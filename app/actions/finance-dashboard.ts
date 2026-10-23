// app/actions/finance-dashboard.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { PaymentMethod } from "@prisma/client";
import {
  getBrasiliaDateParts,
  getBrasiliaDayRange,
  getBrasiliaMonthRange,
  getBrasiliaWeekRange,
} from "@/lib/date-utils";

// Tipagem de retorno inferida para garantir contrato com o Frontend
export async function getFinanceDashboardData(month?: number, year?: number) {
  try {
    const admin = await requireAuth();
    const organizationId = admin.organizationId;

    // Trabalhando com datas no fuso oficial de Brasília para evitar bugs de UTC no servidor
    const nowParts = getBrasiliaDateParts();
    const targetMonth = month ? month : nowParts.month; // 1 a 12
    const targetYear = year || nowParts.year;
    const isCurrentMonth =
      targetMonth === nowParts.month && targetYear === nowParts.year;

    // 1. LIMITES DE DATA
    const { monthStart, monthEnd } = getBrasiliaMonthRange(
      targetYear,
      targetMonth,
    );
    const { startOfDay: todayStart, endOfDay: todayEnd } = getBrasiliaDayRange();
    const { weekStart, weekEnd } = getBrasiliaWeekRange();

    // ============================================================================
    //  O SEGREDO DO ERP: Transações do Mês + Pendências em Aberto
    // ============================================================================
    const [monthlyTxRaw, pendingTxRaw, pendingApptsRaw, recentTx] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          organization_id: organizationId,
          date: { gte: monthStart, lte: monthEnd },
          NOT: {
            type: "RECEITA",
            appointment: {
              package_id: { not: null },
            },
          },
        },
        select: {
          type: true,
          status: true,
          amount: true,
          date: true,
          payment_method: { select: { type: true } },
        },
      }),
      // Busca receitas pendentes (no mês corrente considera todas em aberto, alinhado ao Contas a Receber)
      prisma.transaction.findMany({
        where: {
          organization_id: organizationId,
          type: "RECEITA",
          status: "PENDENTE",
          ...(isCurrentMonth ? {} : { date: { gte: monthStart, lte: monthEnd } }),
        },
        select: {
          amount: true,
        },
      }),
      // Busca agendamentos pendentes de quitação (no mês corrente considera todos em aberto, alinhado ao Contas a Receber)
      prisma.appointment.findMany({
        where: {
          organization_id: organizationId,
          status: "REALIZADO",
          payment_method: null,
          package_id: null, // Sessões de pacote já são quitadas na venda do pacote
          ...(isCurrentMonth
            ? {}
            : { date_time: { gte: monthStart, lte: monthEnd } }),
        },
        select: {
          snapshot_service_price: true,
          service: { select: { price: true } },
        },
      }),
      // Já buscamos as recentes paralelamente para ganhar performance
      prisma.transaction.findMany({
        where: {
          organization_id: organizationId,
          date: { gte: monthStart, lte: monthEnd },
          NOT: {
            type: "RECEITA",
            appointment: {
              package_id: { not: null },
            },
          },
        },
        take: 10,
        select: {
          id: true,
          type: true,
          description: true,
          amount: true,
          date: true,
          status: true,
          client: { select: { name: true } },
          payment_method: { select: { type: true } },
          admin: { select: { display_name: true } },
          appointment: {
            select: {
              client: { select: { name: true } },
              payment_method: true,
              professional: { select: { display_name: true } },
            },
          },
        },
        orderBy: { date: "desc" },
      }),
    ]);

    let incomeMonth = 0;
    let expensesMonth = 0;
    let pendingMonth = 0;
    let receivedToday = 0;
    let receivedWeek = 0;
    let pendingItemsCount = 0;
    const paymentCounts: Record<string, number> = {};

    // 1. Processa o Dinheiro Real (Transactions Liquidadas)
    monthlyTxRaw.forEach((t) => {
      const amount = Number(t.amount);

      // Só calcula hoje e semana se estivermos olhando para o mês atual
      const isToday =
        isCurrentMonth && t.date >= todayStart && t.date <= todayEnd;
      const isThisWeek =
        isCurrentMonth && t.date >= weekStart && t.date <= weekEnd;

      if (t.type === "RECEITA" && t.status === "PAGO") {
        incomeMonth += amount;
        if (isToday) receivedToday += amount;
        if (isThisWeek) receivedWeek += amount;

        if (t.payment_method?.type) {
          paymentCounts[t.payment_method.type] =
            (paymentCounts[t.payment_method.type] || 0) + 1;
        }
      } else if (t.type === "DESPESA" && t.status === "PAGO") {
        expensesMonth += amount;
      }
    });

    // 2. Processa as Receitas Pendentes (Contas a Receber)
    pendingTxRaw.forEach((t) => {
      pendingMonth += Number(t.amount);
      pendingItemsCount++;
    });

    // 3. Processa o "Fiado" (Agenda Pendente de Recebimento)
    pendingApptsRaw.forEach((a) => {
      pendingMonth += Number(a.snapshot_service_price ?? a.service?.price ?? 0);
      pendingItemsCount++;
    });

    // Descobre o Meio Favorito
    let topPaymentMethod: PaymentMethod | null = null;
    let maxCount = 0;
    for (const [method, count] of Object.entries(paymentCounts)) {
      if (count > maxCount) {
        maxCount = count;
        topPaymentMethod = method as PaymentMethod;
      }
    }

    const allHistory = recentTx.map((t) => ({
      id: t.id,
      type: t.type,
      description: t.description,
      amount: Number(t.amount),
      date: t.date.toISOString(),
      status: t.status,
      clientName: t.client?.name || t.appointment?.client?.name || undefined,
      paymentMethod:
        t.payment_method?.type || t.appointment?.payment_method || undefined,
      professionalName:
        t.admin?.display_name ||
        t.appointment?.professional?.display_name ||
        undefined,
    }));

    return {
      summary: {
        receivedMonth: incomeMonth,
        pendingMonth: pendingMonth,
        expensesMonth: expensesMonth,
        balanceMonth: incomeMonth - expensesMonth,
      },
      secondary: {
        receivedToday,
        receivedWeek,
        pendingCount: pendingItemsCount,
        topPaymentMethod,
      },
      recentTransactions: allHistory,
    };
  } catch (error) {
    console.error("[FINANCE_DASHBOARD_ACTION_ERROR]:", error);
    throw new Error(
      "Não foi possível carregar os dados financeiros. Tente novamente.",
    );
  }
}

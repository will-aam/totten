// app/actions/finance-dashboard.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { PaymentMethod } from "@prisma/client";

// Tipagem de retorno inferida para garantir contrato com o Frontend
export async function getFinanceDashboardData(month?: number, year?: number) {
  try {
    const admin = await requireAuth();
    const organizationId = admin.organizationId;

    // Trabalhando com datas de forma mais segura para evitar bugs de UTC no servidor
    const now = new Date();
    const targetMonth = month ? month - 1 : now.getMonth();
    const targetYear = year || now.getFullYear();
    const isCurrentMonth =
      targetMonth === now.getMonth() && targetYear === now.getFullYear();

    // 1. LIMITES DE DATA
    const monthStart = new Date(targetYear, targetMonth, 1, 0, 0, 0);
    const monthEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
    );
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

    const dayOfWeek = now.getDay();
    const weekStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - dayOfWeek,
      0,
      0,
      0,
    );
    const weekEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + (6 - dayOfWeek),
      23,
      59,
      59,
      999,
    );

    // ============================================================================
    //  O SEGREDO DO ERP: Ler apenas a Tabela Transaction!
    // ============================================================================
    const [monthlyTxRaw, pendingApptsRaw, recentTx] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          organization_id: organizationId,
          date: { gte: monthStart, lte: monthEnd },
        },
        select: {
          type: true,
          status: true,
          amount: true,
          date: true,
          payment_method: { select: { type: true } },
        },
      }),
      prisma.appointment.findMany({
        where: {
          organization_id: organizationId,
          status: "REALIZADO",
          payment_method: null,
          package_id: null, // Evita cobrar do fiado se for pacote
          date_time: { gte: monthStart, lte: monthEnd },
        },
        select: {
          service: { select: { price: true } },
        },
      }),
      // Já buscamos as recentes paralelamente para ganhar performance
      prisma.transaction.findMany({
        where: {
          organization_id: organizationId,
          date: { gte: monthStart, lte: monthEnd },
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

    // 1. Processa o Dinheiro Real (Transactions)
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
      } else if (t.type === "RECEITA" && t.status === "PENDENTE") {
        pendingMonth += amount;
        pendingItemsCount++;
      }
    });

    // 2. Processa o "Fiado" (Agenda Pendente)
    pendingApptsRaw.forEach((a) => {
      pendingMonth += Number(a.service?.price || 0);
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

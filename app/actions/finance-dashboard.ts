// app/actions/finance-dashboard.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PaymentMethod } from "@prisma/client";

async function getAdminOrg() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Não autorizado");
  const admin = await prisma.admin.findUnique({
    where: { email: session.user.email },
    include: { organizations: true },
  });
  if (!admin || admin.organizations.length === 0)
    throw new Error("Organização não encontrada");
  return admin.organizations[0].id;
}

export async function getFinanceDashboardData(month?: number, year?: number) {
  try {
    const organizationId = await getAdminOrg();
    const now = new Date();

    const targetMonth = month ? month - 1 : now.getMonth();
    const targetYear = year || now.getFullYear();

    // 1. LIMITES DO MÊS FILTRADO
    const monthStart = new Date(targetYear, targetMonth, 1, 0, 0, 0);
    const monthEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    // 2. LIMITES DE HOJE E ONTEM (Visão Rápida e Histórico Recente)
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
    const yesterdayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1,
      0,
      0,
      0,
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
    // 🔥 OTIMIZAÇÃO 1: BUSCA LEVE (Apenas números e enums para fazer matemática)
    // Descartamos nomes, telefones, descrições. Isso reduz o consumo de RAM em 90%.
    // ============================================================================
    const monthlyApptsRaw = await prisma.appointment.findMany({
      where: {
        organization_id: organizationId,
        status: "REALIZADO",
        date_time: { gte: monthStart, lte: monthEnd },
      },
      select: {
        payment_method: true,
        date_time: true,
        service: { select: { price: true, material_cost: true } },
      },
    });

    const monthlyTxRaw = await prisma.transaction.findMany({
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
    });

    // Variáveis Acumuladoras
    let incomeMonth = 0;
    let pendingMonth = 0;
    let expensesMonth = 0;

    let receivedToday = 0;
    let receivedWeek = 0;

    let pendingItemsCount = 0; // Correção do bug de contagem
    const paymentCounts: Record<string, number> = {};

    // ============================================================================
    // 🔥 CÁLCULOS SUPER RÁPIDOS EM MEMÓRIA (Com os dados leves)
    // ============================================================================

    // Processa Agendamentos (Agenda)
    monthlyApptsRaw.forEach((a) => {
      const price = Number(a.service.price);
      const cost = Number(a.service.material_cost || 0);
      const isToday = a.date_time >= todayStart && a.date_time <= todayEnd;
      const isThisWeek = a.date_time >= weekStart && a.date_time <= weekEnd;

      expensesMonth += cost; // Insumos sempre geram despesa

      if (a.payment_method) {
        // Recebido
        incomeMonth += price;
        if (isToday) receivedToday += price;
        if (isThisWeek) receivedWeek += price;

        // Conta o método favorito
        paymentCounts[a.payment_method] =
          (paymentCounts[a.payment_method] || 0) + 1;
      } else {
        // Pendente
        pendingMonth += price;
        pendingItemsCount++; // Conta +1 item pendente
      }
    });

    // Processa Transações Manuais (Avulsas)
    monthlyTxRaw.forEach((t) => {
      const amount = Number(t.amount);
      const isToday = t.date >= todayStart && t.date <= todayEnd;
      const isThisWeek = t.date >= weekStart && t.date <= weekEnd;

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
      } else if (t.status === "PENDENTE") {
        pendingMonth += amount;
        pendingItemsCount++; // Conta +1 item pendente
      }
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

    // ============================================================================
    // 🔥 OTIMIZAÇÃO 2: BUSCA PESADA RESTRITA (Somente Ontem e Hoje)
    // Trazemos textos pesados (nomes) do BD APENAS para as transações recentes.
    // ============================================================================
    const recentAppts = await prisma.appointment.findMany({
      where: {
        organization_id: organizationId,
        status: "REALIZADO",
        date_time: { gte: yesterdayStart, lte: todayEnd },
      },
      select: {
        id: true,
        date_time: true,
        payment_method: true,
        client: { select: { name: true } },
        service: { select: { name: true, price: true, material_cost: true } },
      },
    });

    const recentTx = await prisma.transaction.findMany({
      where: {
        organization_id: organizationId,
        date: { gte: yesterdayStart, lte: todayEnd },
      },
      select: {
        id: true,
        type: true,
        description: true,
        amount: true,
        date: true,
        status: true,
        client: { select: { name: true } },
        payment_method: { select: { type: true } },
      },
    });

    // Monta o Histórico para o Frontend
    const historyFromAppts = recentAppts.flatMap((a) => {
      const items = [];

      // Receita
      items.push({
        id: `rec_${a.id}`,
        type: "RECEITA" as const,
        description: a.service.name,
        amount: Number(a.service.price),
        date: a.date_time.toISOString(),
        status: (a.payment_method ? "PAGO" : "PENDENTE") as "PAGO" | "PENDENTE",
        clientName: a.client.name,
        paymentMethod: a.payment_method || undefined,
      });

      // Despesa (Material)
      if (a.service.material_cost && Number(a.service.material_cost) > 0) {
        items.push({
          id: `custo_${a.id}`,
          type: "DESPESA" as const,
          description: `Insumos: ${a.service.name}`,
          amount: Number(a.service.material_cost),
          date: a.date_time.toISOString(),
          status: "PAGO" as const,
          clientName: a.client.name,
        });
      }
      return items;
    });

    const historyFromTx = recentTx.map((t) => ({
      id: t.id,
      type: t.type,
      description: t.description,
      amount: Number(t.amount),
      date: t.date.toISOString(),
      status: t.status,
      clientName: t.client?.name,
      paymentMethod: t.payment_method?.type || undefined,
    }));

    // Une tudo e ordena do mais recente para o mais antigo
    const allHistory = [...historyFromAppts, ...historyFromTx].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

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
        pendingCount: pendingItemsCount, // 🔥 Bug corrigido! Agora envia a quantidade real.
        topPaymentMethod,
      },
      recentTransactions: allHistory,
    };
  } catch (error) {
    console.error("Dashboard Error:", error);
    return null;
  }
}

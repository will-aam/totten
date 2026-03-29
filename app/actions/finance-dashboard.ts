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
    const yesterdayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1,
      0,
      0,
      0,
    );

    // ============================================================================
    // 🔥 O SEGREDO DO ERP: Ler apenas a Tabela Transaction!
    // Como nosso Check-in agora gera as Transactions reais, não precisamos mais
    // fazer cálculos "fantasmas" puxando dados de Agendamentos. O Caixa é Rei.
    // ============================================================================
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

    // Para saber o que está PENDENTE, ainda precisamos olhar a Agenda
    // (Pois pendentes ainda não geraram Transaction)
    const pendingApptsRaw = await prisma.appointment.findMany({
      where: {
        organization_id: organizationId,
        status: "REALIZADO",
        payment_method: null,
        package_id: null, // Pacotes não geram pendência de pagamento
        date_time: { gte: monthStart, lte: monthEnd },
      },
      select: {
        service: { select: { price: true } },
      },
    });

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
      const isToday = t.date >= todayStart && t.date <= todayEnd;
      const isThisWeek = t.date >= weekStart && t.date <= weekEnd;

      if (t.type === "RECEITA" && t.status === "PAGO") {
        incomeMonth += amount;
        if (isToday) receivedToday += amount;
        if (isThisWeek) receivedWeek += amount;

        // Tenta pegar o meio de pagamento da transação
        if (t.payment_method?.type) {
          paymentCounts[t.payment_method.type] =
            (paymentCounts[t.payment_method.type] || 0) + 1;
        }
      } else if (t.type === "DESPESA" && t.status === "PAGO") {
        expensesMonth += amount;
      } else if (t.type === "RECEITA" && t.status === "PENDENTE") {
        // 🔥 A CORREÇÃO ESTÁ AQUI: Agora ele soma as parcelas do pacote no KPI de "Pendentes"!
        pendingMonth += amount;
        pendingItemsCount++;
      }
    });

    // 2. Processa o "Fiado" (Agenda Pendente)
    pendingApptsRaw.forEach((a) => {
      pendingMonth += Number(a.service.price);
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

    // ============================================================================
    // 🔥 HISTÓRICO RECENTE (Apenas Transações Reais de Ontem e Hoje)
    // ============================================================================
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
        appointment: {
          select: {
            client: { select: { name: true } },
            payment_method: true, // Puxa o método caso seja uma receita de sessão
          },
        },
      },
      orderBy: { date: "desc" },
    });

    const allHistory = recentTx.map((t) => ({
      id: t.id,
      type: t.type,
      description: t.description,
      amount: Number(t.amount),
      date: t.date.toISOString(),
      status: t.status,
      // Pega o nome do cliente direto da transação ou do agendamento atrelado
      clientName: t.client?.name || t.appointment?.client.name || undefined,
      // Pega o método de pagamento direto da transação ou do agendamento atrelado
      paymentMethod:
        t.payment_method?.type || t.appointment?.payment_method || undefined,
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
    console.error("Dashboard Error:", error);
    return null;
  }
}

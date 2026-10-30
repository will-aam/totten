// app/actions/finance-dashboard.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireFinancePermission } from "@/lib/auth";
import { PaymentMethod } from "@prisma/client";
import {
  getBrasiliaDateParts,
  getBrasiliaDayRange,
  getBrasiliaMonthRange,
  getBrasiliaWeekRange,
} from "@/lib/date-utils";
import {
  FinanceDashboardData,
  PaymentMethodAggregation,
  CategoryAggregation,
  FinanceDailyFlowPoint,
} from "@/types/finance";

function formatPaymentMethodLabel(type: PaymentMethod | "OUTRO"): string {
  switch (type) {
    case "PIX":
      return "Pix";
    case "CARTAO_CREDITO":
      return "Cartão de Crédito";
    case "CARTAO_DEBITO":
      return "Cartão de Débito";
    case "DINHEIRO":
      return "Dinheiro";
    case "OUTRO":
    default:
      return "Outros";
  }
}

// Tipagem de retorno explícita para garantir contrato com o Frontend
export async function getFinanceDashboardData(
  month?: number,
  year?: number,
): Promise<FinanceDashboardData> {
  try {
    const admin = await requireFinancePermission();
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
    // AGREGAÇÃO NATIVA SQL & GROUPBY (Zero Hydration de milhares de objetos)
    // ============================================================================
    const [
      monthlyTotalsGroup,
      todayAgg,
      weekAgg,
      pendingTxAgg,
      paymentGroups,
      orgPaymentMethods,
      byCategoryRaw,
      dailyFlowRaw,
      pendingApptsRaw,
      recentTx,
    ] = await Promise.all([
      // 1. Totais de Receitas e Despesas liquidadas no mês (Agregação no Postgres via groupBy)
      prisma.transaction.groupBy({
        by: ["type"],
        where: {
          organization_id: organizationId,
          status: "PAGO",
          date: { gte: monthStart, lte: monthEnd },
          NOT: {
            type: "RECEITA",
            appointment: {
              package_id: { not: null },
            },
          },
        },
        _sum: {
          amount: true,
        },
      }),

      // 2. Recebido Hoje (Agregação nativa SUM se for mês atual)
      isCurrentMonth
        ? prisma.transaction.aggregate({
            where: {
              organization_id: organizationId,
              type: "RECEITA",
              status: "PAGO",
              date: { gte: todayStart, lte: todayEnd },
              NOT: {
                appointment: {
                  package_id: { not: null },
                },
              },
            },
            _sum: { amount: true },
          })
        : Promise.resolve({ _sum: { amount: null } }),

      // 3. Recebido na Semana (Agregação nativa SUM se for mês atual)
      isCurrentMonth
        ? prisma.transaction.aggregate({
            where: {
              organization_id: organizationId,
              type: "RECEITA",
              status: "PAGO",
              date: { gte: weekStart, lte: weekEnd },
              NOT: {
                appointment: {
                  package_id: { not: null },
                },
              },
            },
            _sum: { amount: true },
          })
        : Promise.resolve({ _sum: { amount: null } }),

      // 4. Receitas pendentes (Agregação nativa SUM e COUNT pré-calculada no Postgres)
      prisma.transaction.aggregate({
        where: {
          organization_id: organizationId,
          type: "RECEITA",
          status: "PENDENTE",
          ...(isCurrentMonth
            ? {}
            : { date: { gte: monthStart, lte: monthEnd } }),
        },
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      }),

      // 5. Agrupamento por método de pagamento (Agrupado no banco via groupBy)
      prisma.transaction.groupBy({
        by: ["payment_method_id"],
        where: {
          organization_id: organizationId,
          status: "PAGO",
          type: "RECEITA",
          date: { gte: monthStart, lte: monthEnd },
          NOT: {
            type: "RECEITA",
            appointment: {
              package_id: { not: null },
            },
          },
        },
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      }),

      // 6. Formas de pagamento da organização para mapeamento dos tipos/nomes
      prisma.organizationPaymentMethod.findMany({
        where: { organization_id: organizationId },
        select: { id: true, type: true, name: true },
      }),

      // 7. Agrupamento por Categoria (Nativo SQL via appointments -> services -> categories)
      prisma.$queryRaw<
        Array<{
          category_id: string;
          category_name: string;
          amount: number | string | null;
          count: number | string | bigint;
        }>
      >`
        SELECT 
          c.id AS category_id,
          c.name AS category_name,
          COALESCE(SUM(t.amount), 0)::float AS amount,
          COUNT(t.id)::int AS count
        FROM transactions t
        INNER JOIN appointments a ON t.appointment_id = a.id
        INNER JOIN services s ON a.service_id = s.id
        INNER JOIN categories c ON s.category_id = c.id
        WHERE t.organization_id = ${organizationId}
          AND t.status = 'PAGO'
          AND t.type = 'RECEITA'
          AND t.date >= ${monthStart}
          AND t.date <= ${monthEnd}
          AND a.package_id IS NULL
        GROUP BY c.id, c.name
        ORDER BY amount DESC
      `,

      // 8. Série temporal de fluxo diário (Nativo SQL agrupado por dia)
      prisma.$queryRaw<
        Array<{
          day: string;
          type: string;
          total: number | string | null;
        }>
      >`
        SELECT 
          TO_CHAR(t.date AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') AS day,
          t.type::text AS type,
          COALESCE(SUM(t.amount), 0)::float AS total
        FROM transactions t
        LEFT JOIN appointments a ON t.appointment_id = a.id
        WHERE t.organization_id = ${organizationId}
          AND t.status = 'PAGO'
          AND t.date >= ${monthStart}
          AND t.date <= ${monthEnd}
          AND NOT (t.type = 'RECEITA' AND a.package_id IS NOT NULL)
        GROUP BY day, t.type
        ORDER BY day ASC
      `,

      // 9. Agendamentos pendentes de quitação (no mês corrente considera todos em aberto)
      prisma.appointment.findMany({
        where: {
          organization_id: organizationId,
          status: "REALIZADO",
          package_id: null,
          OR: [
            { payment_method: null },
            { has_charge: true },
            {
              transactions: {
                none: {
                  type: "RECEITA",
                  status: "PAGO",
                },
              },
            },
          ],
          ...(isCurrentMonth
            ? {}
            : { date_time: { gte: monthStart, lte: monthEnd } }),
        },
        select: {
          snapshot_service_price: true,
          service: { select: { price: true } },
          transactions: {
            where: { type: "RECEITA", status: "PAGO" },
            select: { amount: true },
          },
        },
      }),

      // 10. Recentes (Apenas 10 itens com take: 10 para o widget)
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

    // Totais do mês
    const incomeMonth = Number(
      monthlyTotalsGroup.find((t) => t.type === "RECEITA")?._sum.amount || 0,
    );
    const expensesMonth = Number(
      monthlyTotalsGroup.find((t) => t.type === "DESPESA")?._sum.amount || 0,
    );
    const balanceMonth = Number((incomeMonth - expensesMonth).toFixed(2));
    const profitMargin =
      incomeMonth > 0
        ? Number((((incomeMonth - expensesMonth) / incomeMonth) * 100).toFixed(2))
        : 0;

    const receivedToday = Number(todayAgg._sum.amount || 0);
    const receivedWeek = Number(weekAgg._sum.amount || 0);

    // Contas a receber (Transações Pendentes + Fiado da Agenda)
    let pendingMonth = Number(pendingTxAgg._sum.amount || 0);
    let pendingItemsCount = pendingTxAgg._count.id;

    pendingApptsRaw.forEach((a) => {
      const fullPrice = Number(a.snapshot_service_price ?? a.service?.price ?? 0);
      const totalPaid = (a.transactions || []).reduce(
        (acc, t) => acc + Number(t.amount),
        0,
      );
      const remainingAmount = Math.max(
        0,
        Number((fullPrice - totalPaid).toFixed(2)),
      );

      if (remainingAmount > 0.01) {
        pendingMonth += remainingAmount;
        pendingItemsCount++;
      }
    });

    pendingMonth = Number(pendingMonth.toFixed(2));

    // Mapeamento de Métodos de Pagamento (byPaymentMethod)
    const methodInfoMap = new Map<string, { type: PaymentMethod; name: string }>();
    orgPaymentMethods.forEach((m) => {
      methodInfoMap.set(m.id, { type: m.type, name: m.name });
    });

    const paymentTypeMap = new Map<
      string,
      { name: string; method: PaymentMethod | "OUTRO"; value: number; count: number }
    >();

    for (const group of paymentGroups) {
      const methodId = group.payment_method_id;
      const info = methodId ? methodInfoMap.get(methodId) : null;
      const methodType: PaymentMethod | "OUTRO" = info ? info.type : "OUTRO";
      const amount = Number(group._sum.amount || 0);
      const count = group._count.id;

      const typeKey = methodType;
      const existing = paymentTypeMap.get(typeKey);
      if (existing) {
        existing.value += amount;
        existing.count += count;
      } else {
        paymentTypeMap.set(typeKey, {
          name: formatPaymentMethodLabel(methodType),
          method: methodType,
          value: amount,
          count: count,
        });
      }
    }

    // Descobrir o meio favorito por volume de transações
    let topPaymentMethod: PaymentMethod | null = null;
    let maxMethodCount = 0;
    for (const item of paymentTypeMap.values()) {
      if (item.method !== "OUTRO" && item.count > maxMethodCount) {
        maxMethodCount = item.count;
        topPaymentMethod = item.method as PaymentMethod;
      }
    }

    const totalPaymentValue = Array.from(paymentTypeMap.values()).reduce(
      (acc, curr) => acc + curr.value,
      0,
    );

    const byPaymentMethod: PaymentMethodAggregation[] = Array.from(
      paymentTypeMap.values(),
    )
      .map((item) => ({
        ...item,
        value: Number(item.value.toFixed(2)),
        percentage:
          totalPaymentValue > 0
            ? Number(((item.value / totalPaymentValue) * 100).toFixed(1))
            : 0,
      }))
      .sort((a, b) => b.value - a.value);

    // Mapeamento de Categorias (byCategory)
    const byCategory: CategoryAggregation[] = (byCategoryRaw || []).map(
      (row) => ({
        id: row.category_id,
        name: row.category_name,
        amount: Number(Number(row.amount || 0).toFixed(2)),
        count: Number(row.count || 0),
      }),
    );

    // Mapeamento de Séries Temporais Diárias (chartData)
    const dailyMap = new Map<string, { income: number; expenses: number }>();
    (dailyFlowRaw || []).forEach((row) => {
      const current = dailyMap.get(row.day) || { income: 0, expenses: 0 };
      const val = Number(row.total || 0);
      if (row.type === "RECEITA") {
        current.income += val;
      } else if (row.type === "DESPESA") {
        current.expenses += val;
      }
      dailyMap.set(row.day, current);
    });

    const chartData: FinanceDailyFlowPoint[] = Array.from(dailyMap.entries()).map(
      ([day, val]) => ({
        date: day,
        income: Number(val.income.toFixed(2)),
        expenses: Number(val.expenses.toFixed(2)),
        balance: Number((val.income - val.expenses).toFixed(2)),
      }),
    );

    // Histórico recente (take: 10)
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
        balanceMonth: balanceMonth,
        profitMargin,
      },
      secondary: {
        receivedToday,
        receivedWeek,
        pendingCount: pendingItemsCount,
        topPaymentMethod,
      },
      byPaymentMethod,
      byCategory,
      chartData,
      recentTransactions: allHistory,
    };
  } catch (error: any) {
    if (error?.name === "ForbiddenError" || error?.name === "AuthError") {
      throw error;
    }
    console.error("[FINANCE_DASHBOARD_ACTION_ERROR]:", error);
    throw new Error(
      "Não foi possível carregar os dados financeiros. Tente novamente.",
    );
  }
}

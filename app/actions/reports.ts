// app/actions/reports.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireFinancePermission } from "@/lib/auth";
import { sendClosingReportEmail } from "@/lib/email";
import {
  getBrasiliaDateParts,
  getBrasiliaMonthRange,
} from "@/lib/date-utils";

export async function getReportsData() {
  try {
    const admin = await requireFinancePermission();
    const organizationId = admin.organizationId;
    const nowParts = getBrasiliaDateParts();

    let startMonth = nowParts.month - 5;
    let startYear = nowParts.year;
    while (startMonth < 1) {
      startMonth += 12;
      startYear -= 1;
    }
    const { monthStart: sixMonthsAgo } = getBrasiliaMonthRange(
      startYear,
      startMonth,
    );

    // 1. Agregações nativas no PostgreSQL em paralelo (Zero Hydration de milhares de objetos)
    const [monthlyTxAgg, monthlyApptsAgg, topServicesRaw, serviceSessionsRaw] =
      await Promise.all([
        // Receitas e Despesas agrupadas por mês nos últimos 6 meses
        prisma.$queryRaw<
          Array<{
            month_key: string;
            type: string;
            total: number | null;
          }>
        >`
          SELECT 
            TO_CHAR(t.date AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM') AS month_key,
            t.type::text AS type,
            COALESCE(SUM(t.amount), 0)::float AS total
          FROM transactions t
          LEFT JOIN appointments a ON t.appointment_id = a.id
          WHERE t.organization_id = ${organizationId}
            AND t.status = 'PAGO'
            AND t.date >= ${sixMonthsAgo}
            AND NOT (t.type = 'RECEITA' AND a.package_id IS NOT NULL)
          GROUP BY month_key, t.type
        `,

        // Agendamentos realizados agrupados por mês nos últimos 6 meses
        prisma.$queryRaw<
          Array<{
            month_key: string;
            count: number;
          }>
        >`
          SELECT 
            TO_CHAR(date_time AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM') AS month_key,
            COUNT(id)::int AS count
          FROM appointments
          WHERE organization_id = ${organizationId}
            AND status = 'REALIZADO'
            AND date_time >= ${sixMonthsAgo}
          GROUP BY month_key
        `,

        // Faturamento por serviço/pacote pago no período
        prisma.$queryRaw<
          Array<{
            name: string;
            faturamento: number | null;
          }>
        >`
          SELECT 
            COALESCE(a.snapshot_service_name, s.name, p.snapshot_service_name, p.name, t.description, 'Outros Serviços') AS name,
            COALESCE(SUM(t.amount), 0)::float AS faturamento
          FROM transactions t
          LEFT JOIN appointments a ON t.appointment_id = a.id
          LEFT JOIN services s ON a.service_id = s.id
          LEFT JOIN packages p ON t.package_id = p.id
          WHERE t.organization_id = ${organizationId}
            AND t.status = 'PAGO'
            AND t.type = 'RECEITA'
            AND t.date >= ${sixMonthsAgo}
            AND NOT (a.package_id IS NOT NULL)
          GROUP BY COALESCE(a.snapshot_service_name, s.name, p.snapshot_service_name, p.name, t.description, 'Outros Serviços')
          ORDER BY faturamento DESC
          LIMIT 15
        `,

        // Sessões realizadas agrupadas por serviço
        prisma.$queryRaw<
          Array<{
            name: string;
            sessoes: number;
          }>
        >`
          SELECT 
            COALESCE(a.snapshot_service_name, s.name, 'Serviço') AS name,
            COUNT(a.id)::int AS sessoes
          FROM appointments a
          LEFT JOIN services s ON a.service_id = s.id
          WHERE a.organization_id = ${organizationId}
            AND a.status = 'REALIZADO'
            AND a.date_time >= ${sixMonthsAgo}
          GROUP BY COALESCE(a.snapshot_service_name, s.name, 'Serviço')
        `,
      ]);

    // Monta o mapa dos 6 meses
    const monthlyDataMap = new Map<
      string,
      { month: string; receitas: number; despesas: number; agendamentos: number }
    >();

    const monthNames = [
      "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
      "Jul", "Ago", "Set", "Out", "Nov", "Dez",
    ];

    for (let i = 5; i >= 0; i--) {
      let m = nowParts.month - i;
      let y = nowParts.year;
      while (m < 1) {
        m += 12;
        y -= 1;
      }
      const key = `${y}-${String(m).padStart(2, "0")}`;
      const label = `${monthNames[m - 1]}/${String(y).slice(-2)}`;
      monthlyDataMap.set(key, {
        month: label,
        receitas: 0,
        despesas: 0,
        agendamentos: 0,
      });
    }

    // Preenche receitas e despesas
    monthlyTxAgg.forEach((row) => {
      if (monthlyDataMap.has(row.month_key)) {
        const entry = monthlyDataMap.get(row.month_key)!;
        const total = Number(row.total || 0);
        if (row.type === "RECEITA") entry.receitas += total;
        if (row.type === "DESPESA") entry.despesas += total;
      }
    });

    // Preenche agendamentos
    monthlyApptsAgg.forEach((row) => {
      if (monthlyDataMap.has(row.month_key)) {
        const entry = monthlyDataMap.get(row.month_key)!;
        entry.agendamentos += Number(row.count || 0);
      }
    });

    // Sessões por serviço
    const sessionsMap = new Map<string, number>();
    serviceSessionsRaw.forEach((row) => {
      sessionsMap.set(row.name, Number(row.sessoes || 0));
    });

    // Top Serviços
    const topServices = topServicesRaw.slice(0, 10).map((row) => {
      const faturamento = Number(Number(row.faturamento || 0).toFixed(2));
      const sessoes = sessionsMap.get(row.name) || 0;
      return {
        name: row.name,
        faturamento,
        sessoes,
      };
    });

    return {
      success: true,
      monthlyData: Array.from(monthlyDataMap.values()),
      topServices,
    };
  } catch (error) {
    console.error("Erro ao gerar relatórios:", error);
    return { success: false, monthlyData: [], topServices: [] };
  }
}

// Busca os anos e meses que realmente possuem dados financeiros com agregação DISTINCT no Postgres
export async function getClosingReportAvailablePeriods() {
  try {
    const admin = await requireFinancePermission();
    const organizationId = admin.organizationId;

    // Busca apenas os pares únicos (ano, mês) no Postgres sem transferir todas as linhas históricas
    const distinctPeriodsRaw = await prisma.$queryRaw<
      Array<{
        year: number;
        month: number;
      }>
    >`
      SELECT DISTINCT 
        EXTRACT(YEAR FROM date AT TIME ZONE 'America/Sao_Paulo')::int AS year,
        EXTRACT(MONTH FROM date AT TIME ZONE 'America/Sao_Paulo')::int AS month
      FROM transactions
      WHERE organization_id = ${organizationId}
      UNION
      SELECT DISTINCT 
        EXTRACT(YEAR FROM date_time AT TIME ZONE 'America/Sao_Paulo')::int AS year,
        EXTRACT(MONTH FROM date_time AT TIME ZONE 'America/Sao_Paulo')::int AS month
      FROM appointments
      WHERE organization_id = ${organizationId}
        AND status = 'REALIZADO'
      ORDER BY year DESC, month ASC
    `;

    const nowParts = getBrasiliaDateParts();
    const currentYear = nowParts.year;
    const currentMonth = nowParts.month; // 1 a 12

    const periodsMap = new Map<number, Set<number>>();

    distinctPeriodsRaw.forEach((row) => {
      const year = Number(row.year);
      const month = Number(row.month);

      // Apenas meses que já fecharam (anteriores ao mês atual no fuso de Brasília)
      if (year > currentYear || (year === currentYear && month >= currentMonth)) {
        return;
      }

      if (!periodsMap.has(year)) {
        periodsMap.set(year, new Set<number>());
      }
      periodsMap.get(year)!.add(month);
    });

    // Se ainda não houver nenhum mês fechado com dados históricos, sugere o mês anterior imediato como padrão
    if (periodsMap.size === 0) {
      let prevMonth = currentMonth - 1;
      let prevYear = currentYear;
      if (prevMonth < 1) {
        prevMonth = 12;
        prevYear -= 1;
      }
      periodsMap.set(prevYear, new Set([prevMonth]));
    }

    const availableYears = Array.from(periodsMap.keys()).sort((a, b) => b - a);
    const availableMonthsByYear: Record<number, number[]> = {};

    availableYears.forEach((year) => {
      availableMonthsByYear[year] = Array.from(periodsMap.get(year)!).sort(
        (a, b) => a - b,
      );
    });

    return {
      success: true,
      availableYears,
      availableMonthsByYear,
      defaultEmail: admin.email || "",
    };
  } catch (error) {
    console.error("Erro ao buscar períodos disponíveis:", error);
    const nowParts = getBrasiliaDateParts();
    let fallbackMonth = nowParts.month - 1;
    let fallbackYear = nowParts.year;
    if (fallbackMonth < 1) {
      fallbackMonth = 12;
      fallbackYear -= 1;
    }
    return {
      success: false,
      availableYears: [fallbackYear],
      availableMonthsByYear: { [fallbackYear]: [fallbackMonth] },
      defaultEmail: "",
    };
  }
}

// Envia relatório de fechamento por e-mail com cálculos consolidados no Postgres
export async function sendMonthlyReport(
  month: number,
  year: number,
  emailTo: string,
) {
  try {
    const admin = await requireFinancePermission();
    const organizationId = admin.organizationId;

    // Início e fim exato do mês selecionado no fuso de Brasília
    const { monthStart, monthEnd } = getBrasiliaMonthRange(year, month);

    // Contagem de agendamentos e agrupamento nativo de receitas e despesas
    const [apptCount, txTotals] = await Promise.all([
      prisma.appointment.count({
        where: {
          organization_id: organizationId,
          status: "REALIZADO",
          date_time: { gte: monthStart, lte: monthEnd },
        },
      }),
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
        _sum: { amount: true },
      }),
    ]);

    const receitas = Number(
      txTotals.find((t) => t.type === "RECEITA")?._sum.amount || 0,
    );
    const despesas = Number(
      txTotals.find((t) => t.type === "DESPESA")?._sum.amount || 0,
    );
    const saldo = receitas - despesas;
    const agendamentos = apptCount;

    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
    ];
    const monthStr = monthNames[month - 1];

    // Dispara o e-mail usando o Resend
    const res = await sendClosingReportEmail(emailTo, monthStr, String(year), {
      receitas,
      despesas,
      saldo,
      agendamentos,
    });

    if (!res.success) {
      throw new Error("Falha ao enviar e-mail via Resend.");
    }

    return { success: true };
  } catch (error: any) {
    console.error("Erro no envio do fechamento:", error);
    return {
      success: false,
      error: error?.message || "Falha na geração do relatório.",
    };
  }
}

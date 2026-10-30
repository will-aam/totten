// app/actions/finance-chart.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireFinancePermission } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import {
  getBrasiliaDateParts,
  getBrasiliaDayRange,
  getBrasiliaMonthRange,
} from "@/lib/date-utils";
import { FinanceViewMode } from "@/types/finance";

export type TimeframeOption = "4h" | "1d" | "1w" | "1m" | "1y";

export interface FinanceChartPoint {
  date: string;
  fullDate: string;
  monthIndex?: number;
  revenue: number;
  previousRevenue: number;
  expenses: number;
  balance: number;
}

export interface FinanceChartData {
  companyName: string;
  points: FinanceChartPoint[];
  totalRevenue: number;
  totalExpenses: number;
  netBalance: number;
  previousRevenue: number;
  absoluteChange: number;
  percentChange: number;
  isPositive: boolean;
  comparisonLabel: string;
}

export async function getFinanceChartData(
  timeframe: TimeframeOption = "1y",
  viewMode: FinanceViewMode = "COMPETENCIA",
): Promise<FinanceChartData> {
  const admin = await requireFinancePermission();
  const organizationId = admin.organizationId;

  // 1. Busca nome da empresa
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true, settings: { select: { company_name: true } } },
  });
  const companyName = org?.settings?.company_name || org?.name || "Minha Empresa";

  const now = new Date();
  const nowParts = getBrasiliaDateParts(now);
  let startDate: Date;
  let prevStartDate: Date;
  let comparisonLabel = "Período anterior";

  switch (timeframe) {
    case "4h":
      startDate = new Date(now.getTime() - 4 * 60 * 60 * 1000);
      prevStartDate = new Date(now.getTime() - 8 * 60 * 60 * 1000);
      comparisonLabel = "4h anteriores";
      break;
    case "1d": {
      const { startOfDay } = getBrasiliaDayRange(now);
      startDate = startOfDay;
      prevStartDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
      comparisonLabel = "Dia anterior";
      break;
    }
    case "1w":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      prevStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      comparisonLabel = "Semana anterior";
      break;
    case "1m":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      prevStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      comparisonLabel = "Mês anterior";
      break;
    case "1y":
    default: {
      let startM = nowParts.month - 11;
      let startY = nowParts.year;
      while (startM < 1) {
        startM += 12;
        startY -= 1;
      }
      const { monthStart } = getBrasiliaMonthRange(startY, startM);
      startDate = monthStart;

      let prevM = nowParts.month - 23;
      let prevY = nowParts.year;
      while (prevM < 1) {
        prevM += 12;
        prevY -= 1;
      }
      const { monthStart: prevStart } = getBrasiliaMonthRange(prevY, prevM);
      prevStartDate = prevStart;
      comparisonLabel = "Ano anterior";
      break;
    }
  }

  const dateCol =
    viewMode === "CAIXA"
      ? Prisma.sql`COALESCE(t.settlement_date, t.date)`
      : Prisma.sql`t.date`;

  // 2. Agregações nativas no banco de dados (zero hydration de dezenas de milhares de transações)
  let currentAgg: Array<{ bucket: string; type: string; total: number | null }> = [];
  let previousAgg: Array<{ bucket: string; total: number | null }> = [];

  if (timeframe === "4h" || timeframe === "1d") {
    [currentAgg, previousAgg] = await Promise.all([
      prisma.$queryRaw<Array<{ bucket: string; type: string; total: number | null }>>`
        SELECT 
          TO_CHAR(${dateCol} AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD HH24:00') AS bucket,
          t.type::text AS type,
          COALESCE(SUM(t.amount), 0)::float AS total
        FROM transactions t
        LEFT JOIN appointments a ON t.appointment_id = a.id
        WHERE t.organization_id = ${organizationId}
          AND t.status = 'PAGO'
          AND ${dateCol} >= ${startDate}
          AND ${dateCol} <= ${now}
          AND NOT (t.type = 'RECEITA' AND a.package_id IS NOT NULL)
        GROUP BY bucket, t.type
      `,
      prisma.$queryRaw<Array<{ bucket: string; total: number | null }>>`
        SELECT 
          TO_CHAR(${dateCol} AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD HH24:00') AS bucket,
          COALESCE(SUM(t.amount), 0)::float AS total
        FROM transactions t
        LEFT JOIN appointments a ON t.appointment_id = a.id
        WHERE t.organization_id = ${organizationId}
          AND t.status = 'PAGO'
          AND t.type = 'RECEITA'
          AND ${dateCol} >= ${prevStartDate}
          AND ${dateCol} < ${startDate}
          AND NOT (a.package_id IS NOT NULL)
        GROUP BY bucket
      `,
    ]);
  } else if (timeframe === "1w" || timeframe === "1m") {
    [currentAgg, previousAgg] = await Promise.all([
      prisma.$queryRaw<Array<{ bucket: string; type: string; total: number | null }>>`
        SELECT 
          TO_CHAR(${dateCol} AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') AS bucket,
          t.type::text AS type,
          COALESCE(SUM(t.amount), 0)::float AS total
        FROM transactions t
        LEFT JOIN appointments a ON t.appointment_id = a.id
        WHERE t.organization_id = ${organizationId}
          AND t.status = 'PAGO'
          AND ${dateCol} >= ${startDate}
          AND ${dateCol} <= ${now}
          AND NOT (t.type = 'RECEITA' AND a.package_id IS NOT NULL)
        GROUP BY bucket, t.type
      `,
      prisma.$queryRaw<Array<{ bucket: string; total: number | null }>>`
        SELECT 
          TO_CHAR(${dateCol} AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') AS bucket,
          COALESCE(SUM(t.amount), 0)::float AS total
        FROM transactions t
        LEFT JOIN appointments a ON t.appointment_id = a.id
        WHERE t.organization_id = ${organizationId}
          AND t.status = 'PAGO'
          AND t.type = 'RECEITA'
          AND ${dateCol} >= ${prevStartDate}
          AND ${dateCol} < ${startDate}
          AND NOT (a.package_id IS NOT NULL)
        GROUP BY bucket
      `,
    ]);
  } else {
    // 1y (Ano)
    [currentAgg, previousAgg] = await Promise.all([
      prisma.$queryRaw<Array<{ bucket: string; type: string; total: number | null }>>`
        SELECT 
          TO_CHAR(${dateCol} AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM') AS bucket,
          t.type::text AS type,
          COALESCE(SUM(t.amount), 0)::float AS total
        FROM transactions t
        LEFT JOIN appointments a ON t.appointment_id = a.id
        WHERE t.organization_id = ${organizationId}
          AND t.status = 'PAGO'
          AND ${dateCol} >= ${startDate}
          AND ${dateCol} <= ${now}
          AND NOT (t.type = 'RECEITA' AND a.package_id IS NOT NULL)
        GROUP BY bucket, t.type
      `,
      prisma.$queryRaw<Array<{ bucket: string; total: number | null }>>`
        SELECT 
          TO_CHAR(${dateCol} AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM') AS bucket,
          COALESCE(SUM(t.amount), 0)::float AS total
        FROM transactions t
        LEFT JOIN appointments a ON t.appointment_id = a.id
        WHERE t.organization_id = ${organizationId}
          AND t.status = 'PAGO'
          AND t.type = 'RECEITA'
          AND ${dateCol} >= ${prevStartDate}
          AND ${dateCol} < ${startDate}
          AND NOT (a.package_id IS NOT NULL)
        GROUP BY bucket
      `,
    ]);
  }

  // Mapear os resultados agregados em Maps rápidos para O(1) lookup
  const currentMap = new Map<string, { revenue: number; expenses: number }>();
  currentAgg.forEach((row) => {
    const existing = currentMap.get(row.bucket) || { revenue: 0, expenses: 0 };
    const val = Number(row.total || 0);
    if (row.type === "RECEITA") existing.revenue += val;
    if (row.type === "DESPESA") existing.expenses += val;
    currentMap.set(row.bucket, existing);
  });

  const prevMap = new Map<string, number>();
  previousAgg.forEach((row) => {
    prevMap.set(row.bucket, (prevMap.get(row.bucket) || 0) + Number(row.total || 0));
  });

  const monthNames = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];

  type PointDraft = {
    label: string;
    fullDate: string;
    monthIndex?: number;
    revenue: number;
    previousRevenue: number;
    expenses: number;
  };

  const pointsList: PointDraft[] = [];

  if (timeframe === "4h" || timeframe === "1d") {
    const hoursCount = timeframe === "4h" ? 4 : 24;
    const shiftMs = (timeframe === "4h" ? 4 : 24) * 60 * 60 * 1000;

    for (let i = hoursCount; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 60 * 60 * 1000);
      const label = `${String(d.getHours()).padStart(2, "0")}:00`;
      const p = getBrasiliaDateParts(d);
      const bucketKey = `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")} ${label}`;

      const prevD = new Date(d.getTime() - shiftMs);
      const prevP = getBrasiliaDateParts(prevD);
      const prevLabel = `${String(prevD.getHours()).padStart(2, "0")}:00`;
      const prevBucketKey = `${prevP.year}-${String(prevP.month).padStart(2, "0")}-${String(prevP.day).padStart(2, "0")} ${prevLabel}`;

      const currentVals = currentMap.get(bucketKey) || { revenue: 0, expenses: 0 };
      const prevRevenue = prevMap.get(prevBucketKey) || 0;

      pointsList.push({
        label,
        fullDate: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} às ${label}`,
        revenue: currentVals.revenue,
        previousRevenue: prevRevenue,
        expenses: currentVals.expenses,
      });
    }
  } else if (timeframe === "1w") {
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const shiftMs = 7 * 24 * 60 * 60 * 1000;

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const label = `${dayNames[d.getDay()]} (${String(d.getDate()).padStart(2, "0")})`;
      const p = getBrasiliaDateParts(d);
      const bucketKey = `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;

      const prevD = new Date(d.getTime() - shiftMs);
      const prevP = getBrasiliaDateParts(prevD);
      const prevBucketKey = `${prevP.year}-${String(prevP.month).padStart(2, "0")}-${String(prevP.day).padStart(2, "0")}`;

      const currentVals = currentMap.get(bucketKey) || { revenue: 0, expenses: 0 };
      const prevRevenue = prevMap.get(prevBucketKey) || 0;

      pointsList.push({
        label,
        fullDate: `${String(d.getDate()).padStart(2, "0")} de ${monthNames[d.getMonth()]}`,
        revenue: currentVals.revenue,
        previousRevenue: prevRevenue,
        expenses: currentVals.expenses,
      });
    }
  } else if (timeframe === "1m") {
    // 30 dias em 6 blocos de 5 dias
    const shiftMs = 30 * 24 * 60 * 60 * 1000;

    for (let i = 5; i >= 0; i--) {
      const dayOffsetEnd = i * 5;
      const dEnd = new Date(now.getTime() - dayOffsetEnd * 24 * 60 * 60 * 1000);
      const dStart = new Date(dEnd.getTime() - 4 * 24 * 60 * 60 * 1000);
      const label = `${String(dStart.getDate()).padStart(2, "0")}-${String(dEnd.getDate()).padStart(2, "0")} ${monthNames[dEnd.getMonth()]}`;

      let blockRevenue = 0;
      let blockExpenses = 0;
      let blockPrevRevenue = 0;

      // Soma os 5 dias do bloco
      for (let dayStep = 0; dayStep < 5; dayStep++) {
        const curDay = new Date(dStart.getTime() + dayStep * 24 * 60 * 60 * 1000);
        const curParts = getBrasiliaDateParts(curDay);
        const curKey = `${curParts.year}-${String(curParts.month).padStart(2, "0")}-${String(curParts.day).padStart(2, "0")}`;

        const vals = currentMap.get(curKey);
        if (vals) {
          blockRevenue += vals.revenue;
          blockExpenses += vals.expenses;
        }

        const prevDay = new Date(curDay.getTime() - shiftMs);
        const prevParts = getBrasiliaDateParts(prevDay);
        const prevKey = `${prevParts.year}-${String(prevParts.month).padStart(2, "0")}-${String(prevParts.day).padStart(2, "0")}`;
        blockPrevRevenue += prevMap.get(prevKey) || 0;
      }

      pointsList.push({
        label,
        fullDate: `De ${String(dStart.getDate()).padStart(2, "0")} a ${String(dEnd.getDate()).padStart(2, "0")} de ${monthNames[dEnd.getMonth()]}`,
        revenue: blockRevenue,
        previousRevenue: blockPrevRevenue,
        expenses: blockExpenses,
      });
    }
  } else {
    // 1 Ano: 12 meses no fuso oficial de Brasília (America/Sao_Paulo)
    for (let i = 11; i >= 0; i--) {
      let m = nowParts.month - i;
      let y = nowParts.year;
      while (m < 1) {
        m += 12;
        y -= 1;
      }
      const label = monthNames[m - 1];
      const curKey = `${y}-${String(m).padStart(2, "0")}`;
      const prevKey = `${y - 1}-${String(m).padStart(2, "0")}`;

      const currentVals = currentMap.get(curKey) || { revenue: 0, expenses: 0 };
      const prevRevenue = prevMap.get(prevKey) || 0;

      pointsList.push({
        label,
        fullDate: `${monthNames[m - 1]} de ${y}`,
        monthIndex: m - 1,
        revenue: currentVals.revenue,
        previousRevenue: prevRevenue,
        expenses: currentVals.expenses,
      });
    }
  }

  const points: FinanceChartPoint[] = pointsList.map((p) => ({
    date: p.label,
    fullDate: p.fullDate,
    monthIndex: p.monthIndex,
    revenue: Math.round(p.revenue * 100) / 100,
    previousRevenue: Math.round(p.previousRevenue * 100) / 100,
    expenses: Math.round(p.expenses * 100) / 100,
    balance: Math.round((p.revenue - p.expenses) * 100) / 100,
  }));

  // Totais agregados calculados a partir dos blocos pré-somados
  let totalRevenue = 0;
  let totalExpenses = 0;
  currentAgg.forEach((row) => {
    const val = Number(row.total || 0);
    if (row.type === "RECEITA") totalRevenue += val;
    if (row.type === "DESPESA") totalExpenses += val;
  });

  let previousRevenue = 0;
  previousAgg.forEach((row) => {
    previousRevenue += Number(row.total || 0);
  });

  totalRevenue = Math.round(totalRevenue * 100) / 100;
  totalExpenses = Math.round(totalExpenses * 100) / 100;
  previousRevenue = Math.round(previousRevenue * 100) / 100;

  const absoluteChange = totalRevenue - previousRevenue;
  const percentChange =
    previousRevenue > 0
      ? (absoluteChange / previousRevenue) * 100
      : totalRevenue > 0
        ? 100
        : 0;
  const isPositive = absoluteChange >= 0;

  return {
    companyName,
    points,
    totalRevenue,
    totalExpenses,
    netBalance: totalRevenue - totalExpenses,
    previousRevenue,
    absoluteChange,
    percentChange,
    isPositive,
    comparisonLabel,
  };
}

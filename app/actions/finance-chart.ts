// app/actions/finance-chart.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireFinancePermission } from "@/lib/auth";
import {
  getBrasiliaDateParts,
  getBrasiliaDayRange,
  getBrasiliaMonthRange,
} from "@/lib/date-utils";

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

  // 2. Busca transações do período atual e anterior
  const [currentTransactions, previousTransactions] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        organization_id: organizationId,
        date: { gte: startDate, lte: now },
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
      },
      orderBy: { date: "asc" },
    }),
    prisma.transaction.findMany({
      where: {
        organization_id: organizationId,
        date: { gte: prevStartDate, lt: startDate },
        type: "RECEITA",
        status: "PAGO",
        NOT: {
          appointment: {
            package_id: { not: null },
          },
        },
      },
      select: {
        amount: true,
        date: true,
      },
      orderBy: { date: "asc" },
    }),
  ]);

  const monthNames = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
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
    for (let i = hoursCount; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 60 * 60 * 1000);
      const label = `${String(d.getHours()).padStart(2, "0")}:00`;
      pointsList.push({
        label,
        fullDate: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} às ${label}`,
        revenue: 0,
        previousRevenue: 0,
        expenses: 0,
      });
    }

    currentTransactions.forEach((tx) => {
      if (tx.status !== "PAGO") return;
      const txTime = new Date(tx.date).getTime();
      const diffHours = Math.floor((now.getTime() - txTime) / (60 * 60 * 1000));
      const idx = pointsList.length - 1 - diffHours;
      if (idx >= 0 && idx < pointsList.length) {
        if (tx.type === "RECEITA") pointsList[idx].revenue += Number(tx.amount);
        if (tx.type === "DESPESA") pointsList[idx].expenses += Number(tx.amount);
      }
    });

    // Mapear transações do período anterior (deslocado em 24h ou 4h)
    const shiftMs = (timeframe === "4h" ? 4 : 24) * 60 * 60 * 1000;
    previousTransactions.forEach((tx) => {
      const txTime = new Date(tx.date).getTime() + shiftMs;
      const diffHours = Math.floor((now.getTime() - txTime) / (60 * 60 * 1000));
      const idx = pointsList.length - 1 - diffHours;
      if (idx >= 0 && idx < pointsList.length) {
        pointsList[idx].previousRevenue += Number(tx.amount);
      }
    });
  } else if (timeframe === "1w") {
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const label = `${dayNames[d.getDay()]} (${String(d.getDate()).padStart(2, "0")})`;
      pointsList.push({
        label,
        fullDate: `${String(d.getDate()).padStart(2, "0")} de ${monthNames[d.getMonth()]}`,
        revenue: 0,
        previousRevenue: 0,
        expenses: 0,
      });
    }

    currentTransactions.forEach((tx) => {
      if (tx.status !== "PAGO") return;
      const txTime = new Date(tx.date).getTime();
      const diffDays = Math.floor((now.getTime() - txTime) / (24 * 60 * 60 * 1000));
      const idx = pointsList.length - 1 - diffDays;
      if (idx >= 0 && idx < pointsList.length) {
        if (tx.type === "RECEITA") pointsList[idx].revenue += Number(tx.amount);
        if (tx.type === "DESPESA") pointsList[idx].expenses += Number(tx.amount);
      }
    });

    const shiftMs = 7 * 24 * 60 * 60 * 1000;
    previousTransactions.forEach((tx) => {
      const txTime = new Date(tx.date).getTime() + shiftMs;
      const diffDays = Math.floor((now.getTime() - txTime) / (24 * 60 * 60 * 1000));
      const idx = pointsList.length - 1 - diffDays;
      if (idx >= 0 && idx < pointsList.length) {
        pointsList[idx].previousRevenue += Number(tx.amount);
      }
    });
  } else if (timeframe === "1m") {
    // 30 dias em 6 blocos de 5 dias
    for (let i = 5; i >= 0; i--) {
      const dayOffsetEnd = i * 5;
      const dEnd = new Date(now.getTime() - dayOffsetEnd * 24 * 60 * 60 * 1000);
      const dStart = new Date(dEnd.getTime() - 4 * 24 * 60 * 60 * 1000);
      const label = `${String(dStart.getDate()).padStart(2, "0")}-${String(dEnd.getDate()).padStart(2, "0")} ${monthNames[dEnd.getMonth()]}`;
      pointsList.push({
        label,
        fullDate: `De ${String(dStart.getDate()).padStart(2, "0")} a ${String(dEnd.getDate()).padStart(2, "0")} de ${monthNames[dEnd.getMonth()]}`,
        revenue: 0,
        previousRevenue: 0,
        expenses: 0,
      });
    }

    currentTransactions.forEach((tx) => {
      if (tx.status !== "PAGO") return;
      const txTime = new Date(tx.date).getTime();
      const diffDays = Math.floor((now.getTime() - txTime) / (24 * 60 * 60 * 1000));
      const blockIndex = Math.min(5, Math.max(0, 5 - Math.floor(diffDays / 5)));
      if (pointsList[blockIndex]) {
        if (tx.type === "RECEITA") pointsList[blockIndex].revenue += Number(tx.amount);
        if (tx.type === "DESPESA") pointsList[blockIndex].expenses += Number(tx.amount);
      }
    });

    const shiftMs = 30 * 24 * 60 * 60 * 1000;
    previousTransactions.forEach((tx) => {
      const txTime = new Date(tx.date).getTime() + shiftMs;
      const diffDays = Math.floor((now.getTime() - txTime) / (24 * 60 * 60 * 1000));
      const blockIndex = Math.min(5, Math.max(0, 5 - Math.floor(diffDays / 5)));
      if (pointsList[blockIndex]) {
        pointsList[blockIndex].previousRevenue += Number(tx.amount);
      }
    });
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
      pointsList.push({
        label,
        fullDate: `${monthNames[m - 1]} de ${y}`,
        monthIndex: m - 1,
        revenue: 0,
        previousRevenue: 0,
        expenses: 0,
      });
    }

    currentTransactions.forEach((tx) => {
      if (tx.status !== "PAGO") return;
      const txParts = getBrasiliaDateParts(tx.date);
      // Mapear pelo mês e ano de Brasília
      const diffMonths =
        (nowParts.year - txParts.year) * 12 + (nowParts.month - txParts.month);
      const idx = 11 - diffMonths;
      if (idx >= 0 && idx < pointsList.length) {
        if (tx.type === "RECEITA") pointsList[idx].revenue += Number(tx.amount);
        if (tx.type === "DESPESA") pointsList[idx].expenses += Number(tx.amount);
      }
    });

    previousTransactions.forEach((tx) => {
      const txParts = getBrasiliaDateParts(tx.date);
      // O ano anterior é deslocado em 12 meses no fuso de Brasília
      const diffMonths =
        (nowParts.year - txParts.year) * 12 +
        (nowParts.month - txParts.month) -
        12;
      const idx = 11 - diffMonths;
      if (idx >= 0 && idx < pointsList.length) {
        pointsList[idx].previousRevenue += Number(tx.amount);
      }
    });
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

  // Totais
  let totalRevenue = 0;
  let totalExpenses = 0;
  currentTransactions.forEach((tx) => {
    if (tx.status === "PAGO") {
      if (tx.type === "RECEITA") totalRevenue += Number(tx.amount);
      if (tx.type === "DESPESA") totalExpenses += Number(tx.amount);
    }
  });

  const previousRevenue = previousTransactions.reduce(
    (acc, curr) => acc + Number(curr.amount),
    0,
  );

  const absoluteChange = totalRevenue - previousRevenue;
  const percentChange =
    previousRevenue > 0
      ? (absoluteChange / previousRevenue) * 100
      : totalRevenue > 0
        ? 100
        : 0;
  const isPositive = absoluteChange >= 0;

  // Cálculo de destaque
  const midIndex = Math.floor(points.length / 2);
  const endIndex = points.length - 1;
  const highlightVal1 = points[midIndex]?.revenue || 0;
  const highlightVal2 = points[endIndex]?.revenue || 0;
  const highlightDiff = highlightVal2 - highlightVal1;
  const highlightLabel =
    points[midIndex] && points[endIndex]
      ? `${points[midIndex].date} → ${points[endIndex].date}`
      : "Variação recente";

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

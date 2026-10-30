export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { getTenantPrisma, prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const admin = await requireAuth();
    const tenantPrisma = getTenantPrisma(admin.organizationId);

    // Pegar o slug da organização e status da página personalizada para o link de agendamento
    const organization = await tenantPrisma.organization.findUnique({
      where: { id: admin.organizationId },
      select: {
        slug: true,
        link_bio: {
          select: {
            is_active: true,
          },
        },
      },
    });
    const organizationSlug = organization?.slug || "minha-clinica";
    const isCustomPageActive = Boolean(organization?.link_bio?.is_active);

    // 1. Ranking de Clientes (Top 5 clientes com mais receitas pagas via groupBy no Postgres)
    const topClientsData = await tenantPrisma.transaction.groupBy({
      by: ["client_id"],
      where: {
        organization_id: admin.organizationId,
        type: "RECEITA",
        status: "PAGO",
        client_id: { not: null },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 5,
    });

    const clientIds = topClientsData.map((c) => c.client_id as string);
    const clients = await tenantPrisma.client.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, name: true },
    });

    const ranking = topClientsData.map((c) => {
      const client = clients.find((cl) => cl.id === c.client_id);
      return {
        id: c.client_id as string,
        name: client?.name || "Desconhecido",
        spent: Number(c._sum.amount) || 0,
      };
    });

    // 2. Horários mais Movimentados e Heatmap (Agrupado nativamente no PostgreSQL)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const appointmentsHourlyRaw = await prisma.$queryRaw<
      Array<{
        dow: number;
        hour: number;
        count: number;
      }>
    >`
      SELECT 
        EXTRACT(DOW FROM date_time AT TIME ZONE 'America/Sao_Paulo')::int AS dow,
        EXTRACT(HOUR FROM date_time AT TIME ZONE 'America/Sao_Paulo')::int AS hour,
        COUNT(id)::int AS count
      FROM appointments
      WHERE organization_id = ${admin.organizationId}
        AND date_time >= ${thirtyDaysAgo}
        AND status != 'CANCELADO'
      GROUP BY dow, hour
    `;

    const hoursCount: Record<string, number> = {};
    const heatmapCount: Record<string, Record<string, number>> = {};
    const daysMap = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const timeSlots = ["08h", "10h", "12h", "14h", "16h", "18h"];

    for (const day of daysMap) {
      heatmapCount[day] = {};
      for (const t of timeSlots) {
        heatmapCount[day][t] = 0;
      }
    }

    appointmentsHourlyRaw.forEach((row) => {
      const hour = row.hour;
      const count = Number(row.count || 0);

      // Busiest hours (08:00 to 18:00)
      if (hour >= 8 && hour <= 18) {
        const hKey = `${hour.toString().padStart(2, "0")}:00`;
        hoursCount[hKey] = (hoursCount[hKey] || 0) + count;
      }

      // Heatmap logic
      const day = daysMap[row.dow];
      let slotHour = hour % 2 !== 0 ? hour - 1 : hour;
      if (slotHour < 8) slotHour = 8;
      if (slotHour > 18) slotHour = 18;
      const tKey = `${slotHour.toString().padStart(2, "0")}h`;

      if (day && heatmapCount[day] && heatmapCount[day][tKey] !== undefined) {
        heatmapCount[day][tKey] += count;
      }
    });

    const busiestHours = Object.keys(hoursCount)
      .map((time) => ({
        time,
        appointments: hoursCount[time],
      }))
      .sort((a, b) => a.time.localeCompare(b.time));

    const heatmap = daysMap.map((day) => ({
      day,
      hours: timeSlots.map((time) => ({
        time,
        intensity: heatmapCount[day][time] || 0,
      })),
    }));

    // 3. Ticket Médio Real (Últimos 30 dias vs 30 dias anteriores via Agregação Nativa)
    const now = new Date();
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(now.getDate() - 60);

    const [currentTicketData, previousTicketData] = await Promise.all([
      tenantPrisma.transaction.aggregate({
        where: {
          organization_id: admin.organizationId,
          type: "RECEITA",
          status: "PAGO",
          date: { gte: thirtyDaysAgo },
        },
        _avg: { amount: true },
      }),
      tenantPrisma.transaction.aggregate({
        where: {
          organization_id: admin.organizationId,
          type: "RECEITA",
          status: "PAGO",
          date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
        _avg: { amount: true },
      }),
    ]);

    const currentTicket = Number(currentTicketData._avg.amount) || 0;
    const previousTicket = Number(previousTicketData._avg.amount) || 0;

    let percentageChange = 0;
    if (previousTicket > 0) {
      percentageChange =
        ((currentTicket - previousTicket) / previousTicket) * 100;
    } else if (currentTicket > 0) {
      percentageChange = 100;
    }

    // Histórico para o gráfico de ticket médio (Últimos 7 dias agregados nativamente no Postgres)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 6);

    const recentTxAgg = await prisma.$queryRaw<
      Array<{
        day_str: string;
        total: number;
        count: number;
      }>
    >`
      SELECT 
        TO_CHAR(date AT TIME ZONE 'America/Sao_Paulo', 'DD/MM') AS day_str,
        COALESCE(SUM(amount), 0)::float AS total,
        COUNT(id)::int AS count
      FROM transactions
      WHERE organization_id = ${admin.organizationId}
        AND type = 'RECEITA'
        AND status = 'PAGO'
        AND date >= ${sevenDaysAgo}
      GROUP BY day_str
    `;

    const txAggMap = new Map<string, { total: number; count: number }>();
    recentTxAgg.forEach((r) => {
      txAggMap.set(r.day_str, {
        total: Number(r.total || 0),
        count: Number(r.count || 0),
      });
    });

    const historyMap: Record<string, { total: number; count: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dayStr = d.toLocaleDateString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
      });
      const agg = txAggMap.get(dayStr) || { total: 0, count: 0 };
      historyMap[dayStr] = agg;
    }

    const history = Object.keys(historyMap).map((dayStr) => ({
      day: dayStr.substring(0, 2),
      value:
        historyMap[dayStr].count > 0
          ? historyMap[dayStr].total / historyMap[dayStr].count
          : 0,
    }));

    // 4. Volume de Agendamentos nos últimos 6 meses (Agrupado nativamente no Postgres)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const sixMonthsAppointmentsRaw = await prisma.$queryRaw<
      Array<{
        month_key: string;
        count: number;
      }>
    >`
      SELECT 
        TO_CHAR(date_time AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM') AS month_key,
        COUNT(id)::int AS count
      FROM appointments
      WHERE organization_id = ${admin.organizationId}
        AND status = 'REALIZADO'
        AND date_time >= ${sixMonthsAgo}
      GROUP BY month_key
    `;

    const monthCountMap = new Map<string, number>();
    sixMonthsAppointmentsRaw.forEach((row) => {
      monthCountMap.set(row.month_key, Number(row.count || 0));
    });

    const monthNames = [
      "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
      "Jul", "Ago", "Set", "Out", "Nov", "Dez",
    ];
    const sixMonthsList: Array<{ month: string; agendamentos: number }> = [];
    let totalSixMonths = 0;

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const monthKey = `${y}-${String(m).padStart(2, "0")}`;
      const label = `${monthNames[d.getMonth()]}/${String(y).slice(-2)}`;
      const count = monthCountMap.get(monthKey) || 0;

      sixMonthsList.push({ month: label, agendamentos: count });
      totalSixMonths += count;
    }

    return NextResponse.json({
      scheduling: {
        slug: organizationSlug,
        isActive: isCustomPageActive,
      },
      ranking,
      busiestHours: busiestHours.length > 0 ? busiestHours : null,
      heatmap,
      ticket: {
        current: currentTicket,
        percentageChange: percentageChange,
        history: history.length > 0 ? history : null,
      },
      appointmentsVolume: {
        total: totalSixMonths,
        monthly: sixMonthsList,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[WIDGETS_GET]", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

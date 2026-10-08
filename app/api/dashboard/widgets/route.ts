export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { getTenantPrisma } from "@/lib/prisma";

export async function GET() {
  try {
    const admin = await requireAuth();
    const prisma = getTenantPrisma(admin.organizationId);

    // Pegar o slug da organização para o link de agendamento
    const organization = await prisma.organization.findUnique({
      where: { id: admin.organizationId },
      select: { slug: true }
    });
    const organizationSlug = organization?.slug || "minha-clinica";

    // 1. Ranking de Clientes (Top 5 clientes com mais receitas pagas)
    const topClientsData = await prisma.transaction.groupBy({
      by: ['client_id'],
      where: {
        organization_id: admin.organizationId,
        type: 'RECEITA',
        status: 'PAGO',
        client_id: { not: null }
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 5
    });

    // Pega os nomes dos clientes
    const clientIds = topClientsData.map(c => c.client_id as string);
    const clients = await prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, name: true }
    });

    const ranking = topClientsData.map(c => {
      const client = clients.find(cl => cl.id === c.client_id);
      return {
        id: c.client_id as string,
        name: client?.name || "Desconhecido",
        spent: Number(c._sum.amount) || 0
      };
    });

    // 2. Horários mais Movimentados e Heatmap
    // Pegar agendamentos dos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentAppointments = await prisma.appointment.findMany({
      where: {
        organization_id: admin.organizationId,
        date_time: { gte: thirtyDaysAgo },
        status: { not: 'CANCELADO' }
      },
      select: { date_time: true }
    });

    const hoursCount: Record<string, number> = {};
    const heatmapCount: Record<string, Record<string, number>> = {};
    const daysMap = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const timeSlots = ["08h", "10h", "12h", "14h", "16h", "18h"];

    // Inicializar heatmap
    for (const day of daysMap) {
      heatmapCount[day] = {};
      for (const t of timeSlots) {
        heatmapCount[day][t] = 0;
      }
    }

    recentAppointments.forEach(app => {
      // Ajustar fuso local (simplificado para exibição)
      const date = new Date(app.date_time.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
      const hour = date.getHours();

      // Busiest hours (08:00 to 18:00)
      if (hour >= 8 && hour <= 18) {
        const hKey = `${hour.toString().padStart(2, '0')}:00`;
        hoursCount[hKey] = (hoursCount[hKey] || 0) + 1;
      }

      // Heatmap logic
      const day = daysMap[date.getDay()];
      // Arredondar para o slot mais próximo (par) entre 8 e 18
      let slotHour = hour % 2 !== 0 ? hour - 1 : hour;
      if (slotHour < 8) slotHour = 8;
      if (slotHour > 18) slotHour = 18;
      const tKey = `${slotHour.toString().padStart(2, '0')}h`;

      if (heatmapCount[day] && heatmapCount[day][tKey] !== undefined) {
        heatmapCount[day][tKey] += 1;
      }
    });

    const busiestHours = Object.keys(hoursCount).map(time => ({
      time,
      appointments: hoursCount[time]
    })).sort((a, b) => a.time.localeCompare(b.time));

    const heatmap = daysMap.map(day => ({
      day,
      hours: timeSlots.map(time => ({
        time,
        intensity: heatmapCount[day][time] || 0
      }))
    }));

    // Calcula ticket médio real (Últimos 30 dias vs 30 dias anteriores)
    const now = new Date();
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(now.getDate() - 60);

    const currentTicketData = await prisma.transaction.aggregate({
      where: {
        organization_id: admin.organizationId,
        type: 'RECEITA',
        status: 'PAGO',
        date: { gte: thirtyDaysAgo }
      },
      _avg: { amount: true }
    });

    const previousTicketData = await prisma.transaction.aggregate({
      where: {
        organization_id: admin.organizationId,
        type: 'RECEITA',
        status: 'PAGO',
        date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
      },
      _avg: { amount: true }
    });

    const currentTicket = Number(currentTicketData._avg.amount) || 0;
    const previousTicket = Number(previousTicketData._avg.amount) || 0;

    let percentageChange = 0;
    if (previousTicket > 0) {
      percentageChange = ((currentTicket - previousTicket) / previousTicket) * 100;
    } else if (currentTicket > 0) {
      percentageChange = 100;
    }

    // Histórico para o gráfico (Últimos 7 dias)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 6); // 7 days including today

    const recentTransactions = await prisma.transaction.findMany({
      where: {
        organization_id: admin.organizationId,
        type: 'RECEITA',
        status: 'PAGO',
        date: { gte: sevenDaysAgo }
      },
      select: { date: true, amount: true }
    });

    const historyMap: Record<string, { total: number; count: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dayStr = d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' });
      historyMap[dayStr] = { total: 0, count: 0 };
    }

    recentTransactions.forEach(t => {
      const dayStr = t.date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' });
      if (historyMap[dayStr]) {
        historyMap[dayStr].total += Number(t.amount);
        historyMap[dayStr].count += 1;
      }
    });

    const history = Object.keys(historyMap).map(dayStr => ({
      day: dayStr.substring(0, 2), // Retorna apenas o dia ex: "05"
      value: historyMap[dayStr].count > 0 ? historyMap[dayStr].total / historyMap[dayStr].count : 0
    }));

    return NextResponse.json({
      scheduling: organizationSlug,
      ranking,
      busiestHours: busiestHours.length > 0 ? busiestHours : null,
      heatmap,
      ticket: {
        current: currentTicket,
        percentageChange: percentageChange,
        history: history.length > 0 ? history : null
      }
    });

  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[WIDGETS_GET]", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

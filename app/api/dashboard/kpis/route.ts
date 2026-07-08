// app/api/dashboard/kpis/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    //  CORREÇÃO DO FUSO HORÁRIO (Forçando o fuso do Brasil UTC-3)
    const now = new Date();
    // Pega a data atual EXATAMENTE como é no Brasil (MM/DD/YYYY)
    const todayStr = now.toLocaleDateString("en-US", {
      timeZone: "America/Sao_Paulo",
    });

    // Início e Fim do dia atual no Brasil
    const startOfDay = new Date(`${todayStr} 00:00:00 GMT-0300`);
    const tomorrow = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Início do dia de ontem
    const startOfYesterday = new Date(
      startOfDay.getTime() - 24 * 60 * 60 * 1000,
    );

    // 1. Total de Agendamentos de Hoje
    const appointmentsToday = await prisma.appointment.count({
      where: {
        organization_id: admin.organizationId,
        date_time: {
          gte: startOfDay,
          lt: tomorrow,
        },
      },
    });

    // 2. Total de Agendamentos de Ontem (Para cálculo da métrica)
    const appointmentsYesterday = await prisma.appointment.count({
      where: {
        organization_id: admin.organizationId,
        date_time: {
          gte: startOfYesterday,
          lt: startOfDay,
        },
      },
    });

    // 3. Check-ins Realizados Hoje
    const checkInsToday = await prisma.checkIn.count({
      where: {
        organization_id: admin.organizationId,
        date_time: {
          gte: startOfDay,
          lt: tomorrow,
        },
      },
    });

    // 4. Clientes com pacotes ativos
    const activeClients = await prisma.client.count({
      where: {
        organization_id: admin.organizationId,
        packages: {
          some: {
            active: true,
            used_sessions: {
              lt: prisma.package.fields.total_sessions,
            },
          },
        },
      },
    });

    // 5. Faltas e Cancelamentos de Hoje
    // Baseado na sua cron de faltas automáticas, elas são marcadas como CANCELADO
    const noShowsToday = await prisma.appointment.count({
      where: {
        organization_id: admin.organizationId,
        date_time: {
          gte: startOfDay,
          lt: tomorrow,
        },
        status: "CANCELADO",
      },
    });

    // --- 🧮 CÁLCULO DOS KPIs ---

    // Métrica de Agendamentos (Em relação a ontem)
    let appointmentsVsYesterday = 0;
    if (appointmentsYesterday > 0) {
      appointmentsVsYesterday = Math.round(
        ((appointmentsToday - appointmentsYesterday) / appointmentsYesterday) *
          100,
      );
    } else if (appointmentsToday > 0) {
      appointmentsVsYesterday = 100; // Se ontem foi 0 e hoje teve agendamento, +100%
    }

    // Métrica de Check-ins (Porcentagem de aproveitamento da agenda)
    let checkInsPercentage = 0;
    if (appointmentsToday > 0) {
      checkInsPercentage = Math.round(
        (checkInsToday / appointmentsToday) * 100,
      );
    } else if (checkInsToday > 0) {
      checkInsPercentage = 100; // Tratamento para caso atípico de check-in avulso sem agenda
    }

    // 🔥 Retornamos exatamente as chaves que o nosso KpiData no Front-end espera
    return NextResponse.json({
      appointmentsToday,
      appointmentsVsYesterday,
      checkInsToday,
      checkInsPercentage,
      activeClients,
      noShowsToday,
    });
  } catch (error) {
    console.error("Erro ao buscar KPIs do dashboard:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

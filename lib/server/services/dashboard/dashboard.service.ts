// lib/server/services/dashboard/dashboard.service.ts
import { getTenantPrisma } from "@/lib/prisma";

export class DashboardService {
  /**
   * Busca os check-ins do dia atual com paginação,
   * aplicando correção de fuso horário e isolamento de tenant.
   */
  static async getTodayCheckIns(
    organizationId: string,
    page: number,
    limit: number,
  ) {
    const prisma = getTenantPrisma(organizationId);
    const skip = (page - 1) * limit;

    // CORREÇÃO DO FUSO HORÁRIO (Forçando o fuso do Brasil UTC-3)
    const now = new Date();
    const todayStr = now.toLocaleDateString("en-US", {
      timeZone: "America/Sao_Paulo",
    });

    const startOfDay = new Date(`${todayStr} 00:00:00 GMT-0300`);
    const tomorrow = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Busca apenas os check-ins daquela página
    const recentCheckIns = await prisma.checkIn.findMany({
      where: {
        organization_id: organizationId,
        date_time: {
          gte: startOfDay,
          lt: tomorrow,
        },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        // RASTREABILIDADE: Trazendo o nome de quem atendeu
        admin: {
          select: {
            display_name: true,
          },
        },
      },
      orderBy: {
        date_time: "desc",
      },
      skip: skip,
      take: limit + 1, // Truque: Pede 1 a mais para saber se tem próxima página
    });

    // Verifica se pegou aquele "1 a mais"
    const hasMore = recentCheckIns.length > limit;

    // Remove aquele "1 a mais" se ele existir para devolver apenas o limite exato
    const checkInsToReturn = hasMore
      ? recentCheckIns.slice(0, -1)
      : recentCheckIns;

    const formattedCheckIns = checkInsToReturn.map((checkIn) => ({
      id: checkIn.id,
      client_id: checkIn.client?.id ?? "",
      client_name: checkIn.client?.name ?? "Cliente Avulso",
      date_time: checkIn.date_time,
      professional_name: checkIn.admin?.display_name ?? null,
    }));

    return {
      data: formattedCheckIns,
      hasMore,
      page,
    };
  }
  /**
   * Busca os indicadores de performance (KPIs) do dia atual,
   * calculando a variação em relação ao dia anterior e garantindo isolamento de tenant.
   */
  static async getDashboardKpis(organizationId: string) {
    const prisma = getTenantPrisma(organizationId);

    // CORREÇÃO DO FUSO HORÁRIO (Forçando o fuso do Brasil UTC-3)
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
        organization_id: organizationId,
        date_time: {
          gte: startOfDay,
          lt: tomorrow,
        },
      },
    });

    // 2. Total de Agendamentos de Ontem (Para cálculo da métrica)
    const appointmentsYesterday = await prisma.appointment.count({
      where: {
        organization_id: organizationId,
        date_time: {
          gte: startOfYesterday,
          lt: startOfDay,
        },
      },
    });

    // 3. Check-ins Realizados Hoje
    const checkInsToday = await prisma.checkIn.count({
      where: {
        organization_id: organizationId,
        date_time: {
          gte: startOfDay,
          lt: tomorrow,
        },
      },
    });

    // 4. Clientes com pacotes ativos
    const activeClients = await prisma.client.count({
      where: {
        organization_id: organizationId,
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
    const noShowsToday = await prisma.appointment.count({
      where: {
        organization_id: organizationId,
        date_time: {
          gte: startOfDay,
          lt: tomorrow,
        },
        status: "CANCELADO",
      },
    });

    // --- 🧮 CÁLCULO DOS KPIs ---
    let appointmentsVsYesterday = 0;
    if (appointmentsYesterday > 0) {
      appointmentsVsYesterday = Math.round(
        ((appointmentsToday - appointmentsYesterday) / appointmentsYesterday) *
          100,
      );
    } else if (appointmentsToday > 0) {
      appointmentsVsYesterday = 100;
    }

    let checkInsPercentage = 0;
    if (appointmentsToday > 0) {
      checkInsPercentage = Math.round(
        (checkInsToday / appointmentsToday) * 100,
      );
    } else if (checkInsToday > 0) {
      checkInsPercentage = 100;
    }

    return {
      appointmentsToday,
      appointmentsVsYesterday,
      checkInsToday,
      checkInsPercentage,
      activeClients,
      noShowsToday,
    };
  }
}

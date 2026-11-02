// app/actions/notifications.ts
"use server";

import { requireAuth } from "@/lib/auth";
import { getTenantPrisma } from "@/lib/prisma";

export interface NotificationItem {
  id: string;
  type: "CHECK_IN" | "BOOKING_REQUEST" | "CANCELLATION" | "LOW_STOCK" | "LAST_SESSION";
  title: string;
  description: string;
  timestamp: string;
  actionUrl?: string;
  actionLabel?: string;
}

export interface DailyKickoffData {
  professionalName: string;
  appointmentsToday: number;
  pendingRequests: number;
  birthdaysToday: number;
}

export async function getAutoBookingStatusAction(): Promise<{
  success: boolean;
  isActive: boolean;
}> {
  try {
    const admin = await requireAuth();
    const prisma = getTenantPrisma(admin.organizationId);
    const linkBio = await prisma.linkBio.findUnique({
      where: { organization_id: admin.organizationId },
      select: { is_active: true },
    });
    return { success: true, isActive: Boolean(linkBio?.is_active) };
  } catch (error) {
    return { success: false, isActive: false };
  }
}

export async function getNotificationsAction(): Promise<{
  success: boolean;
  data: NotificationItem[];
  error?: string;
}> {
  try {
    const admin = await requireAuth();
    const prisma = getTenantPrisma(admin.organizationId);

    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    // Consulta confluência: se o autoagendamento da clínica está ativo
    const linkBio = await prisma.linkBio.findUnique({
      where: { organization_id: admin.organizationId },
      select: { is_active: true },
    });
    const isAutoBookingActive = Boolean(linkBio?.is_active);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [checkIns, bookingRequests, cancellations, lowStockItems, lastSessionAppts] =
      await Promise.all([
        // 1. Check-ins recentes no Totem
        prisma.checkIn.findMany({
          where: {
            organization_id: admin.organizationId,
            deleted_at: null,
            date_time: { gte: twoDaysAgo },
          },
          include: {
            client: { select: { id: true, name: true } },
            appointment: {
              include: {
                service: { select: { name: true } },
              },
            },
            package: { select: { name: true } },
          },
          orderBy: { date_time: "desc" },
          take: 10,
        }),

        // 2. Solicitações de agendamento online (somente se autoagendamento ativo)
        isAutoBookingActive
          ? prisma.appointment.findMany({
              where: {
                organization_id: admin.organizationId,
                status: "SOLICITADO",
                created_at: { gte: twoDaysAgo },
              },
              include: {
                client: { select: { id: true, name: true } },
                service: { select: { name: true } },
              },
              orderBy: { created_at: "desc" },
              take: 10,
            })
          : Promise.resolve([]),

        // 3. Cancelamentos feitos exclusivamente pelo cliente via autoatendimento
        isAutoBookingActive
          ? prisma.appointment.findMany({
              where: {
                organization_id: admin.organizationId,
                status: "CANCELADO",
                observations: { contains: "[Cancelado pelo cliente" },
                updated_at: { gte: twoDaysAgo },
              },
              include: {
                client: { select: { id: true, name: true } },
                service: { select: { name: true } },
              },
              orderBy: { updated_at: "desc" },
              take: 5,
            })
          : Promise.resolve([]),

        // 4. Insumos/produtos com estoque baixo
        prisma.stockItem.findMany({
          where: {
            organization_id: admin.organizationId,
            active: true,
            quantity: { lte: 5 },
          },
          orderBy: { quantity: "asc" },
          take: 5,
        }),

        // 5. Última sessão de pacote agendada para hoje
        prisma.appointment.findMany({
          where: {
            organization_id: admin.organizationId,
            date_time: { gte: startOfToday, lte: endOfToday },
            status: { not: "CANCELADO" },
            package_id: { not: null },
          },
          include: {
            client: { select: { id: true, name: true } },
            service: { select: { name: true } },
            package: { select: { total_sessions: true, name: true } },
          },
          take: 5,
        }),
      ]);

    const items: NotificationItem[] = [];

    // Mapeia Check-ins
    for (const c of checkIns) {
      const clientName = c.client?.name || "Cliente";
      const serviceName =
        c.appointment?.service?.name || c.package?.name || "Atendimento";

      items.push({
        id: `checkin-${c.id}`,
        type: "CHECK_IN",
        title: "Check-in Realizado",
        description: `${clientName} confirmou presença para ${serviceName}.`,
        timestamp: c.date_time.toISOString(),
        actionUrl: "/admin/history",
        actionLabel: "Ver Histórico",
      });
    }

    // Mapeia Agendamentos Online
    for (const b of bookingRequests) {
      const clientName = b.client?.name || "Cliente";
      const serviceName = b.service?.name || "Serviço";
      const formattedDate = new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(b.date_time));

      items.push({
        id: `booking-${b.id}`,
        type: "BOOKING_REQUEST",
        title: "Novo Agendamento Online",
        description: `${clientName} solicitou ${serviceName} para ${formattedDate}.`,
        timestamp: b.created_at.toISOString(),
        actionUrl: "/admin/auto/requests",
        actionLabel: "Aprovar Horário",
      });
    }

    // Mapeia Cancelamentos
    for (const cancel of cancellations) {
      const clientName = cancel.client?.name || "Cliente";
      const formattedDate = new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(cancel.date_time));

      items.push({
        id: `cancel-${cancel.id}`,
        type: "CANCELLATION",
        title: "Horário Desmarcado",
        description: `${clientName} cancelou o agendamento de ${formattedDate}.`,
        timestamp: cancel.updated_at.toISOString(),
        actionUrl: "/admin/agenda",
        actionLabel: "Ver Agenda",
      });
    }

    // Mapeia Estoque Baixo
    for (const s of lowStockItems) {
      const qty = Number(s.quantity);
      items.push({
        id: `stock-${s.id}`,
        type: "LOW_STOCK",
        title: "Estoque Baixo",
        description: `${s.name} possui apenas ${qty} ${qty === 1 ? "unidade restante" : "unidades restantes"}.`,
        timestamp: s.updated_at.toISOString(),
        actionUrl: "/admin/stock",
        actionLabel: "Ver Estoque",
      });
    }

    // Mapeia Última Sessão de Pacote
    for (const a of lastSessionAppts) {
      const total = a.package?.total_sessions ?? 0;
      const current = a.session_number ?? 0;
      if (total > 0 && current >= total) {
        const clientName = a.client?.name || "Cliente";
        const serviceName = a.service?.name || a.package?.name || "Tratamento";
        items.push({
          id: `last-session-${a.id}`,
          type: "LAST_SESSION",
          title: "Última Sessão de Pacote",
          description: `${clientName} tem hoje a ${current}ª e última sessão de ${serviceName}.`,
          timestamp: a.date_time.toISOString(),
          actionUrl: "/admin/agenda",
          actionLabel: "Ver na Agenda",
        });
      }
    }

    // Ordena do mais recente para o mais antigo
    items.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return {
      success: true,
      data: items,
    };
  } catch (error: any) {
    console.error("[getNotificationsAction]", error);
    return {
      success: false,
      data: [],
      error: error?.message || "Erro ao buscar notificações",
    };
  }
}

/**
 * Retorna as estatísticas do dia para o cartão Daily Kickoff no Dashboard
 */
export async function getDailyKickoffAction(): Promise<{
  success: boolean;
  data: DailyKickoffData;
  error?: string;
}> {
  try {
    const admin = await requireAuth();
    const prisma = getTenantPrisma(admin.organizationId);

    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
    );

    const [appointmentsToday, pendingRequests, allClients] = await Promise.all([
      // Atendimentos do dia (não cancelados)
      prisma.appointment.count({
        where: {
          organization_id: admin.organizationId,
          date_time: { gte: startOfDay, lte: endOfDay },
          status: { not: "CANCELADO" },
        },
      }),

      // Solicitações de agendamento online pendentes (apenas se autoagendamento ativo)
      prisma.linkBio
        .findUnique({
          where: { organization_id: admin.organizationId },
          select: { is_active: true },
        })
        .then((lb) =>
          lb?.is_active
            ? prisma.appointment.count({
                where: {
                  organization_id: admin.organizationId,
                  status: "SOLICITADO",
                },
              })
            : 0,
        ),

      // Clientes ativos com data de nascimento
      prisma.client.findMany({
        where: {
          organization_id: admin.organizationId,
          active: true,
          birth_date: { not: null },
        },
        select: { birth_date: true },
      }),
    ]);

    const todayDay = now.getDate();
    const todayMonth = now.getMonth();

    const birthdaysToday = allClients.filter((c) => {
      if (!c.birth_date) return false;
      const bDate = new Date(c.birth_date);
      return (
        bDate.getUTCDate() === todayDay && bDate.getUTCMonth() === todayMonth
      );
    }).length;

    return {
      success: true,
      data: {
        professionalName: admin.name ? admin.name.split(" ")[0] : "Profissional",
        appointmentsToday,
        pendingRequests,
        birthdaysToday,
      },
    };
  } catch (error: any) {
    console.error("[getDailyKickoffAction]", error);
    return {
      success: false,
      data: {
        professionalName: "Profissional",
        appointmentsToday: 0,
        pendingRequests: 0,
        birthdaysToday: 0,
      },
      error: error?.message,
    };
  }
}

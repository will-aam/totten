// lib/server/services/clients/client-history.service.ts
import { getTenantPrisma } from "@/lib/prisma";

export class ClientHistoryService {
  /**
   * Constrói e pagina a linha do tempo (timeline) completa do histórico de um cliente.
   */
  static async getClientTimeline(
    organizationId: string,
    clientId: string,
    page: number,
    limit: number,
  ) {
    const prisma = getTenantPrisma(organizationId);
    const skip = (page - 1) * limit;

    const client = await prisma.client.findFirst({
      where: { id: clientId, organization_id: organizationId },
      select: { id: true, created_at: true, name: true },
    });

    if (!client) {
      throw new Error("CLIENT_NOT_FOUND");
    }

    const checkIns = await prisma.checkIn.findMany({
      where: { client_id: clientId, organization_id: organizationId },
      include: {
        admin: { select: { display_name: true } },
        package: { select: { name: true } },
      },
    });

    const packages = await prisma.package.findMany({
      where: { client_id: clientId, organization_id: organizationId },
    });

    const clientNotes = await prisma.clientNote.findMany({
      where: { client_id: clientId, organization_id: organizationId },
    });

    // Buscamos os agendamentos cancelados para achar as faltas automáticas
    const cancelledAppointments = await prisma.appointment.findMany({
      where: {
        client_id: clientId,
        organization_id: organizationId,
        status: "CANCELADO",
      },
      include: {
        package: { select: { name: true } },
        professional: { select: { display_name: true } },
      },
    });

    // Filtramos apenas os que foram cancelados pelo robô (que tem a nossa palavra-chave)
    const noShowAppointments = cancelledAppointments.filter(
      (appt) =>
        appt.observations?.includes("Falta automática") ||
        appt.observations?.includes("Baixa automática pelo sistema"),
    );

    const timelineEvents: any[] = [];

    // A: Criação
    timelineEvents.push({
      id: `client-created-${client.id}`,
      type: "CLIENT_CREATED",
      date: client.created_at,
      title: "Cadastro Realizado",
      meta: { name: client.name },
    });

    // B e C: Pacotes
    packages.forEach((pkg) => {
      timelineEvents.push({
        id: `pkg-purchased-${pkg.id}`,
        type: "PACKAGE_PURCHASED",
        date: pkg.created_at,
        title: "Pacote Adquirido",
        meta: {
          packageName: pkg.name,
          price: Number(pkg.price),
          totalSessions: pkg.total_sessions,
        },
      });

      if (!pkg.active) {
        timelineEvents.push({
          id: `pkg-archived-${pkg.id}`,
          type: "PACKAGE_ARCHIVED",
          date: pkg.updated_at,
          title: "Pacote Encerrado",
          meta: {
            packageName: pkg.name,
            usedSessions: pkg.used_sessions,
            totalSessions: pkg.total_sessions,
          },
        });
      }
    });

    // D: Check-ins (incluindo os removidos, agora marcados)
    checkIns.forEach((ci) => {
      const isDeleted = !!ci.deleted_at;
      timelineEvents.push({
        id: `checkin-${ci.id}`,
        type: "CHECK_IN",
        date: ci.date_time,
        title: isDeleted ? "Check-in Removido" : "Sessão Realizada",
        meta: {
          isPackage: !!ci.package_id,
          packageName: ci.package?.name ?? "Desconhecido",
          professionalName: ci.admin?.display_name ?? null,
          deleted: isDeleted,
          deletedByName: ci.deleted_by_name ?? null,
          deletedAt: ci.deleted_at,
        },
      });
    });

    // E: FALTAS (Como se fossem check-ins, mas vermelhos)
    noShowAppointments.forEach((appt) => {
      timelineEvents.push({
        id: `noshow-${appt.id}`,
        type: "NO_SHOW",
        date: appt.date_time,
        title: "Falta Registrada",
        meta: {
          isPackage: !!appt.package_id,
          packageName: appt.package?.name ?? "Avulso",
          professionalName: appt.professional?.display_name ?? null,
          appointmentId: appt.id,
        },
      });
    });

    // F: Notas (Omitimos as notas de falta automática para não duplicar)
    clientNotes.forEach((note) => {
      if (note.text.includes("Falta Automática")) return;

      timelineEvents.push({
        id: `note-${note.id}`,
        type: "CLIENT_NOTE",
        date: note.date,
        title: "Anotação Adicionada",
        meta: { text: note.text },
      });
    });

    // Ordena do mais recente para o mais antigo
    timelineEvents.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const paginatedEvents = timelineEvents.slice(skip, skip + limit);
    const hasMore = timelineEvents.length > skip + limit;

    return {
      data: paginatedEvents,
      hasMore,
      page,
    };
  }
}

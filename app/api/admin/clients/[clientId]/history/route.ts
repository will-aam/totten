// app/api/admin/clients/[clientId]/history/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> },
) {
  try {
    const admin = await requireAuth();
    const { clientId } = await params;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId é obrigatório." },
        { status: 400 },
      );
    }

    const client = await prisma.client.findFirst({
      where: { id: clientId, organization_id: admin.organizationId },
      select: { id: true, created_at: true, name: true },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente não encontrado." },
        { status: 404 },
      );
    }

    const checkIns = await prisma.checkIn.findMany({
      where: { client_id: clientId, organization_id: admin.organizationId },
      include: {
        admin: { select: { display_name: true } },
        package: { select: { name: true } },
      },
    });

    const packages = await prisma.package.findMany({
      where: { client_id: clientId, organization_id: admin.organizationId },
    });

    const clientNotes = await prisma.clientNote.findMany({
      where: { client_id: clientId, organization_id: admin.organizationId },
    });

    // 🔥 NOVIDADE: Buscamos os agendamentos cancelados para achar as faltas automáticas
    const cancelledAppointments = await prisma.appointment.findMany({
      where: {
        client_id: clientId,
        organization_id: admin.organizationId,
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

    // D: Check-ins normais
    checkIns.forEach((ci) => {
      timelineEvents.push({
        id: `checkin-${ci.id}`,
        type: "CHECK_IN",
        date: ci.date_time,
        title: "Sessão Realizada",
        meta: {
          isPackage: !!ci.package_id,
          packageName: ci.package?.name ?? "Desconhecido",
          professionalName: ci.admin?.display_name ?? null,
        },
      });
    });

    // 🔥 E: FALTAS (Como se fossem check-ins, mas vermelhos)
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
          appointmentId: appt.id, // Guardamos o ID para o botão "Desfazer" no futuro!
        },
      });
    });

    // F: Notas (Omitimos as notas de falta automática para não duplicar com o evento acima)
    clientNotes.forEach((note) => {
      if (note.text.includes("Falta Automática")) return; // Ignora as notas geradas pelo robô

      timelineEvents.push({
        id: `note-${note.id}`,
        type: "CLIENT_NOTE",
        date: note.date,
        title: "Anotação Adicionada",
        meta: { text: note.text },
      });
    });

    timelineEvents.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const paginatedEvents = timelineEvents.slice(skip, skip + limit);
    const hasMore = timelineEvents.length > skip + limit;

    return NextResponse.json({
      data: paginatedEvents,
      hasMore,
      page,
    });
  } catch (error) {
    console.error("[GET /api/admin/clients/[clientId]/history] ERRO:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

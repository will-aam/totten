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

    // 1. Busca os dados do Cliente
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

    // 2. Busca os Check-ins
    const checkIns = await prisma.checkIn.findMany({
      where: { client_id: clientId, organization_id: admin.organizationId },
      include: {
        admin: { select: { display_name: true } },
        package: { select: { name: true } },
      },
    });

    // 3. Busca os Pacotes (para ver compras e arquivamentos)
    const packages = await prisma.package.findMany({
      where: { client_id: clientId, organization_id: admin.organizationId },
    });

    // 4. Busca as Notas / Histórico (ONDE ESTÃO AS FALTAS AUTOMÁTICAS!)
    const clientNotes = await prisma.clientNote.findMany({
      where: { client_id: clientId, organization_id: admin.organizationId },
    });

    //  A MÁGICA ACONTECE AQUI: Montamos uma Linha do Tempo Unificada
    const timelineEvents: any[] = [];

    // Evento A: Criação do Cliente
    timelineEvents.push({
      id: `client-created-${client.id}`,
      type: "CLIENT_CREATED",
      date: client.created_at,
      title: "Cadastro Realizado",
      meta: { name: client.name },
    });

    // Evento B e C: Pacotes (Compra e Encerramento)
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

    // Evento D: Check-ins
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

    // Evento E: Notas do Cliente (Faltas e anotações manuais)
    clientNotes.forEach((note) => {
      // Se a nota tiver a palavra chave do Cron, personalizamos o título!
      const isAutoNoShow = note.text.includes("Falta Automática");

      timelineEvents.push({
        id: `note-${note.id}`,
        type: "CLIENT_NOTE",
        date: note.date, // Data em que a nota (ou a falta) ocorreu
        title: isAutoNoShow ? "Falta Registrada" : "Anotação Adicionada",
        meta: {
          text: note.text,
        },
      });
    });

    //  Ordena todos os eventos misturados pela data (do mais recente pro mais antigo)
    timelineEvents.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    // Faz a paginação manualmente no Array
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

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
    const limit = parseInt(searchParams.get("limit") || "10", 10); // Aumentei pra 10 para ver mais eventos por vez
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
      // Evento de Compra do Pacote
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

      // Se o pacote foi encerrado/arquivado (active = false)
      if (!pkg.active) {
        timelineEvents.push({
          id: `pkg-archived-${pkg.id}`,
          type: "PACKAGE_ARCHIVED",
          // Usamos a data de atualização como a data em que foi encerrado
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

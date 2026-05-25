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

    // 🔥 Pega a paginação da URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "5", 10);
    const skip = (page - 1) * limit;

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId é obrigatório." },
        { status: 400 },
      );
    }

    // Valida se o cliente existe para este admin
    const client = await prisma.client.findFirst({
      where: { id: clientId, organization_id: admin.organizationId },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente não encontrado." },
        { status: 404 },
      );
    }

    // Busca os check-ins paginados com a assinatura do profissional e dados do pacote
    const checkIns = await prisma.checkIn.findMany({
      where: {
        client_id: clientId,
        organization_id: admin.organizationId,
      },
      select: {
        id: true,
        date_time: true,
        // 🔥 RASTREABILIDADE: Busca quem confirmou este check-in
        admin: {
          select: {
            display_name: true,
          },
        },
        // 🔥 IDENTIFICAÇÃO: Busca o pacote vinculado (se houver)
        package: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date_time: "desc",
      },
      skip,
      take: limit + 1, // 🔥 Pede 1 a mais para saber se tem próxima página (HasMore)
    });

    const hasMore = checkIns.length > limit;
    const rawDataToReturn = hasMore ? checkIns.slice(0, -1) : checkIns;

    // Formata os dados para o Front-End, criando a distinção de "tipo"
    const formattedData = rawDataToReturn.map((checkIn) => {
      const isPackage = !!checkIn.package;

      return {
        id: checkIn.id,
        date_time: checkIn.date_time,
        professional_name: checkIn.admin?.display_name ?? null,
        // 🔥 Novas propriedades para o front-end desenhar as etiquetas
        type: isPackage ? "PACOTE" : "AVULSO",
        package_name: checkIn.package?.name ?? null,
      };
    });

    return NextResponse.json({
      data: formattedData,
      hasMore,
      page,
    });
  } catch (error) {
    console.error("[GET /api/admin/clients/[clientId]/history] ERRO:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

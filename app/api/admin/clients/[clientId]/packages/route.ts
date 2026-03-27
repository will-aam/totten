// app/api/admin/clients/[clientId]/packages/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clientId: string }> },
) {
  try {
    const admin = await requireAuth();

    // 🔥 Next.js 15+: params precisa ser aguardado
    const { clientId } = await params;

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId é obrigatório." },
        { status: 400 },
      );
    }

    // Valida se o cliente pertence à organização do admin
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        organization_id: admin.organizationId,
      },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente não encontrado." },
        { status: 404 },
      );
    }

    const packages = await prisma.package.findMany({
      where: {
        client_id: clientId,
        organization_id: admin.organizationId,
        // Deixamos de forçar active: true aqui caso queiramos ver histórico no futuro,
        // pois o frontend já filtra (pkg.active) para achar o pacote ativo.
      },
      select: {
        id: true,
        name: true,
        total_sessions: true,
        used_sessions: true,
        price: true,
        active: true,
        service_id: true, // 🔥 Adicionado para garantir o auto-preenchimento no frontend
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // 🔥 Retorna o array direto para bater perfeitamente com a tipagem do SWR no Front
    return NextResponse.json(packages);
  } catch (error) {
    console.error("[GET /api/admin/clients/[clientId]/packages] ERRO:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erro ao listar pacotes do cliente." },
      { status: 500 },
    );
  }
}

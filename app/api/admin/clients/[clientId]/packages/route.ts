export const dynamic = "force-dynamic";
// app/api/admin/clients/[clientId]/packages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { ClientPackagesService } from "@/lib/server/services/clients/client-packages.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  try {
    // 🛡️ Validação unificada de sessão e extração segura do tenant
    const admin = await requireAuth();

    // Next.js 15+: params precisa ser aguardado
    const { clientId } = await params;

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId é obrigatório." },
        { status: 400 },
      );
    }

    // Delega a busca, formatação e join de tabelas para a camada de serviço
    const packages = await ClientPackagesService.getClientPackages(
      admin.organizationId,
      clientId,
    );

    // Retorna o array direto para bater perfeitamente com a tipagem do SWR no Front
    return NextResponse.json(packages);
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Tratamento de erro específico da regra de negócio
    if (error.message === "CLIENT_NOT_FOUND") {
      return NextResponse.json(
        { error: "Cliente não encontrado." },
        { status: 404 },
      );
    }

    console.error("[GET /api/admin/clients/[clientId]/packages] ERRO:", error);
    return NextResponse.json(
      { error: "Erro ao listar pacotes do cliente." },
      { status: 500 },
    );
  }
}


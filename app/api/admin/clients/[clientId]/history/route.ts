export const dynamic = "force-dynamic";
// app/api/admin/clients/[clientId]/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { ClientHistoryService } from "@/lib/server/services/clients/client-history.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  try {
    // 🛡️ Validação unificada de sessão e tenant
    const admin = await requireAuth();
    const { clientId } = await params;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId é obrigatório." },
        { status: 400 },
      );
    }

    // Delega a busca em múltiplas tabelas, ordenação e paginação para o serviço
    const result = await ClientHistoryService.getClientTimeline(
      admin.organizationId,
      clientId,
      page,
      limit,
    );

    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Tratamento de erro específico do domínio
    if (error.message === "CLIENT_NOT_FOUND") {
      return NextResponse.json(
        { error: "Cliente não encontrado." },
        { status: 404 },
      );
    }

    console.error("[GET /api/admin/clients/[clientId]/history] ERRO:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}


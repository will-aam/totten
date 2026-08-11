export const dynamic = "force-dynamic";
// app/api/totem/search-client/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { TotemSearchService } from "@/lib/server/services/totem/search.service";

// GET - Busca cliente pelo CPF + organização (via sessão do admin do totem)
export async function GET(request: NextRequest) {
  try {
    // 🛡️ Validação unificada de tenant
    const admin = await requireAuth();

    const { searchParams } = new URL(request.url);
    const cpf = searchParams.get("cpf");

    if (!cpf) {
      return NextResponse.json({ error: "CPF é obrigatório" }, { status: 400 });
    }

    // Delega a inteligência de busca, formatação e regras de negócio para o Service
    const clientData = await TotemSearchService.searchClientByCpf(
      cpf,
      admin.organizationId,
    );

    return NextResponse.json(clientData);
  } catch (error: any) {
    // 🛡️ Tratamento de erro centralizado
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: "Não autorizado. Totem não está autenticado." },
        { status: 401 },
      );
    }

    if (error.message === "CLIENT_NOT_FOUND") {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 },
      );
    }

    console.error("[TOTEM_SEARCH_CLIENT_GET]", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}


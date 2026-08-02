// app/api/totem/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { TotemSearchService } from "@/lib/server/services/totem/search.service";

export async function POST(request: NextRequest) {
  try {
    // 🛡️ Validação unificada de sessão e tenant
    const admin = await requireAuth();

    const body = await request.json();
    const { value, mode } = body as { value?: string; mode?: "CPF" | "PHONE" };

    if (!value || !mode) {
      return NextResponse.json(
        { error: "Valor e modo de busca são obrigatórios." },
        { status: 400 },
      );
    }

    // Delega toda a lógica de formatação, busca e transação pesada (Auto Check-in) para o Service
    const result = await TotemSearchService.searchAndProcess(
      value,
      mode,
      admin.organizationId,
    );

    // O serviço já retorna o objeto estruturado perfeitamente (NOT_FOUND, MULTIPLE_FOUND ou FOUND)
    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // 🛡️ Mapeamento de erros de domínio para respostas HTTP (Igual ao check-in)
    const domainErrors: Record<string, { message: string; status: number }> = {
      AGENDAMENTO_JA_PROCESSADO: {
        message: "Este agendamento já foi realizado.",
        status: 400,
      },
      AGENDAMENTO_CANCELADO: {
        message: "Este agendamento foi cancelado. Por favor, dirija-se à recepção.",
        status: 400,
      },
    };

    if (error.message && domainErrors[error.message]) {
      const mappedError = domainErrors[error.message];
      return NextResponse.json(
        { error: mappedError.message },
        { status: mappedError.status },
      );
    }

    console.error("[TOTEM_SEARCH_POST]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 },
    );
  }
}
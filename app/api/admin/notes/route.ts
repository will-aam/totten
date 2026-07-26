// app/api/admin/notes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { ClientNoteService } from "@/lib/server/services/notes/client-note.service";

/**
 * GET: Recupera anotações de um cliente específico ordenadas cronologicamente
 * As rotas de POST, PUT e DELETE foram migradas para Server Actions (app/actions/notes.ts)
 */
export async function GET(request: NextRequest) {
  try {
    // 🛡️ Validação unificada de sessão e extração segura do tenant
    const admin = await requireAuth();

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json(
        { error: "O ID do cliente é obrigatório" },
        { status: 400 },
      );
    }

    // Delega a busca no banco (com isolamento de tenant) para o serviço
    const notes = await ClientNoteService.getClientNotes(
      admin.organizationId,
      clientId,
    );

    return NextResponse.json({ data: notes });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error("[NOTES_GET] ERRO:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

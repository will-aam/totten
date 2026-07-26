// app/api/admin/notes/clients/route.ts
import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { ClientNoteService } from "@/lib/server/services/notes/client-note.service";

export async function GET() {
  try {
    // 🛡️ O requireAuth garante a sessão e extrai o tenant
    const admin = await requireAuth();

    // Delega a busca dos clientes com anotações (e o isolamento de tenant) para o serviço
    const clientsWithNotes = await ClientNoteService.getClientsWithNotes(
      admin.organizationId,
    );

    return NextResponse.json({ data: clientsWithNotes });
  } catch (error) {
    // 🛡️ Captura o erro de autenticação e retorna 401
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error("[NOTES_CLIENTS_GET] ERRO:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
// app/api/admin/manual-notes/clients/route.ts
import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { ClientManualNoteService } from "@/lib/server/services/notes/client-manual-note.service";

export async function GET() {
  try {
    const admin = await requireAuth();

    const clientsWithNotes = await ClientManualNoteService.getClientsWithManualNotes(
      admin.organizationId,
    );

    return NextResponse.json({ data: clientsWithNotes });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error("[MANUAL_NOTES_CLIENTS_GET] ERRO:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

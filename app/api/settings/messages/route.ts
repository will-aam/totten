// app/api/settings/messages/route.ts
import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { MessagesService } from "@/lib/server/services/settings/messages.service";

// GET - Busca templates de mensagem formatados para a organização (Para o SWR)
export async function GET() {
  try {
    // 🛡️ Autenticação centralizada
    const admin = await requireAuth();

    // Delega a busca dos dados para a camada de Serviço
    const templates = await MessagesService.getTemplates(admin.organizationId);

    return NextResponse.json(templates);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[MESSAGES_GET]", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

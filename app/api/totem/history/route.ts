export const dynamic = "force-dynamic";
// app/api/totem/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { TotemService } from "@/lib/server/services/totem/totem.service";

// GET - Busca histórico de check-ins do cliente
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const client_id = searchParams.get("client_id");
    const org_slug = searchParams.get("org");

    if (!client_id || !org_slug) {
      return NextResponse.json(
        { error: "Cliente e organização são obrigatórios" },
        { status: 400 },
      );
    }

    // Delega a validação de tenant (slug) e a busca no banco para a camada de Serviço
    const history = await TotemService.getClientHistory(client_id, org_slug);

    return NextResponse.json(history);
  } catch (error: any) {
    if (error.message === "ORGANIZATION_NOT_FOUND") {
      return NextResponse.json(
        { error: "Organização não encontrada" },
        { status: 404 },
      );
    }

    console.error("[TOTEM_HISTORY_GET] Erro ao buscar histórico:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}


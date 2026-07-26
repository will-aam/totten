// app/api/settings/route.ts
import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { SettingsService } from "@/lib/server/services/settings/settings.service";

export async function GET() {
  try {
    // 🛡️ Autenticação centralizada e extração do tenant
    const admin = await requireAuth();

    // Delega a busca no banco de dados para a camada de Serviço
    const settings = await SettingsService.getSettings(admin.organizationId);

    return NextResponse.json(settings);
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error.message === "SETTINGS_NOT_FOUND") {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    console.error("[SETTINGS_GET]", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

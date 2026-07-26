// app/api/package-templates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { PackageTemplateService } from "@/lib/server/services/packages/package-template.service";

export async function GET(req: NextRequest) {
  try {
    // 🛡️ Validação unificada de sessão e tenant
    const admin = await requireAuth();

    const { searchParams } = new URL(req.url);
    const onlyActive = searchParams.get("active") === "true";

    // Delega toda a inteligência e busca no banco para a camada de Serviço
    const templates = await PackageTemplateService.getTemplates(
      admin.organizationId,
      onlyActive,
    );

    return NextResponse.json(templates);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[PACKAGE_TEMPLATES_GET]", error);
    return NextResponse.json(
      { error: "Erro ao buscar templates" },
      { status: 500 },
    );
  }
}

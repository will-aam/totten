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

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAuth();
    const data = await req.json();

    const template = await PackageTemplateService.createTemplate(
      admin.organizationId,
      data
    );

    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.message === "MISSING_DATA") {
      return NextResponse.json(
        { error: "Dados obrigatórios incompletos." },
        { status: 400 }
      );
    }
    console.error("[PACKAGE_TEMPLATES_POST]", error);
    return NextResponse.json(
      { error: "Erro interno ao criar pacote" },
      { status: 500 }
    );
  }
}

// app/api/services/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { ServiceCatalogService } from "@/lib/server/services/services/service.service";

// GET - Lista os serviços da organização (com filtro opcional de ativos)
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAuth();

    const { searchParams } = new URL(req.url);
    const onlyActive = searchParams.get("active") === "true";

    // Delega a busca complexa (com joins de estoque e categoria) para o serviço
    const services = await ServiceCatalogService.getServices(
      admin.organizationId,
      onlyActive,
    );

    return NextResponse.json(services);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[SERVICES_GET] Erro ao buscar serviços:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

// POST - Cria um novo serviço
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAuth();
    const body = await request.json();

    // Delega toda a lógica de negócio, criação de categoria "Geral"
    // e vínculo de estoque na tabela pivô para o serviço isolado.
    const service = await ServiceCatalogService.createService(
      admin.organizationId,
      body,
    );

    return NextResponse.json({
      success: true,
      service,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Mapeamento de erros do domínio para resposta HTTP amigável
    if (error.message === "MISSING_REQUIRED_FIELDS") {
      return NextResponse.json(
        { error: "Nome, duração e preço são obrigatórios" },
        { status: 400 },
      );
    }

    console.error("[SERVICES_POST] Erro ao criar serviço:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

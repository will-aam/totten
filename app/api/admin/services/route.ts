// app/api/admin/services/route.ts
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ServiceCatalogService } from "@/lib/server/services/services/service.service";

/**
 * Lista serviços da organização do admin logado de forma otimizada.
 *
 * GET /api/admin/services
 */
export async function GET() {
  try {
    // 🛡️ Validação unificada de sessão e extração do tenant
    const admin = await requireAuth();

    // Delega a busca otimizada no banco (com isolamento de tenant) para o serviço
    const services = await ServiceCatalogService.getSimpleServicesList(
      admin.organizationId,
    );

    return NextResponse.json({ services });
  } catch (error) {
    console.error("[GET /api/admin/services] ERRO:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erro ao listar serviços." },
      { status: 500 },
    );
  }
}

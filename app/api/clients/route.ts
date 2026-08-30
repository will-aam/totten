export const dynamic = "force-dynamic";
// app/api/clients/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { ClientService } from "@/lib/server/services/clients/client.service";

export async function GET(request: NextRequest) {
  try {
    // 🛡️ Validação unificada de sessão e tenant
    const admin = await requireAuth();

    // Utilizando request.nextUrl (padrão NextRequest)
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("q") || "";
    const activeParam = searchParams.get("active");
    const sourceParam = searchParams.get("source");
    const multiplePackages = searchParams.get("multiple_packages") === "true";

    // Delega a busca, paginação e filtros pesados para a camada de serviço
    const result = await ClientService.getPaginatedClients(
      admin.organizationId,
      page,
      limit,
      search,
      activeParam,
      multiplePackages,
      sourceParam,
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[GET /api/clients] Erro ao buscar clientes:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
// app/api/admin/clients/route.ts
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ClientService } from "@/lib/server/services/clients/client.service";

/**
 * Lista clientes da organização do admin logado.
 *
 * GET /api/admin/clients
 */
export async function GET() {
  try {
    // 🛡️ Validação unificada de sessão e tenant
    const admin = await requireAuth();

    // Delega a busca no banco (com isolamento de tenant) para o serviço
    const clients = await ClientService.getClients(admin.organizationId);

    return NextResponse.json({ clients });
  } catch (error: any) {
    console.error("[GET /api/admin/clients] ERRO:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erro ao listar clientes." },
      { status: 500 },
    );
  }
}


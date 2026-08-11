export const dynamic = "force-dynamic";
// app/api/birthdays/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { ClientService } from "@/lib/server/services/clients/client.service";

export async function GET(request: NextRequest) {
  try {
    // 🛡️ O requireAuth garante a sessão ativa e lança o AuthError se falhar
    const admin = await requireAuth();

    // Delega a busca no banco (com isolamento de tenant) para a camada de serviço
    const clients = await ClientService.getBirthdayClients(
      admin.organizationId,
    );

    return NextResponse.json(clients);
  } catch (error) {
    // 🛡️ Tratamento centralizado para o 401
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error("[BIRTHDAYS_GET]", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar aniversariantes" },
      { status: 500 },
    );
  }
}


export const dynamic = "force-dynamic";
// app/api/clients/[id]/purchases/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { ClientPurchasesService } from "@/lib/server/services/clients/client-purchases.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAuth();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "id é obrigatório." },
        { status: 400 },
      );
    }

    const data = await ClientPurchasesService.getClientPurchases(
      admin.organizationId,
      id,
    );

    return NextResponse.json(data);
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error.message === "CLIENT_NOT_FOUND") {
      return NextResponse.json(
        { error: "Cliente não encontrado." },
        { status: 404 },
      );
    }

    console.error("[GET /api/clients/[id]/purchases] ERRO:", error);
    return NextResponse.json(
      { error: "Erro ao buscar histórico de compras do cliente." },
      { status: 500 },
    );
  }
}


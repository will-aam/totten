import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { ServiceCatalogService } from "@/lib/server/services/services/service.service";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAuth();

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    await ServiceCatalogService.deleteService(admin.organizationId, id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error.message && error.message.includes("Não é possível excluir")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("[SERVICE_DELETE]", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

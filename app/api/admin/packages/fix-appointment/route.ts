// app/api/admin/packages/fix-appointment/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { PackageService } from "@/lib/server/services/packages/package.service";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAuth();
    const { appointmentId } = await req.json();

    if (!appointmentId) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    // Delega a transação e a lógica de negócio pesada para a camada de serviço
    await PackageService.fixAppointment(appointmentId, admin.organizationId);

    revalidatePath("/admin/packages");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Tratamento de autenticação
    if (
      error instanceof AuthError ||
      error.name === "AuthError" ||
      error.message === "Unauthorized"
    ) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Intercepta o erro lançado pelo Service
    if (error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    console.error("[POST /api/admin/packages/fix-appointment] ERRO:", error);
    return NextResponse.json(
      { error: "Erro ao deletar registro" },
      { status: 500 },
    );
  }
}

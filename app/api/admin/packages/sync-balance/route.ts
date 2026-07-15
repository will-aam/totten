// app/api/admin/packages/sync-balance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAuth();
    const { packageId } = await req.json();

    // 1. Conta quantos check-ins reais existem para este pacote
    const realCount = await prisma.checkIn.count({
      where: { package_id: packageId, organization_id: admin.organizationId },
    });

    // 2. Atualiza o saldo do pacote para esse valor real
    await prisma.package.update({
      where: { id: packageId, organization_id: admin.organizationId },
      data: { used_sessions: realCount },
    });

    revalidatePath("/admin/packages");
    return NextResponse.json({ success: true, count: realCount });
  } catch (error: any) {
    // Intercepta e trata o erro de autorização corretamente
    if (
      error instanceof AuthError ||
      error.name === "AuthError" ||
      error.message === "Unauthorized"
    ) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    console.error("[POST /api/admin/packages/sync-balance] ERRO:", error);
    return NextResponse.json(
      { error: "Erro ao sincronizar saldo" },
      { status: 500 },
    );
  }
}

// app/api/admin/agenda/clear-today/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { startOfDay, endOfDay } from "date-fns";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAuth();
    const body = await req.json();
    const password = body?.password as string | undefined;

    if (!password) {
      return NextResponse.json(
        { error: "Senha é obrigatória." },
        { status: 400 },
      );
    }

    const dbAdmin = await prisma.admin.findUnique({
      where: { id: admin.id },
      select: { password: true },
    });

    if (!dbAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, dbAdmin.password);
    if (!ok) {
      return NextResponse.json({ error: "Senha inválida." }, { status: 401 });
    }

    const today = new Date();
    const from = startOfDay(today);
    const to = endOfDay(today);

    const result = await prisma.appointment.deleteMany({
      where: {
        organization_id: admin.organizationId,
        date_time: { gte: from, lte: to },
      },
    });

    return NextResponse.json({ success: true, deleted: result.count });
  } catch (error: any) {
    if (
      error instanceof AuthError ||
      error.name === "AuthError" ||
      error.message === "Unauthorized"
    ) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    console.error("[POST /api/admin/agenda/clear-today] ERRO:", error);
    return NextResponse.json(
      { error: "Erro ao limpar agenda de hoje." },
      { status: 500 },
    );
  }
}

// app/api/admin/checkins/pending/[checkInId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: { checkInId: string } },
) {
  try {
    const admin = await requireAuth();
    const { checkInId } = params;

    if (!checkInId) {
      return NextResponse.json(
        { error: "checkInId é obrigatório." },
        { status: 400 },
      );
    }

    const checkIn = await prisma.checkIn.findUnique({
      where: { id: checkInId },
      include: {
        client: { select: { id: true, name: true } },
      },
    });

    if (
      !checkIn ||
      checkIn.organization_id !== admin.organizationId ||
      checkIn.appointment_id
    ) {
      return NextResponse.json({ checkIn: null });
    }

    return NextResponse.json({
      checkIn: {
        id: checkIn.id,
        clientId: checkIn.client?.id ?? null,
        clientName: checkIn.client?.name ?? "Cliente desconhecido",
        dateTime: checkIn.date_time,
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/checkins/pending/[checkInId]] ERRO:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erro ao buscar check-in pendente." },
      { status: 500 },
    );
  }
}

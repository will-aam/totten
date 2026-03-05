import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Atualiza os horários de funcionamento (opening_time, closing_time)
 * da organização nas Settings.
 *
 * POST /api/settings/hours
 * Body:
 * {
 *   "organizationId": "ORG_ID",
 *   "openingTime": "08:00",
 *   "closingTime": "19:00"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: "Body inválido." }, { status: 400 });
    }

    const { organizationId, openingTime, closingTime } = body;

    if (!organizationId || !openingTime || !closingTime) {
      return NextResponse.json(
        {
          error:
            "Parâmetros obrigatórios: organizationId, openingTime, closingTime.",
        },
        { status: 400 },
      );
    }

    if (closingTime <= openingTime) {
      return NextResponse.json(
        {
          error:
            "O horário de fechamento deve ser depois do horário de abertura.",
        },
        { status: 400 },
      );
    }

    const updated = await prisma.settings.update({
      where: {
        organization_id: organizationId,
      },
      data: {
        opening_time: openingTime,
        closing_time: closingTime,
      },
      select: {
        opening_time: true,
        closing_time: true,
      },
    });

    return NextResponse.json({
      openingTime: updated.opening_time,
      closingTime: updated.closing_time,
    });
  } catch (error) {
    console.error("[POST /api/settings/hours] ERRO:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar horários de funcionamento." },
      { status: 500 },
    );
  }
}

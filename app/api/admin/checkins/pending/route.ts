// Rota da API Admin: GET /api/admin/checkins/pending
//
// Lista check-ins avulsos (sem agendamento vinculado) de uma organização,
// para que o admin possa tomar alguma ação (ex: associar a um agendamento).
//
// Contrato:
//   - Query params: organizationId (obrigatório)
//   - Resposta:
//     {
//       "pendingCheckIns": [
//         {
//           "id": "...",
//           "clientId": "...",
//           "clientName": "...",
//           "dateTime": "..."
//         }
//       ]
//     }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId é obrigatório." },
        { status: 400 },
      );
    }

    // Busca check-ins sem appointment vinculado (check-ins avulsos)
    const pendingCheckIns = await prisma.checkIn.findMany({
      where: {
        organization_id: organizationId,
        appointment_id: null,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date_time: "desc",
      },
    });

    const mapped = pendingCheckIns.map((checkIn) => ({
      id: checkIn.id,
      clientId: checkIn.client?.id ?? null,
      clientName: checkIn.client?.name ?? "Cliente desconhecido",
      dateTime: checkIn.date_time,
    }));

    return NextResponse.json({ pendingCheckIns: mapped });
  } catch (error) {
    console.error("[GET /api/admin/checkins/pending] ERRO:", error);
    return NextResponse.json(
      { error: "Erro ao listar check-ins pendentes." },
      { status: 500 },
    );
  }
}

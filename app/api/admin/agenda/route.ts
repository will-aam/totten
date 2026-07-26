// app/api/admin/agenda/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { AgendaService } from "@/lib/server/services/agenda/agenda.service";

/**
 * ROTA UNIFICADA DA AGENDA
 * GET /api/admin/agenda?from=2026-06-01T00:00:00.000Z&to=2026-06-30T23:59:59.999Z
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAuth();
    const role = (admin as any).role || "OWNER";

    const { searchParams } = new URL(req.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    // Delega a busca, formatação, snapshots e definição de cores para o serviço
    const result = await AgendaService.getAgenda(
      admin.organizationId,
      admin.id,
      role,
      fromParam,
      toParam,
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[GET /api/admin/agenda] ERRO:", error);

    // Mapeamento de erro de negócio para resposta HTTP
    if (error.message === "MISSING_DATES") {
      return NextResponse.json(
        {
          error: "Os parâmetros 'from' e 'to' são obrigatórios em formato ISO.",
        },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erro ao carregar agenda." },
      { status: 500 },
    );
  }
}

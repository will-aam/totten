// app/api/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { HistoryService } from "@/lib/server/services/history/history.service";

export async function GET(request: NextRequest) {
  try {
    // 🛡️ Validação unificada de sessão e tenant
    const admin = await requireAuth();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const search = searchParams.get("q") || "";
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Delega a montagem da query, paginação e regras de negócio de fallback para o serviço
    const result = await HistoryService.getCheckInHistory(
      admin.organizationId,
      {
        page,
        limit,
        search,
        from,
        to,
      },
    );

    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[HISTORY_GET]", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

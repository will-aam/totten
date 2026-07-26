// app/api/dashboard/checkins/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { DashboardService } from "@/lib/server/services/dashboard/dashboard.service";

export async function GET(request: NextRequest) {
  try {
    // 🛡️ Validação unificada de sessão e tenant
    const admin = await requireAuth();

    // Pega os parâmetros da URL para a paginação usando o NextRequest nativo
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "8", 10);

    // Delega a inteligência de fuso horário, paginação e banco para o Service
    const result = await DashboardService.getTodayCheckIns(
      admin.organizationId,
      page,
      limit,
    );

    return NextResponse.json(result);
  } catch (error) {
    // 🛡️ Tratamento centralizado para o 401
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[DASHBOARD_CHECKINS_GET]", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

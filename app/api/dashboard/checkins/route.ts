export const dynamic = "force-dynamic";
// app/api/dashboard/checkins/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { DashboardService } from "@/lib/server/services/dashboard/dashboard.service";

export async function GET(request: NextRequest) {
  try {
    // 🛡️ Validação unificada de sessão e tenant
    const admin = await requireAuth();

    // 🛡️ Higienização e clamping dos parâmetros da URL para evitar sobrecarga no banco / DoS
    const { searchParams } = request.nextUrl;
    const rawPage = parseInt(searchParams.get("page") || "1", 10);
    const rawLimit = parseInt(searchParams.get("limit") || "8", 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : 8;

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

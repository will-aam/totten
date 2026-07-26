// app/api/dashboard/kpis/route.ts
import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { DashboardService } from "@/lib/server/services/dashboard/dashboard.service";

export async function GET() {
  try {
    // 🛡️ Validação unificada de sessão e tenant
    const admin = await requireAuth();

    // Delega o cálculo dos KPIs e a lógica de fuso horário para o Service
    const kpis = await DashboardService.getDashboardKpis(admin.organizationId);

    return NextResponse.json(kpis);
  } catch (error) {
    // 🛡️ Tratamento centralizado do erro de autenticação
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error("[DASHBOARD_KPIS_GET]", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

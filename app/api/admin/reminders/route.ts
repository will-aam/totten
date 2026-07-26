// app/api/admin/reminders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { ReminderService } from "@/lib/server/services/appointments/reminder.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 🛡️ Validação unificada de sessão e extração segura do tenant
    const admin = await requireAuth();

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");

    // Delega o cálculo de fuso horário e a consulta multitenant para a camada de serviço
    const appointments = await ReminderService.getReminders(
      admin.organizationId,
      dateParam,
    );

    return NextResponse.json({ appointments });
  } catch (error: any) {
    // Tratamento padronizado de erro de autenticação
    if (error instanceof AuthError || error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    console.error("[GET /api/admin/reminders] ERRO:", error);
    return NextResponse.json(
      { error: "Erro ao buscar lembretes." },
      { status: 500 },
    );
  }
}

// app/api/totem/check-in/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { TotemCheckInService } from "@/lib/server/services/totem/checkin.service";

export async function POST(request: NextRequest) {
  try {
    // 🛡️ Validação unificada de sessão e tenant
    const admin = await requireAuth();

    const body = await request.json();
    const { appointment_id } = body;

    if (!appointment_id) {
      return NextResponse.json(
        { error: "Dados obrigatórios ausentes" },
        { status: 400 },
      );
    }

    // Delega toda a transação e regras de negócio para a camada de serviço
    const result = await TotemCheckInService.processCheckIn(
      appointment_id,
      admin.organizationId,
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Mapeamento de erros de domínio para respostas HTTP
    const domainErrors: Record<string, { message: string; status: number }> = {
      AGENDAMENTO_INVALIDO: { message: "Agendamento inválido", status: 404 },
      AGENDAMENTO_JA_PROCESSADO: {
        message: "Este agendamento já foi realizado ou está cancelado.",
        status: 400,
      },
      PACOTE_INATIVO: {
        message:
          "Pacote encerrado ou inválido. Por favor, dirija-se à recepção.",
        status: 400,
      },
      CHECKIN_JA_REGISTRADO: {
        message: "Check-in já registrado.",
        status: 400,
      },
      SALDO_ESGOTADO: {
        message: "Saldo de sessões esgotado devido a requisições simultâneas.",
        status: 400,
      },
    };

    if (error.message && domainErrors[error.message]) {
      const mappedError = domainErrors[error.message];
      return NextResponse.json(
        { error: mappedError.message },
        { status: mappedError.status },
      );
    }

    console.error("[TOTEM_CHECKIN_POST]", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

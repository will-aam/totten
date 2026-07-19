// app/api/service-durations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { ServiceDurationService } from "@/lib/server/services/service-durations/duration.service";

// GET - Lista todas as durações cadastradas
export async function GET() {
  try {
    const admin = await requireAuth();

    // Delega a busca para a camada de serviço
    const durations = await ServiceDurationService.getDurations(
      admin.organizationId,
    );

    return NextResponse.json(durations);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[SERVICE_DURATIONS_GET]", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

// POST - Cria uma nova duração
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAuth();

    const body = await request.json();
    const { label, minutes } = body;

    if (!label || !minutes) {
      return NextResponse.json(
        { error: "Label e minutos são obrigatórios" },
        { status: 400 },
      );
    }

    // Delega a regra de negócio e inserção para o serviço
    const duration = await ServiceDurationService.createDuration(
      admin.organizationId,
      label,
      minutes,
    );

    return NextResponse.json({
      success: true,
      duration,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Mapeamento de erros de negócio
    if (error.message === "INVALID_DURATION") {
      return NextResponse.json(
        { error: "Duração deve ser maior que zero" },
        { status: 400 },
      );
    }
    if (error.message === "DURATION_ALREADY_EXISTS") {
      return NextResponse.json(
        { error: "Duração já cadastrada" },
        { status: 409 },
      );
    }

    console.error("[SERVICE_DURATIONS_POST]", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

// DELETE - Remove uma duração
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAuth();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    // Delega a exclusão para o serviço
    await ServiceDurationService.deleteDuration(admin.organizationId, id);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[SERVICE_DURATIONS_DELETE]", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

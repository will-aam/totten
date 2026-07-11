// app/api/service-durations/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";

// GET - Lista todas as durações cadastradas
export async function GET() {
  try {
    const admin = await requireAuth();

    const durations = await prisma.serviceDuration.findMany({
      where: {
        organization_id: admin.organizationId,
        is_active: true,
      },
      orderBy: {
        minutes: "asc",
      },
    });

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
export async function POST(request: Request) {
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

    if (Number(minutes) < 1) {
      return NextResponse.json(
        { error: "Duração deve ser maior que zero" },
        { status: 400 },
      );
    }

    // Verifica se já existe
    const existing = await prisma.serviceDuration.findFirst({
      where: {
        minutes: Number(minutes),
        organization_id: admin.organizationId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Duração já cadastrada" },
        { status: 409 },
      );
    }

    const duration = await prisma.serviceDuration.create({
      data: {
        label,
        minutes: Number(minutes),
        organization_id: admin.organizationId,
      },
    });

    return NextResponse.json({
      success: true,
      duration,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[SERVICE_DURATIONS_POST]", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

// DELETE - Remove uma duração
export async function DELETE(request: Request) {
  try {
    const admin = await requireAuth();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    await prisma.serviceDuration.delete({
      where: {
        id,
        organization_id: admin.organizationId,
      },
    });

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

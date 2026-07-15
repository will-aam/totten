// app/api/package-templates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAuth();
    const { searchParams } = new URL(req.url);
    const onlyActive = searchParams.get("active") === "true";

    const templates = await prisma.packageTemplate.findMany({
      where: {
        organization_id: admin.organizationId,
        ...(onlyActive ? { active: true } : {}),
      },
      select: {
        id: true,
        name: true,
        total_sessions: true,
        price: true,
        service_id: true,
        active: true,
        validity_days: true,
        //  AQUI ESTÁ A MÁGICA: Trazendo a relação do serviço para o front-end
        service: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(
      templates.map((t) => ({ ...t, price: Number(t.price) })),
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[PACKAGE_TEMPLATES_GET]", error);
    return NextResponse.json(
      { error: "Erro ao buscar templates" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAuth();
    const body = await request.json();

    const { name, total_sessions, price, service_id, validity_days, active } =
      body;

    if (!name || !total_sessions || !price || !service_id) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const template = await prisma.packageTemplate.create({
      data: {
        name,
        total_sessions: Number(total_sessions),
        price: Number(price),
        service_id,
        validity_days:
          validity_days !== "" && validity_days !== null
            ? Number(validity_days)
            : null,
        active: active ?? true,
        organization_id: admin.organizationId,
      },
    });

    return NextResponse.json({ success: true, template });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[PACKAGE_TEMPLATES_POST]", error);
    return NextResponse.json(
      { error: "Erro ao criar template" },
      { status: 500 },
    );
  }
}

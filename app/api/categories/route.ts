import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

// GET - Lista todas as categorias da organização
export async function GET(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 🔥 Adicionamos a captura do parâmetro 'active'
    const { searchParams } = new URL(request.url);
    const onlyActive = searchParams.get("active") === "true";

    const categories = await prisma.category.findMany({
      where: {
        organization_id: admin.organizationId,
        // Se onlyActive for true, filtra apenas ativas. Se não, traz tudo.
        ...(onlyActive ? { active: true } : {}),
      },
      orderBy: {
        name: "asc",
      },
      include: {
        _count: {
          select: {
            services: true,
          },
        },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}
// POST - Cria uma nova categoria
export async function POST(request: Request) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Nome da categoria é obrigatório" },
        { status: 400 },
      );
    }

    // Verifica se já existe
    const existing = await prisma.category.findFirst({
      where: {
        name: name.trim(),
        organization_id: admin.organizationId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Categoria já existe", category: existing },
        { status: 409 },
      );
    }

    // Cria a categoria
    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        organization_id: admin.organizationId,
      },
    });

    return NextResponse.json({
      success: true,
      category,
    });
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

// app/api/categories/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";

// GET - Lista todas as categorias da organização
export async function GET(request: Request) {
  try {
    // 🛡️ Validação unificada de tenant/sessão
    const admin = await requireAuth();

    // 🔍 Captura query param para filtragem condicional
    const { searchParams } = new URL(request.url);
    const onlyActive = searchParams.get("active") === "true";

    const categories = await prisma.category.findMany({
      where: {
        organization_id: admin.organizationId,
        // Aplica filtro de categorias ativas dinamicamente na query
        ...(onlyActive ? { active: true } : {}),
      },
      orderBy: {
        name: "asc",
      },
      include: {
        _count: {
          select: {
            services: true, // Agregação para exibir volume de serviços atrelados
          },
        },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[CATEGORIES_GET]", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

// POST - Cria uma nova categoria
export async function POST(request: Request) {
  try {
    // 🛡️ Garante escopo de tenant antes de processar o payload
    const admin = await requireAuth();

    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Nome da categoria é obrigatório" },
        { status: 400 },
      );
    }

    // Previne colisão de nomes estrita dentro do tenant
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

    // Persiste a entidade vinculada ao tenant atual
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
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[CATEGORIES_POST]", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

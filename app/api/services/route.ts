// app/api/services/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET - Lista os serviços da organização (com filtro opcional de ativos)
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAuth();
    if (!admin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const onlyActive = searchParams.get("active") === "true";

    const services = await prisma.service.findMany({
      where: {
        organization_id: admin.organizationId,
        ...(onlyActive ? { active: true } : {}), // Filtra apenas ativos se solicitado
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        // 🔥 A MÁGICA AQUI: Pede pro Prisma trazer os insumos vinculados ao serviço
        stock_items: {
          include: {
            stock_item: true, // Traz os detalhes do insumo (nome, custo unitário, etc)
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error("Erro ao buscar serviços:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

// POST - Cria um novo serviço
export async function POST(request: Request) {
  try {
    const admin = await requireAuth();
    if (!admin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();

    // 🔥 Adicionamos o track_stock e o array de stock_items
    const {
      name,
      description,
      duration,
      price,
      category_id,
      material_cost,
      track_stock,
      stock_items,
    } = body;

    if (!name || !duration || !price) {
      return NextResponse.json(
        { error: "Nome, duração e preço são obrigatórios" },
        { status: 400 },
      );
    }

    let finalCategoryId = category_id;

    if (!finalCategoryId) {
      let defaultCategory = await prisma.category.findFirst({
        where: {
          name: "Geral",
          organization_id: admin.organizationId,
        },
      });

      if (!defaultCategory) {
        defaultCategory = await prisma.category.create({
          data: {
            name: "Geral",
            organization_id: admin.organizationId,
          },
        });
      }
      finalCategoryId = defaultCategory.id;
    }

    const service = await prisma.service.create({
      data: {
        name,
        description: description || null,
        duration: Number(duration),
        price: Number(price),
        material_cost: material_cost ? Number(material_cost) : null,
        track_stock: track_stock || false, // 🔥 Salva se usa Baixa Inteligente
        category_id: finalCategoryId,
        organization_id: admin.organizationId,
        active: true,
        // 🔥 Se vier insumos na criação, já vincula eles na tabela pivô (ServiceStockItem)
        ...(track_stock && stock_items && stock_items.length > 0
          ? {
              stock_items: {
                create: stock_items.map((item: any) => ({
                  stock_item_id: item.stock_item_id,
                  quantity_used: Number(item.quantity_used),
                })),
              },
            }
          : {}),
      },
      include: {
        category: true,
        stock_items: {
          include: {
            stock_item: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      service,
    });
  } catch (error) {
    console.error("Erro ao criar serviço:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

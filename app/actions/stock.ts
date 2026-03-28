"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth"; // 🔥 Import correto baseado no seu arquivo
import { revalidatePath } from "next/cache";

// Função auxiliar super enxuta agora, usando a sua estrutura nativa
async function getOrgId() {
  const admin = await requireAuth(); // Já lança erro "Unauthorized" automaticamente se não tiver logado

  if (!admin.organizationId) {
    throw new Error("Organização não encontrada para este usuário.");
  }

  return admin.organizationId;
}

// 1. Buscar todos os insumos da organização
export async function getStockItems() {
  try {
    const orgId = await getOrgId();
    const items = await prisma.stockItem.findMany({
      where: { organization_id: orgId },
      orderBy: { name: "asc" },
    });

    // Convertendo Decimal do Prisma para Number nativo do JS/TS para não quebrar o Front
    const formattedData = items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unit_cost: Number(item.unit_cost),
    }));

    return { success: true, data: formattedData };
  } catch (error) {
    console.error("Erro ao buscar estoque:", error);
    return { success: false, error: "Erro ao buscar insumos.", data: [] };
  }
}

// 2. Criar Insumo (e opcionalmente a Despesa Financeira)
export async function createStockItem(data: {
  name: string;
  quantity: number;
  unit_cost: number;
  isAutoDeduct: boolean;
  createExpense: boolean;
}) {
  try {
    const orgId = await getOrgId();

    // Transaction: Executa os comandos juntos. Se um falhar, faz rollback automático.
    await prisma.$transaction(async (tx) => {
      // 1. Cria o Insumo no Estoque
      const newItem = await tx.stockItem.create({
        data: {
          name: data.name,
          quantity: data.quantity,
          unit_cost: data.unit_cost,
          isAutoDeduct: data.isAutoDeduct,
          organization_id: orgId,
        },
      });

      // 2. Cria a Transação Financeira SE a cliente ativou o toggle
      if (data.createExpense) {
        const totalCost = data.quantity * data.unit_cost;

        await tx.transaction.create({
          data: {
            type: "DESPESA",
            description: `Compra de Insumo: ${data.name}`,
            amount: totalCost,
            date: new Date(),
            status: "PAGO",
            organization_id: orgId,
            stock_item_id: newItem.id, // Vínculo com o estoque
          },
        });
      }
    });

    revalidatePath("/admin/stock"); // Atualiza a página em cache
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar insumo:", error);
    return { success: false, error: "Erro ao cadastrar insumo." };
  }
}

// 3. Atualizar Insumo (Usado na edição inline)
export async function updateStockItem(
  id: string,
  data: {
    name?: string;
    quantity?: number;
    unit_cost?: number;
    isAutoDeduct?: boolean;
  },
) {
  try {
    const orgId = await getOrgId();

    // Segurança: Garantir que o item pertence à organização logada
    const existing = await prisma.stockItem.findFirst({
      where: { id, organization_id: orgId },
    });

    if (!existing) {
      return { success: false, error: "Insumo não encontrado." };
    }

    await prisma.stockItem.update({
      where: { id },
      data: {
        name: data.name,
        quantity: data.quantity !== undefined ? data.quantity : undefined,
        unit_cost: data.unit_cost !== undefined ? data.unit_cost : undefined,
        isAutoDeduct:
          data.isAutoDeduct !== undefined ? data.isAutoDeduct : undefined,
      },
    });

    revalidatePath("/admin/stock");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar insumo:", error);
    return { success: false, error: "Erro ao atualizar insumo." };
  }
}

// app/actions/stock.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function getOrgId() {
  const admin = await requireAuth();

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

// 2. Criar Insumo e Opcionalmente Lançar Despesa
export async function createStockItem(data: {
  name: string;
  quantity: number;
  unit_cost: number;
  isAutoDeduct: boolean;
  createExpense: boolean;
}) {
  try {
    const orgId = await getOrgId();

    await prisma.$transaction(async (tx) => {
      const newItem = await tx.stockItem.create({
        data: {
          name: data.name,
          quantity: data.quantity,
          unit_cost: data.unit_cost,
          isAutoDeduct: data.isAutoDeduct,
          was_expensed: data.createExpense,
          organization_id: orgId,
        },
      });

      // Se marcou "Lançar como despesa", já desconta do caixa!
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
            stock_item_id: newItem.id, // 🔥 Vinculamos a despesa ao insumo!
          },
        });
      }
    });

    revalidatePath("/admin/stock");
    revalidatePath("/admin/finance/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar insumo:", error);
    return { success: false, error: "Erro ao cadastrar insumo." };
  }
}

// 3. Atualizar Insumo (Regra do Passado Intacto: Não mexe nas transações!)
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

// 4. EXCLUIR INSUMO (A Trava de Segurança Nível Sênior)
export async function deleteStockItem(id: string) {
  try {
    const orgId = await getOrgId();

    // Busca o insumo e verifica se ele está vinculado a algum serviço
    const item = await prisma.stockItem.findUnique({
      where: { id, organization_id: orgId },
      include: {
        services: true, // Traz os vínculos com a tabela ServiceStockItem
      },
    });

    if (!item) return { success: false, error: "Insumo não encontrado." };

    // 🔥 REGRA DE OURO: Se está amarrado a um serviço (check-in), BLOQUEIA!
    if (item.services.length > 0) {
      return {
        success: false,
        error:
          "Este insumo faz parte de um Serviço. Remova-o do serviço antes de excluir, ou apenas zere a sua quantidade para preservar o histórico.",
      };
    }

    // Se chegou aqui, é porque foi um cadastro errado e está "solto". Pode apagar!
    await prisma.$transaction(async (tx) => {
      // 1. Apaga a despesa de compra original (se ela existir) para devolver o dinheiro ao caixa virtual
      await tx.transaction.deleteMany({
        where: {
          stock_item_id: id,
          organization_id: orgId,
          type: "DESPESA",
        },
      });

      // 2. Apaga o insumo fisicamente do estoque
      await tx.stockItem.delete({
        where: { id },
      });
    });

    revalidatePath("/admin/stock");
    revalidatePath("/admin/finance/dashboard"); // Atualiza o dashboard pq revertemos uma despesa
    revalidatePath("/admin/finance/transactions");

    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir insumo:", error);
    return {
      success: false,
      error: "Erro ao excluir insumo. Tente desvinculá-lo de serviços antes.",
    };
  }
}

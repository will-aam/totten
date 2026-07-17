// app/actions/stock.ts
"use server";

import { getTenantPrisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function getOrgId() {
  const admin = await requireAuth();

  if (!admin.organizationId) {
    throw new Error("Organização não encontrada para este usuário.");
  }

  return admin.organizationId;
}

export async function getStockItems() {
  try {
    const orgId = await getOrgId();
    const prisma = getTenantPrisma(orgId);

    const items = await prisma.stockItem.findMany({
      where: { organization_id: orgId, active: true },
      orderBy: { name: "asc" },
    });

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

export async function createStockItem(data: {
  name: string;
  quantity: number;
  unit_cost: number;
  isAutoDeduct: boolean;
  createExpense: boolean;
}) {
  try {
    const orgId = await getOrgId();
    const prisma = getTenantPrisma(orgId);

    await prisma.$transaction(async (tx) => {
      const newItem = await tx.stockItem.create({
        data: {
          name: data.name,
          quantity: data.quantity,
          unit_cost: data.unit_cost,
          isAutoDeduct: data.isAutoDeduct,
          was_expensed: data.createExpense,
          organization_id: orgId,
          active: true,
        },
      });

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
            stock_item_id: newItem.id,
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
    const prisma = getTenantPrisma(orgId);

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

// 4. EXCLUIR INSUMO (Padrão Sênior: Limpeza de Vínculos + Soft Delete)
export async function deleteStockItem(id: string) {
  try {
    const orgId = await getOrgId();
    const prisma = getTenantPrisma(orgId);

    const item = await prisma.stockItem.findUnique({
      where: { id, organization_id: orgId },
      include: {
        services: true,
      },
    });

    if (!item) return { success: false, error: "Insumo não encontrado." };

    // LÓGICA SÊNIOR: O insumo já foi usado em serviços.
    if (item.services.length > 0) {
      await prisma.$transaction(async (tx) => {
        // 1. ARRANCAMOS o insumo de todos os serviços (Hard Delete no vínculo).
        // Isso atualiza a contagem na tela de Serviços (ex: de 4 para 3) e derruba o custo.
        await tx.serviceStockItem.deleteMany({
          where: { stock_item_id: id },
        });

        // 2. Fazemos o Soft Delete no insumo APENAS para não quebrar as Transações passadas.
        await tx.stockItem.update({
          where: { id },
          data: { active: false },
        });
      });

      revalidatePath("/admin/stock");
      revalidatePath("/admin/services"); // Avisamos o Next.js para recarregar a tela de serviços!

      return {
        success: true,
        message: "Insumo excluído com sucesso!", // UX perfeita para o usuário
      };
    }

    // CENÁRIO 2: Nunca foi usado em serviço. Hard delete em tudo.
    await prisma.$transaction(async (tx) => {
      await tx.transaction.deleteMany({
        where: {
          stock_item_id: id,
          organization_id: orgId,
          type: "DESPESA",
        },
      });

      await tx.stockItem.delete({
        where: { id },
      });
    });

    revalidatePath("/admin/stock");
    revalidatePath("/admin/finance/dashboard");
    revalidatePath("/admin/finance/transactions");

    return {
      success: true,
      message: "Insumo excluído com sucesso!",
    };
  } catch (error) {
    console.error("Erro ao excluir insumo:", error);
    return {
      success: false,
      error: "Erro interno ao tentar excluir o insumo.",
    };
  }
}

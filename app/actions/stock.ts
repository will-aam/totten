// app/actions/stock.ts
"use server";

import { getTenantPrisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { triggerZibeeSyncById } from "@/lib/server/integrations/zibee.service";

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

    const txResult = await prisma.$transaction(async (tx) => {
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

      let createdExpenseTxId: string | null = null;
      if (data.createExpense) {
        const totalCost = data.quantity * data.unit_cost;
        const now = new Date();
        const expTx = await tx.transaction.create({
          data: {
            type: "DESPESA",
            description: `Compra de Insumo: ${data.name}`,
            amount: totalCost,
            date: now,
            due_date: now,
            settlement_date: now,
            status: "PAGO",
            organization_id: orgId,
            stock_item_id: newItem.id,
          },
        });
        createdExpenseTxId = expTx.id;
      }
      return createdExpenseTxId;
    });

    if (txResult) {
      triggerZibeeSyncById(txResult, orgId).catch(console.error);
    }

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
    createExpense?: boolean;
  },
) {
  try {
    const orgId = await getOrgId();
    const prisma = getTenantPrisma(orgId);

    const txResult = await prisma.$transaction(async (tx) => {
      const existing = await tx.stockItem.findFirst({
        where: { id, organization_id: orgId },
      });

      if (!existing) {
        throw new Error("Insumo não encontrado.");
      }

      const oldQty = Number(existing.quantity);
      const newQty =
        data.quantity !== undefined ? Number(data.quantity) : oldQty;
      const addedQty = newQty - oldQty;
      const unitCost =
        data.unit_cost !== undefined
          ? Number(data.unit_cost)
          : Number(existing.unit_cost);

      // Decisão contábil de despesa no reabastecimento:
      // Se data.createExpense foi explicitamente informado, respeita a escolha do usuário.
      // Se não foi informado, preserva a política do insumo (existing.was_expensed).
      const shouldCreateExpense =
        addedQty > 0 &&
        (data.createExpense === true ||
          (data.createExpense === undefined && existing.was_expensed));

      let createdExpenseTxId: string | null = null;
      let totalExpenseCost = 0;

      if (shouldCreateExpense) {
        totalExpenseCost = addedQty * unitCost;

        if (totalExpenseCost > 0) {
          const now = new Date();
          const expTx = await tx.transaction.create({
            data: {
              type: "DESPESA",
              description: `Reabastecimento de Insumo: ${data.name || existing.name} (+${addedQty} un)`,
              amount: totalExpenseCost,
              date: now,
              due_date: now,
              settlement_date: now,
              status: "PAGO",
              organization_id: orgId,
              stock_item_id: existing.id,
            },
          });
          createdExpenseTxId = expTx.id;
        }
      }

      // Atualiza o insumo com os novos valores e política contábil
      await tx.stockItem.update({
        where: { id },
        data: {
          name: data.name,
          quantity: data.quantity !== undefined ? data.quantity : undefined,
          unit_cost: data.unit_cost !== undefined ? data.unit_cost : undefined,
          isAutoDeduct:
            data.isAutoDeduct !== undefined ? data.isAutoDeduct : undefined,
          was_expensed:
            data.createExpense !== undefined
              ? data.createExpense
              : existing.was_expensed,
        },
      });

      return {
        createdExpenseTxId,
        expenseCreated: shouldCreateExpense,
        addedQuantity: addedQty > 0 ? addedQty : 0,
        expenseAmount: totalExpenseCost,
      };
    });

    if (txResult.createdExpenseTxId) {
      triggerZibeeSyncById(txResult.createdExpenseTxId, orgId).catch(
        console.error,
      );
    }

    revalidatePath("/admin/stock");
    if (txResult.expenseCreated) {
      revalidatePath("/admin/finance/dashboard");
      revalidatePath("/admin/finance/transactions");
    }

    return {
      success: true,
      expenseCreated: txResult.expenseCreated,
      addedQuantity: txResult.addedQuantity,
      expenseAmount: txResult.expenseAmount,
    };
  } catch (error: any) {
    console.error("Erro ao atualizar insumo:", error);
    return {
      success: false,
      error: error?.message || "Erro ao atualizar insumo.",
    };
  }
}

// 3.1. REABASTECER INSUMO (Helper com incremento explícito)
export async function restockStockItem(
  id: string,
  addedQuantity: number,
  options?: {
    unit_cost?: number;
    createExpense?: boolean;
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

    const currentQty = Number(existing.quantity);
    const newQty = currentQty + addedQuantity;

    return await updateStockItem(id, {
      quantity: newQty,
      unit_cost: options?.unit_cost,
      createExpense: options?.createExpense,
    });
  } catch (error: any) {
    console.error("Erro ao reabastecer insumo:", error);
    return {
      success: false,
      error: error?.message || "Erro ao reabastecer insumo.",
    };
  }
}

// 4. EXCLUIR INSUMO (Preservação Contábil e Limpeza de Vínculos)
export async function deleteStockItem(id: string) {
  try {
    const orgId = await getOrgId();
    const prisma = getTenantPrisma(orgId);

    const item = await prisma.stockItem.findUnique({
      where: { id, organization_id: orgId },
      include: {
        services: true,
        transactions: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!item) return { success: false, error: "Insumo não encontrado." };

    await prisma.$transaction(async (tx) => {
      // 1. Removemos os vínculos do insumo com qualquer serviço cadastrado
      if (item.services.length > 0) {
        await tx.serviceStockItem.deleteMany({
          where: { stock_item_id: id },
        });
      }

      // 2. Se houver despesas financeiras históricas registradas ou se o insumo já gerou despesa contábil,
      // NUNCA apagamos as transações para não distorcer o balanço contábil e fiscal. Aplicamos Soft Delete.
      if (item.transactions.length > 0 || item.was_expensed) {
        await tx.stockItem.update({
          where: { id },
          data: { active: false },
        });
      } else {
        // Se nunca gerou despesa e não possui histórico financeiro, pode ser removido fisicamente
        await tx.stockItem.delete({
          where: { id },
        });
      }
    });

    revalidatePath("/admin/stock");
    revalidatePath("/admin/services");
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

export async function checkStockItemUsage(id: string) {
  try {
    const orgId = await getOrgId();
    const prisma = getTenantPrisma(orgId);

    const item = await prisma.stockItem.findUnique({
      where: { id, organization_id: orgId },
      include: {
        services: {
          include: {
            service: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!item) return { success: false, error: "Insumo não encontrado." };

    return {
      success: true,
      data: item.services.map((s) => s.service.name),
    };
  } catch (error) {
    console.error("Erro ao verificar uso do insumo:", error);
    return { success: false, error: "Erro interno ao verificar uso." };
  }
}

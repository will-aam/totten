// app/actions/services.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
// Importando nossa nova camada de validação profissional
import { validateServiceDeactivation } from "@/lib/validation/catalog";

// Função auxiliar para limpar dados sensíveis/decimais
function sanitizeService(service: any) {
  if (!service) return null;
  return {
    ...service,
    price: Number(service.price || 0),
    material_cost: service.material_cost ? Number(service.material_cost) : null,
  };
}

// --- AÇÕES DE SERVIÇO ---

export async function createService(data: {
  name: string;
  description?: string;
  price: number;
  duration: number;
  category_id: string;
  material_cost?: number | null;
  track_stock?: boolean;
  stock_items?: { stock_item_id: string; quantity_used: number }[];
}) {
  try {
    const admin = await requireAuth();

    const service = await prisma.service.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        duration: data.duration,
        category_id: data.category_id,
        material_cost: data.material_cost,
        track_stock: data.track_stock || false,
        organization_id: admin.organizationId,
        active: true,
        ...(data.track_stock && data.stock_items && data.stock_items.length > 0
          ? {
              stock_items: {
                create: data.stock_items.map((item) => ({
                  stock_item_id: item.stock_item_id,
                  quantity_used: item.quantity_used,
                })),
              },
            }
          : {}),
      },
    });

    revalidatePath("/admin/services");
    return { success: true, service: sanitizeService(service) };
  } catch (error) {
    console.error("Erro ao criar serviço:", error);
    return { success: false, error: "Erro ao criar serviço." };
  }
}

export async function updateService(
  id: string,
  data: {
    name?: string;
    description?: string;
    price?: number;
    duration?: number;
    category_id?: string;
    material_cost?: number | null;
    track_stock?: boolean;
    stock_items?: { stock_item_id: string; quantity_used: number }[];
  },
) {
  try {
    const admin = await requireAuth();

    const existingService = await prisma.service.findFirst({
      where: { id, organization_id: admin.organizationId },
    });

    if (!existingService) {
      return { success: false, error: "Serviço não encontrado." };
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.serviceStockItem.deleteMany({
        where: { service_id: id },
      });

      return await tx.service.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          price: data.price,
          duration: data.duration,
          category_id: data.category_id,
          material_cost: data.material_cost,
          track_stock: data.track_stock,
          ...(data.track_stock &&
          data.stock_items &&
          data.stock_items.length > 0
            ? {
                stock_items: {
                  create: data.stock_items.map((item) => ({
                    stock_item_id: item.stock_item_id,
                    quantity_used: item.quantity_used,
                  })),
                },
              }
            : {}),
        },
      });
    });

    revalidatePath("/admin/services");
    return { success: true, service: sanitizeService(updated) };
  } catch (error) {
    console.error("Erro ao atualizar serviço:", error);
    return { success: false, error: "Erro ao atualizar serviço." };
  }
}

// app/actions/services.ts

// ... (mantenha os imports e funções create/update iguais)

export async function toggleServiceStatus(
  id: string,
  currentStatus: boolean,
  forceCascade: boolean = false,
) {
  try {
    const admin = await requireAuth();

    // 🔥 CORREÇÃO: A validação SEMPRE deve rodar ao inativar, tiramos o !forceCascade daqui
    if (currentStatus === true) {
      const validation = await validateServiceDeactivation(
        id,
        admin.organizationId,
      );

      if (!validation.success) {
        // Se o erro for APENAS o aviso de cascade (HAS_ACTIVE_PACKAGES) e o usuário JÁ confirmou,
        // nós deixamos o código seguir.
        if (validation.code === "HAS_ACTIVE_PACKAGES" && forceCascade) {
          // Segue o fluxo normalmente para inativar em cascata
        } else {
          // BLOQUEIO REAL: Tem agendamento futuro ou Cliente usando o pacote!
          // O sistema não deixa inativar de jeito nenhum.
          return {
            success: false,
            requiresConfirmation: validation.code === "HAS_ACTIVE_PACKAGES",
            error: validation.message,
          };
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.service.update({
        where: { id, organization_id: admin.organizationId },
        data: { active: !currentStatus },
      });

      if (currentStatus === true && forceCascade) {
        await tx.packageTemplate.updateMany({
          where: { service_id: id, organization_id: admin.organizationId },
          data: { active: false },
        });
      }
    });

    revalidatePath("/admin/services");
    revalidatePath("/admin/packages");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao mudar status do serviço." };
  }
}

// ... (mantenha o resto das categorias igual)

// --- AÇÕES DE CATEGORIA ---
export async function updateCategory(id: string, name: string) {
  try {
    const admin = await requireAuth();
    await prisma.category.update({
      where: { id, organization_id: admin.organizationId },
      data: { name },
    });
    revalidatePath("/admin/services");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao atualizar categoria." };
  }
}

export async function toggleCategoryStatus(
  id: string,
  currentStatus: boolean,
  forceCascade: boolean = false,
) {
  try {
    const admin = await requireAuth();

    if (currentStatus === true && !forceCascade) {
      const linkedServices = await prisma.service.count({
        where: {
          category_id: id,
          organization_id: admin.organizationId,
          active: true,
        },
      });

      if (linkedServices > 0) {
        return {
          success: false,
          requiresConfirmation: true,
          error: `Esta categoria possui ${linkedServices} Serviço(s) ativo(s). Deseja inativar a Categoria e todos os Serviços vinculados?`,
        };
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.category.update({
        where: { id, organization_id: admin.organizationId },
        data: { active: !currentStatus },
      });

      if (currentStatus === true && forceCascade) {
        await tx.service.updateMany({
          where: { category_id: id, organization_id: admin.organizationId },
          data: { active: false },
        });
      }
    });

    revalidatePath("/admin/services");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao mudar status da categoria." };
  }
}

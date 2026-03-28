// app/actions/services.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// 🔥 FUNÇÃO AUXILIAR: Converte Decimal do Prisma em Number puro para o Next.js
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
  track_stock?: boolean; // 🔥 Nova Flag
  stock_items?: { stock_item_id: string; quantity_used: number }[]; // 🔥 Lista de Insumos
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
        // 🔥 Salva os insumos na criação se a baixa inteligente estiver ativa
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
    track_stock?: boolean; // 🔥 Nova Flag
    stock_items?: { stock_item_id: string; quantity_used: number }[]; // 🔥 Lista de Insumos
  },
) {
  try {
    const admin = await requireAuth();

    // 1. Verifica se o serviço existe e pertence à organização (Segurança)
    const existingService = await prisma.service.findFirst({
      where: { id, organization_id: admin.organizationId },
    });

    if (!existingService) {
      return { success: false, error: "Serviço não encontrado." };
    }

    // 🔥 2. Transação: Limpa as conexões velhas e cria as novas
    const updated = await prisma.$transaction(async (tx) => {
      // Deleta as vinculações antigas de estoque deste serviço
      await tx.serviceStockItem.deleteMany({
        where: { service_id: id },
      });

      // Atualiza o serviço principal e vincula os novos insumos
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

export async function toggleServiceStatus(id: string, currentStatus: boolean) {
  try {
    const admin = await requireAuth();

    await prisma.service.update({
      where: { id, organization_id: admin.organizationId },
      data: { active: !currentStatus },
    });

    revalidatePath("/admin/services");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao mudar status do serviço." };
  }
}

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

export async function toggleCategoryStatus(id: string, currentStatus: boolean) {
  try {
    const admin = await requireAuth();

    await prisma.category.update({
      where: { id, organization_id: admin.organizationId },
      data: { active: !currentStatus },
    });

    revalidatePath("/admin/services");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao mudar status da categoria." };
  }
}

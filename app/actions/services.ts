// app/actions/services.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

//  FUNÇÃO AUXILIAR: Converte Decimal do Prisma em Number puro para o Next.js
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
  track_stock?: boolean; //  Nova Flag
  stock_items?: { stock_item_id: string; quantity_used: number }[]; //  Lista de Insumos
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
        //  Salva os insumos na criação se a baixa inteligente estiver ativa
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
    track_stock?: boolean; //  Nova Flag
    stock_items?: { stock_item_id: string; quantity_used: number }[]; //  Lista de Insumos
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

    //  2. Transação: Limpa as conexões velhas e cria as novas
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

export async function toggleServiceStatus(
  id: string,
  currentStatus: boolean,
  forceCascade: boolean = false,
) {
  try {
    const admin = await requireAuth();

    // 🔥 TRAVA DE INTEGRIDADE: Se for inativar (currentStatus === true) e não forçou a cascata
    if (currentStatus === true && !forceCascade) {
      const linkedPackages = await prisma.packageTemplate.count({
        where: {
          service_id: id,
          organization_id: admin.organizationId,
          active: true, // Só nos importamos se o pacote estiver ativo na vitrine
        },
      });

      if (linkedPackages > 0) {
        return {
          success: false,
          requiresConfirmation: true, // Flag mágica para o front-end
          error: `Este serviço está vinculado a ${linkedPackages} Pacote(s) ativo(s). Deseja inativar o Serviço e o(s) Pacote(s) juntos?`,
        };
      }
    }

    // Executa a inativação
    await prisma.$transaction(async (tx) => {
      // 1. Muda o status do serviço
      await tx.service.update({
        where: { id, organization_id: admin.organizationId },
        data: { active: !currentStatus },
      });

      // 2. Se for inativação com cascata forçada, derruba os pacotes vinculados
      if (currentStatus === true && forceCascade) {
        await tx.packageTemplate.updateMany({
          where: { service_id: id, organization_id: admin.organizationId },
          data: { active: false },
        });
      }
    });

    revalidatePath("/admin/services");
    revalidatePath("/admin/packages"); // Importante revalidar a vitrine de pacotes
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

export async function toggleCategoryStatus(
  id: string,
  currentStatus: boolean,
  forceCascade: boolean = false,
) {
  try {
    const admin = await requireAuth();

    // 🔥 TRAVA DE INTEGRIDADE: Se for inativar a Categoria
    if (currentStatus === true && !forceCascade) {
      const linkedServices = await prisma.service.count({
        where: {
          category_id: id,
          organization_id: admin.organizationId,
          active: true, // Conta serviços que ainda estão ativos nela
        },
      });

      if (linkedServices > 0) {
        return {
          success: false,
          requiresConfirmation: true, // Flag mágica para o front-end
          error: `Esta categoria possui ${linkedServices} Serviço(s) ativo(s). Deseja inativar a Categoria e todos os Serviços vinculados a ela?`,
        };
      }
    }

    await prisma.$transaction(async (tx) => {
      // 1. Muda o status da categoria
      await tx.category.update({
        where: { id, organization_id: admin.organizationId },
        data: { active: !currentStatus },
      });

      // 2. Se for inativação com cascata forçada, derruba os serviços
      if (currentStatus === true && forceCascade) {
        await tx.service.updateMany({
          where: { category_id: id, organization_id: admin.organizationId },
          data: { active: false },
        });

        // Nota Sênior: Aqui nós inativamos os serviços. Se quiser que a cascata desça
        // até os pacotes vinculados a esses serviços, precisaríamos de uma query a mais aqui.
        // Por ora, matamos a categoria e os serviços.
      }
    });

    revalidatePath("/admin/services");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao mudar status da categoria." };
  }
}

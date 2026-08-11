// lib/server/services/services/service.service.ts
import { getTenantPrisma } from "@/lib/prisma";

export class ServiceCatalogService {
  /**
   * Lista de forma otimizada os serviços (apenas id e name) para listagens simples e dropdowns.
   */
  static async getSimpleServicesList(organizationId: string) {
    const prisma = getTenantPrisma(organizationId);

    return await prisma.service.findMany({
      where: {
        organization_id: organizationId,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  /**
   * Lista os serviços da organização de forma completa (com filtro opcional de ativos)
   */
  static async getServices(organizationId: string, onlyActive: boolean) {
    const prisma = getTenantPrisma(organizationId);

    return await prisma.service.findMany({
      where: {
        organization_id: organizationId,
        ...(onlyActive ? { active: true } : {}),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        stock_items: {
          include: {
            stock_item: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  /**
   * Cria um novo serviço, gerenciando a categoria padrão e vinculando insumos de estoque.
   */
  static async createService(organizationId: string, data: any) {
    const prisma = getTenantPrisma(organizationId);
    const {
      name,
      description,
      duration,
      price,
      category_id,
      material_cost,
      track_stock,
      stock_items,
      available_online,
      image_url,
    } = data;

    if (!name || !duration || !price) {
      throw new Error("MISSING_REQUIRED_FIELDS");
    }

    let finalCategoryId = category_id;

    // Lógica de fallback para a categoria "Geral" isolada no Service
    if (!finalCategoryId) {
      let defaultCategory = await prisma.category.findFirst({
        where: {
          name: "Geral",
          organization_id: organizationId,
        },
      });

      if (!defaultCategory) {
        defaultCategory = await prisma.category.create({
          data: {
            name: "Geral",
            organization_id: organizationId,
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
        track_stock: track_stock || false,
        category_id: finalCategoryId,
        organization_id: organizationId,
        active: true,
        available_online: available_online !== undefined ? available_online : true,
        image_url: image_url || null,
        // Vínculo inteligente de insumos na tabela pivô
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

    return service;
  }

  /**
   * Remove um serviço, se não houver vínculos impeditivos (pacotes, histórico ou agendamentos).
   */
  static async deleteService(organizationId: string, id: string) {
    const prisma = getTenantPrisma(organizationId);

    const service = await prisma.service.findUnique({
      where: { id, organization_id: organizationId },
    });

    if (!service) {
      throw new Error("Serviço não encontrado.");
    }

    // Verifica vínculos
    const [packagesCount, appointmentsCount] = await Promise.all([
      prisma.packageTemplate.count({
        where: { service_id: id, organization_id: organizationId },
      }),
      prisma.appointment.count({
        where: { service_id: id, organization_id: organizationId },
      }),
    ]);

    if (packagesCount > 0 || appointmentsCount > 0) {
      const messages = [];
      if (appointmentsCount > 0) messages.push(`${appointmentsCount} agendamento(s)`);
      if (packagesCount > 0) messages.push(`${packagesCount} pacote(s)`);
      
      throw new Error(
        `Não é possível excluir. O serviço está vinculado a: ${messages.join(", ")}.`
      );
    }

    await prisma.service.delete({
      where: { id, organization_id: organizationId },
    });

    return true;
  }
}

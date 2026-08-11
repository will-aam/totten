// lib/server/services/categories/category.service.ts
import { getTenantPrisma } from "@/lib/prisma";

export class CategoryService {
  /**
   * Lista todas as categorias da organização (com filtro opcional de ativas)
   * e inclui a contagem de serviços atrelados.
   */
  static async getCategories(
    organizationId: string,
    onlyActive: boolean = false,
  ) {
    const prisma = getTenantPrisma(organizationId);

    return await prisma.category.findMany({
      where: {
        organization_id: organizationId,
        ...(onlyActive ? { active: true } : {}),
      },
      orderBy: {
        name: "asc",
      },
      include: {
        _count: {
          select: {
            services: true,
          },
        },
      },
    });
  }

  /**
   * Cria uma nova categoria, prevenindo colisão de nomes estrita dentro do tenant.
   */
  static async createCategory(organizationId: string, name: string) {
    const prisma = getTenantPrisma(organizationId);
    const trimmedName = name.trim();

    if (!trimmedName) {
      throw new Error("Nome da categoria é obrigatório");
    }

    const existing = await prisma.category.findFirst({
      where: {
        name: trimmedName,
        organization_id: organizationId,
      },
    });

    if (existing) {
      throw new Error("Categoria já existe");
    }

    return await prisma.category.create({
      data: {
        name: trimmedName,
        organization_id: organizationId,
      },
    });
  }

  /**
   * Remove uma categoria, se não houver serviços vinculados a ela.
   */
  static async deleteCategory(organizationId: string, id: string) {
    const prisma = getTenantPrisma(organizationId);

    const category = await prisma.category.findUnique({
      where: { id, organization_id: organizationId },
    });

    if (!category) {
      throw new Error("Categoria não encontrada.");
    }

    // Verifica se existem serviços vinculados a esta categoria
    const servicesUsingCategory = await prisma.service.count({
      where: {
        category_id: id,
        organization_id: organizationId,
      },
    });

    if (servicesUsingCategory > 0) {
      throw new Error(
        `Não é possível excluir. Existem ${servicesUsingCategory} serviço(s) utilizando esta categoria.`,
      );
    }

    await prisma.category.delete({
      where: {
        id,
        organization_id: organizationId,
      },
    });

    return true;
  }
}

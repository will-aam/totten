// lib/server/services/packages/package-template.service.ts
import { getTenantPrisma } from "@/lib/prisma";

export class PackageTemplateService {
  /**
   * Lista os templates de pacotes da organização, com filtro opcional para ativos.
   */
  static async getTemplates(organizationId: string, onlyActive: boolean) {
    const prisma = getTenantPrisma(organizationId);

    const templates = await prisma.packageTemplate.findMany({
      where: {
        organization_id: organizationId,
        ...(onlyActive ? { active: true } : {}),
      },
      select: {
        id: true,
        name: true,
        total_sessions: true,
        price: true,
        service_id: true,
        active: true,
        validity_days: true,
        // AQUI ESTÁ A MÁGICA: Trazendo a relação do serviço para o front-end
        service: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return templates.map((t) => ({ ...t, price: Number(t.price) }));
  }

  /**
   * Cria um novo template de pacote vinculado à organização.
   */
  static async createTemplate(
    organizationId: string,
    data: {
      name: string;
      total_sessions: string | number;
      price: string | number;
      service_id: string;
      validity_days?: string | number | null;
      active?: boolean;
    },
  ) {
    const prisma = getTenantPrisma(organizationId);

    if (!data.name || !data.total_sessions || !data.price || !data.service_id) {
      throw new Error("MISSING_DATA");
    }

    return await prisma.packageTemplate.create({
      data: {
        name: data.name,
        total_sessions: Number(data.total_sessions),
        price: Number(data.price),
        service_id: data.service_id,
        validity_days:
          data.validity_days !== "" &&
          data.validity_days !== null &&
          data.validity_days !== undefined
            ? Number(data.validity_days)
            : null,
        active: data.active ?? true,
        organization_id: organizationId,
      },
    });
  }
}

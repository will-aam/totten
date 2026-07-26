// lib/server/services/public/organization.service.ts
import { prisma } from "@/lib/prisma";

export class PublicOrganizationService {
  /**
   * Busca as informações públicas de uma organização.
   * Pode ser resolvida pelo ID (se houver sessão do Totem) ou pelo Slug (Link da Bio).
   */
  static async getPublicInfo(organizationId?: string, slug?: string | null) {
    let targetId = organizationId;

    // Se não temos o ID diretamente, tentamos descobrir pelo Slug
    if (!targetId && slug) {
      const org = await prisma.organization.findUnique({
        where: { slug },
        select: { id: true },
      });
      targetId = org?.id;
    }

    // Se no fim das contas não achamos nenhuma organização, retornamos null
    if (!targetId) {
      return null;
    }

    // Busca os dados públicos nas configurações
    const settings = await prisma.settings.findUnique({
      where: {
        organization_id: targetId,
      },
      select: {
        company_name: true,
        trade_name: true,
        opening_time: true,
        closing_time: true,
      },
    });

    if (!settings) {
      throw new Error("SETTINGS_NOT_FOUND");
    }

    return {
      companyName: settings.company_name,
      tradeName: settings.trade_name,
      openingTime: settings.opening_time,
      closingTime: settings.closing_time,
    };
  }
}

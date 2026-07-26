// lib/server/services/settings/settings.service.ts
import { getTenantPrisma } from "@/lib/prisma";

export class SettingsService {
  /**
   * Busca as configurações gerais da organização.
   */
  static async getSettings(organizationId: string) {
    const prisma = getTenantPrisma(organizationId);

    const settings = await prisma.settings.findUnique({
      where: { organization_id: organizationId },
    });

    if (!settings) {
      throw new Error("SETTINGS_NOT_FOUND");
    }

    return {
      companyName: settings.company_name,
      tradeName: settings.trade_name || "",
      document: settings.document || "",
      contactPhone: settings.phone_landline || "",
      whatsapp: settings.phone_whatsapp || "",
      email: settings.email_admin || "",
      openingTime: settings.opening_time,
      closingTime: settings.closing_time,
    };
  }

  /**
   * Atualiza as configurações gerais da organização via upsert.
   */
  static async updateSettings(organizationId: string, data: any) {
    const prisma = getTenantPrisma(organizationId);

    const existingSettings = await prisma.settings.findUnique({
      where: { organization_id: organizationId },
      include: { organization: true },
    });

    const updateData: any = {};
    if (data.companyName !== undefined)
      updateData.company_name = data.companyName;
    if (data.tradeName !== undefined) updateData.trade_name = data.tradeName;
    if (data.document !== undefined) updateData.document = data.document;
    if (data.contactPhone !== undefined)
      updateData.phone_landline = data.contactPhone;
    if (data.whatsapp !== undefined) updateData.phone_whatsapp = data.whatsapp;
    if (data.openingTime !== undefined)
      updateData.opening_time = data.openingTime;
    if (data.closingTime !== undefined)
      updateData.closing_time = data.closingTime;

    return await prisma.settings.upsert({
      where: { organization_id: organizationId },
      update: updateData,
      create: {
        organization_id: organizationId,
        company_name:
          data.companyName ||
          existingSettings?.organization.name ||
          "Minha Empresa",
        trade_name: data.tradeName || "",
        document: data.document || "",
        phone_landline: data.contactPhone || "",
        phone_whatsapp: data.whatsapp || "",
        opening_time: data.openingTime || "08:00",
        closing_time: data.closingTime || "19:00",
      },
    });
  }
}

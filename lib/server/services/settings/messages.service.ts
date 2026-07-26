// lib/server/services/settings/messages.service.ts
import { getTenantPrisma } from "@/lib/prisma";

export class MessagesService {
  /**
   * Busca as configurações de telefone e os templates de mensagens da organização.
   */
  static async getTemplates(organizationId: string) {
    const prisma = getTenantPrisma(organizationId);

    const settings = await prisma.settings.findUnique({
      where: { organization_id: organizationId },
    });

    const templates = await prisma.messageTemplate.findMany({
      where: { organization_id: organizationId },
    });

    const templatesMap: Record<string, string> = {};
    templates.forEach((t) => {
      templatesMap[t.type] = t.content;
    });

    return {
      phone: settings?.phone_whatsapp || "",
      msgUpdate: templatesMap["CHECK_IN"] || "",
      msgWelcome: templatesMap["WELCOME"] || "",
      msgRenewal: templatesMap["RENEWAL"] || "",
      msgReminder: templatesMap["REMINDER"] || "",
      msgManualConfirmation: templatesMap["MANUAL_CONFIRMATION"] || "",
    };
  }

  /**
   * Atualiza os templates de mensagens utilizando upsert via transação.
   */
  static async updateTemplates(organizationId: string, data: any) {
    const prisma = getTenantPrisma(organizationId);

    const {
      msgUpdate,
      msgWelcome,
      msgRenewal,
      msgReminder,
      msgManualConfirmation,
    } = data;

    await prisma.$transaction(async (tx) => {
      const templates = [
        { type: "CHECK_IN", content: msgUpdate },
        { type: "WELCOME", content: msgWelcome },
        { type: "RENEWAL", content: msgRenewal },
        { type: "REMINDER", content: msgReminder },
        { type: "MANUAL_CONFIRMATION", content: msgManualConfirmation },
      ];

      for (const template of templates) {
        // Ignora campos não fornecidos no request
        if (template.content === undefined) continue;

        await tx.messageTemplate.upsert({
          where: {
            type_organization_id: {
              type: template.type,
              organization_id: organizationId,
            },
          },
          update: { content: template.content },
          create: {
            type: template.type,
            content: template.content,
            organization_id: organizationId,
          },
        });
      }
    });

    return { success: true, message: "Mensagens atualizadas com sucesso" };
  }
}

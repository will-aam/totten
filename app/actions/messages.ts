// app/actions/messages.ts
"use server";

import { requireAuth } from "@/lib/auth";
import { MessagesService } from "@/lib/server/services/settings/messages.service";
import { revalidatePath } from "next/cache";

export async function updateMessagesAction(data: {
  msgUpdate?: string;
  msgWelcome?: string;
  msgRenewal?: string;
  msgReminder?: string;
  msgManualConfirmation?: string;
}) {
  try {
    // 🛡️ Validação unificada de sessão e extração do tenant garantida
    const admin = await requireAuth();

    // Delega a regra de negócio e o upsert em massa para o Service
    await MessagesService.updateTemplates(admin.organizationId, data);

    // Revalida o cache do Next.js para as páginas de configurações
    revalidatePath("/admin/settings");
    revalidatePath("/admin/settings/messages");

    return { success: true, message: "Mensagens atualizadas com sucesso!" };
  } catch (error: any) {
    if (error.name === "AuthError" || error.message === "Não autorizado") {
      return {
        success: false,
        error: "Sessão expirada. Faça login novamente.",
      };
    }

    console.error("[ACTION updateMessages]", error);
    return {
      success: false,
      error: "Erro interno ao atualizar templates de mensagens.",
    };
  }
}

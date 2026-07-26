"use server";

import { requireAuth } from "@/lib/auth";
import { SettingsService } from "@/lib/server/services/settings/settings.service";
import { revalidatePath } from "next/cache";

export async function updateSettingsAction(data: {
  companyName?: string;
  tradeName?: string;
  document?: string;
  contactPhone?: string;
  whatsapp?: string;
  openingTime?: string;
  closingTime?: string;
}) {
  try {
    // 🛡️ Validação unificada de sessão e extração do tenant
    const admin = await requireAuth();

    // Delega a regra de negócio e o upsert para o Service
    await SettingsService.updateSettings(admin.organizationId, data);

    // Revalida o cache do Next.js para as páginas de configurações
    revalidatePath("/admin/settings");
    revalidatePath("/admin/settings/general");

    return { success: true };
  } catch (error: any) {
    if (error.name === "AuthError" || error.message === "Não autorizado") {
      return {
        success: false,
        error: "Sessão expirada. Faça login novamente.",
      };
    }

    console.error("[ACTION updateSettings]", error);
    return {
      success: false,
      error: "Erro interno ao atualizar configurações.",
    };
  }
}

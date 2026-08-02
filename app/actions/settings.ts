// app/actions/settings.ts
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
  autoConfirmAppointments?: boolean;
  scheduleGenerationType?: string;
  allowOverLimitAppointments?: boolean;
  defaultScheduleView?: string;
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

// ---------------------------------------------------------------------------
// Novas Actions para o Autoatendimento (Regras e Horários)
// ---------------------------------------------------------------------------

export async function getSelfServiceSettingsAction() {
  try {
    const admin = await requireAuth();

    // Delega a busca para o Service
    const data = await SettingsService.getSelfServiceSettings(
      admin.organizationId,
    );

    return { success: true, data };
  } catch (error: any) {
    if (error.name === "AuthError" || error.message === "Não autorizado") {
      return {
        success: false,
        error: "Sessão expirada. Faça login novamente.",
      };
    }

    console.error("[ACTION getSelfServiceSettings]", error);
    return { success: false, error: "Erro interno ao buscar configurações." };
  }
}

export async function updateSelfServiceSettingsAction(data: {
  termsOfUse?: string;
  futureBookingLimitDays?: number;
  welcomeMessage?: string;
  schedule: Array<{
    dayOfWeek: number;
    isOpen: boolean;
    openTime?: string;
    closeTime?: string;
    breakStart?: string;
    breakEnd?: string;
    breakReason?: string;
    breakVisibleToClient?: boolean;
  }>;
  exceptions: Array<{
    date: string;
    isOpen: boolean;
    openTime?: string;
    closeTime?: string;
    breakStart?: string;
    breakEnd?: string;
    breakReason?: string;
    breakVisibleToClient?: boolean;
  }>;
}) {
  try {
    const admin = await requireAuth();

    // Delega a regra de negócio e as mutações (transação) para o Service
    await SettingsService.updateSelfServiceSettings(admin.organizationId, data);

    // Revalida o cache da rota de autoatendimento para atualizar a UI
    revalidatePath("/admin/self-service");

    return { success: true };
  } catch (error: any) {
    if (error.name === "AuthError" || error.message === "Não autorizado") {
      return {
        success: false,
        error: "Sessão expirada. Faça login novamente.",
      };
    }

    console.error("[ACTION updateSelfServiceSettings]", error);
    return {
      success: false,
      error: "Erro interno ao atualizar configurações de autoatendimento.",
    };
  }
}

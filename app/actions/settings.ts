// app/actions/settings.ts
"use server";

import { requireAuth, requireFinancePermission } from "@/lib/auth";
import { SettingsService } from "@/lib/server/services/settings/settings.service";
import { revalidatePath } from "next/cache";

export async function updateSettingsAction(data: {
  companyName?: string;
  responsibleName?: string;
  document?: string;
  contactPhone?: string;
  whatsapp?: string;
  openingTime?: string;
  closingTime?: string;
  autoConfirmAppointments?: boolean;
  scheduleGenerationType?: string;
  allowOverLimitAppointments?: boolean;
  defaultScheduleView?: string;
  address?: string;
  autoSettleOnCheckin?: boolean;
  defaultPaymentMethodId?: string;
}) {
  try {
    // 🛡️ Validação unificada de sessão e extração do tenant
    const admin = await requireAuth();

    // Delega a regra de negócio e o upsert para o Service
    await SettingsService.updateSettings(admin.organizationId, data);

    // Revalida o cache do Next.js para as páginas de configurações
    revalidatePath("/admin/settings");
    revalidatePath("/admin/settings/general");
    revalidatePath("/admin/finance/settings");

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

export async function getFinancialSettingsAction() {
  try {
    const admin = await requireFinancePermission();
    const settings = await SettingsService.getSettings(admin.organizationId);
    return {
      success: true,
      data: {
        autoSettleOnCheckin: settings.autoSettleOnCheckin ?? true,
        defaultPaymentMethodId: settings.defaultPaymentMethodId || "",
      },
    };
  } catch (error: any) {
    console.error("[ACTION getFinancialSettingsAction]", error);
    return {
      success: false,
      error: error?.message || "Erro ao buscar configurações financeiras.",
    };
  }
}

export async function updateFinancialSettingsAction(data: {
  autoSettleOnCheckin: boolean;
  defaultPaymentMethodId?: string;
}) {
  try {
    const admin = await requireFinancePermission();
    await SettingsService.updateSettings(admin.organizationId, data);
    revalidatePath("/admin/finance/settings");
    revalidatePath("/admin/finance/receivables");
    revalidatePath("/admin/finance/transactions");
    revalidatePath("/admin/finance/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("[ACTION updateFinancialSettingsAction]", error);
    return {
      success: false,
      error: error?.message || "Erro ao salvar configurações financeiras.",
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
  clinicTermsOfUse?: string;
  futureBookingLimitDays?: number;
  openingTime?: string;
  closingTime?: string;
  scheduleGenerationType?: string;
  allowOverLimitAppointments?: boolean;

  bookingTheme?: string;
  bookingPrimaryColor?: string;

  requirePrepayment?: boolean;
  pixPaymentType?: string;
  pixKey?: string;
  paymentInstructions?: string;
  showPackages?: boolean;
  showMostBooked?: boolean;
  showTeam?: boolean;
  showTeamLikes?: boolean;
  packageValidityMode?: string;
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

// ---------------------------------------------------------------------------
// Ações para Regras de Horários
// ---------------------------------------------------------------------------

export async function createScheduleRuleAction(name: string, isDefault: boolean) {
  try {
    const admin = await requireAuth();
    const rule = await SettingsService.createScheduleRule(admin.organizationId, name, isDefault);
    revalidatePath("/admin/self-service");
    return { success: true, data: rule };
  } catch (error: any) {
    return { success: false, error: "Erro ao criar regra de horários." };
  }
}

export async function updateScheduleRuleAction(ruleId: string, data: any) {
  try {
    const admin = await requireAuth();
    await SettingsService.updateScheduleRule(admin.organizationId, ruleId, data);
    revalidatePath("/admin/self-service");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Erro ao atualizar regra de horários." };
  }
}

export async function deleteScheduleRuleAction(ruleId: string) {
  try {
    const admin = await requireAuth();
    await SettingsService.deleteScheduleRule(admin.organizationId, ruleId);
    revalidatePath("/admin/self-service");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Erro ao excluir regra de horários." };
  }
}

export async function disconnectMercadoPagoAction() {
  try {
    const admin = await requireAuth();
    const { prisma } = await import("@/lib/prisma");

    await prisma.settings.update({
      where: { organization_id: admin.organizationId },
      data: {
        pix_payment_type: "MANUAL",
        mp_access_token: null,
        mp_refresh_token: null,
        mp_public_key: null,
        mp_user_id: null,
      },
    });

    revalidatePath("/admin/custom-page");
    return { success: true };
  } catch (error: any) {
    console.error("[ACTION disconnectMercadoPago]", error);
    return { success: false, error: "Erro ao desconectar conta do Mercado Pago." };
  }
}

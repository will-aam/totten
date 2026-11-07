"use server";

import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MP_SUBSCRIPTION_PLANS, PlanType, BillingCycle } from "@/lib/mercadopago/plans-config";

export async function createSubscriptionCheckoutAction(
  planId: PlanType,
  cycle: BillingCycle
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !admin.organizationId) {
      return { success: false, error: "Usuário não autenticado ou sem organização." };
    }

    const planConfig = MP_SUBSCRIPTION_PLANS[cycle]?.[planId];
    if (!planConfig) {
      return { success: false, error: "Plano inválido selecionado." };
    }

    const token = process.env.MP_PLATFORM_ACCESS_TOKEN;
    if (!token) {
      return {
        success: false,
        error: "Configuração do Mercado Pago da plataforma ausente (MP_PLATFORM_ACCESS_TOKEN).",
      };
    }

    const appUrl =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://totten.com.br";

    const backUrl = `${appUrl.replace(/\/$/, "")}/admin/plan?status=success`;

    // Chamada oficial à API do Mercado Pago para gerar a assinatura amarrada à organização
    const response = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        preapproval_plan_id: planConfig.preapprovalPlanId,
        reason: `${planConfig.name} - Totten`,
        external_reference: admin.organizationId,
        payer_email: admin.email || undefined,
        back_url: backUrl,
        status: "pending",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[MP_SUBSCRIPTION_ERROR]", data);
      return {
        success: false,
        error:
          data.message ||
          data.error ||
          "Não foi possível iniciar o checkout de assinatura.",
      };
    }

    // Registra intenção do plano na organização
    await prisma.organization.update({
      where: { id: admin.organizationId },
      data: {
        plan: planId.toUpperCase(),
        billing_cycle: cycle,
      },
    });

    const initPoint = data.init_point;
    if (!initPoint) {
      return { success: false, error: "URL de checkout não retornada pelo Mercado Pago." };
    }

    return {
      success: true,
      initPoint,
    };
  } catch (error: any) {
    console.error("[CREATE_SUBSCRIPTION_CHECKOUT_EXCEPTION]", error);
    return {
      success: false,
      error: error?.message || "Erro inesperado ao gerar pagamento da assinatura.",
    };
  }
}


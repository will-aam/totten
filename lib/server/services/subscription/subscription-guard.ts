import { prisma } from "@/lib/prisma";

export type SubscriptionAccess = {
  isBlocked: boolean;
  status: "TRIAL" | "ACTIVE" | "PAST_DUE" | "SUSPENDED" | "CANCELLED";
  plan: string;
  reason?: string;
  daysRemaining?: number;
};

export async function checkOrganizationSubscription(organizationId: string): Promise<SubscriptionAccess> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      plan: true,
      subscription_status: true,
      current_period_end: true,
      trial_ends_at: true,
      created_at: true,
      mp_subscription_id: true,
    },
  });

  if (!org) {
    return {
      isBlocked: true,
      status: "SUSPENDED",
      plan: "TRIAL",
      reason: "Organização não encontrada.",
    };
  }

  // 👑 ISENÇÃO VITALÍCIA (Dono do Sistema / Conta Master):
  // A organização do dono possui plano FULL vitalício e isenção permanente de pagamento.
  const isMasterExempt =
    organizationId === "cmw6jrh6t0000cgxgwi7hi285" ||
    org.plan === "FULL" ||
    org.plan === "MASTER" ||
    org.mp_subscription_id === "MASTER_EXEMPT_LIFETIME";

  if (isMasterExempt) {
    return {
      isBlocked: false,
      status: "ACTIVE",
      plan: "FULL",
      daysRemaining: 99999,
    };
  }

  const status = (org.subscription_status || "TRIAL") as SubscriptionAccess["status"];
  const plan = org.plan || "TRIAL";
  const now = new Date();

  // 1. Assinatura ativa com pagamento confirmado
  if (status === "ACTIVE") {
    // Se tiver data de fim de período e já tiver passado de 3 dias de tolerância
    if (org.current_period_end) {
      const gracePeriod = new Date(org.current_period_end.getTime() + 3 * 24 * 60 * 60 * 1000);
      if (now > gracePeriod) {
        return {
          isBlocked: true,
          status: "PAST_DUE",
          plan,
          reason: "Renovação pendente de pagamento.",
        };
      }
    }
    return {
      isBlocked: false,
      status: "ACTIVE",
      plan,
    };
  }

  // 2. Em Trial (14 dias grátis a contar da data de criação ou trial_ends_at)
  if (status === "TRIAL") {
    const trialEnd =
      org.trial_ends_at ||
      new Date(org.created_at.getTime() + 14 * 24 * 60 * 60 * 1000);

    const diffMs = trialEnd.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    if (now > trialEnd) {
      return {
        isBlocked: true,
        status: "SUSPENDED",
        plan,
        daysRemaining: 0,
        reason: "Seu período de teste de 14 dias expirou. Escolha um plano para continuar utilizando o Totten.",
      };
    }

    return {
      isBlocked: false,
      status: "TRIAL",
      plan,
      daysRemaining,
    };
  }

  // 3. Suspenso ou Cancelado
  if (status === "SUSPENDED" || status === "CANCELLED" || status === "PAST_DUE") {
    return {
      isBlocked: true,
      status,
      plan,
      reason: "Identificamos uma pendência no pagamento da sua assinatura. Regularize para reativar o acesso.",
    };
  }

  return {
    isBlocked: false,
    status: "ACTIVE",
    plan,
  };
}


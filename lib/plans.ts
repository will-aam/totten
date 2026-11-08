// lib/plans.ts

export type OfficialPlan = "BASIC" | "MEDIUM" | "ADVANCED";

export interface PlanConfig {
  id: OfficialPlan;
  key: "basic" | "medium" | "advanced";
  name: "Plano Básico" | "Plano Padrão" | "Plano Avançado";
  shortName: "Básico" | "Padrão" | "Avançado";
  badgeClass: string;
}

export const OFFICIAL_PLANS: Record<OfficialPlan, PlanConfig> = {
  BASIC: {
    id: "BASIC",
    key: "basic",
    name: "Plano Básico",
    shortName: "Básico",
    badgeClass: "border-blue-500/30 text-blue-700 dark:text-blue-300 bg-blue-500/10",
  },
  MEDIUM: {
    id: "MEDIUM",
    key: "medium",
    name: "Plano Padrão",
    shortName: "Padrão",
    badgeClass: "border-purple-500/30 text-purple-700 dark:text-purple-300 bg-purple-500/10",
  },
  ADVANCED: {
    id: "ADVANCED",
    key: "advanced",
    name: "Plano Avançado",
    shortName: "Avançado",
    badgeClass: "border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10",
  },
};

/**
 * Normaliza qualquer valor armazenado (inclusive valores legados como "TRIAL", "ACTIVE", "FULL")
 * para um dos três planos oficiais: "BASIC", "MEDIUM" ou "ADVANCED".
 */
export function normalizePlan(plan?: string | null): OfficialPlan {
  if (!plan) return "ADVANCED";
  const upper = plan.toUpperCase().trim();
  if (upper === "BASIC" || upper === "BASICO" || upper === "BÁSICO") return "BASIC";
  if (upper === "MEDIUM" || upper === "PADRAO" || upper === "PADRÃO") return "MEDIUM";
  if (upper === "ADVANCED" || upper === "AVANCADO" || upper === "AVANÇADO") return "ADVANCED";
  // Casos legados ("TRIAL", "ACTIVE", "FULL", "MASTER", etc.)
  return "ADVANCED";
}

/**
 * Retorna o nome formatado oficial do plano: "Plano Básico", "Plano Padrão" ou "Plano Avançado".
 */
export function formatPlanName(plan?: string | null): string {
  const norm = normalizePlan(plan);
  return OFFICIAL_PLANS[norm].name;
}

/**
 * Retorna o nome curto do plano: "Básico", "Padrão" ou "Avançado".
 */
export function formatPlanShortName(plan?: string | null): string {
  const norm = normalizePlan(plan);
  return OFFICIAL_PLANS[norm].shortName;
}

/**
 * Retorna o status de assinatura formatado em português.
 */
export function formatSubscriptionStatus(
  status?: string | null,
  trialDaysLeft?: number | null,
  currentPeriodEnd?: string | null
) {
  const s = (status || "TRIAL").toUpperCase().trim();
  if (s === "ACTIVE") {
    let label = "Assinatura Ativa";
    if (currentPeriodEnd) {
      const d = new Date(currentPeriodEnd);
      if (!isNaN(d.getTime())) {
        const day = d.getUTCDate().toString().padStart(2, "0");
        const month = (d.getUTCMonth() + 1).toString().padStart(2, "0");
        label = `Ativa (Vence ${day}/${month})`;
      }
    }
    return {
      label,
      isTrial: false,
      badgeClass: "border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10",
    };
  }
  if (s === "TRIAL") {
    const days = trialDaysLeft ?? 0;
    return {
      label: days > 0 ? `Em Teste (${days}d restantes)` : "Teste Expirado",
      isTrial: true,
      badgeClass:
        days > 0
          ? "border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-500/10"
          : "border-destructive/30 text-destructive bg-destructive/10",
    };
  }
  if (s === "PAST_DUE") {
    return {
      label: "Pagamento Pendente",
      isTrial: false,
      badgeClass: "border-orange-500/30 text-orange-700 dark:text-orange-300 bg-orange-500/10",
    };
  }
  if (s === "SUSPENDED" || s === "CANCELLED") {
    return {
      label: "Acesso Suspenso",
      isTrial: false,
      badgeClass: "border-red-500/30 text-red-700 dark:text-red-300 bg-red-500/10",
    };
  }
  return {
    label: s,
    isTrial: false,
    badgeClass: "border-muted text-muted-foreground bg-muted/20",
  };
}


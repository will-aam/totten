export const MP_SUBSCRIPTION_PLANS = {
  monthly: {
    basic: {
      name: "Plano Básico",
      planId: "basic",
      cycle: "monthly",
      price: 29.9,
      preapprovalPlanId: "dc195b1e2c1647eea28781279b3c3d80",
    },
    medium: {
      name: "Plano Padrão",
      planId: "medium",
      cycle: "monthly",
      price: 49.9,
      preapprovalPlanId: "52c880180792452f8b2f574a7563b66a",
    },
    advanced: {
      name: "Plano Avançado",
      planId: "advanced",
      cycle: "monthly",
      price: 89.9,
      preapprovalPlanId: "9e27233c2d194258bd92a263b2707e6d",
    },
  },
  yearly: {
    basic: {
      name: "Plano Básico Anual",
      planId: "basic",
      cycle: "yearly",
      price: 299.0,
      preapprovalPlanId: "3da5f8375e664650b096546dd7d2c1b7",
    },
    medium: {
      name: "Plano Padrão Anual",
      planId: "medium",
      cycle: "yearly",
      price: 499.0,
      preapprovalPlanId: "4c3b566593d345728e9da8ceb008fea5",
    },
    advanced: {
      name: "Plano Avançado Anual",
      planId: "advanced",
      cycle: "yearly",
      price: 899.0,
      preapprovalPlanId: "cf8d434ea7424dcebe64ed34ec3b620a",
    },
  },
} as const;

export type PlanType = "basic" | "medium" | "advanced";
export type BillingCycle = "monthly" | "yearly";


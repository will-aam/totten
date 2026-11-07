"use server";

import { getCurrentAdmin } from "@/lib/auth";
import { checkOrganizationSubscription, type SubscriptionAccess } from "@/lib/server/services/subscription/subscription-guard";

export async function getSubscriptionStatusAction(): Promise<SubscriptionAccess> {
  const admin = await getCurrentAdmin();
  if (!admin || !admin.organizationId) {
    return {
      isBlocked: false,
      status: "ACTIVE",
      plan: "UNKNOWN",
    };
  }

  return await checkOrganizationSubscription(admin.organizationId);
}


// app/actions/push.ts
"use server";

import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface PushSubscriptionItem {
  endpoint: string;
  expirationTime?: number | null;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
  userAgent?: string;
  updatedAt: string;
}

/**
 * Salva ou atualiza a subscrição de Notificação Push (Web/PWA) do dispositivo do usuário.
 * Armazena no campo JSON do Admin para persistência segura sem risco de quebra de banco.
 */
export async function savePushSubscriptionAction(subscription: {
  endpoint: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
  userAgent?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await requireAuth();

    if (!subscription || !subscription.endpoint) {
      return { success: false, error: "Subscrição inválida." };
    }

    const currentAdmin = await prisma.admin.findUnique({
      where: { id: admin.id },
      select: { dashboard_layout: true },
    });

    const currentLayout =
      currentAdmin?.dashboard_layout &&
      typeof currentAdmin.dashboard_layout === "object" &&
      !Array.isArray(currentAdmin.dashboard_layout)
        ? (currentAdmin.dashboard_layout as Record<string, any>)
        : {};

    const existingSubscriptions: PushSubscriptionItem[] = Array.isArray(
      currentLayout.push_subscriptions,
    )
      ? currentLayout.push_subscriptions
      : [];

    // Remove subscription existente com o mesmo endpoint se houver
    const filtered = existingSubscriptions.filter(
      (s) => s.endpoint !== subscription.endpoint,
    );

    filtered.push({
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      userAgent: subscription.userAgent || "",
      updatedAt: new Date().toISOString(),
    });

    // Mantém no máximo os 10 dispositivos mais recentes por segurança
    const trimmed = filtered.slice(-10);

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        dashboard_layout: {
          ...currentLayout,
          push_subscriptions: trimmed,
        } as any,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("[savePushSubscriptionAction] Erro ao salvar subscrição push:", error);
    return { success: false, error: error?.message || "Erro ao salvar subscrição." };
  }
}

/**
 * Remove uma subscrição Push pelo endpoint (quando o usuário desativa o aparelho).
 */
export async function removePushSubscriptionAction(
  endpoint: string,
): Promise<{ success: boolean }> {
  try {
    const admin = await requireAuth();

    const currentAdmin = await prisma.admin.findUnique({
      where: { id: admin.id },
      select: { dashboard_layout: true },
    });

    const currentLayout =
      currentAdmin?.dashboard_layout &&
      typeof currentAdmin.dashboard_layout === "object" &&
      !Array.isArray(currentAdmin.dashboard_layout)
        ? (currentAdmin.dashboard_layout as Record<string, any>)
        : {};

    const existingSubscriptions: PushSubscriptionItem[] = Array.isArray(
      currentLayout.push_subscriptions,
    )
      ? currentLayout.push_subscriptions
      : [];

    const updated = existingSubscriptions.filter((s) => s.endpoint !== endpoint);

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        dashboard_layout: {
          ...currentLayout,
          push_subscriptions: updated,
        } as any,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("[removePushSubscriptionAction] Erro:", error);
    return { success: false };
  }
}

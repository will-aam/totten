// app/admin/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "./_components/AdminSidebar/admin-sidebar";
import { getSubscriptionStatusAction } from "./_actions/get-subscription-status";
import { SubscriptionBlockedView } from "./_components/subscription-blocked-view";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  const isPlanPage = pathname.startsWith("/admin/plan");

  const [subscriptionState, setSubscriptionState] = useState<{
    isBlocked: boolean;
    status?: "TRIAL" | "ACTIVE" | "PAST_DUE" | "SUSPENDED" | "CANCELLED";
    reason?: string;
  } | null>(null);

  useEffect(() => {
    // Checa o status da assinatura em segundo plano
    getSubscriptionStatusAction().then((sub) => {
      setSubscriptionState({
        isBlocked: Boolean(sub.isBlocked),
        status: sub.status,
        reason: sub.reason,
      });
    }).catch(() => {
      // Em caso de falha de conexão temporária, não bloqueia
      setSubscriptionState({ isBlocked: false });
    });
  }, [pathname]);

  // Se for login, renderiza apenas o conteúdo (sem sidebar)
  if (isLogin) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  // Se estiver bloqueado e NÃO for a página de planos/regularização, exibe tela de bloqueio
  const shouldBlockAccess = subscriptionState?.isBlocked && !isPlanPage;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar isBlocked={subscriptionState?.isBlocked} />
        <SidebarInset className="flex flex-col flex-1">
          <main className="flex-1 overflow-y-auto custom-scrollbar">
            {shouldBlockAccess ? (
              <SubscriptionBlockedView
                reason={subscriptionState?.reason}
                status={subscriptionState?.status}
              />
            ) : (
              children
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

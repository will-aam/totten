// app/(private)/admin/finance/layout.tsx
"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import {
  Dashboard,
  ArrowRightLeft,
  CreditCard,
  Package,
  Wallet,
  LoaderDots, //  Adicionado para o estado de carregamento
} from "@boxicons/react";

const mobileNavItems = [
  { id: "/admin/finance/dashboard", label: "Dashboard", icon: Dashboard },
  { id: "/admin/finance/transactions", label: "Extrato", icon: ArrowRightLeft },
  { id: "/admin/finance/receivables", label: "A Receber", icon: Wallet },
  {
    id: "/admin/finance/payment-methods",
    label: "Pagamentos",
    icon: CreditCard,
  },
  { id: "/admin/packages", label: "Pacotes", icon: Package },
];

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  //  Pegando a sessão para verificar as permissões
  const { data: session, status } = useSession();

  //  LÓGICA DE PROTEÇÃO DE ROTA (RBAC)
  useEffect(() => {
    if (status === "loading") return; // Espera carregar

    const isOwner = session?.user?.role === "OWNER";
    const hasFinancePermission =
      session?.user?.permissions?.includes("FINANCE");

    // Se NÃO for Owner E NÃO tiver permissão de Finanças, expulsa para o Dashboard
    if (!isOwner && !hasFinancePermission) {
      router.replace("/admin/dashboard");
    }
  }, [session, status, router]);

  const hideBottomNavRoutes = ["/admin/finance/reports"];
  const shouldHideBottomNav = hideBottomNavRoutes.includes(pathname);

  //  Evita aquele "flash" na tela mostrando dados proibidos antes de redirecionar
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoaderDots className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  // Trava de segurança final na renderização
  const isOwner = session?.user?.role === "OWNER";
  const hasFinancePermission = session?.user?.permissions?.includes("FINANCE");
  if (!isOwner && !hasFinancePermission) {
    return null; // Retorna nulo enquanto o useEffect faz o redirecionamento
  }

  return (
    <>
      <div
        className={shouldHideBottomNav ? "w-full pb-6" : "w-full pb-24 md:pb-6"}
      >
        {children}
      </div>

      {!shouldHideBottomNav && (
        <div className="md:hidden">
          <MobileBottomNav
            items={mobileNavItems}
            activeId={pathname}
            onChange={(value) => router.push(value)}
          />
        </div>
      )}
    </>
  );
}

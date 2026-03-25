"use client";

import { usePathname, useRouter } from "next/navigation";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import {
  LayoutDashboard,
  ArrowRightLeft,
  CreditCard,
  Package,
  Wallet, // 🔥 Importamos o ícone novo aqui
} from "lucide-react";

// Menu inferior com as opções principais (agora com 5 itens)
const mobileNavItems = [
  { id: "/admin/finance/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "/admin/finance/transactions", label: "Extrato", icon: ArrowRightLeft },
  { id: "/admin/finance/receivables", label: "A Receber", icon: Wallet }, // 🔥 Nova rota adicionada
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

  // 🔥 LISTA DE ROTAS ONDE O MENU INFERIOR GERAL NÃO DEVE APARECER
  const hideBottomNavRoutes = ["/admin/finance/reports"];

  // Verifica se a rota atual está dentro da nossa lista de exceções
  const shouldHideBottomNav = hideBottomNavRoutes.includes(pathname);

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

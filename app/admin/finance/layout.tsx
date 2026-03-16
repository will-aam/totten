"use client";

import { usePathname, useRouter } from "next/navigation";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import {
  LayoutDashboard,
  ArrowRightLeft,
  CreditCard,
  Package,
  FileText,
} from "lucide-react";

// Usamos as próprias rotas como IDs para facilitar a navegação
const mobileNavItems = [
  { id: "/admin/finance/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "/admin/finance/transactions", label: "Extrato", icon: ArrowRightLeft },
  {
    id: "/admin/finance/payment-methods",
    label: "Pagamentos",
    icon: CreditCard,
  },
  { id: "/admin/finance/packages", label: "Pacotes", icon: Package },
  { id: "/admin/finance/reports", label: "Relatórios", icon: FileText },
];

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <>
      {/* O conteúdo da página (dashboard, extrato, etc) entra aqui.
        A classe pb-24 garante que no mobile o conteúdo não fique escondido atrás do menu.
        No desktop (md:pb-6), o espaçamento volta ao normal.
      */}
      <div className="w-full pb-24 md:pb-6">{children}</div>

      {/* Menu Mobile: 
        A div por fora com 'md:hidden' garante que este menu inferior 
        NUNCA apareça no desktop.
      */}
      <div className="md:hidden">
        <MobileBottomNav
          items={mobileNavItems}
          activeId={pathname}
          onChange={(value) => router.push(value)}
        />
      </div>
    </>
  );
}

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
      <div className="w-full pb-24 md:pb-6">{children}</div>
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

// app/admin/layout.tsx
"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  // Se for login, renderiza apenas o conteúdo (sem sidebar)
  if (isLogin) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  // Para as outras páginas do admin, usa o provedor da sidebar
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <main className="flex-1 overflow-y-auto custom-scrollbar">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

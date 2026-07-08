"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import {
  DashboardAlt,
  Lock,
  Wallet,
  Mobile,
  Database,
  CalendarDetail,
} from "@boxicons/react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

import { NavIcon } from "./nav-icon";
import { NavCollapsibleGroup } from "./nav-collapsible-group";
import { SidebarUserFooter } from "./sidebar-footer";
import {
  navItems,
  cadastrosSubItems,
  agendaSubItems,
  autoatendimentoSubItems,
  financeSubItems,
  type OpenModule,
} from "./nav-config";

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { setOpenMobile, isMobile } = useSidebar();
  const [loggingOut, setLoggingOut] = useState(false);
  const [openModule, setOpenModule] = useState<OpenModule>(null);

  const supportPhone = "5579998752198";
  const supportMessage = encodeURIComponent(
    "Olá! Preciso de ajuda com o sistema Totten.",
  );
  const whatsappUrl = `https://wa.me/${supportPhone}?text=${supportMessage}`;

  //  RECUPERANDO AS REGRAS DA SESSÃO
  const isOwner = session?.user?.role === "OWNER";
  const hasFinancePermission = session?.user?.permissions?.includes("FINANCE");
  const canViewFinance = isOwner || hasFinancePermission;

  useEffect(() => {
    if (cadastrosSubItems.some((i) => pathname.startsWith(i.href))) {
      setOpenModule("cadastros");
    } else if (agendaSubItems.some((i) => pathname.startsWith(i.href))) {
      setOpenModule("agenda");
    } else if (
      autoatendimentoSubItems.some(
        (i) => pathname.startsWith(i.href) && i.href !== "#",
      )
    ) {
      setOpenModule("autoatendimento");
    } else if (financeSubItems.some((i) => pathname.startsWith(i.href))) {
      setOpenModule("finance");
    }
  }, [pathname]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut({ callbackUrl: "/totem/idle" });
  };

  const closeMobile = () => setOpenMobile(false);

  const isCadastrosActive = cadastrosSubItems.some((i) =>
    pathname.startsWith(i.href),
  );
  const isAgendaActive = agendaSubItems.some((i) =>
    pathname.startsWith(i.href),
  );
  const isAutoActive = autoatendimentoSubItems.some((i) =>
    pathname.startsWith(i.href),
  );
  const isFinanceActive = financeSubItems.some((i) =>
    pathname.startsWith(i.href),
  );

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-3"
          onClick={closeMobile}
        >
          <div className="flex items-center justify-center shrink-0">
            {/* Logo exibida no TEMA CLARO */}
            <Image
              src="/totten.png"
              alt="Logo"
              width={36}
              height={36}
              className="object-contain dark:hidden block"
              priority
            />
            {/* Logo exibida no TEMA ESCURO */}
            <Image
              src="/totten-brac.png"
              alt="Logo"
              width={36}
              height={36}
              className="object-contain hidden dark:block"
              priority
            />
          </div>
          <h2 className="font-philosopher text-xl font-bold text-sidebar-foreground tracking-tight truncate">
            Totten
          </h2>
        </Link>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto [&::-webkit-scrollbar]:hidden">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 px-2">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/admin/dashboard")}
                  className="hover:bg-muted/50"
                >
                  <Link href="/admin/dashboard" onClick={closeMobile}>
                    <NavIcon
                      icon={DashboardAlt}
                      isActive={pathname.startsWith("/admin/dashboard")}
                    />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Cadastros (Apenas Owner) */}
              {isOwner && (
                <NavCollapsibleGroup
                  label="Cadastros"
                  icon={Database}
                  isOpen={openModule === "cadastros"}
                  onOpenChange={(open) =>
                    setOpenModule(open ? "cadastros" : null)
                  }
                  isActive={isCadastrosActive}
                  items={cadastrosSubItems}
                  pathname={pathname}
                  onNavigate={closeMobile}
                />
              )}

              {/* Demais itens do menu principal */}
              {navItems.map((item) => {
                //  Bloqueia se for exclusivo da dona
                if (item.ownerOnly && !isOwner) return null;

                //  Bloqueia se exigir uma permissão que a colaboradora não tem
                if (
                  item.permission &&
                  !isOwner &&
                  !session?.user?.permissions?.includes(item.permission)
                )
                  return null;

                const isActive = pathname.startsWith(item.href) && item.active;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild={item.active}
                      isActive={isActive}
                      className={cn(
                        "hover:bg-muted/50",
                        !item.active && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      {item.active ? (
                        <Link href={item.href} onClick={closeMobile}>
                          <NavIcon icon={item.icon} isActive={isActive} />
                          <span>{item.title}</span>
                        </Link>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <NavIcon icon={item.icon} isActive={false} />
                            <span>{item.title}</span>
                          </div>
                          <Lock size="xs" className="opacity-50" />
                        </div>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* MÓDULOS */}
        <SidebarGroup className="mt-0.5">
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 px-2">
            Módulos
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Módulo: Agenda - Todos veem */}
              <NavCollapsibleGroup
                label="Gestão de Agenda"
                icon={CalendarDetail}
                isOpen={openModule === "agenda"}
                onOpenChange={(open) => setOpenModule(open ? "agenda" : null)}
                isActive={isAgendaActive}
                items={agendaSubItems}
                pathname={pathname}
                onNavigate={closeMobile}
              />

              {/* Módulo: Autoatendimento - Apenas Owner */}
              {isOwner && (
                <NavCollapsibleGroup
                  label="Autoatendimento"
                  icon={Mobile}
                  isOpen={openModule === "autoatendimento"}
                  onOpenChange={(open) =>
                    setOpenModule(open ? "autoatendimento" : null)
                  }
                  isActive={isAutoActive}
                  items={autoatendimentoSubItems}
                  pathname={pathname}
                  onNavigate={closeMobile}
                />
              )}

              {/* Módulo: Financeiro - Owner OU Colaborador com Permissão */}
              {canViewFinance &&
                (isMobile ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isFinanceActive}
                      className="hover:bg-muted/50"
                    >
                      <Link
                        href="/admin/finance/dashboard"
                        onClick={closeMobile}
                      >
                        <div className="flex items-center gap-2">
                          <NavIcon icon={Wallet} isActive={isFinanceActive} />
                          <span>Financeiro</span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : (
                  <NavCollapsibleGroup
                    label="Financeiro"
                    icon={Wallet}
                    isOpen={openModule === "finance"}
                    onOpenChange={(open) =>
                      setOpenModule(open ? "finance" : null)
                    }
                    isActive={isFinanceActive}
                    items={financeSubItems}
                    pathname={pathname}
                    onNavigate={closeMobile}
                  />
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarUserFooter
        isOwner={isOwner}
        userEmail={session?.user?.email}
        whatsappUrl={whatsappUrl}
        loggingOut={loggingOut}
        onLogout={handleLogout}
        onNavigate={closeMobile}
      />
    </Sidebar>
  );
}

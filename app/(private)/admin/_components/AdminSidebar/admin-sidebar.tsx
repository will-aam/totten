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
  ListPlus,
  Archive,
  Trophy,
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
  registrosSubItems,
  autoatendimentoSubItems,
  financeSubItems,
  type OpenModule,
} from "./nav-config";

type Gated = { ownerOnly?: boolean; permission?: string };

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

  // Regras vindas da sessão
  const isOwner = session?.user?.role === "OWNER";
  const permissions: string[] = session?.user?.permissions ?? [];
  const canViewFinance = isOwner || permissions.includes("FINANCE");

  // Uma única regra de acesso para todo item de menu
  const canAccess = (item: Gated) => {
    if (isOwner) return true;
    if (item.ownerOnly) return false;
    if (item.permission && !permissions.includes(item.permission)) return false;
    return true;
  };

  const visibleCadastros = cadastrosSubItems.filter(canAccess);
  const visibleRegistros = registrosSubItems.filter(canAccess);
  const visibleAuto = autoatendimentoSubItems.filter(canAccess);
  const visibleFinance = financeSubItems.filter(canAccess);

  const hasModules = isOwner || canViewFinance;

  useEffect(() => {
    if (cadastrosSubItems.some((i) => pathname.startsWith(i.href))) {
      setOpenModule("cadastros");
    } else if (registrosSubItems.some((i) => pathname.startsWith(i.href))) {
      setOpenModule("registros");
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
  const isRegistrosActive = registrosSubItems.some((i) =>
    pathname.startsWith(i.href),
  );
  const isAutoActive = autoatendimentoSubItems.some((i) =>
    pathname.startsWith(i.href),
  );
  const isFinanceActive = financeSubItems.some((i) =>
    pathname.startsWith(i.href),
  );

  return (
    <Sidebar
      collapsible="icon"
      // `group-data-[side=left]:border-r-0` vence o border-r padrão do shadcn,
      // que é o que desenha a linha vertical entre sidebar e conteúdo.
      className="border-none group-data-[side=left]:border-r-0 group-data-[side=right]:border-l-0"
    >
      <SidebarHeader className="py-4 group-data-[collapsible=icon]:py-4 px-4 group-data-[collapsible=icon]:px-0 border-none">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center"
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
          <h2 className="font-philosopher text-xl font-bold text-sidebar-foreground tracking-tight truncate group-data-[collapsible=icon]:hidden">
            Totten
          </h2>
        </Link>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto [&::-webkit-scrollbar]:hidden">
        {/* MENU PRINCIPAL: dia a dia → cadastros → registros */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 px-2 mt-2">
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

              {/* Itens do dia a dia (Agenda, Confirmações, Aniversariantes...) */}
              {navItems.filter(canAccess).map((item) => {
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

              {/* Cadastros */}
              {isOwner && visibleCadastros.length > 0 && (
                <NavCollapsibleGroup
                  label="Cadastros"
                  icon={ListPlus}
                  isOpen={openModule === "cadastros"}
                  onOpenChange={(open) =>
                    setOpenModule(open ? "cadastros" : null)
                  }
                  isActive={isCadastrosActive}
                  items={visibleCadastros}
                  pathname={pathname}
                  onNavigate={closeMobile}
                />
              )}

              {/* Registros */}
              {visibleRegistros.length > 0 && (
                <NavCollapsibleGroup
                  label="Registros"
                  icon={Archive}
                  isOpen={openModule === "registros"}
                  onOpenChange={(open) =>
                    setOpenModule(open ? "registros" : null)
                  }
                  isActive={isRegistrosActive}
                  items={visibleRegistros}
                  pathname={pathname}
                  onNavigate={closeMobile}
                />
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* MÓDULOS: financeiro → autoatendimento → fidelidade */}
        {hasModules && (
          <SidebarGroup className="mt-0.5">
            <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 px-2">
              Módulos
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* Financeiro — Owner OU colaborador com permissão */}
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
                      items={visibleFinance}
                      pathname={pathname}
                      onNavigate={closeMobile}
                    />
                  ))}

                {/* Autoatendimento — Apenas Owner */}
                {isOwner && (
                  <NavCollapsibleGroup
                    label="Autoatendimento"
                    icon={Mobile}
                    isOpen={openModule === "autoatendimento"}
                    onOpenChange={(open) =>
                      setOpenModule(open ? "autoatendimento" : null)
                    }
                    isActive={isAutoActive}
                    items={visibleAuto}
                    pathname={pathname}
                    onNavigate={closeMobile}
                  />
                )}

                {/* Programa de Fidelidade — Apenas Owner */}
                {isOwner && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith("/admin/loyalty")}
                      className="hover:bg-muted/50"
                    >
                      <Link href="/admin/loyalty" onClick={closeMobile}>
                        <div className="flex items-center gap-2">
                          <NavIcon
                            icon={Trophy}
                            isActive={pathname.startsWith("/admin/loyalty")}
                          />
                          <span>Programa de Fidelidade</span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* "Meu Plano" agora mora no menu do usuário (rodapé) */}
      <SidebarUserFooter
        isOwner={isOwner}
        whatsappUrl={whatsappUrl}
        loggingOut={loggingOut}
        onLogout={handleLogout}
        onNavigate={closeMobile}
        userImage={session?.user?.photoUrl}
        userName={session?.user?.name}
      />
    </Sidebar>
  );
}
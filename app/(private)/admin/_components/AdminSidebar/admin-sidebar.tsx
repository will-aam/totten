"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import {
  GridCircleDiagonalLeft,
  Lock,
  Wallet,
  Mobile,
  Cloud,
  Shield,
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

import { NavIcon } from "./nav-icon";
import { NavCollapsibleGroup } from "./nav-collapsible-group";
import { SidebarUserFooter } from "./sidebar-footer";
import {
  navItems,
  cadastrosSubItems,
  autoatendimentoSubItems,
  financeSubItems,
  termosSubItems,
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
    } else if (
      autoatendimentoSubItems.some(
        (i) => pathname.startsWith(i.href) && i.href !== "#",
      )
    ) {
      setOpenModule("autoatendimento");
    } else if (financeSubItems.some((i) => pathname.startsWith(i.href))) {
      setOpenModule("finance");
    } else if (termosSubItems.some((i) => pathname.startsWith(i.href))) {
      setOpenModule("termos");
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
  const isAutoActive = autoatendimentoSubItems.some((i) =>
    pathname.startsWith(i.href),
  );
  const isFinanceActive = financeSubItems.some((i) =>
    pathname.startsWith(i.href),
  );
  const isTermosActive = termosSubItems.some((i) =>
    pathname.startsWith(i.href),
  );

  // Rota fixa do sub-item de Agendamento
  const remindersHref = "/admin/reminders";
  const isRemindersActive = pathname.startsWith(remindersHref);

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
                      icon={GridCircleDiagonalLeft}
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
                  icon={Cloud}
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

                // 👇 Agendamento ganha um sub-item FIXO (Confirmações Manuais),
                // sem colapsar/expandir — sempre visível, com a linha de hierarquia.
                if (item.title === "Agendamento") {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className="hover:bg-muted/50"
                      >
                        <Link href={item.href} onClick={closeMobile}>
                          <NavIcon icon={item.icon} isActive={isActive} />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>

                      <div className="mx-3.5 my-0.5 flex items-stretch">
                        {/* Conector curvo: desce e curva à direita até o item */}
                        <div className="relative w-3 shrink-0">
                          <span className="absolute left-0 top-0 h-4 w-3 rounded-bl-lg border-b border-l border-sidebar-border" />
                        </div>

                        <SidebarMenuSubButton
                          asChild
                          isActive={isRemindersActive}
                          className="flex-1 pl-1"
                        >
                          <Link href={remindersHref} onClick={closeMobile}>
                            <span>Confirmações Manuais</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </div>
                    </SidebarMenuItem>
                  );
                }

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
              {/* Módulo: Termos de Uso - Apenas Owner */}
              {isOwner && (
                <NavCollapsibleGroup
                  label="Termos de Uso"
                  icon={Shield}
                  isOpen={openModule === "termos"}
                  onOpenChange={(open) => setOpenModule(open ? "termos" : null)}
                  isActive={isTermosActive}
                  items={termosSubItems}
                  pathname={pathname}
                  onNavigate={closeMobile}
                />
              )}

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

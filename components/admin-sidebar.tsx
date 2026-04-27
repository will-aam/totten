// components/admin-sidebar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import {
  NoteBook,
  Group,
  ClipboardDetail,
  Cog,
  Power,
  CalendarDetail,
  Wallet,
  Lock,
  HeadphoneMic,
  Bell,
  User,
  ChevronRight,
  Medal,
  LinkAlt,
  LoaderDots,
  Note,
  Database,
  Mobile,
} from "@boxicons/react";
import type { BoxIconProps } from "@boxicons/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

type BoxIcon = React.ForwardRefExoticComponent<
  BoxIconProps & React.RefAttributes<SVGSVGElement>
>;

// Componente auxiliar que troca de pack com transição suave
function NavIcon({
  icon: Icon,
  isActive,
  size = "sm",
  className,
}: {
  icon: BoxIcon;
  isActive: boolean;
  size?: BoxIconProps["size"];
  className?: string;
}) {
  return (
    <span className="relative flex items-center justify-center transition-all duration-300">
      {/* Ícone outline — some quando ativo */}
      <Icon
        size={size}
        pack="basic"
        className={cn(
          "absolute transition-all duration-300",
          isActive ? "opacity-0 scale-75" : "opacity-100 scale-100",
          className,
        )}
      />
      {/* Ícone filled — aparece quando ativo */}
      <Icon
        size={size}
        pack="filled"
        className={cn(
          "transition-all duration-300",
          isActive ? "opacity-100 scale-100" : "opacity-0 scale-75",
          className,
        )}
      />
    </span>
  );
}

const navItems = [
  {
    title: "Agendamento",
    href: "/admin/agenda",
    icon: CalendarDetail as BoxIcon,
    active: true,
  },
  {
    title: "Histórico Check-in",
    href: "/admin/history",
    icon: ClipboardDetail as BoxIcon,
    active: true,
  },
  {
    title: "Vouchers",
    href: "/admin/vouchers",
    icon: Medal as BoxIcon,
    active: true,
  },
  {
    title: "Notas",
    href: "/admin/notes",
    icon: Note as BoxIcon,
    active: true,
  },
];

const cadastrosSubItems = [
  { title: "Clientes", href: "/admin/clients", active: true },
  { title: "Serviços", href: "/admin/services", active: true },
  { title: "Fichas de Anamnese", href: "/admin/anamnesis", active: true },
  { title: "Estoque", href: "/admin/stock", active: true },
];

const agendaSubItems = [
  { title: "Calendário Diário", href: "/admin/agenda/calendar", active: false },
  { title: "Confirmações Manuais", href: "/admin/reminders", active: true },
];

const autoatendimentoSubItems = [
  { title: "Dashboard", href: "/admin/auto/dashboard", active: false },
  {
    title: "Solicitações Pendentes",
    href: "/admin/auto/requests",
    active: false,
  },
  { title: "Link Bio", href: "/admin/link-bio", icon: LinkAlt, active: false },
  { title: "WhatsApp Automático", href: "/admin/whatsapp-auto", active: false },
  { title: "Regras e Horários", href: "/admin/auto/rules", active: false },
];

const financeSubItems = [
  { title: "Dashboard", href: "/admin/finance/dashboard", active: true },
  { title: "Extrato", href: "/admin/finance/transactions", active: true },
  {
    title: "Meios de Pagamento",
    href: "/admin/finance/payment-methods",
    active: true,
  },
  { title: "Pacotes e Planos", href: "/admin/packages", active: true },
];

type OpenModule = "cadastros" | "agenda" | "autoatendimento" | "finance" | null;

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { setOpenMobile, isMobile } = useSidebar();
  const [clinicName, setClinicName] = useState("Totten");
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [openModule, setOpenModule] = useState<OpenModule>(null);

  const supportPhone = "5579998752198";
  const supportMessage = encodeURIComponent(
    "Olá! Preciso de ajuda com o sistema Totten.",
  );
  const whatsappUrl = `https://wa.me/${supportPhone}?text=${supportMessage}`;

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

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings/public");
        if (res.ok) {
          const data = await res.json();
          setClinicName(data.tradeName || "Totten");
        }
      } catch (error) {
        console.error("Erro ao buscar configurações:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut({ redirect: false });
      router.push("/totem/idle");
    } catch (error) {
      console.error("Erro ao sair:", error);
      setLoggingOut(false);
    }
  };

  // Helpers de isActive por módulo
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
          onClick={() => setOpenMobile(false)}
        >
          <div className="flex h-9 w-9 items-center justify-center shrink-0 bg-white rounded-full">
            <Image
              src="/totten.png"
              alt="Logo"
              width={36}
              height={36}
              className="rounded-full object-cover"
              priority
            />
          </div>
          {loading ? (
            <div className="flex items-center gap-2">
              <LoaderDots size="sm" className="text-primary" />
            </div>
          ) : (
            <h2 className="font-inter text-xl font-bold text-sidebar-foreground tracking-tight truncate">
              {clinicName}
            </h2>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto [&::-webkit-scrollbar]:hidden">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 px-2">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Resumo Diário */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/admin/dashboard")}
                  className="hover:bg-muted/50"
                >
                  <Link
                    href="/admin/dashboard"
                    onClick={() => setOpenMobile(false)}
                  >
                    <NavIcon
                      icon={NoteBook}
                      isActive={pathname.startsWith("/admin/dashboard")}
                    />
                    <span>Resumo Diário</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Cadastros (Collapsible) */}
              <Collapsible
                asChild
                className="group/collapsible w-full"
                open={openModule === "cadastros"}
                onOpenChange={(open) =>
                  setOpenModule(open ? "cadastros" : null)
                }
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={isCadastrosActive}
                      className="hover:bg-muted/50"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <NavIcon
                            icon={Database}
                            isActive={isCadastrosActive}
                          />
                          <span>Cadastros</span>
                        </div>
                        <ChevronRight
                          size="xs"
                          className="text-muted-foreground/50 transition-transform group-data-[state=open]/collapsible:rotate-90"
                        />
                      </div>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="border-l border-border ml-4 mt-1">
                      {cadastrosSubItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild={subItem.active}
                            isActive={
                              pathname.startsWith(subItem.href) &&
                              subItem.active
                            }
                            className={cn(
                              "py-2",
                              !subItem.active &&
                                "opacity-50 cursor-not-allowed",
                            )}
                          >
                            {subItem.active ? (
                              <Link
                                href={subItem.href}
                                onClick={() => setOpenMobile(false)}
                              >
                                <span className="text-xs">{subItem.title}</span>
                              </Link>
                            ) : (
                              <div className="flex items-center justify-between w-full">
                                <span className="text-xs">{subItem.title}</span>
                                <Lock size="xs" className="opacity-50" />
                              </div>
                            )}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Demais itens do menu principal */}
              {navItems.map((item) => {
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
                        <Link
                          href={item.href}
                          onClick={() => setOpenMobile(false)}
                        >
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

        <SidebarGroup className="mt-0.5">
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 px-2">
            Módulos
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Módulo: Agenda */}
              <Collapsible
                asChild
                className="group/collapsible w-full"
                open={openModule === "agenda"}
                onOpenChange={(open) => setOpenModule(open ? "agenda" : null)}
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={isAgendaActive}
                      className="hover:bg-muted/50"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <NavIcon
                            icon={CalendarDetail}
                            isActive={isAgendaActive}
                          />
                          <span>Agenda</span>
                        </div>
                        <ChevronRight
                          size="xs"
                          className="text-muted-foreground/50 transition-transform group-data-[state=open]/collapsible:rotate-90"
                        />
                      </div>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="border-l border-border ml-4 mt-1">
                      {agendaSubItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild={subItem.active}
                            isActive={
                              pathname.startsWith(subItem.href) &&
                              subItem.active
                            }
                            className={cn(
                              "py-2",
                              !subItem.active &&
                                "opacity-50 cursor-not-allowed",
                            )}
                          >
                            {subItem.active ? (
                              <Link
                                href={subItem.href}
                                onClick={() => setOpenMobile(false)}
                              >
                                <span className="text-xs">{subItem.title}</span>
                              </Link>
                            ) : (
                              <div className="flex items-center justify-between w-full">
                                <span className="text-xs">{subItem.title}</span>
                                <Lock size="xs" className="opacity-50" />
                              </div>
                            )}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Módulo: Autoatendimento */}
              <Collapsible
                asChild
                className="group/collapsible w-full"
                open={openModule === "autoatendimento"}
                onOpenChange={(open) =>
                  setOpenModule(open ? "autoatendimento" : null)
                }
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={isAutoActive}
                      className="hover:bg-muted/50"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <NavIcon icon={Mobile} isActive={isAutoActive} />
                          <span>Autoatendimento</span>
                        </div>
                        <ChevronRight
                          size="xs"
                          className="text-muted-foreground/50 transition-transform group-data-[state=open]/collapsible:rotate-90"
                        />
                      </div>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="border-l border-border ml-4 mt-1">
                      {autoatendimentoSubItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild={subItem.active}
                            isActive={
                              pathname.startsWith(subItem.href) &&
                              subItem.active
                            }
                            className={cn(
                              "py-2",
                              !subItem.active &&
                                "opacity-50 cursor-not-allowed",
                            )}
                          >
                            {subItem.active ? (
                              <Link
                                href={subItem.href}
                                onClick={() => setOpenMobile(false)}
                              >
                                <span className="text-xs">{subItem.title}</span>
                              </Link>
                            ) : (
                              <div className="flex items-center justify-between w-full">
                                <span className="text-xs">{subItem.title}</span>
                                <Lock size="xs" className="opacity-50" />
                              </div>
                            )}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Módulo: Financeiro */}
              {isMobile ? (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isFinanceActive}
                    className="hover:bg-muted/50"
                  >
                    <Link
                      href="/admin/finance/dashboard"
                      onClick={() => setOpenMobile(false)}
                    >
                      <div className="flex items-center gap-2">
                        <NavIcon icon={Wallet} isActive={isFinanceActive} />
                        <span>Financeiro</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                <Collapsible
                  asChild
                  className="group/collapsible w-full"
                  open={openModule === "finance"}
                  onOpenChange={(open) =>
                    setOpenModule(open ? "finance" : null)
                  }
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        isActive={isFinanceActive}
                        className="hover:bg-muted/50"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <NavIcon icon={Wallet} isActive={isFinanceActive} />
                            <span>Financeiro</span>
                          </div>
                          <ChevronRight
                            size="xs"
                            className="text-muted-foreground/50 transition-transform group-data-[state=open]/collapsible:rotate-90"
                          />
                        </div>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub className="border-l border-border ml-4 mt-1">
                        {financeSubItems.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild={subItem.active}
                              isActive={
                                pathname.startsWith(subItem.href) &&
                                subItem.active
                              }
                              className={cn(
                                "py-2",
                                !subItem.active &&
                                  "opacity-50 cursor-not-allowed",
                              )}
                            >
                              {subItem.active ? (
                                <Link
                                  href={subItem.href}
                                  onClick={() => setOpenMobile(false)}
                                >
                                  <span className="text-xs">
                                    {subItem.title}
                                  </span>
                                </Link>
                              ) : (
                                <div className="flex items-center justify-between w-full">
                                  <span className="text-xs">
                                    {subItem.title}
                                  </span>
                                  <Lock size="xs" className="opacity-50" />
                                </div>
                              )}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User size="sm" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-none mb-1">
                Administrador
              </span>
              <span className="text-[10px] text-muted-foreground leading-none truncate max-w-35">
                {session?.user?.email || "admin@totten.com"}
              </span>
            </div>
          </div>
          <button className="relative p-2 text-muted-foreground hover:bg-muted rounded-full transition-all">
            <Bell size="sm" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
          </button>
        </div>

        <div className="h-px bg-border/50 w-full" />

        <div className="flex w-full items-center gap-1">
          <SidebarMenuButton
            asChild
            tooltip="Suporte"
            className="flex-1 justify-center bg-transparent hover:bg-transparent text-muted-foreground hover:text-primary"
          >
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <HeadphoneMic size="sm" />
            </a>
          </SidebarMenuButton>

          <SidebarMenuButton
            asChild
            tooltip="Configurações"
            className="flex-1 justify-center bg-transparent hover:bg-transparent"
          >
            <Link href="/admin/settings" onClick={() => setOpenMobile(false)}>
              <Cog size="sm" />
            </Link>
          </SidebarMenuButton>

          <SidebarMenuButton
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex-2 justify-center text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            {loggingOut ? (
              <LoaderDots size="sm" className="animate-spin" />
            ) : (
              <Power size="sm" />
            )}
            <span>Sair</span>
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

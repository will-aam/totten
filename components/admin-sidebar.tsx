// components/admin-sidebar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Settings,
  LogOut,
  CalendarDays,
  Wallet,
  Lock,
  Headset,
  Bell,
  User,
  ChevronRight,
  UserCog,
  Award,
  Link2,
  ShelvingUnit,
  Loader2,
  FileText,
} from "lucide-react";
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

const navItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    active: true,
  },
  { title: "Clientes", href: "/admin/clients", icon: Users, active: true },
  { title: "Serviços", href: "/admin/services", icon: UserCog, active: true },
  {
    title: "Agendamento",
    href: "/admin/agenda",
    icon: CalendarDays,
    active: true,
  },
  {
    title: "Histórico Check-in",
    href: "/admin/history",
    icon: ClipboardList,
    active: true,
  },
  { title: "Vouchers", href: "/admin/vouchers", icon: Award, active: true },
  { title: "Estoque", href: "#", icon: ShelvingUnit, active: false },
  { title: "Link na Bio", href: "/admin/link-bio", icon: Link2, active: false },
  {
    title: "Fichas de Anamnese",
    href: "#",
    icon: FileText,
    active: false,
  },
];

const agendaSubItems = [
  { title: "Agendamentos Recorrentes", href: "/admin/recurring", active: true },
  { title: "Confirmações e Lembretes", href: "/admin/reminders", active: true },
  { title: "Bloqueio de Horário", href: "#", active: false },
  { title: "Lista de Espera", href: "#", active: false },
];

const financeSubItems = [
  { title: "Dashboard", href: "/admin/finance/dashboard", active: true },
  { title: "Extrato", href: "/admin/finance/transactions", active: true },
  {
    title: "Meios de Pagamento",
    href: "/admin/finance/payment-methods",
    active: true,
  },
  {
    title: "Pacotes e Planos",
    href: "/admin/finance/packages",
    active: true,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { setOpenMobile, isMobile } = useSidebar();
  const [clinicName, setClinicName] = useState("Totten");
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [openModule, setOpenModule] = useState<"agenda" | "finance" | null>(
    null,
  );

  const supportPhone = "5579998752198";
  const supportMessage = encodeURIComponent(
    "Olá! Preciso de ajuda com o sistema Totten.",
  );
  const whatsappUrl = `https://wa.me/${supportPhone}?text=${supportMessage}`;

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
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
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
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild={item.active}
                    isActive={pathname.startsWith(item.href) && item.active}
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
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </div>
                        <Lock className="h-3 w-3 opacity-50" />
                      </div>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-0.5">
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 px-2">
            Módulos
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible
                asChild
                className="group/collapsible w-full"
                open={openModule === "agenda"}
                onOpenChange={(open) => setOpenModule(open ? "agenda" : null)}
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="hover:bg-muted/50">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          <span>Agenda</span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-muted-foreground/50 transition-transform group-data-[state=open]/collapsible:rotate-90" />
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
                                <Lock className="h-2.5 w-2.5 opacity-50" />
                              </div>
                            )}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {isMobile ? (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith("/admin/finance")}
                    className="hover:bg-muted/50"
                  >
                    <Link
                      href="/admin/finance/dashboard"
                      onClick={() => setOpenMobile(false)}
                    >
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
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
                      <SidebarMenuButton className="hover:bg-muted/50">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4" />
                            <span>Financeiro</span>
                          </div>
                          <ChevronRight className="h-3 w-3 text-muted-foreground/50 transition-transform group-data-[state=open]/collapsible:rotate-90" />
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
                                  <Lock className="h-2.5 w-2.5 opacity-50" />
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
              <User className="h-4 w-4" strokeWidth={2.5} />
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
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
          </button>
        </div>

        <div className="h-px bg-border/50 w-full" />

        {/* Linha unificada: Suporte, Configurações e Sair */}
        <div className="flex w-full items-center gap-1">
          {/* Botão Suporte (Apenas ícone) */}
          <SidebarMenuButton
            asChild
            tooltip="Suporte"
            className="flex-1 justify-center bg-transparent hover:bg-transparent text-muted-foreground hover:text-primary"
          >
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Headset className="h-4 w-4" />
            </a>
          </SidebarMenuButton>

          {/* Botão Configurações (Apenas ícone) */}
          <SidebarMenuButton
            asChild
            tooltip="Configurações"
            className="flex-1 justify-center bg-transparent hover:bg-transparent"
          >
            <Link href="/admin/settings" onClick={() => setOpenMobile(false)}>
              <Settings className="h-4 w-4" />
            </Link>
          </SidebarMenuButton>

          {/* Botão Sair (Ícone + Texto) */}
          <SidebarMenuButton
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex-2 justify-center text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            {loggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            <span>Sair</span>
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

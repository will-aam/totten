"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Bird,
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
  Loader2,
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

// 🔥 Menu principal atualizado (Agendamento adicionado após Serviços)
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
  { title: "Link na Bio", href: "/admin/link-bio", icon: Link2, active: false }, // 🔒 BLOQUEADO
];

// 🔥 Sub-itens da Agenda (Lembretes ATIVADO!)
const agendaSubItems = [
  { title: "Agendamentos Recorrentes", href: "/admin/recurring", active: true },
  { title: "Confirmações e Lembretes", href: "/admin/reminders", active: true },
  { title: "Bloqueio de Horário", href: "#", active: false },
  { title: "Lista de Espera", href: "#", active: false },
  { title: "Fichas de Anamnese", href: "#", active: false },
];

const financeSubItems = [
  {
    title: "Pacotes e Planos",
    href: "/admin/packages",
    active: true,
  },
  { title: "Dashboard Financeiro", href: "#", active: false },
  { title: "Títulos a Receber", href: "#", active: false },
  { title: "Meios de Pagamento", href: "#", active: false },
  { title: "Gestão de Comissões", href: "#", active: false },
  { title: "Despesas", href: "#", active: false },
  { title: "Relatórios", href: "#", active: false },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { setOpenMobile } = useSidebar();
  const [clinicName, setClinicName] = useState("Totten");
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

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
          setClinicName(data.tradeName);
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
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Bird className="h-5 w-5" />
          </div>
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          ) : (
            <h2 className="font-inter text-xl font-bold text-sidebar-foreground tracking-tight">
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
                <SidebarMenuItem key={item.href}>
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

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 px-2">
            Módulos
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Agenda */}
              <Collapsible asChild className="group/collapsible w-full">
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

              {/* Financeiro */}
              <Collapsible asChild className="group/collapsible w-full">
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t flex flex-col gap-4">
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
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="hover:text-primary">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <Headset className="h-4 w-4" />
                <span>Suporte</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="mt-1">
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/admin/settings")}
            >
              <Link href="/admin/settings" onClick={() => setOpenMobile(false)}>
                <Settings className="h-4 w-4" />
                <span>Configurações</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="mt-1">
            <SidebarMenuButton
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              {loggingOut ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saindo...</span>
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

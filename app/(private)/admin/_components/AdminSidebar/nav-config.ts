import {
  Group,
  ClipboardDetail,
  Ticket,
  Note,
  Gift,
  CalendarDetail,
  LinkAlt,
} from "@boxicons/react";
import type { BoxIcon } from "./nav-icon";

export type NavItem = {
  title: string;
  href: string;
  icon: BoxIcon;
  active: boolean;
  ownerOnly?: boolean;
  permission?: string;
};

export type SubNavItem = {
  title: string;
  href: string;
  active: boolean;
  icon?: BoxIcon;
};

export type OpenModule =
  | "cadastros"
  | "agenda"
  | "autoatendimento"
  | "finance"
  | "termos"
  | null;

export const termosSubItems: SubNavItem[] = [
  { title: "Criar/Editar Termo", href: "/admin/termos/editor", active: false },
  {
    title: "Ver Assinaturas",
    href: "/admin/termos/assinaturas",
    active: false,
  },
  {
    title: "Status",
    href: "/admin/termos/status",
    active: false,
  },
  {
    title: "Data/Hora e Histórico",
    href: "/admin/termos/historico",
    active: false,
  },
];
export const navItems: NavItem[] = [
  {
    title: "Agendamento",
    href: "/admin/agenda",
    icon: CalendarDetail as BoxIcon,
    active: true,
  },
  {
    title: "Profissionais",
    href: "/admin/team",
    icon: Group as BoxIcon,
    active: true,
    ownerOnly: true, // Apenas a administradora (Owner) vê
  },
  {
    title: "Histórico Check-in",
    href: "/admin/history",
    icon: ClipboardDetail as BoxIcon,
    active: true,
    permission: "HISTORY", //  Depende dessa permissão específica
  },
  {
    title: "Vouchers",
    href: "/admin/vouchers",
    icon: Ticket as BoxIcon,
    active: true,
    ownerOnly: true,
  },
  {
    title: "Notas",
    href: "/admin/notes",
    icon: Note as BoxIcon,
    active: true,
    ownerOnly: true,
  },
  {
    title: "Aniversariantes",
    href: "/admin/birthdays",
    icon: Gift as BoxIcon,
    active: true,
  },
];

export const cadastrosSubItems: SubNavItem[] = [
  { title: "Clientes", href: "/admin/clients", active: true },
  { title: "Estoque", href: "/admin/stock", active: true },
  { title: "Serviços e Pacotes", href: "/admin/services", active: true },
  { title: "Fichas de Anamnese", href: "/admin/anamnesis", active: true },
];

export const agendaSubItems: SubNavItem[] = [
  { title: "Calendário Diário", href: "/admin/agenda/calendar", active: false },
  { title: "Confirmações Manuais", href: "/admin/reminders", active: true },
];

export const autoatendimentoSubItems: SubNavItem[] = [
  { title: "Dashboard", href: "/admin/auto/dashboard", active: false },
  {
    title: "Solicitações Pendentes",
    href: "/admin/auto/requests",
    active: false,
  },
  {
    title: "Link Bio",
    href: "/admin/link-bio",
    icon: LinkAlt as BoxIcon,
    active: false,
  },
  { title: "WhatsApp Automático", href: "/admin/whatsapp-auto", active: false },
  { title: "Regras e Horários", href: "/admin/auto/rules", active: false },
];

export const financeSubItems: SubNavItem[] = [
  { title: "Dashboard", href: "/admin/finance/dashboard", active: true },
  { title: "Extrato", href: "/admin/finance/transactions", active: true },
  {
    title: "Meios de Pagamento",
    href: "/admin/finance/payment-methods",
    active: true,
  },
  { title: "Pacotes e Planos", href: "/admin/packages", active: true },
];

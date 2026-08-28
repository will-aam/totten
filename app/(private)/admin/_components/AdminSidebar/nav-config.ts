import {
  Group,
  ClipboardDetail,
  Tickets,
  Note,
  Gift,
  CalendarDetail,
  LinkAlt,
  Layers,
  ClipboardCheck,
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
  ownerOnly?: boolean;
};

export type OpenModule =
  | "cadastros"
  | "autoatendimento"
  | "finance"
  | null;

export const navItems: NavItem[] = [
  {
    title: "Agenda",
    href: "/admin/agenda",
    icon: CalendarDetail as BoxIcon,
    active: true,
  },
  {
    title: "Confirmações Manuais",
    href: "/admin/reminders",
    icon: ClipboardCheck as BoxIcon,
    active: true,
  },
  {
    title: "Pacotes e Planos",
    href: "/admin/packages",
    icon: Layers as BoxIcon,
    active: true,
    permission: "FINANCE", // mantém a mesma regra de acesso de antes (owner ou permissão FINANCE) — remova essa linha se quiser liberar geral
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
    icon: Tickets as BoxIcon,
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
  { 
    title: "Profissionais", 
    href: "/admin/team", 
    active: true,
    ownerOnly: true, 
  },
];

export const autoatendimentoSubItems: SubNavItem[] = [
  { title: "Dashboard", href: "/admin/auto/dashboard", active: false },
  {
    title: "Solicitações Pendentes",
    href: "/admin/auto/requests",
    active: false,
  },
  {
    title: "Página Personalizada",
    href: "/admin/custom-page",
    icon: LinkAlt as BoxIcon,
    active: true,
  },
  { title: "WhatsApp Automático", href: "/admin/whatsapp-auto", active: false },
  { title: "Configurar Horários", href: "/admin/self-service", active: true },
];

export const financeSubItems: SubNavItem[] = [
  { title: "Dashboard", href: "/admin/finance/dashboard", active: true },
  { title: "Extrato", href: "/admin/finance/transactions", active: true },
  {
    title: "Meios de Pagamento",
    href: "/admin/finance/payment-methods",
    active: true,
  },
];

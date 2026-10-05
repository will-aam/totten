import {
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
  permission?: string;
};

export type OpenModule =
  | "cadastros"
  | "registros"
  | "autoatendimento"
  | "finance"
  | null;

/**
 * Menu Principal — do dia a dia da recepção:
 * agenda → confirmações → aniversariantes → anotações → pacotes.
 * (Dashboard, Cadastros e Registros são renderizados direto na sidebar.)
 */
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
    title: "Aniversariantes",
    href: "/admin/birthdays",
    icon: Gift as BoxIcon,
    active: true,
  },
  {
    title: "Notas",
    href: "/admin/manual-notes",
    icon: Note as BoxIcon,
    active: true,
  },
  {
    title: "Gestão de Pacotes",
    href: "/admin/packages",
    icon: Layers as BoxIcon,
    active: true,
    permission: "FINANCE", // mantém a mesma regra de acesso de antes (owner ou permissão FINANCE) — remova essa linha se quiser liberar geral
  },
];

/** Cadastros — pessoas primeiro, depois o catálogo e o estoque. */
export const cadastrosSubItems: SubNavItem[] = [
  { title: "Clientes", href: "/admin/clients", active: true },
  { title: "Fichas de Anamnese", href: "/admin/anamnesis", active: true },
  {
    title: "Profissionais",
    href: "/admin/team",
    active: true,
    ownerOnly: true,
  },
  { title: "Serviços e Pacotes", href: "/admin/services", active: true },
  { title: "Estoque", href: "/admin/stock", active: true },
];

/** Registros — do documento ao histórico: comprovantes → check-in → ações. */
export const registrosSubItems: SubNavItem[] = [
  {
    title: "Comprovantes",
    href: "/admin/vouchers",
    active: true,
    ownerOnly: true,
  },
  {
    title: "Histórico de Check-in",
    href: "/admin/history",
    active: true,
    permission: "HISTORY",
  },
  {
    title: "Histórico de Ações",
    href: "/admin/notes",
    active: true,
    ownerOnly: true,
  },
];

/** Autoatendimento — visão geral → pedidos → configuração → divulgação. */
export const autoatendimentoSubItems: SubNavItem[] = [
  { title: "Dashboard", href: "/admin/auto/dashboard", active: false },
  {
    title: "Solicitações Pendentes",
    href: "/admin/auto/requests",
    active: true,
  },
  { title: "Regras e Horários", href: "/admin/self-service", active: true },
  {
    title: "Página Personalizada",
    href: "/admin/custom-page",
    icon: LinkAlt as BoxIcon,
    active: true,
  },
  { title: "WhatsApp Automático", href: "/admin/whatsapp-auto", active: false },
];

/** Financeiro — visão geral → movimentações → projeção → configuração. */
export const financeSubItems: SubNavItem[] = [
  { title: "Dashboard", href: "/admin/finance/dashboard", active: true },
  { title: "Extrato", href: "/admin/finance/transactions", active: true },
  {
    title: "Fluxo de Caixa",
    href: "/admin/cashflow-demo",
    active: true,
    ownerOnly: true,
  },
  {
    title: "Meios de Pagamento",
    href: "/admin/finance/payment-methods",
    active: true,
  },
];
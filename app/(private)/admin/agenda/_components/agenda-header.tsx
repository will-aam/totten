"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSidebar } from "@/components/ui/sidebar";
import { MenuLeft, CheckShield, ChevronDown, Slider, InfoCircle, CalendarAlt, Lock, LockOpen } from "@boxicons/react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

/* ── Legenda de cores – dados ─────────────────────────────────── */

interface LegendItem {
  color: string;
  label: string;
  tag: string;
  description: string;
}

const MOVABLE_ITEMS: LegendItem[] = [
  {
    color: "bg-amber-500",
    label: "Avulso Pendente",
    tag: "Amarelo",
    description: "Agendamento avulso sem vínculo com pacote. Ainda não fez check-in.",
  },
  {
    color: "bg-teal-500",
    label: "Pacote Pendente",
    tag: "Verde Água",
    description: "Agendamento de pacote ou retorno. Ainda não fez check-in.",
  },
  {
    color: "bg-pink-500",
    label: "Falta",
    tag: "Rosa",
    description: "O cliente faltou ao atendimento agendado.",
  },
];

const LOCKED_ITEMS: LegendItem[] = [
  {
    color: "bg-blue-500",
    label: "Realizado",
    tag: "Azul",
    description: "O atendimento foi finalizado. Altere o status para poder reagendar.",
  },
  {
    color: "bg-purple-500",
    label: "Check-in Realizado",
    tag: "Roxo",
    description: "O cliente já fez check-in presencial e aguarda atendimento.",
  },
  {
    color: "bg-slate-400 dark:bg-slate-500",
    label: "Cancelado",
    tag: "Cinza",
    description: "O agendamento foi cancelado amigavelmente.",
  },
  {
    color: "bg-red-500",
    label: "Inativo",
    tag: "Vermelho",
    description: "Pacote encerrado ou cancelado. Agendamento inativo.",
  },
];

function LegendRow({ item }: { item: LegendItem }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className={cn("w-3 h-3 rounded-full shrink-0 ring-2 ring-offset-2 ring-offset-background", item.color, item.color.replace("bg-", "ring-"))} />
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-foreground leading-tight">
          {item.label}
          <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
            {item.tag}
          </span>
        </p>
        <p className="text-[11px] text-muted-foreground/80 leading-snug mt-0.5">
          {item.description}
        </p>
      </div>
    </div>
  );
}

/* ── Header Props ─────────────────────────────────────────────── */

interface AgendaHeaderProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  title: string;
  subtitle: ReactNode;
  onOpenSettings: () => void;
  filtersNode?: ReactNode;
  viewMode: "day" | "week" | "month";
  onViewModeChange: (val: "day" | "week" | "month") => void;
}

export function AgendaHeader({
  selectedDate,
  onSelectDate,
  title,
  subtitle,
  onOpenSettings,
  filtersNode,
  viewMode,
  onViewModeChange,
}: AgendaHeaderProps) {
  const { toggleSidebar } = useSidebar();
  const { data: session } = useSession();
  const slug = session?.user?.organizationSlug;

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between bg-background/60 px-4 backdrop-blur-md md:px-6 border-b border-transparent dark:border-border/40">
      <div className="flex items-center gap-1 sm:gap-2 min-w-0">
        <button
          onClick={toggleSidebar}
          className="relative flex items-center justify-center p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-all active:scale-95 shrink-0"
        >
          <MenuLeft size="base" removePadding />
          <span className="sr-only">Menu</span>
        </button>

        <Popover>
          <PopoverTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer md:cursor-default md:pointer-events-none hover:bg-muted/50 md:hover:bg-transparent p-1.5 rounded-2xl transition-colors group min-w-0">
              <div className="text-left min-w-0">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-foreground leading-tight flex items-center gap-1.5 truncate">
                  <span className="truncate">{title}</span>
                  <ChevronDown
                    size="sm"
                    className="text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity shrink-0 md:hidden"
                  />
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium truncate">
                  {subtitle}
                </p>
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 rounded-2xl shadow-xl"
            align="start"
          >
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onSelectDate(date)}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Tabs
          value={viewMode}
          onValueChange={(val) => onViewModeChange(val as "day" | "week" | "month")}
          className="hidden md:block mr-2"
        >
          <TabsList className="grid w-56 grid-cols-3 h-9 rounded-full bg-muted/40 p-1">
            <TabsTrigger value="day" className="rounded-full font-bold text-xs">
              Dia
            </TabsTrigger>
            <TabsTrigger value="week" className="rounded-full font-bold text-xs">
              Semana
            </TabsTrigger>
            <TabsTrigger value="month" className="rounded-full font-bold text-xs">
              Mês
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="md:hidden">
          {filtersNode}
        </div>

        {/* ── Legenda de Cores (Sheet) ────────────────────────── */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 bg-none border border-none hover:bg-muted"
            >
              <InfoCircle size="sm" />
            </Button>
          </SheetTrigger>
          <SheetContent className="flex flex-col h-[100dvh] w-full p-0 sm:max-w-md border-l-0 sm:border-l shadow-2xl overflow-hidden z-[100]">
            <SheetHeader className="px-6 pt-6 pb-5 border-b shrink-0 flex-row items-center justify-between text-left space-y-0">
              <div className="space-y-1">
                <SheetTitle className="text-lg font-extrabold tracking-tight">
                  Legenda de Cores
                </SheetTitle>
                <SheetDescription className="font-medium text-xs text-muted-foreground">
                  Significado de cada cor nos cards da agenda.
                </SheetDescription>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 custom-scrollbar pb-10">

              {/* ── Seção: Reagendável ──────────────────────────── */}
              <section>
                <div className="flex items-center gap-2 mb-1">
                  <LockOpen className="h-3.5 w-3.5 text-primary" />
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-primary">
                    Reagendável
                  </h3>
                </div>
                <p className="text-[11px] text-muted-foreground/70 mb-3">
                  Pode ser arrastado para outro dia e horário.
                </p>
                <div className="rounded-xl border border-border/60 bg-muted/20 divide-y divide-border/40 px-3.5">
                  {MOVABLE_ITEMS.map((item) => (
                    <LegendRow key={item.tag} item={item} />
                  ))}
                </div>
              </section>

              {/* ── Seção: Fixo na agenda ───────────────────────── */}
              <section>
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Fixo na agenda
                  </h3>
                </div>
                <p className="text-[11px] text-muted-foreground/70 mb-3">
                  Não pode ser arrastado. Altere o status antes de reagendar.
                </p>
                <div className="rounded-xl border border-border/60 bg-muted/20 divide-y divide-border/40 px-3.5">
                  {LOCKED_ITEMS.map((item) => (
                    <LegendRow key={item.tag} item={item} />
                  ))}
                </div>
              </section>

              {/* ── Nota: Reagendamento ─────────────────────────── */}
              <section className="rounded-xl border border-border/50 bg-muted/10 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <CalendarAlt className="h-3.5 w-3.5 text-foreground/70" />
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-foreground/70">
                    Arrastar e Soltar
                  </h3>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Ao arrastar um card, a data e o horário são atualizados imediatamente. Um registro de auditoria com o horário anterior e o novo é salvo automaticamente no histórico do cliente.
                </p>
              </section>
            </div>
          </SheetContent>
        </Sheet>

        <Button
          variant="outline"
          size="icon"
          onClick={onOpenSettings}
          className="h-9 w-9 bg-none border border-none hover:bg-muted"
        >
          <Slider size="sm" />
        </Button>

        <Button
          asChild
          variant="secondary"
          size="sm"
          className="group h-8 sm:h-9 gap-2 font-medium text-xs sm:text-sm shadow-sm border border-border/50 bg-primary/5 hover:bg-primary/10 text-primary transition-all"
        >
          <Link href={slug ? `/totem/idle?slug=${slug}` : "/totem/idle"}>
            <span className="relative flex items-center justify-center w-4 h-4">
              <CheckShield
                size="base"
                removePadding
                pack="basic"
                className={cn(
                  "absolute transition-all duration-300",
                  "opacity-100 scale-100 group-hover:opacity-0 group-hover:scale-75",
                )}
              />
              <CheckShield
                size="base"
                removePadding
                pack="filled"
                className={cn(
                  "absolute transition-all duration-300",
                  "opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100",
                )}
              />
            </span>
            <span className="hidden sm:inline">Modo Check-in</span>
            <span className="sm:hidden">Totem</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}

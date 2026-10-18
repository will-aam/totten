"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSidebar } from "@/components/ui/sidebar";
import { MenuLeft, CheckShield, ChevronDown, Slider, InfoCircle, CalendarAlt } from "@boxicons/react";
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
            <SheetHeader className="px-6 py-6 border-b shrink-0 flex-row items-center justify-between text-left space-y-0">
              <div className="space-y-1.5">
                <SheetTitle className="text-xl font-black">Legenda de Cores</SheetTitle>
                <SheetDescription className="font-medium text-xs">
                  Entenda o significado de cada cor nos cards da sua agenda.
                </SheetDescription>
              </div>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar pb-10">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded mt-0.5 shrink-0 bg-blue-500 shadow-sm"></div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Azul (Realizado)</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    O atendimento foi finalizado com sucesso. 
                    <strong className="block mt-1 text-foreground/80 font-bold">
                      🔒 Fixo na agenda: não pode ser arrastado (altere o status antes se precisar reagendar).
                    </strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded mt-0.5 shrink-0 bg-purple-500 shadow-sm"></div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Roxo (Check-in Realizado)</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    O cliente já fez check-in presencial no totem e aguarda atendimento.
                    <strong className="block mt-1 text-foreground/80 font-bold">
                      🔒 Fixo na agenda: não pode ser arrastado para preservar o horário do check-in.
                    </strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded mt-0.5 shrink-0 bg-amber-500 shadow-sm"></div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Amarelo (Avulso Pendente)</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Agendamento sem vínculo com pacote. O Cliente ainda não fez check-in.
                    <span className="block mt-1 text-primary font-bold">
                      ✨ Pode ser arrastado livremente para reagendar data e horário.
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded mt-0.5 shrink-0 bg-teal-500 shadow-sm"></div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Verde Água (Pacote Pendente)</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Agendamento de pacote ou retorno. O Cliente ainda não fez check-in.
                    <span className="block mt-1 text-primary font-bold">
                      ✨ Pode ser arrastado livremente para reagendar data e horário.
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded mt-0.5 shrink-0 bg-pink-500 shadow-sm"></div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Rosa (Falta)</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    O cliente faltou ao atendimento agendado.
                    <span className="block mt-1 text-primary font-bold">
                      ✨ Pode ser arrastado para reagendar a falta para um novo dia e horário.
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded mt-0.5 shrink-0 bg-slate-400 shadow-sm dark:bg-slate-500 opacity-80"></div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Cinza (Cancelado)</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    O agendamento foi cancelado amigavelmente.
                    <strong className="block mt-1 text-foreground/80 font-bold">
                      🔒 Fixo na agenda: não pode ser arrastado.
                    </strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded mt-0.5 shrink-0 bg-red-500 shadow-sm relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-px bg-white/60 rotate-45"></div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Vermelho (Inativo)</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Agendamento atrelado a um pacote que acabou ou foi cancelado.
                    <strong className="block mt-1 text-foreground/80 font-bold">
                      🔒 Fixo na agenda: não pode ser arrastado.
                    </strong>
                  </p>
                </div>
              </div>

              {/* Bloco Explicativo de Reagendamento */}
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-2 mt-4">
                <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-wider">
                  <CalendarAlt className="h-4 w-4" /> Arrastar e Soltar (Reagendamento)
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ao arrastar um card pendente ou falta para outro dia/horário, tanto a data quanto o horário no banco de dados são atualizados imediatamente para o novo momento escolhido.
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Um registro detalhado de auditoria contendo a data/horário anterior e a nova data/horário é automaticamente salvo no histórico da ficha do cliente.
                </p>
              </div>
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

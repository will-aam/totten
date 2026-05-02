// components/history/history-filters.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarDetail, Search, X } from "@boxicons/react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface HistoryFiltersProps {
  search: string;
  setSearch: (val: string) => void;
  dateFrom: Date | undefined;
  setDateFrom: (date: Date | undefined) => void;
  dateTo: Date | undefined;
  setDateTo: (date: Date | undefined) => void;
  clearFilters: () => void;
}

export function HistoryFilters({
  search,
  setSearch,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  clearFilters,
}: HistoryFiltersProps) {
  const hasFilters = search || dateFrom || dateTo;

  // 🔥 ATALHOS INTELIGENTES PARA MÊS
  const handleThisMonth = () => {
    const today = new Date();
    setDateFrom(startOfMonth(today));
    setDateTo(endOfMonth(today));
  };

  const handleLastMonth = () => {
    const lastMonth = subMonths(new Date(), 1);
    setDateFrom(startOfMonth(lastMonth));
    setDateTo(endOfMonth(lastMonth));
  };

  return (
    <div className="flex flex-col gap-4 w-full animate-in fade-in slide-in-from-top-2 duration-500">
      {/* Atalhos Rápidos (Mês Atual / Mês Passado) */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-2">
          Atalhos de Período:
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleThisMonth}
          className="h-8 rounded-xl text-xs font-bold bg-background shadow-sm hover:bg-primary/10 hover:text-primary transition-colors"
        >
          <Calendar className="h-3 w-3 mr-1.5" /> Este Mês
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLastMonth}
          className="h-8 rounded-xl text-xs font-bold bg-background shadow-sm hover:bg-primary/10 hover:text-primary transition-colors"
        >
          <Calendar className="h-3 w-3 mr-1.5" /> Mês Passado
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end w-full">
        {/* Campo de Busca Livre (Nome/CPF) */}
        <div className="flex flex-col gap-1.5 w-full md:flex-1">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
            Buscar Cliente
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nome ou CPF (mín. 3 letras)..." // 🔥 UNICA MUDANÇA: Aviso ao usuário
              className="pl-10 rounded-2xl bg-card border-border/50 h-12 shadow-sm font-medium focus-visible:ring-primary/20"
            />
          </div>
        </div>

        {/* Filtros de Data (Lado a Lado) */}
        <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
          <div className="flex flex-col gap-1.5 w-full">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
              Data Inicial
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-medium bg-card border-border/50 h-12 rounded-2xl shadow-sm hover:bg-muted/50 transition-colors",
                    !dateFrom && "text-muted-foreground",
                  )}
                >
                  <CalendarDetail className="mr-2 h-4 w-4 text-primary" />
                  {dateFrom ? format(dateFrom, "dd/MM/yy") : "Selecione"}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 rounded-3xl border-none shadow-2xl"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
              Data Final
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-medium bg-card border-border/50 h-12 rounded-2xl shadow-sm hover:bg-muted/50 transition-colors",
                    !dateTo && "text-muted-foreground",
                  )}
                >
                  <CalendarDetail className="mr-2 h-4 w-4 text-primary" />
                  {dateTo ? format(dateTo, "dd/MM/yy") : "Selecione"}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 rounded-3xl border-none shadow-2xl"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Botão Limpar Filtros */}
        {hasFilters && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="rounded-2xl h-12 text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-full md:w-auto font-bold transition-colors shrink-0"
          >
            <X className="h-4 w-4 mr-2" /> Limpar
          </Button>
        )}
      </div>
    </div>
  );
}

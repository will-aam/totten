"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarIcon,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface HistoryFiltersProps {
  filterMode: "month" | "range";
  setFilterMode: (mode: "month" | "range") => void;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  dateFrom: Date | undefined;
  setDateFrom: (date: Date | undefined) => void;
  dateTo: Date | undefined;
  setDateTo: (date: Date | undefined) => void;
  clearRangeFilters: () => void;
}

export function HistoryFilters({
  filterMode,
  setFilterMode,
  currentDate,
  setCurrentDate,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  clearRangeFilters,
}: HistoryFiltersProps) {
  // Funções do Navegador Mensal
  const handlePrevMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  const handleNextMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  const monthYearString = currentDate.toLocaleString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <Card className="border-0 shadow-none bg-transparent md:border md:shadow-sm md:bg-card">
      <CardHeader className="px-0 pt-0 md:pt-4 md:px-5 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground font-semibold uppercase tracking-wider">
          <Filter className="h-4 w-4 text-primary" />
          Opções de Filtro
        </CardTitle>
      </CardHeader>

      <CardContent className="px-0 pb-0 md:pb-5 md:px-5">
        <Tabs
          value={filterMode}
          onValueChange={(v) => setFilterMode(v as "month" | "range")}
          className="w-full"
        >
          {/* BOTÕES DE ALTERNÂNCIA (As Abas) */}
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
            <TabsTrigger value="month">Visão Mensal</TabsTrigger>
            <TabsTrigger value="range">Período Específico</TabsTrigger>
          </TabsList>

          {/* ABA 1: NAVEGADOR MENSAL */}
          <TabsContent value="month" className="mt-0">
            <div className="flex items-center justify-between bg-card border border-border/50 rounded-2xl p-2 shadow-sm w-full md:w-fit">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevMonth}
                className="rounded-full hover:bg-muted"
              >
                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
              </Button>
              <div className="flex items-center gap-2 px-4 min-w-40 justify-center">
                <CalendarDays className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold capitalize text-foreground">
                  {monthYearString}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextMonth}
                className="rounded-full hover:bg-muted"
              >
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>
          </TabsContent>

          {/* ABA 2: DATAS ESPECÍFICAS */}
          <TabsContent value="range" className="mt-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:flex gap-3 md:gap-4 md:items-end p-4 bg-muted/20 border border-border/50 rounded-xl">
              <div className="flex flex-col gap-1.5 flex-1">
                <Label className="text-xs font-medium text-foreground ml-1">
                  De (Data Inicial)
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal bg-background h-11 md:h-10 rounded-xl md:rounded-md",
                        !dateFrom && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? (
                        format(dateFrom, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
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

              <div className="flex flex-col gap-1.5 flex-1">
                <Label className="text-xs font-medium text-foreground ml-1">
                  Até (Data Final)
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal bg-background h-11 md:h-10 rounded-xl md:rounded-md",
                        !dateTo && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? (
                        format(dateTo, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
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

              {(dateFrom || dateTo) && (
                <Button
                  variant="ghost"
                  onClick={clearRangeFilters}
                  className="h-11 md:h-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl md:rounded-md"
                >
                  <X className="h-4 w-4 mr-2" /> Limpar
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import { AdminHeader } from "@/components/admin-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, CalendarCheck, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  HistoryTable,
  type EnrichedCheckIn,
} from "@/components/history/history-table";
import { HistoryFilters } from "@/components/history/history-filters";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminHistoryPage() {
  // 🔥 Capturamos o 'mutate' para permitir atualização reativa da lista
  const {
    data: checkIns,
    isLoading,
    mutate,
  } = useSWR<EnrichedCheckIn[]>("/api/history", fetcher);

  // ESTADOS DOS FILTROS
  const [filterMode, setFilterMode] = useState<"month" | "range">("month");

  // Estado Aba 1
  const [currentDate, setCurrentDate] = useState(new Date());

  // Estados Aba 2
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  // Estado Voltar ao Topo
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const clearRangeFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  // A MÁGICA: Aplica o filtro de acordo com a Aba selecionada
  const filtered = useMemo(() => {
    if (!checkIns) return [];

    return checkIns.filter((ci) => {
      const ciDate = new Date(ci.date_time);
      ciDate.setHours(0, 0, 0, 0);

      if (filterMode === "month") {
        return (
          ciDate.getMonth() === currentDate.getMonth() &&
          ciDate.getFullYear() === currentDate.getFullYear()
        );
      }

      if (filterMode === "range") {
        if (dateFrom) {
          const from = new Date(dateFrom);
          from.setHours(0, 0, 0, 0);
          if (ciDate < from) return false;
        }
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          if (ciDate > to) return false;
        }
        return true;
      }

      return true;
    });
  }, [checkIns, filterMode, currentDate, dateFrom, dateTo]);

  return (
    <>
      <AdminHeader title="Histórico" />

      <div className="flex flex-col gap-4 md:gap-6 p-4 md:p-6 max-w-6xl mx-auto w-full pb-24 md:pb-6 relative">
        <HistoryFilters
          filterMode={filterMode}
          setFilterMode={setFilterMode}
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          clearRangeFilters={clearRangeFilters}
        />

        <Card className="border-0 shadow-none bg-transparent md:border md:shadow-sm md:bg-card">
          <CardHeader className="px-0 pt-0 md:pt-6 md:px-6 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg text-card-foreground">
              <ClipboardList className="h-5 w-5 text-primary" />
              {filterMode === "month"
                ? "Extrato de Presenças"
                : "Resultado da Busca"}
              <span className="ml-auto text-xs font-semibold bg-muted px-2 py-1 rounded-full text-muted-foreground">
                {filtered.length}{" "}
                {filtered.length === 1 ? "registro" : "registros"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0 md:pb-6 md:px-6">
            {isLoading ? (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="flex flex-col gap-2 w-full">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/30 rounded-xl border border-dashed border-border mt-2">
                <CalendarCheck className="h-10 w-10 text-muted-foreground/40" />
                <p className="mt-4 text-sm font-medium text-muted-foreground px-4">
                  {filterMode === "month"
                    ? `Nenhum check-in registrado em ${currentDate.toLocaleString("pt-BR", { month: "long" })}.`
                    : "Nenhum check-in encontrado para as datas selecionadas."}
                </p>
              </div>
            ) : (
              // 🔥 Passamos a função 'mutate' para o onUpdate da tabela
              <HistoryTable data={filtered} onUpdate={mutate} />
            )}
          </CardContent>
        </Card>
      </div>

      <button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-20 md:bottom-8 right-4 md:right-8 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 z-50",
          showScrollTop
            ? "translate-y-0 opacity-100"
            : "translate-y-10 opacity-0 pointer-events-none",
        )}
        aria-label="Voltar ao topo"
      >
        <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </>
  );
}

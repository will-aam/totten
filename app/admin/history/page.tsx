// app/admin/history/page.tsx
"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { AdminHeader } from "@/components/admin-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ClipboardDetail,
  ChevronUp,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  LoaderDots,
} from "@boxicons/react";
import { cn } from "@/lib/utils";

import {
  HistoryTable,
  type EnrichedCheckIn,
} from "@/components/history/history-table";
import { HistoryFilters } from "@/components/history/history-filters";
import { useDebounce } from "@/hooks/use-debounce";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type HistoryResponse = {
  data: EnrichedCheckIn[];
  total: number;
  page: number;
  totalPages: number;
};

export default function AdminHistoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, dateFrom, dateTo]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const clearFilters = () => {
    setSearch("");
    setDateFrom(undefined);
    setDateTo(undefined);
    setPage(1);
  };

  const query = new URLSearchParams({ page: page.toString(), limit: "15" });
  if (debouncedSearch) query.append("q", debouncedSearch);
  if (dateFrom) query.append("from", dateFrom.toISOString());
  if (dateTo) query.append("to", dateTo.toISOString());

  const {
    data: response,
    isLoading,
    mutate,
  } = useSWR<HistoryResponse>(`/api/history?${query.toString()}`, fetcher);

  const checkIns = response?.data || [];
  const total = response?.total || 0;
  const totalPages = response?.totalPages || 1;

  return (
    <>
      <AdminHeader title="Histórico" />

      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 md:pb-12 relative animate-in fade-in duration-500 min-h-[calc(100vh-100px)]">
        <HistoryFilters
          search={search}
          setSearch={setSearch}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          clearFilters={clearFilters}
        />

        <div className="flex items-center justify-between pt-2">
          <h2 className="text-xl font-black text-foreground flex items-center gap-2">
            <ClipboardDetail size="sm" className="text-primary" />
            Extrato de Presenças
          </h2>
          {!isLoading && (
            <span className="text-[11px] font-bold bg-muted/60 text-muted-foreground px-3 py-1.5 rounded-full uppercase tracking-wider">
              {total} {total === 1 ? "Registro" : "Registros"}
            </span>
          )}
        </div>

        <div>
          {isLoading ? (
            <div className="flex flex-col gap-4 bg-card p-6 rounded-3xl border border-border/50">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-2xl shrink-0 bg-muted/50" />
                  <div className="flex flex-col gap-2 w-full">
                    <Skeleton className="h-5 w-40 bg-muted/50" />
                    <Skeleton className="h-3 w-24 bg-muted/50" />
                  </div>
                </div>
              ))}
            </div>
          ) : checkIns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-card rounded-4xl border border-dashed border-border/60 shadow-sm">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <CalendarCheck size="md" className="text-muted-foreground" />
              </div>
              <p className="text-base font-bold text-foreground">
                Nenhum check-in encontrado
              </p>
              <p className="text-sm font-medium text-muted-foreground mt-1 max-w-sm">
                Tente ajustar os filtros de busca ou verifique o período
                selecionado.
              </p>
            </div>
          ) : (
            <div className="animate-in slide-in-from-bottom-2 duration-500">
              <HistoryTable data={checkIns} onUpdate={mutate} />

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 bg-card p-4 rounded-2xl border border-border/50 shadow-sm">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-center sm:text-left w-full sm:w-auto">
                    Página {page} de {totalPages}
                  </p>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rounded-xl h-10 font-bold bg-background shadow-sm hover:bg-muted"
                    >
                      <ChevronLeft size="sm" className="mr-1" /> Anterior
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      className="rounded-xl h-10 font-bold bg-background shadow-sm hover:bg-muted"
                    >
                      Próxima <ChevronRight size="sm" className="ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-20 md:bottom-8 right-4 md:right-8 p-3.5 flex items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 z-50",
          showScrollTop
            ? "translate-y-0 opacity-100"
            : "translate-y-16 opacity-0 pointer-events-none",
        )}
        aria-label="Voltar ao topo"
      >
        <ChevronUp size="base" removePadding />
      </button>
    </>
  );
}

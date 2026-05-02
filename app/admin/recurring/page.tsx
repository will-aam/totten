// app/admin/recurring/page.tsx
"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { AdminHeader } from "@/components/admin-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Repeat,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
} from "@boxicons/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { deleteAppointment } from "@/app/actions/appointments";
import { useDebounce } from "@/hooks/use-debounce";
import {
  RecurringItem,
  type RecurringSeries,
} from "@/components/recurring/recurring-item";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type RecurringResponse = {
  data: RecurringSeries[];
  total: number;
  page: number;
  totalPages: number;
};

export default function RecurringAppointmentsPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const query = new URLSearchParams({ page: page.toString(), limit: "15" });
  if (debouncedSearch && debouncedSearch.trim().length >= 3) {
    query.append("q", debouncedSearch.trim());
  }

  const {
    data: response,
    isLoading,
    mutate,
  } = useSWR<RecurringResponse>(
    `/api/admin/recurring?${query.toString()}`,
    fetcher,
  );

  const seriesList = response?.data || [];
  const total = response?.total || 0;
  const totalPages = response?.totalPages || 1;

  const handleDeleteSeries = async (recurrenceId: string) => {
    try {
      const res = await deleteAppointment("", true, recurrenceId);
      if (res.success) {
        toast.success("Série cancelada e horários liberados!");
        mutate();
      } else {
        toast.error("Erro ao cancelar a série.");
      }
    } catch {
      toast.error("Erro de conexão ao cancelar.");
    }
  };

  const handleWhatsApp = (
    phone: string,
    clientName: string,
    warnings: string[],
  ) => {
    const cleanPhone = phone.replace(/\D/g, "");
    let msg = `Olá ${clientName.split(" ")[0]}! Tudo bem?`;
    if (warnings.length > 0) {
      msg += ` Passando para lembrar que o seu pacote está finalizando, mas ainda temos seus horários fixos reservados na nossa agenda. Gostaria de renovar o plano para mantermos as suas vagas?`;
    }
    window.open(
      `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  };

  return (
    <>
      <AdminHeader title="Gestão de Recorrências" />

      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 md:pb-6 relative min-h-[calc(100vh-100px)] animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-black tracking-tight text-foreground">
              Cadeiras Ocupadas
            </h2>
            <p className="text-sm font-medium text-muted-foreground mt-1">
              Acompanhe horários fixos e renove pacotes.
            </p>
          </div>

          <div className="relative w-full md:w-80 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar cliente (mín. 3 letras)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-2xl h-12 bg-card border-none font-medium focus-visible:ring-primary/20"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <h2 className="text-xl font-black text-foreground flex items-center gap-2">
            <Repeat size="sm" className="text-primary" />
            Séries Ativas e Finalizadas
          </h2>
          {!isLoading && (
            <span className="text-[11px] font-bold bg-muted/60 text-muted-foreground px-3 py-1.5 rounded-full uppercase tracking-wider">
              {total} {total === 1 ? "Série" : "Séries"}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-24 w-full rounded-3xl bg-muted/50 border border-border/50"
              />
            ))
          ) : seriesList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-card rounded-4xl border border-dashed border-border/60 mt-2">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Repeat size="md" className="text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {searchTerm.length >= 3
                  ? "Nenhuma série encontrada"
                  : "Nenhuma série recorrente"}
              </h3>
              <p className="mt-1 text-sm font-medium text-muted-foreground max-w-sm px-4">
                {searchTerm.length >= 3
                  ? "Tente buscar por outro nome de cliente."
                  : 'Crie um agendamento marcando "Agendamento Recorrente" para gerenciar seus horários fixos aqui.'}
              </p>
            </div>
          ) : (
            seriesList.map((series, index) => (
              <div
                key={series.recurrenceId}
                className="animate-in slide-in-from-bottom-2"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <RecurringItem
                  series={series}
                  onWhatsApp={handleWhatsApp}
                  onDelete={handleDeleteSeries}
                />
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 bg-card p-4 rounded-2xl border border-border/50">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-center sm:text-left w-full sm:w-auto">
              Página {page} de {totalPages}
            </p>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-xl h-10 font-bold bg-background hover:bg-muted border-none"
              >
                <ChevronLeft size="sm" className="mr-1" /> Anterior
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-xl h-10 font-bold bg-background hover:bg-muted border-none"
              >
                Próxima <ChevronRight size="sm" className="ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-20 md:bottom-8 right-4 md:right-8 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-all duration-300 z-50",
          showScrollTop
            ? "translate-y-0 opacity-100"
            : "translate-y-10 opacity-0 pointer-events-none",
        )}
        aria-label="Voltar ao topo"
      >
        <ChevronUp size="base" removePadding />
      </button>
    </>
  );
}

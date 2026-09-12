"use client";

import { ChevronLeft, Folder, ChevronRight, LoaderDots } from "@boxicons/react";
import { Button } from "@/components/ui/button";
import { HistoryLog, Note } from "./history-log";

interface HistoryViewProps {
  clientName: string;
  notes: Note[];
  page: number;
  totalPages: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onBack: () => void;
}

export function HistoryView({
  clientName,
  notes,
  page,
  totalPages,
  isLoading,
  onPageChange,
  onBack,
}: HistoryViewProps) {
  // 1. Agrupar as notas por data (YYYY-MM-DD)
  const groupedNotes = notes.reduce(
    (acc, note) => {
      const dateKey = new Date(note.date).toISOString().split("T")[0];
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(note);
      return acc;
    },
    {} as Record<string, Note[]>,
  );

  // 2. Formatar o cabeçalho do grupo (Hoje, Ontem, ou "segunda-feira, 18 de mar.")
  const formatGroupDate = (dateString: string) => {
    const today = new Date();
    const targetDate = new Date(dateString);
    // Ajuste de fuso horário para evitar bugs de data no frontend
    const todayStr = new Date(
      today.getTime() - today.getTimezoneOffset() * 60000,
    )
      .toISOString()
      .split("T")[0];

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = new Date(
      yesterday.getTime() - yesterday.getTimezoneOffset() * 60000,
    )
      .toISOString()
      .split("T")[0];

    if (dateString === todayStr) return "Hoje";
    if (dateString === yesterdayStr) return "Ontem";

    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "short",
    }).format(targetDate);
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-background">
      {/* Header Customizado com Botão de Voltar */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 bg-background px-4 shadow-sm border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="-ml-2 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm border border-primary/20">
            {clientName.charAt(0)}
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold text-foreground leading-none truncate max-w-50 md:max-w-xs">
              {clientName}
            </h1>
            <span className="text-[11px] text-muted-foreground mt-1 tracking-wide">
              Histórico de Ações
            </span>
          </div>
        </div>
      </header>

      {/* Container das Notas */}
      <div className="flex-1 p-4 md:p-6 pb-28 max-w-400 mx-auto w-full overflow-y-auto">
        <div className="flex flex-col gap-6">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <LoaderDots className="h-8 w-8 text-primary opacity-50 animate-spin" />
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
              <div className="bg-primary/5 p-4 rounded-full mb-4">
                <Folder className="h-8 w-8 text-primary/60" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Nenhum histórico registrado.
              </p>
            </div>
          ) : (
            // Ordena as chaves de data cronologicamente inversa (mais recentes primeiro)
            Object.keys(groupedNotes)
              .sort((a, b) => b.localeCompare(a))
              .map((dateKey) => (
                <div key={dateKey} className="flex flex-col gap-4">
                  {/* Divisor de Data */}
                  <div className="flex justify-center my-2">
                    <span className="bg-muted text-muted-foreground border border-border text-[11px] font-medium px-3 py-1 rounded-full capitalize">
                      {formatGroupDate(dateKey)}
                    </span>
                  </div>

                  {/* Renderiza as ações (mais recentes primeiro) */}
                  <div className="flex flex-col gap-2 relative">
                    <div className="absolute left-6 top-2 bottom-2 w-px bg-border z-0 hidden md:block"></div>
                    {groupedNotes[dateKey].map((note) => (
                      <HistoryLog
                        key={note.id}
                        note={note}
                      />
                    ))}
                  </div>
                </div>
              ))
          )}
        </div>
        
        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t">
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1 || isLoading}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-muted-foreground">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages || isLoading}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

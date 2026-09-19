"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, Folder, ChevronRight, LoaderDots, Send } from "@boxicons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ManualNotesBubble, ManualNote } from "./manual-notes-bubble";
import { createManualNote, deleteManualNote } from "@/app/actions/manual-notes";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

interface ManualNotesViewProps {
  clientId: string;
  clientName: string;
  notes: ManualNote[];
  page: number;
  totalPages: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onBack: () => void;
  cacheKey: string; // To invalidate SWR cache
}

export function ManualNotesView({
  clientId,
  clientName,
  notes,
  page,
  totalPages,
  isLoading,
  onPageChange,
  onBack,
  cacheKey
}: ManualNotesViewProps) {
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const { mutate } = useSWRConfig();

  const bottomRef = useRef<HTMLDivElement>(null);

  // 1. Agrupar as notas por data (YYYY-MM-DD)
  const groupedNotes = notes.reduce(
    (acc, note) => {
      const dateKey = new Date(note.date).toISOString().split("T")[0];
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(note);
      return acc;
    },
    {} as Record<string, ManualNote[]>,
  );

  // 2. Formatar o cabeçalho do grupo
  const formatGroupDate = (dateString: string) => {
    const today = new Date();
    const targetDate = new Date(dateString);
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsSending(true);
    try {
      const result = await createManualNote(clientId, inputText.trim());
      if (result.error) {
        toast.error(result.error);
      } else {
        setInputText("");
        mutate(cacheKey);
        setTimeout(() => {
          bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (err) {
      toast.error("Erro ao salvar anotação");
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    setDeletingIds(prev => new Set(prev).add(noteId));
    try {
      const result = await deleteManualNote(noteId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Anotação apagada");
        mutate(cacheKey);
      }
    } catch (err) {
      toast.error("Erro ao apagar anotação");
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(noteId);
        return next;
      });
    }
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-background relative">
      {/* Header Customizado */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 bg-background/80 backdrop-blur-md px-4 shadow-sm border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="-ml-2 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
            {clientName.charAt(0)}
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold text-foreground leading-none truncate max-w-50 md:max-w-xs">
              {clientName}
            </h1>
            <span className="text-[11px] text-muted-foreground mt-1 tracking-wide">
              Notas
            </span>
          </div>
        </div>
      </header>

      {/* Container das Notas */}
      <div className="flex-1 p-4 md:p-6 pb-28 max-w-400 mx-auto w-full flex flex-col justify-end overflow-y-auto">

        {/* Paginação (No topo porque é um chat, os antigos ficam pra cima) */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages || isLoading}
              onClick={() => onPageChange(page + 1)} // Antigos -> + página
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1 || isLoading}
              onClick={() => onPageChange(page - 1)} // Novos -> - página
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-6 w-full">
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
                Nenhuma anotação manual.
              </p>
            </div>
          ) : (
            // Ordena as chaves cronologicamente normal (mais antigos em cima)
            Object.keys(groupedNotes)
              .sort((a, b) => a.localeCompare(b))
              .map((dateKey) => (
                <div key={dateKey} className="flex flex-col gap-4 w-full">
                  <div className="flex justify-center my-2">
                    <span className="bg-muted text-muted-foreground text-[11px] font-medium px-3 py-1 rounded-full capitalize">
                      {formatGroupDate(dateKey)}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3 w-full">
                    {groupedNotes[dateKey].map((note) => (
                      <ManualNotesBubble
                        key={note.id}
                        note={note}
                        onDelete={handleDelete}
                        isDeleting={deletingIds.has(note.id)}
                      />
                    ))}
                  </div>
                </div>
              ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input de Mensagem Flutuante */}
      <div className="sticky bottom-0 z-40 w-full max-w-400 mx-auto bg-background/95 backdrop-blur-md p-3 md:p-4 border-t md:border-none md:bg-transparent md:backdrop-blur-none md:pb-6">
        <form onSubmit={handleSend} className="flex items-center gap-2 bg-background border shadow-lg rounded-full p-1 pl-4 md:pl-5">
          <Input
            placeholder="Digite sua anotação..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSending}
            className="border-0 shadow-none focus-visible:ring-0 px-0 flex-1 bg-transparent dark:bg-transparent"
            autoComplete="off"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isSending || !inputText.trim()}
            className="h-10 w-10 shrink-0 shadow-sm"
          >
            {isSending ? (
              <LoaderDots className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

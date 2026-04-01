"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, StickyNote, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatBubble, Note } from "./chat-bubble";

interface ChatViewProps {
  clientName: string;
  notes: Note[];
  onBack: () => void;
  onSend: (text: string) => void;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
}

export function ChatView({
  clientName,
  notes,
  onBack,
  onSend,
  onEdit,
  onDelete,
}: ChatViewProps) {
  const [newNote, setNewNote] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Rola para o final (última mensagem) quando a lista de notas muda
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [notes]);

  const handleSend = () => {
    if (!newNote.trim()) return;
    onSend(newNote);
    setNewNote("");
  };

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
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 bg-background px-4 shadow-sm">
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
              Anotações Internas
            </span>
          </div>
        </div>
      </header>

      {/* Container das Notas */}
      <div className="flex-1 p-4 md:p-6 pb-28 max-w-400 mx-auto w-full overflow-y-auto">
        <div className="flex flex-col gap-6">
          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
              <div className="bg-primary/5 p-4 rounded-full mb-4">
                <StickyNote className="h-8 w-8 text-primary/60" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Nenhuma anotação registrada.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Use a barra abaixo para adicionar algo importante.
              </p>
            </div>
          ) : (
            // Ordena as chaves de data cronologicamente e renderiza
            Object.keys(groupedNotes)
              .sort()
              .map((dateKey) => (
                <div key={dateKey} className="flex flex-col gap-4">
                  {/* Divisor de Data estilo WhatsApp */}
                  <div className="flex justify-center my-2">
                    <span className="bg-muted/80 text-muted-foreground text-[11px] font-medium px-3 py-1 rounded-full  capitalize">
                      {formatGroupDate(dateKey)}
                    </span>
                  </div>

                  {/* Renderiza as bolhas de chat para aquele dia específico */}
                  {groupedNotes[dateKey].map((note) => (
                    <ChatBubble
                      key={note.id}
                      note={note}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              ))
          )}
          {/* Âncora invisível para forçar o scroll para o final */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Fixo na parte inferior */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-background p-3 md:p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] pb-safe z-40">
        <div className="max-w-400 mx-auto flex items-end gap-2 md:gap-4">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            // Envia ao apertar Enter (sem shift) no Desktop
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Digite uma nota para este cliente..."
            className="flex-1 min-h-11min-h-[52px] max-h-30 bg-muted/50 border border-transparent focus:border-primary/30 rounded-2xl md:rounded-lg px-4 py-3 md:py-4 text-sm resize-none outline-none transition-colors"
            rows={1}
          />
          <Button
            size="icon"
            className="h-11 w-11 md:h-12 md:w-12 rounded-2xl md:rounded-lg shrink-0 shadow-md active:scale-95 transition-all"
            disabled={!newNote.trim()}
            onClick={handleSend}
          >
            <Send className="h-4 w-4 md:h-5 md:w-5 ml-0.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

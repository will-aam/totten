"use client";

import { useState } from "react";
import { AdminHeader } from "@/components/admin-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, StickyNote, Calendar, Send } from "lucide-react";
import { cn } from "@/lib/utils";

// --- MOCK DATA (Dados falsos apenas para validar o visual) ---
const MOCK_CLIENTS = [
  { id: "1", name: "Maria Silva", cpf: "111.111.111-11" },
  { id: "2", name: "João Pereira", cpf: "222.222.222-22" },
  { id: "3", name: "Ana Beatriz", cpf: "333.333.333-33" },
];

const MOCK_NOTES = {
  "1": [
    {
      id: "n1",
      text: "Cliente prefere agendamentos na parte da manhã.",
      date: "2026-03-28T10:00:00",
    },
    { id: "n2", text: "Tem alergia a produto X.", date: "2026-03-29T14:30:00" },
  ],
  "2": [],
  "3": [
    {
      id: "n3",
      text: "Sempre atrasa 10 minutos, avisar com antecedência.",
      date: "2026-03-25T09:15:00",
    },
  ],
};
// -------------------------------------------------------------

export default function AdminNotesPage() {
  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");

  // Estado local para simular a adição de notas dinamicamente
  const [localNotes, setLocalNotes] = useState<Record<string, any>>(MOCK_NOTES);

  const filteredClients = MOCK_CLIENTS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.cpf.includes(search),
  );

  const selectedClient = MOCK_CLIENTS.find((c) => c.id === selectedClientId);
  const clientNotes = selectedClientId
    ? localNotes[selectedClientId] || []
    : [];

  const handleAddNote = () => {
    if (!newNote.trim() || !selectedClientId) return;

    const note = {
      id: Math.random().toString(),
      text: newNote,
      date: new Date().toISOString(),
    };

    setLocalNotes((prev) => ({
      ...prev,
      [selectedClientId]: [...(prev[selectedClientId] || []), note],
    }));
    setNewNote("");
  };

  // Visão 1: Lista de Seleção de Clientes
  if (!selectedClientId) {
    return (
      <>
        <AdminHeader title="Notas" />
        {/* Ajustado max-w-2xl para max-w-400 */}
        <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 md:pb-6 relative">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente por nome ou CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-full shadow-sm bg-card border-border md:rounded-md"
            />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2">
              Selecione um cliente
            </h2>
            <div className="flex flex-col gap-2">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  className="flex items-center gap-3 p-3 bg-card border border-border/50 rounded-xl md:rounded-md shadow-sm cursor-pointer hover:bg-muted/50 active:scale-[0.98] transition-all"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                    {client.name.charAt(0)}
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="font-semibold text-sm text-foreground">
                      {client.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {client.cpf}
                    </span>
                  </div>
                </div>
              ))}
              {filteredClients.length === 0 && (
                <div className="text-center p-6 text-muted-foreground text-sm border border-dashed rounded-xl md:rounded-md bg-muted/30">
                  Nenhum cliente encontrado.
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // Visão 2: Notas do Cliente Selecionado (Estilo Chat)
  return (
    <div className="flex flex-col h-full min-h-screen bg-muted/10">
      {/* Header Customizado com Botão de Voltar */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background px-4 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedClientId(null)}
          className="-ml-2 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm border border-primary/20">
            {selectedClient?.name.charAt(0)}
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold text-foreground leading-none">
              {selectedClient?.name}
            </h1>
            <span className="text-[11px] text-muted-foreground mt-1 tracking-wide">
              Anotações Internas
            </span>
          </div>
        </div>
      </header>

      {/* Container das Notas */}
      {/* Ajustado max-w-2xl para max-w-400 */}
      <div className="flex-1 p-4 md:p-6 pb-28 max-w-400 mx-auto w-full overflow-y-auto">
        <div className="flex flex-col gap-4">
          {clientNotes.length === 0 ? (
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
            clientNotes.map((note: any) => (
              <div
                key={note.id}
                className="bg-background border border-border shadow-sm rounded-2xl md:rounded-md rounded-tl-sm p-3.5 md:p-5 w-[90%] md:w-full self-start flex flex-col gap-1"
              >
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {note.text}
                </p>
                <div className="flex items-center justify-end gap-1.5 mt-2 opacity-60">
                  <Calendar className="h-3 w-3" />
                  <span className="text-[10px] md:text-xs font-medium">
                    {new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(note.date))}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Input Fixo na parte inferior */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-background border-t border-border p-3 md:p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] pb-safe z-40">
        {/* Ajustado max-w-2xl para max-w-400 */}
        <div className="max-w-400 mx-auto flex items-end gap-2 md:gap-4">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Digite uma nota para este cliente..."
            className="flex-1 min-h-11 md:min-h-13 max-h-30 bg-muted/50 border border-transparent focus:border-primary/30 rounded-2xl md:rounded-lg px-4 py-3 md:py-4 text-sm resize-none outline-none transition-colors"
            rows={1}
          />
          <Button
            size="icon"
            className="h-11 w-11 md:h-12 md:w-12 rounded-full md:rounded-lg shrink-0 shadow-md active:scale-95 transition-all"
            disabled={!newNote.trim()}
            onClick={handleAddNote}
          >
            <Send className="h-4 w-4 md:h-5 md:w-5 ml-0.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

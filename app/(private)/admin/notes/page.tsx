"use client";

import { useState } from "react";
import useSWR from "swr";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import { ClientListView } from "@/components/notes/client-list-view";
import { ChatView } from "@/components/notes/chat-view";
import { Note } from "@/components/notes/chat-bubble";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Tipo baseado no retorno real da sua API de clientes
type Client = {
  id: string;
  name: string;
  cpf: string;
};

export default function AdminNotesPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Gatilho de busca com 2 letras, conforme você pediu
  const shouldSearch = debouncedSearch.trim().length >= 2;

  // 1. Busca a lista de clientes:
  // Se estiver pesquisando, vai na rota global de clientes.
  // Se NÃO estiver pesquisando, vai na nossa rota nova que só traz quem tem anotações.
  const { data: clientsResponse, mutate: mutateClients } = useSWR<{
    data: Client[];
  }>(
    shouldSearch
      ? `/api/clients?q=${encodeURIComponent(debouncedSearch.trim())}&limit=10`
      : `/api/admin/notes/clients`,
    fetcher,
  );
  const displayClients = clientsResponse?.data || [];

  // 2. Busca as notas APENAS do cliente selecionado (SWR faz cache e auto-atualiza)
  const { data: notesResponse, mutate: mutateNotes } = useSWR<{ data: Note[] }>(
    selectedClient ? `/api/admin/notes?clientId=${selectedClient.id}` : null,
    fetcher,
  );
  const clientNotes = notesResponse?.data || [];

  // --- HANDLERS COM INTEGRAÇÃO REAL (API) E OPTIMISTIC UI ---

  const handleSendNote = async (text: string) => {
    if (!selectedClient) return;

    // Atualiza a tela instantaneamente (Optimistic UI)
    const tempNote: Note = {
      id: Math.random().toString(),
      text,
      date: new Date().toISOString(),
    };
    const previousNotes = [...clientNotes];
    mutateNotes({ data: [...previousNotes, tempNote] }, false);

    try {
      const res = await fetch("/api/admin/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: selectedClient.id, text }),
      });

      if (!res.ok) throw new Error("Falha ao salvar");
      mutateNotes(); // Revalida com o ID real gerado pelo banco
      mutateClients(); // Atualiza a lista inicial para o cliente aparecer lá caso seja a 1ª nota
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a anotação.",
        variant: "destructive",
      });
      mutateNotes({ data: previousNotes }, false); // Reverte a tela em caso de erro
    }
  };

  const handleEditNote = async (updatedNote: Note) => {
    if (!selectedClient) return;

    const previousNotes = [...clientNotes];
    mutateNotes(
      {
        data: previousNotes.map((n) =>
          n.id === updatedNote.id ? updatedNote : n,
        ),
      },
      false,
    );

    try {
      const res = await fetch("/api/admin/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteId: updatedNote.id,
          text: updatedNote.text,
        }),
      });

      if (!res.ok) throw new Error("Falha ao editar");
      mutateNotes();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível editar a anotação.",
        variant: "destructive",
      });
      mutateNotes({ data: previousNotes }, false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!selectedClient) return;

    const previousNotes = [...clientNotes];
    mutateNotes({ data: previousNotes.filter((n) => n.id !== noteId) }, false);

    try {
      const res = await fetch(`/api/admin/notes?noteId=${noteId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Falha ao deletar");

      toast({
        description: "Anotação excluída com sucesso.",
      });
      mutateNotes();
      mutateClients(); // Se foi a última nota, ele vai sumir da tela inicial
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a anotação.",
        variant: "destructive",
      });
      mutateNotes({ data: previousNotes }, false);
    }
  };

  // --- VISÃO 1: Lista e Pesquisa ---
  if (!selectedClient) {
    return (
      <ClientListView
        search={search}
        onSearchChange={setSearch}
        filteredClients={displayClients}
        onSelectClient={(id) => {
          const client = displayClients.find((c) => c.id === id);
          if (client) setSelectedClient(client);
        }}
      />
    );
  }

  // --- VISÃO 2: Chat de Notas ---
  return (
    <ChatView
      clientName={selectedClient.name}
      notes={clientNotes}
      onBack={() => {
        setSelectedClient(null);
        setSearch("");
      }}
      onSend={handleSendNote}
      onEdit={handleEditNote}
      onDelete={handleDeleteNote}
    />
  );
}

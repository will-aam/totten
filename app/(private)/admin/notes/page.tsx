// app/(private)/admin/notes/page.tsx
"use client";

import { useState } from "react";
import useSWR from "swr";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import { ClientListView } from "./_components/client-list-view";
import { ChatView } from "./_components/chat-view";
import { Note } from "./_components/chat-bubble";
import { apiClient } from "@/lib/api-client";
// Importamos as nossas Server Actions:
import { createNote, updateNote, deleteNote } from "@/app/actions/notes";

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

  const shouldSearch = debouncedSearch.trim().length >= 2;

  // 1. Busca a lista de clientes via API Route (SWR)
  const { data: clientsResponse, mutate: mutateClients } = useSWR<{
    data: Client[];
  }>(
    shouldSearch
      ? `clients?q=${encodeURIComponent(debouncedSearch.trim())}&limit=10`
      : `admin/notes/clients`,
    apiClient,
  );
  const displayClients = clientsResponse?.data || [];

  // 2. Busca as notas do cliente selecionado via API Route (SWR)
  const { data: notesResponse, mutate: mutateNotes } = useSWR<{ data: Note[] }>(
    selectedClient ? `admin/notes?clientId=${selectedClient.id}` : null,
    apiClient,
  );
  const clientNotes = notesResponse?.data || [];

  // --- HANDLERS COM INTEGRAÇÃO REAL (SERVER ACTIONS) E OPTIMISTIC UI ---

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
      // Chama a Server Action de Criação
      const result = await createNote(selectedClient.id, text);

      if (result.error) {
        throw new Error(result.error);
      }

      mutateNotes(); // Revalida com o ID real gerado pelo banco
      mutateClients(); // Atualiza a lista inicial
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
      // Chama a Server Action de Atualização
      const result = await updateNote(updatedNote.id, updatedNote.text);

      if (result.error) {
        throw new Error(result.error);
      }

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
      // Chama a Server Action de Deleção
      const result = await deleteNote(noteId);

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        description: "Anotação excluída com sucesso.",
      });
      mutateNotes();
      mutateClients();
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

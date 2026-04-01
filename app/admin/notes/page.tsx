"use client";

import { useState } from "react";
import useSWR from "swr";
import { useDebounce } from "@/hooks/use-debounce";
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
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Estado que armazena as notas temporariamente na memória (Protótipo)
  const [localNotes, setLocalNotes] = useState<Record<string, Note[]>>({});

  // Estado que armazena os clientes que já possuem alguma anotação
  const [clientsWithNotes, setClientsWithNotes] = useState<Client[]>([]);

  // Só faz requisição ao banco (API Real) se a busca tiver 3 ou mais caracteres
  const shouldFetch = debouncedSearch.trim().length >= 3;
  const { data: apiResponse } = useSWR<{ data: Client[] }>(
    shouldFetch
      ? `/api/clients?q=${encodeURIComponent(debouncedSearch.trim())}&limit=10`
      : null,
    fetcher,
  );

  const searchResults = apiResponse?.data || [];

  // Se estiver pesquisando, mostra resultados do BD. Se não, mostra o histórico local.
  const displayClients = shouldFetch ? searchResults : clientsWithNotes;

  const handleSendNote = (text: string) => {
    if (!selectedClient) return;

    const newNote: Note = {
      id: Math.random().toString(), // ID provisório
      text,
      date: new Date().toISOString(),
    };

    setLocalNotes((prev) => ({
      ...prev,
      [selectedClient.id]: [...(prev[selectedClient.id] || []), newNote],
    }));

    // Se o cliente não estava na lista inicial, adicionamos ele agora
    setClientsWithNotes((prev) => {
      if (prev.some((c) => c.id === selectedClient.id)) return prev;
      return [selectedClient, ...prev];
    });
  };

  // ATUALIZADO: Como o componente ChatBubble já pega o novo texto no Modal,
  // aqui nós apenas recebemos a nota atualizada e salvamos no estado.
  const handleEditNote = (updatedNote: Note) => {
    if (!selectedClient) return;

    setLocalNotes((prev) => ({
      ...prev,
      [selectedClient.id]: prev[selectedClient.id].map((n) =>
        n.id === updatedNote.id ? updatedNote : n,
      ),
    }));
  };

  // ATUALIZADO: O modal de confirmação já foi tratado no ChatBubble.
  // Aqui só executamos a deleção de fato nos dados.
  const handleDeleteNote = (noteId: string) => {
    if (!selectedClient) return;

    setLocalNotes((prev) => {
      const updatedNotes = prev[selectedClient.id].filter(
        (n) => n.id !== noteId,
      );

      // Se apagou todas as notas, remove o cliente da lista inicial (para manter tudo limpo)
      if (updatedNotes.length === 0) {
        setClientsWithNotes((prevClients) =>
          prevClients.filter((c) => c.id !== selectedClient.id),
        );
      }

      return {
        ...prev,
        [selectedClient.id]: updatedNotes,
      };
    });
  };

  // --- VISÃO 1: Lista e Pesquisa ---
  if (!selectedClient) {
    return (
      <ClientListView
        search={search}
        onSearchChange={setSearch}
        filteredClients={displayClients}
        onSelectClient={(id) => {
          // Encontra o cliente clicado na lista e o define como selecionado
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
      notes={localNotes[selectedClient.id] || []}
      onBack={() => {
        setSelectedClient(null);
        setSearch(""); // Limpa a busca ao sair da nota
      }}
      onSend={handleSendNote}
      onEdit={handleEditNote}
      onDelete={handleDeleteNote}
    />
  );
}

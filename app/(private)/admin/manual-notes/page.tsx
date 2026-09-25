// app/(private)/admin/manual-notes/page.tsx
"use client";

import { useState } from "react";
import useSWR from "swr";
import { useDebounce } from "@/hooks/use-debounce";
import { ClientListView } from "../notes/_components/client-list-view";
import { ManualNotesView } from "./_components/manual-notes-view";
import { ManualNote } from "./_components/manual-notes-bubble";
import { apiClient } from "@/lib/api-client";

type Client = {
  id: string;
  name: string;
  cpf: string;
};

export default function AdminManualNotesPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Pagination state for history
  const [page, setPage] = useState(1);
  const limit = 20;

  const shouldSearch = debouncedSearch.trim().length >= 2;

  // 1. Busca a lista de clientes via API Route (SWR)
  const { data: clientsResponse, isLoading: isLoadingClients } = useSWR<{
    data: Client[];
  }>(
    shouldSearch
      ? `clients?q=${encodeURIComponent(debouncedSearch.trim())}&limit=10`
      : `admin/manual-notes/clients`,
    apiClient,
  );
  const displayClients = clientsResponse?.data || [];

  // 2. Busca o histórico do cliente selecionado via API Route (SWR)
  const cacheKey = selectedClient ? `admin/manual-notes?clientId=${selectedClient.id}&page=${page}&limit=${limit}` : null;
  const { data: historyResponse, isLoading: isLoadingHistory } = useSWR<{ data: ManualNote[], totalPages: number, page: number }>(
    cacheKey,
    apiClient,
  );
  const clientHistory = historyResponse?.data || [];
  const totalPages = historyResponse?.totalPages || 1;

  // --- VISÃO 1: Lista e Pesquisa ---
  if (!selectedClient) {
    return (
      <ClientListView
        title="Notas"
        search={search}
        onSearchChange={setSearch}
        filteredClients={displayClients}
        onSelectClient={(id) => {
          const client = displayClients.find((c) => c.id === id);
          if (client) {
            setSelectedClient(client);
            setPage(1); // Reset page on new client
          }
        }}
        isLoading={isLoadingClients}
      />
    );
  }

  // --- VISÃO 2: Chat de Anotações ---
  return (
    <ManualNotesView
      clientId={selectedClient.id}
      clientName={selectedClient.name}
      notes={clientHistory}
      page={page}
      totalPages={totalPages}
      isLoading={isLoadingHistory}
      onPageChange={setPage}
      cacheKey={cacheKey!}
      onBack={() => {
        setSelectedClient(null);
        setSearch("");
        setPage(1);
      }}
    />
  );
}

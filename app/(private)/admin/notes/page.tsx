// app/(private)/admin/notes/page.tsx
"use client";

import { useState } from "react";
import useSWR from "swr";
import { useDebounce } from "@/hooks/use-debounce";
import { ClientListView } from "./_components/client-list-view";
import { HistoryView } from "./_components/history-view";
import { Note } from "./_components/history-log";
import { apiClient } from "@/lib/api-client";

type Client = {
  id: string;
  name: string;
  cpf: string;
};

export default function AdminHistoryPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Pagination state for history
  const [page, setPage] = useState(1);
  const limit = 20;

  const shouldSearch = debouncedSearch.trim().length >= 2;

  // 1. Busca a lista de clientes via API Route (SWR)
  const { data: clientsResponse } = useSWR<{
    data: Client[];
  }>(
    shouldSearch
      ? `clients?q=${encodeURIComponent(debouncedSearch.trim())}&limit=10`
      : `admin/notes/clients`,
    apiClient,
  );
  const displayClients = clientsResponse?.data || [];

  // 2. Busca o histórico do cliente selecionado via API Route (SWR)
  const { data: historyResponse, isLoading: isLoadingHistory } = useSWR<{ data: Note[], totalPages: number, page: number }>(
    selectedClient ? `admin/notes?clientId=${selectedClient.id}&page=${page}&limit=${limit}` : null,
    apiClient,
  );
  const clientHistory = historyResponse?.data || [];
  const totalPages = historyResponse?.totalPages || 1;

  // --- VISÃO 1: Lista e Pesquisa ---
  if (!selectedClient) {
    return (
      <ClientListView
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
      />
    );
  }

  // --- VISÃO 2: Histórico (Leitura Apenas) ---
  return (
    <HistoryView
      clientName={selectedClient.name}
      notes={clientHistory}
      page={page}
      totalPages={totalPages}
      isLoading={isLoadingHistory}
      onPageChange={setPage}
      onBack={() => {
        setSelectedClient(null);
        setSearch("");
        setPage(1);
      }}
    />
  );
}

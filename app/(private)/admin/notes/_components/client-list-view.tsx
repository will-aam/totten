"use client";

import { useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "@boxicons/react";
import { Input } from "@/components/ui/input";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type Client = {
  id: string;
  name: string;
  cpf: string;
};

interface ClientListViewProps {
  search: string;
  onSearchChange: (val: string) => void;
  filteredClients: Client[];
  onSelectClient: (id: string) => void;
  title?: string;
  isLoading?: boolean;
}

export function ClientListView({
  search,
  onSearchChange,
  filteredClients,
  onSelectClient,
  title = "Histórico de Ações",
  isLoading = false,
}: ClientListViewProps) {
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  const handleSearchChange = (val: string) => {
    onSearchChange(val);
    setPage(1); // Reset page on new search
  };

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const displayedClients = filteredClients.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <>
      <AdminHeader title={title} />
      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 md:pb-6 relative">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente por nome ou CPF..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 shadow-sm bg-card border-border rounded-full"
          />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2">
            Selecione um cliente
          </h2>
          <div className="flex flex-col gap-2">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-[66px] w-full rounded-full md:rounded-md" />
              ))
            ) : displayedClients.length > 0 ? (
              displayedClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => onSelectClient(client.id)}
                  className="flex items-center gap-3 p-3 bg-card border border-border/50 rounded-full md:rounded-md shadow-sm cursor-pointer hover:bg-muted/50 active:scale-[0.98] transition-all"
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
              ))
            ) : (
              <div className="text-center p-6 text-muted-foreground text-sm border border-dashed rounded-full md:rounded-md bg-muted/30">
                Nenhum cliente encontrado.
              </div>
            )}
          </div>
          
          {/* Paginação */}
          {!isLoading && totalPages > 1 && (
            <div className="pt-4 mt-2">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    if (
                      p === 1 ||
                      p === totalPages ||
                      (p >= page - 1 && p <= page + 1)
                    ) {
                      return (
                        <PaginationItem key={p}>
                          <PaginationLink
                            onClick={() => setPage(p)}
                            isActive={page === p}
                            className="cursor-pointer"
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }

                    if (p === page - 2 || p === page + 2) {
                      return (
                        <PaginationItem key={p}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

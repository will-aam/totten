"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AdminHeader } from "@/components/admin-header";

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
}

export function ClientListView({
  search,
  onSearchChange,
  filteredClients,
  onSelectClient,
}: ClientListViewProps) {
  return (
    <>
      <AdminHeader title="Notas" />
      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 md:pb-6 relative">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente por nome ou CPF..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
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
                onClick={() => onSelectClient(client.id)}
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

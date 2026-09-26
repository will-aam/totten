"use client";

import { Search, Trophy, Plus, Star } from "@boxicons/react";
import { Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Client {
  id: number | string;
  name: string;
  points: number;
  lastCheckIn: string;
  tier: string;
}

interface LoyaltyOverviewTabProps {
  isProgramActive: boolean;
  setIsProgramActive: (active: boolean) => void;
  programScope: "global" | "specific";
  clients: Client[];
  onOpenVoucher: (client: Client) => void;
}

export function LoyaltyOverviewTab({
  isProgramActive,
  setIsProgramActive,
  programScope,
  clients,
  onOpenVoucher,
}: LoyaltyOverviewTabProps) {
  if (!isProgramActive) {
    return (
      <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
            <Trophy size="md" />
            Fidelize seus clientes
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Configure regras de pontos para cada check-in realizado e ofereça
            recompensas incríveis para quem mais frequenta o seu espaço.
          </p>
        </div>
        <Button variant="default" className="rounded-full shrink-0" onClick={() => setIsProgramActive(true)}>
          Ativar Programa
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size="sm" />
          <Input
            placeholder="Buscar cliente por nome..."
            className="pl-10 rounded-full bg-card"
          />
        </div>

        {programScope === "specific" && (
          <Button className="rounded-full w-full sm:w-auto flex items-center gap-2">
            <Plus size="xs" />
            Incluir Cliente
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {clients.map((client) => (
          <Card key={client.id} className="rounded-2xl shadow-sm border-border/50 relative overflow-hidden">
            <Star
              aria-hidden="true"
              type="solid"
              width={100}
              height={100}
              rotate={-15}
              className="pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 text-foreground/5"
            />
            <Star
              aria-hidden="true"
              type="solid"
              width={40}
              height={40}
              rotate={20}
              className="pointer-events-none absolute right-12 -bottom-4 text-foreground/5"
            />

            <CardContent className="relative z-10 p-5 flex flex-col items-center text-center gap-2">
              <div className="space-y-1 mt-2">
                <h3 className="font-semibold text-lg">{client.name}</h3>
                <p className="text-xs text-muted-foreground">
                  Último Check-in: {client.lastCheckIn}
                </p>
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 bg-secondary/50 px-3 py-1 rounded-full text-sm font-medium">
                <span className="text-primary font-bold">{client.points}</span> 
                <span>pts</span>
              </div>

              <div className="flex items-center gap-2 mt-4 w-full pt-4 border-t border-border/50">
                <Button 
                  variant="outline" 
                  className="rounded-xl flex-1 flex flex-col gap-1 h-auto py-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => onOpenVoucher(client)}
                >
                  <Download size={16} />
                  Baixar
                </Button>
                <Button variant="outline" className="rounded-xl flex-1 flex flex-col gap-1 h-auto py-2 text-xs text-muted-foreground hover:text-foreground">
                  <ExternalLink size={16} />
                  Perfil
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Pagination className="mt-8">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" className="pointer-events-none opacity-50 rounded-full" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#" isActive className="rounded-full">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#" className="rounded-full">2</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" className="rounded-full" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </>
  );
}

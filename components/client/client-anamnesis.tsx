// components/client/client-anamnesis.tsx
"use client";

import Link from "next/link";
import useSWR from "swr";
import {
  Plus,
  ClipboardCheck,
  CheckCircle,
  Clock,
  ChevronRight,
} from "@boxicons/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getClientAnamnesisResponses } from "@/app/actions/anamnesis";
import { cn } from "@/lib/utils";

export function ClientAnamnesis({ clientId }: { clientId: string }) {
  // SWR com Server Action
  const fetcher = async () => {
    const result = await getClientAnamnesisResponses(clientId);
    if (!result.success) throw new Error("Erro ao carregar anamneses");
    return result.data || [];
  };

  const { data: responses = [], isLoading } = useSWR(
    `anamnesis-${clientId}`,
    fetcher,
  );

  const formatDate = (dateInput: string | Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(dateInput));
  };

  return (
    /* Mobile: Transparente. Desktop: Card padrão */
    <Card className="md:col-span-1 border-0 shadow-none bg-transparent md:border md:shadow-sm md:bg-card">
      <CardHeader className="px-0 pt-0 md:pt-6 md:px-6 pb-3 md:pb-6 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2 text-foreground">
          <ClipboardCheck className="h-5 w-5 text-primary" strokeWidth={1.5} />
          Fichas de Anamnese
        </CardTitle>

        <Button
          asChild
          size="sm"
          variant="outline"
          /* Botão Nova: Outline primary, sem hover, efeito click */
          className="h-8 rounded-full border-primary/20 text-primary select-none transition-transform duration-100 ease-out hover:bg-transparent hover:text-primary active:scale-95 active:bg-primary/10 text-xs font-medium px-3"
        >
          <Link href={`/admin/clients/${clientId}/anamnesis/new`}>
            <Plus className="h-3.5 w-3.5 mr-1" strokeWidth={2} /> Nova
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="px-0 pb-0 md:pb-6 md:px-6 flex flex-col gap-2">
        {isLoading ? (
          <div className="flex flex-col gap-3 py-2">
            <div className="h-12 w-full bg-muted/30 animate-pulse rounded-lg" />
            <div className="h-12 w-full bg-muted/30 animate-pulse rounded-lg" />
          </div>
        ) : responses.length === 0 ? (
          /* Estado Vazio: Limpo e integrado */
          <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 rounded-xl border border-dashed border-border">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
              <ClipboardCheck
                className="h-5 w-5 text-muted-foreground/50"
                strokeWidth={1.5}
              />
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Nenhuma ficha preenchida
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1 max-w-62.5">
              Esta cliente ainda não possui formulários registrados.
            </p>
          </div>
        ) : (
          /* Lista de Anamneses */
          <div className="flex flex-col">
            {responses.map((response) => {
              const isSigned = !!response.signed_at;

              return (
                <Link
                  key={response.id}
                  href={`/admin/clients/${clientId}/anamnesis/${response.id}`}
                  /* Item da lista: Sem hover colorido, efeito click ativo */
                  className="flex items-center justify-between py-3 border-b border-border/40 last:border-0 select-none transition-all duration-100 ease-out active:bg-muted/30 -mx-2 px-2 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {/* Ícone de Status (Mantido semântico: Verde/Amarelo) */}
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                        isSigned
                          ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20",
                      )}
                    >
                      {isSigned ? (
                        <CheckCircle className="h-4 w-4" strokeWidth={2} />
                      ) : (
                        <Clock className="h-4 w-4" strokeWidth={2} />
                      )}
                    </div>

                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground leading-none mb-1.5">
                        {response.template?.name || "Ficha Sem Nome"}
                      </span>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium leading-none">
                        <span>{formatDate(response.created_at)}</span>
                        <span>•</span>
                        <span
                          className={cn(
                            isSigned ? "text-blue-600/80" : "text-amber-600/80",
                          )}
                        >
                          {isSigned ? "Assinada" : "Pendente"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Setas e badges removidos para limpeza mobile */}
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

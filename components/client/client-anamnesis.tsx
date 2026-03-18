"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  FileText,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Importando a Server Action que criamos lá no começo
import { getClientAnamnesisResponses } from "@/app/actions/anamnesis";

export function ClientAnamnesis({ clientId }: { clientId: string }) {
  const [responses, setResponses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadResponses() {
      const result = await getClientAnamnesisResponses(clientId);
      if (result.success && result.data) {
        setResponses(result.data);
      }
      setIsLoading(false);
    }
    loadResponses();
  }, [clientId]);

  // Função nativa do JS para formatar a data sem precisar instalar bibliotecas extras
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(dateString));
  };

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4 bg-muted/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <CardTitle className="text-xl font-bold">
            Fichas de Anamnese
          </CardTitle>
        </div>
        <Button
          asChild
          size="sm"
          className="rounded-xl font-semibold shadow-sm"
        >
          <Link href={`/admin/clients/${clientId}/anamnesis/new`}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Ficha
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary" />
            <p className="text-sm font-medium">
              Carregando fichas da cliente...
            </p>
          </div>
        ) : responses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="bg-muted/30 p-4 rounded-full mb-4">
              <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-base font-semibold text-foreground mb-1">
              Nenhuma ficha preenchida
            </p>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Esta cliente ainda não possui formulários de anamnese registrados
              no sistema.
            </p>
            <Button asChild variant="outline" className="rounded-xl h-10">
              <Link href={`/admin/clients/${clientId}/anamnesis/new`}>
                <Plus className="w-4 h-4 mr-2" />
                Preencher a Primeira Ficha
              </Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {responses.map((response) => (
              <div
                key={response.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 hover:bg-muted/20 transition-all gap-4"
              >
                <div className="flex items-start gap-4">
                  {/* Ícone de Status */}
                  <div className="mt-1 shrink-0">
                    {response.signed_at ? (
                      <div className="bg-green-100 p-2 rounded-full">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                    ) : (
                      <div className="bg-amber-100 p-2 rounded-full">
                        <Clock className="w-5 h-5 text-amber-600" />
                      </div>
                    )}
                  </div>

                  {/* Detalhes */}
                  <div>
                    <h4 className="font-bold text-base text-foreground mb-1">
                      {response.template?.name || "Ficha sem nome"}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium">
                        {formatDate(response.created_at)}
                      </span>
                      <span>•</span>
                      {response.signed_at ? (
                        <Badge
                          variant="outline"
                          className="text-green-700 bg-green-50 border-green-200 pointer-events-none"
                        >
                          Assinada
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-amber-700 bg-amber-50 border-amber-200 pointer-events-none"
                        >
                          Rascunho (Pendente)
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botão de Ação */}
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="w-full sm:w-auto shrink-0 border border-transparent group-hover:border-border/50 group-hover:bg-background h-10 rounded-lg"
                >
                  <Link
                    href={`/admin/clients/${clientId}/anamnesis/${response.id}`}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Visualizar Ficha
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

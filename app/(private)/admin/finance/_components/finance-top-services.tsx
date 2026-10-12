// app/(private)/admin/finance/_components/finance-top-services.tsx
"use client";

import useSWR from "swr";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getReportsData } from "@/app/actions/reports";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinanceVisibility } from "./finance-visibility-context";

export function FinanceTopServices() {
  const { hideValues } = useFinanceVisibility();

  const formatCurrency = (val: number) => {
    if (hideValues) return "••••••";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  const { data: res, isLoading } = useSWR(
    "finance-reports-data",
    async () => {
      return await getReportsData();
    },
    { revalidateOnFocus: true, dedupingInterval: 5000 },
  );

  const topServices = (res?.topServices || []).slice(0, 4);
  const maxFaturamento = topServices.reduce(
    (max, service) => Math.max(max, service.faturamento || 0),
    0,
  ) || 1;

  return (
    <Card className="border-none shadow-none bg-transparent flex flex-col w-full h-full transition-all">
      <CardHeader className="py-3 px-4 pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="text-base font-bold text-foreground">
              Curva ABC de Serviços
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Serviços mais rentáveis dos últimos 6 meses.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-3 pt-1 flex-1 flex flex-col min-h-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center flex-1 py-12 text-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground mt-2 font-medium">
              Carregando serviços...
            </span>
          </div>
        ) : topServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-12 text-center opacity-60">
            <p className="text-xs font-medium">Nenhum dado disponível.</p>
          </div>
        ) : (
          <div
            className={cn(
              "flex-1 flex flex-col",
              topServices.length >= 4 ? "justify-between" : "justify-start gap-2.5",
            )}
          >
            {topServices.map((service, index) => {
              const percent = (service.faturamento / maxFaturamento) * 100;

              return (
                <div
                  key={service.name || index}
                  className="relative flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/50 transition-colors group overflow-hidden"
                >


                  <div className="flex items-center gap-3 min-w-0 z-10">
                    <div
                      className={cn(
                        "flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs shrink-0",
                        index === 0
                          ? "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 ring-1 ring-amber-400"
                          : index === 1
                            ? "bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400 ring-1 ring-slate-300 dark:ring-slate-700"
                            : index === 2
                              ? "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400 ring-1 ring-orange-300"
                              : "bg-muted text-muted-foreground",
                      )}
                    >
                      {index + 1}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {service.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        {service.sessoes} {service.sessoes === 1 ? "atendimento" : "atendimentos"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 ml-2 z-10">
                    <span className="text-sm font-bold text-foreground">
                      {formatCurrency(service.faturamento)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

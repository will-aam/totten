// app/(private)/admin/finance/_components/finance-recent-transactions-widget.tsx
"use client";

import useSWR from "swr";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getFinanceDashboardData } from "@/app/actions/finance-dashboard";
import { ArrowDownRight, ArrowUpRight, Receipt, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinanceVisibility } from "./finance-visibility-context";

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export function FinanceRecentTransactionsWidget() {
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
    "finance-dashboard-action-data",
    async () => {
      return await getFinanceDashboardData();
    },
    { keepPreviousData: true },
  );

  const transactions = (res?.recentTransactions || []).slice(0, 5);

  return (
    <Card className="border-none shadow-none bg-transparent flex flex-col w-full h-full transition-all">
      <CardHeader className="py-3 px-4 pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Receipt className="h-4 w-4 text-emerald-500" />
              Últimas Movimentações
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Transações financeiras mais recentes registradas.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-1 flex-1 flex flex-col min-h-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center flex-1 py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground mt-2 font-medium">
              Carregando transações...
            </span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-12 text-center opacity-60">
            <p className="text-xs font-medium">Nenhuma movimentação registrada.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 flex-1 justify-center">
            {transactions.map((tx) => {
              const isReceita = tx.type === "RECEITA";
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/40 transition-colors border border-border/30"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                        isReceita
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                      )}
                    >
                      {isReceita ? (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {tx.clientName || tx.description || (isReceita ? "Receita" : "Despesa")}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(tx.date)} {tx.paymentMethod ? `• ${tx.paymentMethod}` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 ml-2">
                    <span
                      className={cn(
                        "text-xs font-bold",
                        isReceita
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400",
                      )}
                    >
                      {isReceita ? "+" : "-"} {formatCurrency(tx.amount)}
                    </span>
                    <span
                      className={cn(
                        "text-[9px] font-semibold uppercase tracking-wider",
                        tx.status === "PAGO"
                          ? "text-emerald-600/80 dark:text-emerald-400/80"
                          : "text-amber-500",
                      )}
                    >
                      {tx.status}
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

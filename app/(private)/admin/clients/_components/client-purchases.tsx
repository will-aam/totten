// app/(private)/admin/clients/_components/client-purchases.tsx
"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingBag,
  CreditCard,
  Dollar,
  Calendar,
  ChevronDown,
  ChevronUp,
  Receipt,
  Package,
} from "@boxicons/react";
import { cn } from "@/lib/utils";

export interface ClientPurchasesSummary {
  totalSpent: number;
  totalPurchases: number;
  averageTicket: number;
  pendingAmount: number;
  lastPurchaseDate: string | null;
}

export interface ClientPurchaseItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "PACKAGE" | "APPOINTMENT" | "OTHER";
  status: "PAGO" | "PENDENTE" | "CANCELADO" | "ATRASADO";
  paymentMethodName: string | null;
  installment: string | null;
  dueDate: string | null;
  packageId?: string | null;
  appointmentId?: string | null;
}

interface ClientPurchasesData {
  summary: ClientPurchasesSummary;
  purchases: ClientPurchaseItem[];
}

interface ClientPurchasesProps {
  clientId: string;
}

export function ClientPurchases({ clientId }: ClientPurchasesProps) {
  const { data, isLoading } = useSWR<ClientPurchasesData>(
    `clients/${clientId}/purchases`,
    apiClient,
  );

  const [period, setPeriod] = useState<
    "all" | "this_month" | "last_month" | "last_2_months" | "last_90_days" | "this_year" | "last_year"
  >("all");
  const [visibleCount, setVisibleCount] = useState(5);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const formatDate = (isoString: string) => {
    try {
      return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAGO":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">
            Pago
          </Badge>
        );
      case "PENDENTE":
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">
            Pendente
          </Badge>
        );
      case "ATRASADO":
        return (
          <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 border-rose-200">
            Atrasado
          </Badge>
        );
      case "CANCELADO":
        return (
          <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-slate-200">
            Cancelado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const summary = data?.summary || {
    totalSpent: 0,
    totalPurchases: 0,
    averageTicket: 0,
    pendingAmount: 0,
    lastPurchaseDate: null,
  };

  const purchases = data?.purchases || [];

  const filteredPurchases = useMemo(() => {
    if (period === "all") return purchases;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return purchases.filter((item) => {
      const itemDate = new Date(item.date);
      if (isNaN(itemDate.getTime())) return false;

      if (period === "this_month") {
        return (
          itemDate.getFullYear() === currentYear &&
          itemDate.getMonth() === currentMonth
        );
      }

      if (period === "last_month") {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return (
          itemDate.getFullYear() === lastMonthYear &&
          itemDate.getMonth() === lastMonth
        );
      }

      if (period === "last_2_months") {
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        return itemDate >= sixtyDaysAgo && itemDate <= now;
      }

      if (period === "last_90_days") {
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        return itemDate >= ninetyDaysAgo && itemDate <= now;
      }

      if (period === "this_year") {
        return itemDate.getFullYear() === currentYear;
      }

      if (period === "last_year") {
        return itemDate.getFullYear() === currentYear - 1;
      }

      return true;
    });
  }, [purchases, period]);

  const dynamicSummary = useMemo(() => {
    if (period === "all") return summary;

    let totalSpent = 0;
    let paidCount = 0;
    let pendingAmount = 0;

    for (const item of filteredPurchases) {
      const amount = Number(item.amount) || 0;
      if (item.status === "PAGO") {
        totalSpent += amount;
        paidCount++;
      } else if (item.status === "PENDENTE" || item.status === "ATRASADO") {
        pendingAmount += amount;
      }
    }

    const averageTicket = paidCount > 0 ? totalSpent / paidCount : 0;

    return {
      totalSpent,
      totalPurchases: paidCount,
      averageTicket,
      pendingAmount,
      lastPurchaseDate: summary?.lastPurchaseDate ?? null,
    };
  }, [filteredPurchases, period, summary]);

  const visiblePurchases = filteredPurchases.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPurchases.length;

  if (isLoading) {
    return (
      <Card className="rounded-3xl border shadow-sm">
        <CardHeader className="p-4 md:p-6 pb-2">
          <Skeleton className="h-6 w-48 rounded-lg" />
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-2 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
          <Skeleton className="h-32 rounded-2xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border shadow-sm bg-card overflow-hidden">
      <CardHeader className="p-4 md:p-6 pb-4 border-b bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Resumo Financeiro & Compras
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            Total de {filteredPurchases.length} lançamento(s) registrados
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4 md:p-6 space-y-5">
        {/* Filtros Minimalistas de Período (com scroll horizontal no mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth">
          {[
            { id: "all", label: "Todas" },
            { id: "this_month", label: "Este mês" },
            { id: "last_month", label: "Mês passado" },
            { id: "last_2_months", label: "Últimos 2 meses" },
            { id: "last_90_days", label: "Últimos 3 meses" },
            { id: "this_year", label: "Este ano" },
            { id: "last_year", label: "Ano passado" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setPeriod(tab.id as any);
                setVisibleCount(5);
              }}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-full transition-all shrink-0",
                period === tab.id
                  ? "bg-foreground text-background shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Gasto</span>
              <Dollar className="h-4 w-4" />
            </div>
            <p className="text-xl md:text-2xl font-black text-emerald-950 dark:text-emerald-100 mt-2">
              {formatCurrency(dynamicSummary.totalSpent)}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col justify-between">
            <div className="flex items-center justify-between text-primary">
              <span className="text-xs font-semibold uppercase tracking-wider">Compras Pagas</span>
              <Receipt className="h-4 w-4" />
            </div>
            <p className="text-xl md:text-2xl font-black text-foreground mt-2">
              {dynamicSummary.totalPurchases}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex flex-col justify-between">
            <div className="flex items-center justify-between text-blue-700 dark:text-blue-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Ticket Médio</span>
              <CreditCard className="h-4 w-4" />
            </div>
            <p className="text-xl md:text-2xl font-black text-blue-950 dark:text-blue-100 mt-2">
              {formatCurrency(dynamicSummary.averageTicket)}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Pendente</span>
              <Calendar className="h-4 w-4" />
            </div>
            <p className="text-xl md:text-2xl font-black text-amber-950 dark:text-amber-100 mt-2">
              {formatCurrency(dynamicSummary.pendingAmount)}
            </p>
          </div>
        </div>

        {/* Purchases Table / List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Histórico Transacional
            </h4>
            {dynamicSummary.lastPurchaseDate && (
              <span className="text-xs text-muted-foreground">
                Última compra paga: <strong className="text-foreground">{formatDate(dynamicSummary.lastPurchaseDate)}</strong>
              </span>
            )}
          </div>

          {filteredPurchases.length === 0 ? (
            <div className="py-8 px-4 text-center rounded-2xl border border-dashed text-muted-foreground">
              <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">
                {period === "all"
                  ? "Nenhuma compra ou pagamento registrado para este cliente."
                  : "Nenhuma compra registrada no período selecionado."}
              </p>
              {period !== "all" && (
                <button
                  type="button"
                  onClick={() => setPeriod("all")}
                  className="text-xs font-semibold text-primary hover:underline mt-2 inline-block"
                >
                  Ver todas as compras
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y rounded-2xl border overflow-hidden">
              {visiblePurchases.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 gap-2 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-0",
                        item.type === "PACKAGE"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
                      )}
                    >
                      {item.type === "PACKAGE" ? (
                        <Package className="h-5 w-5" />
                      ) : (
                        <Receipt className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">
                        {item.description}
                        {item.installment && (
                          <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                            ({item.installment})
                          </span>
                        )}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                        <span>{formatDate(item.date)}</span>
                        {item.paymentMethodName && (
                          <>
                            <span>•</span>
                            <span>{item.paymentMethodName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0">
                    <div className="text-right">
                      <span className="font-bold text-sm sm:text-base text-foreground">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                    <div>{getStatusBadge(item.status)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasMore && (
            <div className="pt-2 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount((prev) => prev + 5)}
                className="rounded-full text-xs"
              >
                Ver mais compras ({filteredPurchases.length - visibleCount} restantes)
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {visibleCount > 5 && (
            <div className="pt-1 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVisibleCount(5)}
                className="text-xs text-muted-foreground"
              >
                Recolher lista
                <ChevronUp className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


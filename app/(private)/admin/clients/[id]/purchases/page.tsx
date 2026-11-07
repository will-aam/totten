"use client";
// app/(private)/admin/clients/[id]/purchases/page.tsx

import { use, useState, useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "@boxicons/react";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface Purchase {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: string;
  paymentMethodName: string | null;
  installment: string | null;
}

interface PurchasesData {
  summary: {
    totalSpent: number;
    totalPurchases: number;
    averageTicket: number;
    pendingAmount: number;
    lastPurchaseDate: string | null;
  };
  purchases: Purchase[];
}

const fmt = (val: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

const fmtDate = (iso: string) => {
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
};

function StatusLabel({ status }: { status: string }) {
  if (status === "PAGO") return <span className="text-[11px] text-emerald-700 font-semibold">Pago</span>;
  if (status === "PENDENTE") return <span className="text-[11px] text-amber-600 font-semibold">Pendente</span>;
  if (status === "ATRASADO") return <span className="text-[11px] text-rose-600 font-semibold">Atrasado</span>;
  if (status === "CANCELADO") return <span className="text-[11px] text-muted-foreground font-semibold">Cancelado</span>;
  return <span className="text-[11px] text-muted-foreground font-semibold">{status}</span>;
}

export default function AdminClientPurchasesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [period, setPeriod] = useState<
    "all" | "this_month" | "last_month" | "last_2_months" | "last_90_days" | "this_year" | "last_year"
  >("all");

  const { data, isLoading } = useSWR<PurchasesData>(
    `clients/${id}/purchases`,
    apiClient,
  );

  const summary = data?.summary;
  const purchases = data?.purchases ?? [];

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
    if (period === "all" && summary) return summary;

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

  if (isLoading) {
    return (
      <>
        <AdminHeader title="Compras do Cliente" />
        <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full">
          <Skeleton className="h-5 w-28 rounded-lg" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </>
    );
  }

  return (
    <>
      <AdminHeader title="Histórico de Compras" />

      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 md:pb-6 animate-in fade-in duration-500 min-h-[calc(100vh-100px)]">

        {/* Back */}
        <Link
          href={`/admin/clients/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao perfil
        </Link>

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
              onClick={() => setPeriod(tab.id as any)}
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

        {/* Resumo */}
        {dynamicSummary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="border rounded-2xl p-4 space-y-1">
              <p className="text-xs text-muted-foreground">Total gasto</p>
              <p className="text-xl font-bold">{fmt(dynamicSummary.totalSpent)}</p>
            </div>
            <div className="border rounded-2xl p-4 space-y-1">
              <p className="text-xs text-muted-foreground">Pagamentos</p>
              <p className="text-xl font-bold">{dynamicSummary.totalPurchases}</p>
            </div>
            <div className="border rounded-2xl p-4 space-y-1">
              <p className="text-xs text-muted-foreground">Ticket médio</p>
              <p className="text-xl font-bold">{fmt(dynamicSummary.averageTicket)}</p>
            </div>
            <div className="border rounded-2xl p-4 space-y-1">
              <p className="text-xs text-muted-foreground">Em aberto</p>
              <p className="text-xl font-bold">{fmt(dynamicSummary.pendingAmount)}</p>
            </div>
          </div>
        )}

        {/* Lista */}
        {filteredPurchases.length === 0 ? (
          <div className="py-16 text-center border rounded-2xl bg-card">
            <p className="text-muted-foreground text-sm">
              {period === "all"
                ? "Nenhuma compra registrada para este cliente."
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
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium px-1 pb-1">
              {filteredPurchases.length} lançamento{filteredPurchases.length !== 1 ? "s" : ""}
            </p>
            <div className="border rounded-2xl divide-y overflow-hidden">
              {filteredPurchases.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-4 py-3.5 gap-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.description}
                      {item.installment && (
                        <span className="text-xs text-muted-foreground font-normal ml-1">
                          ({item.installment})
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <span>{fmtDate(item.date)}</span>
                      {item.paymentMethodName && (
                        <>
                          <span>·</span>
                          <span>{item.paymentMethodName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">{fmt(item.amount)}</p>
                    <StatusLabel status={item.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

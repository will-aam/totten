"use client";
// app/(private)/admin/clients/[id]/purchases/page.tsx

import { use } from "react";
import useSWR from "swr";
import Link from "next/link";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "@boxicons/react";
import { apiClient } from "@/lib/api-client";

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

  const { data, isLoading } = useSWR<PurchasesData>(
    `clients/${id}/purchases`,
    apiClient,
  );

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

  const summary = data?.summary;
  const purchases = data?.purchases ?? [];

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

        {/* Resumo */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="border rounded-2xl p-4 space-y-1">
              <p className="text-xs text-muted-foreground">Total investido</p>
              <p className="text-xl font-bold">{fmt(summary.totalSpent)}</p>
            </div>
            <div className="border rounded-2xl p-4 space-y-1">
              <p className="text-xs text-muted-foreground">Pagamentos</p>
              <p className="text-xl font-bold">{summary.totalPurchases}</p>
            </div>
            <div className="border rounded-2xl p-4 space-y-1">
              <p className="text-xs text-muted-foreground">Ticket médio</p>
              <p className="text-xl font-bold">{fmt(summary.averageTicket)}</p>
            </div>
            <div className="border rounded-2xl p-4 space-y-1">
              <p className="text-xs text-muted-foreground">Em aberto</p>
              <p className="text-xl font-bold">{fmt(summary.pendingAmount)}</p>
            </div>
          </div>
        )}

        {/* Lista */}
        {purchases.length === 0 ? (
          <div className="py-16 text-center border rounded-2xl">
            <p className="text-muted-foreground text-sm">Nenhuma compra registrada para este cliente.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium px-1 pb-1">
              {purchases.length} lançamento{purchases.length !== 1 ? "s" : ""}
            </p>
            <div className="border rounded-2xl divide-y overflow-hidden">
              {purchases.map((item) => (
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

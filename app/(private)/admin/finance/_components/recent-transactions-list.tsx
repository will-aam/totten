// app/(private)/admin/finance/_components/recent-transactions-list.tsx
"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Transaction, TransactionStatus } from "@/types/finance";
import {
  ArrowDownRight,
  ArrowUpRight,
  Receipt,
  User,
  InfoCircle,
} from "@boxicons/react";
import { cn } from "@/lib/utils";

export interface ExtendedTransaction extends Transaction {
  professionalName?: string | null;
}

interface RecentTransactionsListProps {
  data: ExtendedTransaction[];
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

function getPaymentMethodLabel(method: string | null | undefined): string {
  if (!method) return "";
  const m = method.toUpperCase();
  if (m.includes("PIX")) return "Pix";
  if (m.includes("CREDIT") || m.includes("CREDITO")) return "Crédito";
  if (m.includes("DEBIT") || m.includes("DEBITO")) return "Débito";
  if (m.includes("CASH") || m.includes("DINHEIRO")) return "Dinheiro";
  return "Outros";
}

function getCleanDescription(
  desc: string,
  type: string,
  clientName?: string | null,
) {
  if (!desc) return type === "RECEITA" ? "Receita" : "Despesa";

  let clean = desc.split("|")[0];

  clean = clean.replace(/\(Totem[^)]+\):?/gi, "");
  clean = clean.replace(/\(Agend[^)]+\):?/gi, "");
  clean = clean.replace(
    /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi,
    "",
  );
  clean = clean.replace(/[a-z0-9]{24,30}/gi, "");
  clean = clean.replace(/Custo fixo de material/gi, "");
  clean = clean.replace(/Custo de insumo/gi, "");
  clean = clean.replace(/Agendamento/gi, "");
  clean = clean.replace(/ID:/gi, "");

  if (clientName) {
    const escapedName = clientName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const nameRegex = new RegExp(`\\(\\s*${escapedName}\\s*\\)`, "i");
    clean = clean.replace(nameRegex, "");
  }

  clean = clean.replace(/\s{2,}/g, " ");
  clean = clean.replace(/-\s*-/g, "-");
  clean = clean.replace(/^[-\s,:]+|[-\s,:]+$/g, "");

  return clean.trim() || (type === "RECEITA" ? "Receita" : "Despesa");
}

const StatusBadge = ({ status }: { status: TransactionStatus }) => {
  const styles = {
    PAGO: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 ring-1 ring-emerald-500/20",
    PENDENTE:
      "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 ring-1 ring-amber-500/20",
    ATRASADO:
      "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400 ring-1 ring-rose-500/20",
  };
  return (
    <Badge
      variant="secondary"
      className={cn(
        styles[status],
        "border-none text-[10px] px-2 py-0.5 h-5 uppercase font-bold tracking-wider",
      )}
    >
      {status === "PAGO"
        ? "Pago"
        : status === "PENDENTE"
          ? "Pendente"
          : "Atrasado"}
    </Badge>
  );
};

function TransactionListItem({
  transaction,
  onClick,
}: {
  transaction: ExtendedTransaction;
  onClick: () => void;
}) {
  const isIncome = transaction.type === "RECEITA";

  let rawDesc = transaction.description || "";
  let taxDiscount = "";

  const taxMatch = rawDesc.match(/\(Taxa abatida:\s*(R\$\s*[\d,.]+)\)/i);
  if (taxMatch) {
    taxDiscount = taxMatch[1];
    rawDesc = rawDesc.replace(taxMatch[0], "").trim();
  }

  const displayTitle = getCleanDescription(
    rawDesc,
    transaction.type,
    transaction.clientName,
  );

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between py-3 md:py-4 border-b border-border/40 last:border-0 hover:bg-muted/40 transition-all duration-300 px-3 -mx-3 rounded-2xl group cursor-pointer"
    >
      <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 pr-2">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold shadow-sm transition-all duration-300 group-hover:scale-110",
            isIncome
              ? "bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-[0_4px_15px_rgb(16,185,129,0.2)]"
              : "bg-rose-500/10 text-rose-600 group-hover:bg-rose-500 group-hover:text-white group-hover:shadow-[0_4px_15px_rgb(244,63,94,0.2)]",
          )}
        >
          {isIncome ? (
            <ArrowUpRight className="h-5 w-5" />
          ) : (
            <ArrowDownRight className="h-5 w-5" />
          )}
        </div>

        <div className="flex flex-col min-w-0">
          <span
            className="text-sm font-bold text-foreground leading-tight mb-1.5 truncate group-hover:text-primary transition-colors"
            title={transaction.description}
          >
            {displayTitle}
          </span>
          <span className="text-[11px] font-medium text-muted-foreground leading-none flex items-center gap-1.5 truncate">
            <span className="shrink-0 font-semibold">
              {dateFormatter.format(new Date(transaction.date))}
            </span>
            {transaction.paymentMethod && (
              <>
                <span className="w-1 h-1 rounded-full bg-border"></span>
                <span className="shrink-0 uppercase tracking-wide text-[10px]">
                  {getPaymentMethodLabel(transaction.paymentMethod)}
                </span>
              </>
            )}
            {transaction.clientName && (
              <>
                <span className="w-1 h-1 rounded-full bg-border"></span>
                <span className="truncate">{transaction.clientName}</span>
              </>
            )}
            {transaction.professionalName && (
              <>
                <span className="w-1 h-1 rounded-full bg-border"></span>
                <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 shrink-0 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                  <User size="xs" /> {transaction.professionalName}
                </span>
              </>
            )}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span
          className={cn(
            "text-sm font-black leading-none tracking-tight",
            isIncome
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-foreground",
          )}
        >
          {isIncome ? "+" : "-"} {currencyFormatter.format(transaction.amount)}
        </span>
        {taxDiscount && (
          <span className="text-[9px] font-bold text-rose-500/80 uppercase tracking-widest leading-none">
            - taxa {taxDiscount}
          </span>
        )}
        <div className="mt-0.5">
          <StatusBadge status={transaction.status} />
        </div>
      </div>
    </div>
  );
}

export function RecentTransactionsList({ data }: RecentTransactionsListProps) {
  const [viewingTx, setViewingTx] = useState<ExtendedTransaction | null>(null);

  return (
    <>
      <Card className="border-0 shadow-none bg-transparent md:border md:border-border/50 md:shadow-lg md:bg-background/50 md:backdrop-blur-sm md:rounded-3xl mt-2 md:mt-0 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -z-10 pointer-events-none" />
        <CardHeader className="px-0 pt-0 md:pt-6 md:px-6 z-10 relative">
          <CardTitle className="flex items-center gap-2 text-foreground font-black text-lg">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <Receipt className="h-5 w-5" />
            </div>
            Histórico Recente
          </CardTitle>
          <CardDescription className="font-medium text-xs uppercase tracking-widest ml-11">
            Últimas movimentações financeiras registradas
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0 md:pb-6 md:px-6 z-10 relative">
          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/20 rounded-2xl border border-dashed border-border/60">
              <div className="p-4 bg-muted/40 rounded-full mb-3">
                <Receipt className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                Nenhuma movimentação.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {data.map((transaction) => (
                <TransactionListItem
                  key={transaction.id}
                  transaction={transaction}
                  onClick={() => setViewingTx(transaction)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL DE DETALHES - GLASSMORPHISM PREMIUM */}
      <Dialog
        open={!!viewingTx}
        onOpenChange={(open) => !open && setViewingTx(null)}
      >
        <DialogContent className="rounded-4xl sm:max-w-md border-border/40 shadow-2xl bg-background/80 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <InfoCircle className="h-5 w-5" />
              </div>
              Detalhes da Movimentação
            </DialogTitle>
          </DialogHeader>

          {viewingTx && (
            <div className="space-y-5 py-2">
              <div className="flex items-center justify-between bg-linear-to-br from-muted/30 to-muted/10 p-5 rounded-3xl border border-border/50 shadow-sm">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
                    Valor
                  </span>
                  <span
                    className={cn(
                      "text-3xl font-black tracking-tighter",
                      viewingTx.type === "RECEITA"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400",
                    )}
                  >
                    {currencyFormatter.format(viewingTx.amount)}
                  </span>
                </div>
                <StatusBadge status={viewingTx.status} />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                  Descrição Completa
                </span>
                <div className="bg-muted/20 p-5 rounded-2xl border border-border/40 text-sm font-medium leading-relaxed text-foreground shadow-inner">
                  {viewingTx.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 bg-muted/10 p-4 rounded-2xl border border-border/40">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Data
                  </span>
                  <span className="text-sm font-bold">
                    {dateFormatter.format(new Date(viewingTx.date))}
                  </span>
                </div>
                {viewingTx.clientName && (
                  <div className="flex flex-col gap-1.5 bg-muted/10 p-4 rounded-2xl border border-border/40">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      Cliente
                    </span>
                    <span className="text-sm font-bold truncate">
                      {viewingTx.clientName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

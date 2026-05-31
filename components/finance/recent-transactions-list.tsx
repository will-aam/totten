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

// 🔥 Função de limpeza do texto aprimorada
function getCleanDescription(
  desc: string,
  type: string,
  clientName?: string | null,
) {
  if (!desc) return type === "RECEITA" ? "Receita" : "Despesa";

  let clean = desc.split("|")[0];

  // 1. Remove blocos inteiros entre parênteses gerados pelo sistema (ex: "(Totem - Agend: ID):")
  clean = clean.replace(/\(Totem[^)]+\):?/gi, "");
  clean = clean.replace(/\(Agend[^)]+\):?/gi, "");

  // 2. Remove UUIDs (padrão com traços) e CUIDs (padrão de ~25 letras e números)
  clean = clean.replace(
    /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi,
    "",
  );
  clean = clean.replace(/[a-z0-9]{24,30}/gi, "");

  // 3. Remove termos técnicos e palavras soltas
  clean = clean.replace(/Custo fixo de material/gi, "");
  clean = clean.replace(/Custo de insumo/gi, "");
  clean = clean.replace(/Agendamento/gi, "");
  clean = clean.replace(/ID:/gi, "");

  // 4. Remove o nome do cliente se estiver entre parênteses no meio da string
  if (clientName) {
    const escapedName = clientName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const nameRegex = new RegExp(`\\(\\s*${escapedName}\\s*\\)`, "i");
    clean = clean.replace(nameRegex, "");
  }

  // 5. Limpeza final de formatação (espaços duplos, dois pontos, traços ou vírgulas sobrando nas pontas)
  clean = clean.replace(/\s{2,}/g, " "); // Remove espaços duplos
  clean = clean.replace(/-\s*-/g, "-"); // Arruma traços duplos
  clean = clean.replace(/^[-\s,:]+|[-\s,:]+$/g, ""); // Remove lixo do começo e do final da frase

  return clean.trim() || (type === "RECEITA" ? "Receita" : "Despesa");
}

const StatusBadge = ({ status }: { status: TransactionStatus }) => {
  const styles = {
    PAGO: "bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
    PENDENTE:
      "bg-amber-100/50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
    ATRASADO:
      "bg-rose-100/50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400",
  };
  return (
    <Badge
      variant="secondary"
      className={`${styles[status]} border-none text-[10px] px-1.5 py-0 h-4 uppercase`}
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

  // Processamento do Título e Taxas
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
      className="flex items-center justify-between py-3 md:py-4 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors px-2 -mx-2 rounded-lg group cursor-pointer"
    >
      <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 pr-2">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold shadow-sm border transition-transform group-hover:scale-105",
            isIncome
              ? "bg-emerald-100/50 text-emerald-600 border-emerald-200/50 dark:bg-emerald-900/30 dark:border-emerald-800/50"
              : "bg-rose-100/50 text-rose-600 border-rose-200/50 dark:bg-rose-900/30 dark:border-rose-800/50",
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
            className="text-sm font-semibold text-foreground leading-tight mb-1 truncate"
            title={transaction.description}
          >
            {displayTitle}
          </span>
          <span className="text-xs text-muted-foreground leading-none flex items-center gap-1.5 truncate">
            <span className="shrink-0">
              {dateFormatter.format(new Date(transaction.date))}
            </span>
            {transaction.paymentMethod && (
              <>
                <span>•</span>
                <span className="shrink-0">
                  {getPaymentMethodLabel(transaction.paymentMethod)}
                </span>
              </>
            )}
            {transaction.clientName && (
              <>
                <span>•</span>
                <span className="truncate">{transaction.clientName}</span>
              </>
            )}
            {transaction.professionalName && (
              <>
                <span>•</span>
                <span className="flex items-center gap-0.5 font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                  <User size="xs" /> {transaction.professionalName}
                </span>
              </>
            )}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <span
          className={cn(
            "text-sm font-bold leading-none",
            isIncome
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-foreground",
          )}
        >
          {isIncome ? "+" : "-"} {currencyFormatter.format(transaction.amount)}
        </span>
        {taxDiscount && (
          <span className="text-[9px] font-medium text-muted-foreground/80 leading-none">
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
      <Card className="border-0 shadow-none bg-transparent md:border md:shadow-sm md:bg-card mt-2 md:mt-0">
        <CardHeader className="px-0 pt-0 md:pt-6 md:px-6">
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Receipt className="h-5 w-5 text-primary" />
            Histórico Recente
          </CardTitle>
          <CardDescription>
            Últimas movimentações financeiras registradas
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0 md:pb-6 md:px-6">
          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/30 rounded-lg border border-dashed border-border">
              <Receipt className="h-10 w-10 text-muted-foreground/40" />
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                Nenhuma movimentação encontrada.
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

      {/* MODAL DE DETALHES */}
      <Dialog
        open={!!viewingTx}
        onOpenChange={(open) => !open && setViewingTx(null)}
      >
        <DialogContent className="rounded-3xl sm:max-w-md border-border/50 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <InfoCircle className="h-6 w-6 text-primary" />
              Detalhes da Movimentação
            </DialogTitle>
          </DialogHeader>

          {viewingTx && (
            <div className="space-y-5 py-2">
              <div className="flex items-center justify-between bg-muted/20 p-4 rounded-2xl border border-border/50">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-muted-foreground">
                    Valor
                  </span>
                  <span
                    className={cn(
                      "text-2xl font-bold",
                      viewingTx.type === "RECEITA"
                        ? "text-emerald-600"
                        : "text-rose-600",
                    )}
                  >
                    {currencyFormatter.format(viewingTx.amount)}
                  </span>
                </div>
                <StatusBadge status={viewingTx.status} />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Descrição Completa
                </span>
                <div className="bg-muted/30 p-4 rounded-xl border border-border/50 text-sm leading-relaxed text-foreground">
                  {viewingTx.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Data
                  </span>
                  <span className="text-sm font-semibold">
                    {dateFormatter.format(new Date(viewingTx.date))}
                  </span>
                </div>
                {viewingTx.clientName && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      Cliente
                    </span>
                    <span className="text-sm font-semibold">
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

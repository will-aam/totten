// components/finance/recent-transactions-list.tsx
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PaymentMethod, Transaction, TransactionStatus } from "@/types/finance";
import { ArrowDownRight, ArrowUpRight, ReceiptText } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecentTransactionsListProps {
  data: Transaction[];
}

// 🔥 OTIMIZAÇÃO: Formatadores instanciados uma única vez fora do componente
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

// Função auxiliar para evitar erros de tipagem com o Enum do Prisma
function getPaymentMethodLabel(method: string | null | undefined): string {
  if (!method) return "";
  const m = method.toUpperCase();
  if (m.includes("PIX")) return "Pix";
  if (m.includes("CREDIT") || m.includes("CREDITO")) return "Crédito";
  if (m.includes("DEBIT") || m.includes("DEBITO")) return "Débito";
  if (m.includes("CASH") || m.includes("DINHEIRO")) return "Dinheiro";
  return "Outros";
}

function TransactionListItem({ transaction }: { transaction: Transaction }) {
  const isIncome = transaction.type === "RECEITA";

  const StatusBadge = ({ status }: { status: TransactionStatus }) => {
    switch (status) {
      case "PAGO":
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-none text-[10px] px-1.5 py-0 h-4"
          >
            Pago
          </Badge>
        );
      case "PENDENTE":
        return (
          <Badge
            variant="secondary"
            className="bg-amber-100/50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-none text-[10px] px-1.5 py-0 h-4"
          >
            Pendente
          </Badge>
        );
      case "ATRASADO":
        return (
          <Badge
            variant="secondary"
            className="bg-rose-100/50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 border-none text-[10px] px-1.5 py-0 h-4"
          >
            Atrasado
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-between py-3 md:py-4 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors px-2 -mx-2 rounded-lg group">
      <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 pr-4">
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
          <span className="text-sm font-semibold text-foreground leading-tight mb-1 truncate">
            {transaction.description}
          </span>
          <span className="text-xs text-muted-foreground leading-none flex items-center gap-1.5 truncate">
            <span>{dateFormatter.format(new Date(transaction.date))}</span>

            {transaction.paymentMethod && (
              <>
                <span>•</span>
                <span>{getPaymentMethodLabel(transaction.paymentMethod)}</span>
              </>
            )}

            {transaction.clientName && (
              <>
                <span>•</span>
                <span className="truncate">{transaction.clientName}</span>
              </>
            )}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span
          className={cn(
            "text-sm font-bold",
            isIncome
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-foreground",
          )}
        >
          {isIncome ? "+" : "-"} {currencyFormatter.format(transaction.amount)}
        </span>
        <StatusBadge status={transaction.status} />
      </div>
    </div>
  );
}

export function RecentTransactionsList({ data }: RecentTransactionsListProps) {
  return (
    <Card className="border-0 shadow-none bg-transparent md:border md:shadow-sm md:bg-card mt-2 md:mt-0">
      <CardHeader className="px-0 pt-0 md:pt-6 md:px-6">
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <ReceiptText className="h-5 w-5 text-primary" />
          Histórico Recente
        </CardTitle>
        <CardDescription>
          Últimas movimentações financeiras registradas
        </CardDescription>
      </CardHeader>

      <CardContent className="px-0 pb-0 md:pb-6 md:px-6">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/30 rounded-lg border border-dashed border-border">
            <ReceiptText className="h-10 w-10 text-muted-foreground/40" />
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
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

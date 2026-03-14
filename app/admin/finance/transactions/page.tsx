// app/admin/finance/transactions/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminHeader } from "@/components/admin-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Filter,
  Loader2,
  Pencil,
  Trash2,
  MoreVertical,
  Repeat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getFullTransactions,
  deleteTransaction,
  updateTransactionStatus, // 🔥 Importamos a nova Action rápida
} from "@/app/actions/transactions";
import { toast } from "sonner";
import { TransactionStatus } from "@/types/finance";
import { TransactionModal } from "@/components/finance/transaction-modal";

const MONTHS = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de Controle (Deletar e Editar)
  const [deletingTx, setDeletingTx] = useState<any | null>(null);
  const [deleteFuture, setDeleteFuture] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any | null>(
    null,
  );
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);

  // Filtros
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filterType, setFilterType] = useState<"ALL" | "RECEITA" | "DESPESA">(
    "ALL",
  );

  const currentYear = new Date().getFullYear();
  const startYear = 2026;
  const YEARS = Array.from(
    { length: currentYear - startYear + 2 },
    (_, i) => startYear + i,
  );

  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getFullTransactions(selectedMonth, selectedYear);
      setTransactions(data);
    } catch (error) {
      toast.error("Erro ao carregar extrato.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const confirmDelete = async () => {
    if (!deletingTx) return;
    setIsDeletingLoading(true);
    try {
      const res = await deleteTransaction(deletingTx.originalId, deleteFuture);
      if (res.success) {
        toast.success(
          deleteFuture
            ? "Parcelas excluídas com sucesso!"
            : "Movimentação excluída com sucesso!",
        );
        loadTransactions();
      } else {
        toast.error(res.error || "Erro ao excluir.");
      }
    } catch (error) {
      toast.error("Erro na conexão.");
    } finally {
      setIsDeletingLoading(false);
      setDeletingTx(null);
      setDeleteFuture(false);
    }
  };

  // 🔥 Nova Função: Troca Rápida de Status
  const handleStatusChange = async (
    id: string,
    newStatus: TransactionStatus,
  ) => {
    try {
      const res = await updateTransactionStatus(id, newStatus);
      if (res.success) {
        toast.success("Status atualizado com sucesso!");
        loadTransactions(); // Recarrega para refletir a cor nova
      } else {
        toast.error(res.error || "Erro ao atualizar status.");
      }
    } catch (error) {
      toast.error("Erro de conexão ao alterar status.");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const dateObj = new Date(dateString);
    const dayMonth = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
    }).format(dateObj);
    const time = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj);
    return `${dayMonth} ${time}`;
  };

  const paymentMethodMap: Record<string, string> = {
    PIX: "Pix",
    CARTAO_CREDITO: "Crédito",
    CARTAO_DEBITO: "Débito",
    DINHEIRO: "Dinheiro",
    OUTRO: "Outros",
  };

  // 🔥 COMPONENTE ATUALIZADO: Badge Inteligente
  const StatusBadge = ({ transaction }: { transaction: any }) => {
    const isManual = transaction.isManual;
    const status = transaction.status as TransactionStatus;

    let badgeClasses = "";
    let label = "";

    if (status === "PAGO") {
      badgeClasses =
        "bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400";
      label = "Pago";
    } else if (status === "PENDENTE") {
      badgeClasses =
        "bg-amber-100/50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400";
      label = "Pendente";
    } else if (status === "ATRASADO") {
      badgeClasses =
        "bg-rose-100/50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400";
      label = "Atrasado";
    } else {
      return null;
    }

    const baseClasses =
      "text-[10px] px-1.5 py-0 h-4 transition-colors select-none";

    // Se NÃO for editável (gerado pela agenda)
    if (!isManual) {
      return (
        <Badge
          variant="secondary"
          className={cn(baseClasses, badgeClasses, "border-none")}
        >
          {label}
        </Badge>
      );
    }

    // Se FOR editável (manual) -> Ganha Borda e Menu de Clique
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="outline-none focus:outline-none">
          <Badge
            variant="secondary"
            className={cn(
              baseClasses,
              badgeClasses,
              // Dica visual de que é clicável (Borda sutil e hover)
              "cursor-pointer border border-foreground/15 hover:border-foreground/30 hover:opacity-80",
            )}
          >
            {label}
          </Badge>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-30 rounded-xl border border-border/40 shadow-sm p-1 bg-background"
        >
          <DropdownMenuItem
            className="text-xs font-semibold justify-center cursor-pointer rounded-lg text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700 dark:focus:bg-emerald-900/20 dark:text-emerald-400"
            onClick={() => handleStatusChange(transaction.originalId, "PAGO")}
          >
            Pago
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-xs font-semibold justify-center cursor-pointer rounded-lg text-amber-600 focus:bg-amber-50 focus:text-amber-700 dark:focus:bg-amber-900/20 dark:text-amber-400 mt-0.5"
            onClick={() =>
              handleStatusChange(transaction.originalId, "PENDENTE")
            }
          >
            Pendente
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const filteredTransactions = transactions.filter(
    (t) => filterType === "ALL" || t.type === filterType,
  );

  return (
    <>
      <AdminHeader title="Extrato de Movimentações" />

      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-5xl mx-auto w-full pb-24 md:pb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-2xl border border-border/50 shadow-sm">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Calendar className="h-5 w-5 text-muted-foreground hidden sm:block" />
            <Select
              value={selectedMonth.toString()}
              onValueChange={(val) => setSelectedMonth(Number(val))}
            >
              <SelectTrigger className="h-10 w-full sm:w-32.5 rounded-xl font-medium bg-muted/30 border-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {MONTHS.map((m) => (
                  <SelectItem
                    key={m.value}
                    value={m.value.toString()}
                    className="rounded-lg"
                  >
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedYear.toString()}
              onValueChange={(val) => setSelectedYear(Number(val))}
            >
              <SelectTrigger className="h-10 w-full sm:w-25 rounded-xl font-medium bg-muted/30 border-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {YEARS.map((y) => (
                  <SelectItem
                    key={y}
                    value={y.toString()}
                    className="rounded-lg"
                  >
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="h-5 w-5 text-muted-foreground hidden sm:block" />
            <Select
              value={filterType}
              onValueChange={(val: any) => setFilterType(val)}
            >
              <SelectTrigger className="h-10 w-full sm:w-40 rounded-xl font-medium bg-muted/30 border-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="ALL" className="rounded-lg">
                  Todas
                </SelectItem>
                <SelectItem
                  value="RECEITA"
                  className="rounded-lg text-emerald-600"
                >
                  Receitas
                </SelectItem>
                <SelectItem
                  value="DESPESA"
                  className="rounded-lg text-rose-600"
                >
                  Despesas
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col w-full">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/10 rounded-2xl">
              <Filter className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">
                Nenhuma movimentação encontrada neste período.
              </p>
            </div>
          ) : (
            <div className="flex flex-col w-full">
              {filteredTransactions.map((transaction) => {
                const isIncome = transaction.type === "RECEITA";

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between py-4 border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors px-1 sm:px-2 rounded-lg group"
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
                        <span className="text-sm font-semibold text-foreground leading-tight mb-1 truncate flex items-center gap-2">
                          {transaction.description}
                          {transaction.installment && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] h-4 px-1.5 py-0 flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary/20 border-none"
                            >
                              <Repeat className="h-3 w-3" />
                              {transaction.installment}
                            </Badge>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground leading-none flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span>{formatDate(transaction.date)}</span>
                          {transaction.paymentMethod && (
                            <>
                              <span>•</span>
                              <span>
                                {paymentMethodMap[transaction.paymentMethod] ||
                                  transaction.paymentMethod}
                              </span>
                            </>
                          )}
                          {transaction.clientName && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-30">
                                {transaction.clientName}
                              </span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                      <div className="flex flex-col items-end gap-1.5">
                        <span
                          className={cn(
                            "text-sm font-bold",
                            isIncome
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-foreground",
                          )}
                        >
                          {isIncome ? "+" : "-"}{" "}
                          {formatCurrency(transaction.amount)}
                        </span>

                        {/* 🔥 Injetamos a transação inteira no Badge Inteligente */}
                        <StatusBadge transaction={transaction} />
                      </div>

                      <div className="flex items-center justify-end w-8 sm:w-10">
                        {transaction.isManual ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:bg-muted/30 hover:text-foreground rounded-full border-none focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-36 rounded-2xl border border-border/40 shadow-sm p-1 bg-background"
                            >
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer rounded-xl text-muted-foreground focus:bg-muted/40 focus:text-foreground font-medium transition-colors"
                                onClick={() =>
                                  setEditingTransaction(transaction)
                                }
                              >
                                <Pencil className="h-4 w-4" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer rounded-xl text-rose-500 focus:bg-rose-500/10 focus:text-rose-600 dark:focus:bg-rose-900/20 dark:focus:text-rose-400 font-medium transition-colors mt-0.5"
                                onClick={() => setDeletingTx(transaction)}
                              >
                                <Trash2 className="h-4 w-4" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <div className="h-8 w-8" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <AlertDialog
        open={!!deletingTx}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingTx(null);
            setDeleteFuture(false);
          }
        }}
      >
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">
              Excluir Movimentação?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Você está prestes a excluir esta transação. Essa ação atualizará
                o seu caixa e não pode ser desfeita.
              </p>

              {deletingTx?.recurrence_id && (
                <label className="flex items-start gap-3 p-4 border border-border/50 rounded-xl bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors">
                  <Checkbox
                    checked={deleteFuture}
                    onCheckedChange={(checked) => setDeleteFuture(!!checked)}
                    className="mt-1 shadow-none"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground">
                      Excluir parcelas futuras também
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5">
                      Esta transação e todas as repetições criadas após ela
                      serão excluídas.
                    </span>
                  </div>
                </label>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-none bg-muted">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeletingLoading}
              className="rounded-xl bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeletingLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Sim, excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODAL DE EDIÇÃO */}
      {editingTransaction && (
        <TransactionModal
          isOpen={!!editingTransaction}
          onClose={() => {
            setEditingTransaction(null);
            loadTransactions();
          }}
          type={editingTransaction.type === "RECEITA" ? "INCOME" : "EXPENSE"}
          initialData={{
            id: editingTransaction.originalId,
            description: editingTransaction.description,
            amount: editingTransaction.amount,
            date: editingTransaction.date,
            status: editingTransaction.status,
            paymentMethodId: undefined,
            recurrence_id: editingTransaction.recurrence_id,
          }}
        />
      )}
    </>
  );
}

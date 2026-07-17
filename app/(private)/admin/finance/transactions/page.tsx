// app/(private)/admin/finance/transactions/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Filter,
  LoaderDots,
  Pencil,
  Trash,
  ChevronDown,
  Repeat,
  Search,
  ChevronLeft,
  ChevronRight,
  InfoCircle,
} from "@boxicons/react";
import { cn } from "@/lib/utils";
import {
  getPaginatedTransactions,
  deleteTransaction,
  updateTransactionStatus,
} from "@/app/actions/transactions";
import { toast } from "sonner";
import { TransactionStatus } from "@/types/finance";
import { TransactionModal } from "../_components/transaction-modal";
import { useDebounce } from "@/hooks/use-debounce";

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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const [deletingTx, setDeletingTx] = useState<any | null>(null);
  const [deleteFuture, setDeleteFuture] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any | null>(
    null,
  );
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);

  const [viewingTx, setViewingTx] = useState<any | null>(null);

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

  useEffect(() => {
    setPage(1);
  }, [selectedMonth, selectedYear, filterType, debouncedSearch]);

  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const searchQuery =
        debouncedSearch.trim().length >= 3 ? debouncedSearch.trim() : "";
      const response = await getPaginatedTransactions({
        month: selectedMonth,
        year: selectedYear,
        type: filterType === "ALL" ? undefined : filterType,
        page,
        limit: 20,
        search: searchQuery,
      });
      setTransactions(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      toast.error("Erro ao carregar extrato.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear, filterType, page, debouncedSearch]);

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

  const handleStatusChange = async (
    id: string,
    newStatus: TransactionStatus,
  ) => {
    try {
      const res = await updateTransactionStatus(id, newStatus);
      if (res.success) {
        toast.success("Status atualizado com sucesso!");
        loadTransactions();
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

  const StatusBadge = ({ transaction }: { transaction: any }) => {
    const isManual = transaction.isManual;
    const status = transaction.status as TransactionStatus;

    let badgeClasses = "";
    let label = "";

    if (status === "PAGO") {
      badgeClasses =
        "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 ring-1 ring-emerald-500/20";
      label = "Pago";
    } else if (status === "PENDENTE") {
      badgeClasses =
        "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 ring-1 ring-amber-500/20";
      label = "Pendente";
    } else if (status === "ATRASADO") {
      badgeClasses =
        "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400 ring-1 ring-rose-500/20";
      label = "Atrasado";
    } else return null;

    const baseClasses =
      "text-[10px] px-2 py-0.5 h-5 uppercase font-bold tracking-wider transition-all select-none border-none";

    if (!isManual) {
      return (
        <Badge variant="secondary" className={cn(baseClasses, badgeClasses)}>
          {label}
        </Badge>
      );
    }

    return (
      <div onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none focus:outline-none">
            <Badge
              variant="secondary"
              className={cn(
                baseClasses,
                badgeClasses,
                "cursor-pointer hover:ring-2 hover:opacity-80",
              )}
            >
              {label} <ChevronDown className="ml-1 h-3 w-3" />
            </Badge>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-30 rounded-2xl border border-border/40 shadow-xl p-1.5 bg-background/95 backdrop-blur-md"
          >
            <DropdownMenuItem
              className="text-xs font-bold justify-center cursor-pointer rounded-xl text-emerald-600 focus:bg-emerald-500/10 focus:text-emerald-700 dark:focus:bg-emerald-900/20 dark:text-emerald-400 py-2.5"
              onClick={() => handleStatusChange(transaction.originalId, "PAGO")}
            >
              Marcar como Pago
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-xs font-bold justify-center cursor-pointer rounded-xl text-amber-600 focus:bg-amber-500/10 focus:text-amber-700 dark:focus:bg-amber-900/20 dark:text-amber-400 mt-1 py-2.5"
              onClick={() =>
                handleStatusChange(transaction.originalId, "PENDENTE")
              }
            >
              Marcar Pendente
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <>
      <AdminHeader title="Extrato de Movimentações" />

      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full pb-24 md:pb-6 animate-in fade-in duration-700 min-h-[calc(100vh-100px)]">
        {/* BARRA DE FILTROS - PREMIUM GLASSMORPHISM */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-background/50 backdrop-blur-md p-4 rounded-3xl border border-border/40 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -z-10 pointer-events-none" />

            <div className="flex items-center gap-2 w-full md:w-auto relative z-10">
              <div className="p-2 bg-primary/10 rounded-xl text-primary hidden sm:block">
                <Calendar className="h-5 w-5" />
              </div>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(val) => setSelectedMonth(Number(val))}
              >
                <SelectTrigger className="h-12 w-full sm:w-36 rounded-2xl font-bold bg-muted/20 border-border/40 hover:bg-muted/30 focus-visible:ring-primary/30 transition-all shadow-inner">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/50 shadow-xl">
                  {MONTHS.map((m) => (
                    <SelectItem
                      key={m.value}
                      value={m.value.toString()}
                      className="rounded-xl font-medium"
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
                <SelectTrigger className="h-12 w-full sm:w-28 rounded-2xl font-bold bg-muted/20 border-border/40 hover:bg-muted/30 focus-visible:ring-primary/30 transition-all shadow-inner">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/50 shadow-xl">
                  {YEARS.map((y) => (
                    <SelectItem
                      key={y}
                      value={y.toString()}
                      className="rounded-xl font-medium"
                    >
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto relative z-10">
              <div className="relative w-full sm:w-72 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="text"
                  placeholder="Buscar transação..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 h-12 rounded-2xl bg-muted/20 border-border/40 hover:bg-muted/30 font-bold w-full focus-visible:ring-primary/30 transition-all shadow-inner"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="p-2 bg-muted/30 rounded-xl text-muted-foreground hidden sm:block border border-border/40">
                  <Filter className="h-5 w-5" />
                </div>
                <Select
                  value={filterType}
                  onValueChange={(val: any) => setFilterType(val)}
                >
                  <SelectTrigger className="h-12 w-full sm:w-40 rounded-2xl font-bold bg-muted/20 border-border/40 hover:bg-muted/30 focus-visible:ring-primary/30 transition-all shadow-inner">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border/50 shadow-xl">
                    <SelectItem value="ALL" className="rounded-xl font-medium">
                      Todas
                    </SelectItem>
                    <SelectItem
                      value="RECEITA"
                      className="rounded-xl font-bold text-emerald-600 focus:text-emerald-700"
                    >
                      Receitas
                    </SelectItem>
                    <SelectItem
                      value="DESPESA"
                      className="rounded-xl font-bold text-rose-600 focus:text-rose-700"
                    >
                      Despesas
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* LISTAGEM DE TRANSAÇÕES */}
        <div className="flex flex-col w-full bg-background/40 backdrop-blur-sm rounded-3xl border border-border/40 p-2 sm:p-4 shadow-sm">
          {isLoading ? (
            <div className="flex justify-center items-center py-24">
              <LoaderDots className="h-10 w-10 animate-spin text-primary/40" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-muted/10 rounded-2xl border border-dashed border-border/60 mx-2">
              <div className="p-4 bg-muted/30 rounded-full mb-4">
                <Filter className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                {searchTerm.length >= 3
                  ? "Nenhuma movimentação na busca."
                  : "Nenhuma movimentação neste período."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col w-full">
              {transactions.map((transaction) => {
                const isIncome = transaction.type === "RECEITA";
                const displayTitle = getCleanDescription(
                  transaction.description,
                  transaction.type,
                  transaction.clientName,
                );

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between py-4 border-b border-border/40 last:border-0 hover:bg-muted/40 transition-all duration-300 px-3 rounded-2xl group cursor-pointer"
                    onClick={() => setViewingTx(transaction)}
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
                          className="text-sm font-bold text-foreground leading-tight mb-1.5 truncate flex items-center gap-2 group-hover:text-primary transition-colors"
                          title={transaction.description}
                        >
                          {displayTitle}
                          {transaction.installment && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] h-5 px-2 py-0 flex items-center gap-1 bg-primary/10 text-primary border-none font-bold tracking-wider"
                            >
                              <Repeat className="h-3 w-3" />{" "}
                              {transaction.installment}
                            </Badge>
                          )}
                        </span>
                        <span className="text-[11px] font-medium text-muted-foreground leading-none flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="font-semibold">
                            {formatDate(transaction.date)}
                          </span>
                          {transaction.paymentMethod && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-border"></span>
                              <span className="uppercase tracking-wide text-[10px]">
                                {paymentMethodMap[transaction.paymentMethod] ||
                                  transaction.paymentMethod}
                              </span>
                            </>
                          )}
                          {transaction.clientName && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-border"></span>
                              <span className="truncate max-w-32">
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
                            "text-sm font-black tracking-tight",
                            isIncome
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-foreground",
                          )}
                        >
                          {isIncome ? "+" : "-"}{" "}
                          {formatCurrency(transaction.amount)}
                        </span>
                        <StatusBadge transaction={transaction} />
                      </div>

                      <div
                        className="flex items-center justify-end w-8 sm:w-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {transaction.isManual ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full border-none focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors shadow-sm"
                              >
                                <ChevronDown className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-40 rounded-2xl border border-border/40 shadow-xl p-1.5 bg-background/95 backdrop-blur-md"
                            >
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer rounded-xl text-foreground focus:bg-primary/10 focus:text-primary font-bold transition-colors py-2.5"
                                onClick={() =>
                                  setEditingTransaction(transaction)
                                }
                              >
                                <Pencil className="h-4 w-4" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer rounded-xl text-rose-500 focus:bg-rose-500/10 focus:text-rose-600 dark:focus:bg-rose-900/20 dark:focus:text-rose-400 font-bold transition-colors mt-1 py-2.5"
                                onClick={() => setDeletingTx(transaction)}
                              >
                                <Trash className="h-4 w-4" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <div className="h-9 w-9" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PAGINAÇÃO GLASSMORPHISM */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 bg-background/50 backdrop-blur-md p-4 rounded-3xl border border-border/40 shadow-sm">
            <p className="text-xs font-black text-muted-foreground uppercase tracking-wider text-center sm:text-left w-full sm:w-auto">
              Página {page} de {totalPages}
            </p>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
                className="rounded-2xl h-12 font-bold bg-muted/20 border-border/40 hover:bg-muted/40 transition-all shadow-sm px-5"
              >
                <ChevronLeft removePadding className="h-5 w-5 mr-1" /> Anterior
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || isLoading}
                className="rounded-2xl h-12 font-bold bg-muted/20 border-border/40 hover:bg-muted/40 transition-all shadow-sm px-5"
              >
                Próxima <ChevronRight removePadding className="h-5 w-5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE DETALHES RÁPIDOS - PREMIUM GLASSMORPHISM */}
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
                    {formatCurrency(viewingTx.amount)}
                  </span>
                </div>
                <StatusBadge transaction={viewingTx} />
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
                    {formatDate(viewingTx.date)}
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

      {/* ALERT DIALOG DE EXCLUSÃO PREMIUM */}
      <AlertDialog
        open={!!deletingTx}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingTx(null);
            setDeleteFuture(false);
          }
        }}
      >
        <AlertDialogContent className="rounded-4xl sm:max-w-md border-border/40 shadow-2xl bg-background/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-foreground">
              Excluir Movimentação?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 text-muted-foreground font-medium text-sm leading-relaxed">
              <p>
                Você está prestes a excluir esta transação. Essa ação atualizará
                o seu caixa e não pode ser desfeita.
              </p>
              {deletingTx?.recurrence_id && (
                <label className="flex items-start gap-4 p-5 border border-rose-500/20 rounded-3xl bg-rose-500/5 cursor-pointer hover:bg-rose-500/10 transition-colors shadow-sm group">
                  <Checkbox
                    checked={deleteFuture}
                    onCheckedChange={(checked) => setDeleteFuture(!!checked)}
                    className="mt-0.5 shadow-none data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-rose-600 dark:text-rose-400 group-hover:text-rose-700 transition-colors">
                      Excluir parcelas futuras
                    </span>
                    <span className="text-xs text-rose-600/70 dark:text-rose-400/70 mt-1">
                      Esta transação e todas as repetições criadas após ela
                      serão excluídas do caixa.
                    </span>
                  </div>
                </label>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel className="rounded-2xl h-12 font-bold border-border/40 bg-muted/30 hover:bg-muted/50 px-6">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeletingLoading}
              className="rounded-2xl h-12 font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-[0_4px_20px_rgb(244,63,94,0.3)] hover:shadow-[0_6px_25px_rgb(244,63,94,0.4)] transition-all px-6"
            >
              {isDeletingLoading ? (
                <LoaderDots className="h-5 w-5 animate-spin" />
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

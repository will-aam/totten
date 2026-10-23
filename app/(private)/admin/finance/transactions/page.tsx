// app/(private)/admin/finance/transactions/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import useSWR from "swr";
import { invalidateFinanceCaches } from "../_lib/finance-cache";
import {
  getCleanDescription,
  parseTransactionDescription,
} from "../_lib/transaction-formatters";
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
  InfoCircle,
  X,
  CreditCard,
  Wallet,
  Tag,
} from "@boxicons/react";
import { cn } from "@/lib/utils";
import {
  getPaginatedTransactions,
  deleteTransaction,
  updateTransactionStatus,
} from "@/app/actions/transactions";
import { getPaymentMethods } from "@/app/actions/payment-methods";
import { toast } from "sonner";
import { TransactionStatus } from "@/types/finance";
import { TransactionModal } from "../_components/transaction-modal";
import { FinanceSpeedDial } from "../_components/finance-speed-dial";
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

type DateMode = "month" | "day" | "range" | "all";

export default function TransactionsPage() {
  // Paginação padrão do sistema
  const [page, setPage] = useState(1);

  // Busca Inteligente
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  // Filtros de Data
  const [dateMode, setDateMode] = useState<DateMode>("month");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [specificDate, setSpecificDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Outros Filtros
  const [filterType, setFilterType] = useState<"ALL" | "RECEITA" | "DESPESA">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | TransactionStatus>("ALL");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("ALL");

  // Modais e Ações
  const [deletingTx, setDeletingTx] = useState<any | null>(null);
  const [deleteFuture, setDeleteFuture] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);
  const [viewingTx, setViewingTx] = useState<any | null>(null);

  const currentYear = new Date().getFullYear();
  const startYear = 2026;
  const YEARS = Array.from(
    { length: currentYear - startYear + 2 },
    (_, i) => startYear + i,
  );

  // Reiniciar paginação quando qualquer filtro for alterado
  useEffect(() => {
    setPage(1);
  }, [
    dateMode,
    selectedMonth,
    selectedYear,
    specificDate,
    startDate,
    endDate,
    filterType,
    statusFilter,
    paymentMethodFilter,
    debouncedSearch,
  ]);

  // Parâmetros memoizados para a chave do SWR
  const queryParams = useMemo(() => {
    const params: any = {
      page,
      limit: 25,
      type: filterType === "ALL" ? undefined : filterType,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      paymentMethod:
        paymentMethodFilter === "ALL" ? undefined : paymentMethodFilter,
      search: debouncedSearch.trim() || undefined,
    };

    if (dateMode === "day" && specificDate) {
      params.specificDate = specificDate;
    } else if (dateMode === "range") {
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
    } else if (dateMode === "month") {
      params.month = selectedMonth;
      params.year = selectedYear;
    }

    return params;
  }, [
    page,
    dateMode,
    selectedMonth,
    selectedYear,
    specificDate,
    startDate,
    endDate,
    filterType,
    statusFilter,
    paymentMethodFilter,
    debouncedSearch,
  ]);

  // Consulta otimizada com SWR (mantém dados anteriores e elimina re-buscas desnecessárias ao trocar de aba)
  const {
    data: response,
    isLoading: isTransactionsLoading,
    mutate: mutateTransactions,
  } = useSWR(
    ["finance-transactions", queryParams],
    ([, params]) => getPaginatedTransactions(params),
    {
      keepPreviousData: true,
    },
  );

  const transactions = response?.data || [];
  const totalPages = response?.totalPages || 1;
  const totalCount = response?.total || 0;
  const isLoading = isTransactionsLoading && transactions.length === 0;

  // Carregar formas de pagamento cadastradas com SWR compartilhado
  const { data: paymentMethodsList = [] } = useSWR(
    "finance-payment-methods",
    getPaymentMethods,
    {
      keepPreviousData: true,
    },
  );

  const refreshData = useCallback(async () => {
    await mutateTransactions();
    invalidateFinanceCaches();
  }, [mutateTransactions]);

  // Agrupamento por Dia
  const groupedTransactions = useMemo(() => {
    const groups: {
      dateKey: string;
      dateFormatted: string;
      weekday: string;
      isToday: boolean;
      totalRevenue: number;
      totalExpense: number;
      items: typeof transactions;
    }[] = [];

    const map = new Map<string, (typeof groups)[0]>();

    for (const tx of transactions) {
      const dateKey = tx.date.split("T")[0]; // YYYY-MM-DD
      if (!map.has(dateKey)) {
        const parts = dateKey.split("-").map(Number);
        const d = new Date(parts[0], parts[1] - 1, parts[2]);

        const todayKey = new Date().toISOString().split("T")[0];
        const isToday = dateKey === todayKey;

        const weekday = new Intl.DateTimeFormat("pt-BR", {
          weekday: "long",
        }).format(d);
        const dateFormatted = new Intl.DateTimeFormat("pt-BR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(d);

        const group = {
          dateKey,
          dateFormatted,
          weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
          isToday,
          totalRevenue: 0,
          totalExpense: 0,
          items: [],
        };
        map.set(dateKey, group);
        groups.push(group);
      }

      const group = map.get(dateKey)!;
      group.items.push(tx);
      if (tx.status === "PAGO") {
        if (tx.type === "RECEITA") {
          group.totalRevenue += tx.amount;
        } else {
          group.totalExpense += tx.amount;
        }
      }
    }

    return groups;
  }, [transactions]);

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
        refreshData();
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
        refreshData();
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

  const formatTime = (dateString: string) => {
    const dateObj = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj);
  };

  const formatDateFull = (dateString: string) => {
    const dateObj = new Date(dateString);
    const dayMonth = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
    }).format(dateObj);
    const time = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj);
    return `${dayMonth} às ${time}`;
  };

  const paymentMethodMap: Record<string, string> = {
    PIX: "Pix",
    CARTAO_CREDITO: "Crédito",
    CARTAO_DEBITO: "Débito",
    DINHEIRO: "Dinheiro",
    OUTRO: "Outros",
  };

  const isFiltersActive =
    searchTerm.trim().length > 0 ||
    filterType !== "ALL" ||
    statusFilter !== "ALL" ||
    paymentMethodFilter !== "ALL" ||
    dateMode !== "month" ||
    specificDate !== "" ||
    startDate !== "" ||
    endDate !== "";

  const resetFilters = () => {
    setSearchTerm("");
    setFilterType("ALL");
    setStatusFilter("ALL");
    setPaymentMethodFilter("ALL");
    setDateMode("month");
    setSelectedMonth(new Date().getMonth() + 1);
    setSelectedYear(new Date().getFullYear());
    setSpecificDate("");
    setStartDate("");
    setEndDate("");
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
      "text-[9px] sm:text-[10px] px-1.5 py-0 h-4.5 uppercase font-bold tracking-wider transition-all select-none border-none shrink-0";

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
                "cursor-pointer hover:ring-2 hover:opacity-80 flex items-center gap-0.5",
              )}
            >
              {label} <ChevronDown className="h-2.5 w-2.5" />
            </Badge>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-32 rounded-2xl border border-border/40 shadow-xl p-1.5 bg-background/95 backdrop-blur-md"
          >
            <DropdownMenuItem
              className="text-xs font-bold justify-center cursor-pointer rounded-full text-emerald-600 focus:bg-emerald-500/10 focus:text-emerald-700 dark:focus:bg-emerald-900/20 dark:text-emerald-400 py-2"
              onClick={() => handleStatusChange(transaction.originalId, "PAGO")}
            >
              Marcar como Pago
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-xs font-bold justify-center cursor-pointer rounded-full text-amber-600 focus:bg-amber-500/10 focus:text-amber-700 dark:focus:bg-amber-900/20 dark:text-amber-400 mt-1 py-2"
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

      <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-6 max-w-400 mx-auto w-full pb-36 md:pb-6 animate-in fade-in duration-500 min-h-[calc(100vh-100px)]">
        {/* BARRA DE FILTROS RESPONSIVA & MOBILE-FIRST */}
        <div className="flex flex-col gap-3 sm:gap-4 bg-background/60 backdrop-blur-md p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-border/40 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-3xl rounded-full -z-10 pointer-events-none" />

          {/* LINHA 1: MODOS DE DATA (Tabs em Pills com scroll horizontal suave) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 sm:pb-3 border-b border-border/30">
            {/* Seletor de Modo de Data em Pills */}
            <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-xl sm:rounded-2xl border border-border/40 overflow-x-auto no-scrollbar w-full sm:w-fit">
              <Button
                variant={dateMode === "month" ? "default" : "ghost"}
                size="sm"
                onClick={() => setDateMode("month")}
                className={cn(
                  "rounded-lg sm:rounded-xl text-xs font-bold h-7 sm:h-8 px-2.5 sm:px-3.5 shrink-0 transition-all",
                  dateMode === "month"
                    ? "shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Calendar className="h-3.5 w-3.5 mr-1" />
                Mês
              </Button>
              <Button
                variant={dateMode === "day" ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setDateMode("day");
                  if (!specificDate) {
                    setSpecificDate(new Date().toISOString().split("T")[0]);
                  }
                }}
                className={cn(
                  "rounded-lg sm:rounded-xl text-xs font-bold h-7 sm:h-8 px-2.5 sm:px-3.5 shrink-0 transition-all",
                  dateMode === "day"
                    ? "shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Tag className="h-3.5 w-3.5 mr-1" />
                Dia
              </Button>
              <Button
                variant={dateMode === "range" ? "default" : "ghost"}
                size="sm"
                onClick={() => setDateMode("range")}
                className={cn(
                  "rounded-lg sm:rounded-xl text-xs font-bold h-7 sm:h-8 px-2.5 sm:px-3.5 shrink-0 transition-all",
                  dateMode === "range"
                    ? "shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Filter className="h-3.5 w-3.5 mr-1" />
                Período
              </Button>
              <Button
                variant={dateMode === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setDateMode("all")}
                className={cn(
                  "rounded-lg sm:rounded-xl text-xs font-bold h-7 sm:h-8 px-2.5 sm:px-3.5 shrink-0 transition-all",
                  dateMode === "all"
                    ? "shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Tudo
              </Button>
            </div>

            {/* Controles de Data Compactos */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {dateMode === "month" && (
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                  <Select
                    value={selectedMonth.toString()}
                    onValueChange={(val) => setSelectedMonth(Number(val))}
                  >
                    <SelectTrigger className="h-8 sm:h-9 w-full sm:w-32 font-bold bg-muted/20 border-border/40 hover:bg-muted/30 focus-visible:ring-primary/30 rounded-xl sm:rounded-2xl shadow-inner text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-border/50 shadow-xl rounded-2xl max-h-56">
                      {MONTHS.map((m) => (
                        <SelectItem
                          key={m.value}
                          value={m.value.toString()}
                          className="rounded-full font-medium text-xs sm:text-sm"
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
                    <SelectTrigger className="h-8 sm:h-9 w-full sm:w-24 font-bold bg-muted/20 border-border/40 hover:bg-muted/30 focus-visible:ring-primary/30 rounded-xl sm:rounded-2xl shadow-inner text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-border/50 shadow-xl rounded-2xl">
                      {YEARS.map((y) => (
                        <SelectItem
                          key={y}
                          value={y.toString()}
                          className="rounded-full font-medium text-xs sm:text-sm"
                        >
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {dateMode === "day" && (
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <Input
                    type="date"
                    value={specificDate}
                    onChange={(e) => setSpecificDate(e.target.value)}
                    className="h-8 sm:h-9 rounded-xl sm:rounded-2xl bg-muted/20 border-border/40 font-bold focus-visible:ring-primary/30 shadow-inner px-2.5 text-xs sm:text-sm flex-1 sm:flex-none"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSpecificDate(new Date().toISOString().split("T")[0])
                    }
                    className="h-8 sm:h-9 rounded-xl sm:rounded-2xl font-bold bg-muted/20 border-border/40 hover:bg-muted/40 px-2.5 text-[11px] sm:text-xs shrink-0"
                  >
                    Hoje
                  </Button>
                </div>
              )}

              {dateMode === "range" && (
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-8 sm:h-9 rounded-xl sm:rounded-2xl bg-muted/20 border-border/40 font-bold focus-visible:ring-primary/30 shadow-inner px-2.5 text-xs sm:text-sm"
                    title="Data Inicial"
                  />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-8 sm:h-9 rounded-xl sm:rounded-2xl bg-muted/20 border-border/40 font-bold focus-visible:ring-primary/30 shadow-inner px-2.5 text-xs sm:text-sm"
                    title="Data Final"
                  />
                </div>
              )}

              {dateMode === "all" && (
                <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground italic">
                  Todo o histórico
                </span>
              )}
            </div>
          </div>

          {/* LINHA 2: INPUT DE BUSCA */}
          <div className="relative group w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              type="text"
              placeholder="Buscar cliente, CPF, valor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-9 h-10 rounded-xl sm:rounded-2xl bg-muted/20 border-border/40 hover:bg-muted/30 font-medium w-full focus-visible:ring-primary/30 transition-all shadow-inner text-xs sm:text-sm"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* LINHA 3: CHIPS DE FILTRO HORIZONTAIS (Single-row no mobile, sem poluir a tela) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 w-full">
            {/* Chip: Tipo */}
            <Select
              value={filterType}
              onValueChange={(val: any) => setFilterType(val)}
            >
              <SelectTrigger
                className={cn(
                  "h-8 sm:h-9 text-xs font-bold rounded-full px-3 w-auto min-w-[100px] border-border/40 hover:bg-muted/30 focus-visible:ring-primary/30 shadow-sm shrink-0 transition-all",
                  filterType !== "ALL"
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-muted/20 text-muted-foreground",
                )}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Wallet className="h-3.5 w-3.5 shrink-0" />
                  <SelectValue placeholder="Tipo" />
                </div>
              </SelectTrigger>
              <SelectContent className="border-border/50 shadow-xl rounded-2xl">
                <SelectItem value="ALL" className="rounded-full font-medium text-xs">
                  Todos os Tipos
                </SelectItem>
                <SelectItem
                  value="RECEITA"
                  className="rounded-full font-bold text-emerald-600 text-xs"
                >
                  Receitas
                </SelectItem>
                <SelectItem
                  value="DESPESA"
                  className="rounded-full font-bold text-rose-600 text-xs"
                >
                  Despesas
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Chip: Status */}
            <Select
              value={statusFilter}
              onValueChange={(val: any) => setStatusFilter(val)}
            >
              <SelectTrigger
                className={cn(
                  "h-8 sm:h-9 text-xs font-bold rounded-full px-3 w-auto min-w-[105px] border-border/40 hover:bg-muted/30 focus-visible:ring-primary/30 shadow-sm shrink-0 transition-all",
                  statusFilter !== "ALL"
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-muted/20 text-muted-foreground",
                )}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Tag className="h-3.5 w-3.5 shrink-0" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent className="border-border/50 shadow-xl rounded-2xl">
                <SelectItem value="ALL" className="rounded-full font-medium text-xs">
                  Todos os Status
                </SelectItem>
                <SelectItem
                  value="PAGO"
                  className="rounded-full font-bold text-emerald-600 text-xs"
                >
                  Pago
                </SelectItem>
                <SelectItem
                  value="PENDENTE"
                  className="rounded-full font-bold text-amber-600 text-xs"
                >
                  Pendente
                </SelectItem>
                <SelectItem
                  value="ATRASADO"
                  className="rounded-full font-bold text-rose-600 text-xs"
                >
                  Atrasado
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Chip: Forma de Pagamento */}
            <Select
              value={paymentMethodFilter}
              onValueChange={(val: any) => setPaymentMethodFilter(val)}
            >
              <SelectTrigger
                className={cn(
                  "h-8 sm:h-9 text-xs font-bold rounded-full px-3 w-auto min-w-[115px] border-border/40 hover:bg-muted/30 focus-visible:ring-primary/30 shadow-sm shrink-0 transition-all",
                  paymentMethodFilter !== "ALL"
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-muted/20 text-muted-foreground",
                )}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <CreditCard className="h-3.5 w-3.5 shrink-0" />
                  <SelectValue placeholder="Pagamento" />
                </div>
              </SelectTrigger>
              <SelectContent className="border-border/50 shadow-xl rounded-2xl">
                <SelectItem value="ALL" className="rounded-full font-medium text-xs">
                  Todas as Formas
                </SelectItem>
                <SelectItem value="PIX" className="rounded-full font-semibold text-xs">
                  Pix
                </SelectItem>
                <SelectItem
                  value="CARTAO_CREDITO"
                  className="rounded-full font-semibold text-xs"
                >
                  Cartão de Crédito
                </SelectItem>
                <SelectItem
                  value="CARTAO_DEBITO"
                  className="rounded-full font-semibold text-xs"
                >
                  Cartão de Débito
                </SelectItem>
                <SelectItem
                  value="DINHEIRO"
                  className="rounded-full font-semibold text-xs"
                >
                  Dinheiro
                </SelectItem>
                <SelectItem value="OUTRO" className="rounded-full font-semibold text-xs">
                  Outros
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Chip: Botão Limpar Filtros */}
            {isFiltersActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-8 sm:h-9 text-xs font-bold rounded-full px-2.5 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 shrink-0 transition-colors"
                title="Limpar todos os filtros"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Limpar
              </Button>
            )}
          </div>
        </div>

        {/* LISTAGEM DE TRANSAÇÕES AGRUPADA POR DIA */}
        <div className="flex flex-col w-full gap-3 sm:gap-5">
          {isLoading ? (
            <div className="flex justify-center items-center py-20 bg-background/40 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-border/40">
              <LoaderDots className="h-8 w-8 animate-spin text-primary/40" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-background/40 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-dashed border-border/60 p-6">
              <div className="p-3 bg-muted/30 rounded-full mb-3">
                <Filter className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-widest">
                {searchTerm.length > 0
                  ? "Nenhuma movimentação encontrada na busca."
                  : "Nenhuma movimentação neste período."}
              </p>
              {isFiltersActive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="mt-3 rounded-xl font-bold bg-muted/20 border-border/40 text-xs"
                >
                  Limpar Filtros
                </Button>
              )}
            </div>
          ) : (
            groupedTransactions.map((group) => {
              return (
                <div
                  key={group.dateKey}
                  className="flex flex-col bg-background/40 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-border/40 overflow-hidden shadow-sm"
                >
                  {/* CABEÇALHO DO DIA ELEGANTE E COMPACTO NO MOBILE */}
                  <div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-5 sm:py-3 bg-muted/25 border-b border-border/30">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1 sm:p-1.5 bg-primary/10 rounded-lg text-primary shrink-0">
                        <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap truncate">
                        <span className="text-xs sm:text-sm font-black text-foreground truncate">
                          {group.dateFormatted}
                        </span>
                        <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground capitalize hidden sm:inline">
                          • {group.weekday}
                        </span>
                        {group.isToday && (
                          <Badge
                            variant="secondary"
                            className="bg-primary/10 text-primary text-[9px] font-black uppercase tracking-wider rounded-md px-1.5 py-0"
                          >
                            Hoje
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Resumo Financeiro do Dia */}
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-xs font-bold">
                      <Badge
                        variant="secondary"
                        className="bg-muted/40 text-muted-foreground text-[9px] sm:text-[10px] font-bold rounded-md px-1.5 py-0 border-none hidden xs:inline-flex"
                      >
                        {group.items.length}{" "}
                        {group.items.length === 1 ? "lanç." : "lanç."}
                      </Badge>

                      {group.totalRevenue > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-black text-xs sm:text-sm">
                          + {formatCurrency(group.totalRevenue)}
                        </span>
                      )}

                      {group.totalExpense > 0 && (
                        <span className="text-rose-600 dark:text-rose-400 font-black text-xs sm:text-sm">
                          - {formatCurrency(group.totalExpense)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ITENS DO DIA COM DESIGN MOBILE-FIRST */}
                  <div className="flex flex-col divide-y divide-border/20 px-1 sm:px-2">
                    {group.items.map((transaction) => {
                      const isIncome = transaction.type === "RECEITA";
                      const displayTitle = getCleanDescription(
                        transaction.description,
                        transaction.type,
                        transaction.clientName,
                      );

                      return (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between py-2.5 sm:py-3.5 px-2 sm:px-3 hover:bg-muted/40 transition-all duration-200 rounded-xl sm:rounded-2xl group cursor-pointer"
                          onClick={() => setViewingTx(transaction)}
                        >
                          {/* LADO ESQUERDO: Ícone + Título + Subtítulo */}
                          <div className="flex items-center gap-2.5 sm:gap-3.5 flex-1 min-w-0 pr-2">
                            <div
                              className={cn(
                                "flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full font-bold shadow-sm transition-all duration-200 group-hover:scale-105",
                                isIncome
                                  ? "bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white"
                                  : "bg-rose-500/10 text-rose-600 group-hover:bg-rose-500 group-hover:text-white",
                              )}
                            >
                              {isIncome ? (
                                <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5" />
                              ) : (
                                <ArrowDownRight className="h-4 w-4 sm:h-5 sm:w-5" />
                              )}
                            </div>

                            <div className="flex flex-col min-w-0 flex-1">
                              <span
                                className="text-xs sm:text-sm font-bold text-foreground leading-tight truncate flex items-center gap-1.5 group-hover:text-primary transition-colors"
                                title={transaction.description}
                              >
                                {displayTitle}
                                {transaction.installment && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[9px] h-4 px-1 py-0 flex items-center gap-0.5 bg-primary/10 text-primary border-none font-bold tracking-wider shrink-0"
                                  >
                                    <Repeat className="h-2 w-2" />{" "}
                                    {transaction.installment}
                                  </Badge>
                                )}
                              </span>
                              <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground leading-none flex items-center gap-1.5 mt-1 truncate">
                                <span className="font-semibold text-foreground/75 shrink-0">
                                  {formatTime(transaction.date)}
                                </span>
                                {(transaction.paymentMethodName ||
                                  transaction.paymentMethod) && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-border shrink-0"></span>
                                    <span className="uppercase text-[9px] sm:text-[10px] font-semibold text-foreground/70 shrink-0">
                                      {transaction.paymentMethodName ||
                                        (transaction.paymentMethod
                                          ? paymentMethodMap[
                                              transaction.paymentMethod
                                            ] || transaction.paymentMethod
                                          : "")}
                                    </span>
                                  </>
                                )}
                                {transaction.clientName && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-border shrink-0"></span>
                                    <span className="truncate text-foreground/80 font-medium">
                                      {transaction.clientName}
                                    </span>
                                  </>
                                )}
                              </span>
                            </div>
                          </div>

                          {/* LADO DIREITO: Valor + Status Badge + Ações */}
                          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                            <div className="flex flex-col items-end gap-1">
                              <span
                                className={cn(
                                  "text-xs sm:text-sm font-black tracking-tight",
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

                            {/* Dropdown de Ações EXCLUSIVAMENTE para lançamentos manuais */}
                            {transaction.isManual && (
                              <div
                                className="flex items-center justify-end"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-muted-foreground hover:bg-muted hover:text-foreground border-none transition-colors"
                                    >
                                      <ChevronDown className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-36 rounded-2xl border border-border/40 shadow-xl p-1.5 bg-background/95 backdrop-blur-md"
                                  >
                                    <DropdownMenuItem
                                      className="gap-2 cursor-pointer rounded-full text-foreground focus:bg-primary/10 focus:text-primary font-bold transition-colors py-2 text-xs"
                                      onClick={() =>
                                        setEditingTransaction(transaction)
                                      }
                                    >
                                      <Pencil className="h-3.5 w-3.5" /> Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="gap-2 cursor-pointer rounded-full text-rose-500 focus:bg-rose-500/10 focus:text-rose-600 font-bold transition-colors mt-1 py-2 text-xs"
                                      onClick={() =>
                                        setDeletingTx(transaction)
                                      }
                                    >
                                      <Trash className="h-3.5 w-3.5" /> Excluir
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* PAGINAÇÃO PADRÃO DO SISTEMA (SHADCN PAGINATION) */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-2 bg-background/50 backdrop-blur-md p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-border/40 shadow-sm">
            <p className="text-[11px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider text-center sm:text-left w-full sm:w-auto">
              Página {page} de {totalPages} ({totalCount}{" "}
              {totalCount === 1 ? "movimentação" : "movimentações"})
            </p>

            <div className="w-full sm:w-auto flex justify-center sm:justify-end">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page > 1) setPage(page - 1);
                      }}
                      className={
                        page === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => {
                      if (
                        p === 1 ||
                        p === totalPages ||
                        (p >= page - 1 && p <= page + 1)
                      ) {
                        return (
                          <PaginationItem key={p}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setPage(p);
                              }}
                              isActive={page === p}
                              className="cursor-pointer font-bold"
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }

                      if (p === page - 2 || p === page + 2) {
                        return (
                          <PaginationItem key={p}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    },
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page < totalPages) setPage(page + 1);
                      }}
                      className={
                        page === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
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
              <div className="p-2 bg-primary/10 rounded-full text-primary">
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

              {(() => {
                const parsed = parseTransactionDescription(
                  viewingTx.description,
                  viewingTx.type,
                  viewingTx.clientName,
                );
                return (
                  <>
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                        Descrição
                      </span>
                      <div className="bg-muted/20 p-5 rounded-2xl border border-border/40 text-sm font-medium leading-relaxed text-foreground shadow-inner">
                        {parsed.title}
                      </div>
                    </div>

                    {parsed.details && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                          Itens / Detalhes dos Insumos
                        </span>
                        <div className="bg-muted/20 p-4 rounded-2xl border border-border/40 text-xs font-semibold leading-relaxed text-muted-foreground shadow-inner flex items-center gap-2">
                          <Tag className="h-4 w-4 text-primary shrink-0" />
                          <span>{parsed.details}</span>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 bg-muted/10 p-4 rounded-2xl border border-border/40">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Data e Hora
                  </span>
                  <span className="text-sm font-bold">
                    {formatDateFull(viewingTx.date)}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 bg-muted/10 p-4 rounded-2xl border border-border/40">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Origem
                  </span>
                  <span className="text-sm font-bold truncate">
                    {viewingTx.package_id
                      ? "Venda de Pacote"
                      : viewingTx.appointment_id
                        ? "Atendimento / Totem"
                        : viewingTx.stock_item_id
                          ? "Controle de Estoque"
                          : "Lançamento Manual"}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 bg-muted/10 p-4 rounded-2xl border border-border/40 col-span-2">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Forma de Pagamento
                  </span>
                  <span className="text-sm font-bold truncate">
                    {viewingTx.paymentMethodName ||
                      (viewingTx.paymentMethod &&
                        paymentMethodMap[viewingTx.paymentMethod]) ||
                      viewingTx.paymentMethod ||
                      "Não informada"}
                  </span>
                </div>

                {viewingTx.clientName && (
                  <div className="flex flex-col gap-1.5 bg-muted/10 p-4 rounded-2xl border border-border/40 col-span-2">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      Cliente
                    </span>
                    <span className="text-sm font-bold truncate">
                      {viewingTx.clientName}
                    </span>
                    {(viewingTx.clientCpf || viewingTx.clientPhone) && (
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        {viewingTx.clientCpf && (
                          <span>CPF: {viewingTx.clientCpf}</span>
                        )}
                        {viewingTx.clientPhone && (
                          <span>Telefone: {viewingTx.clientPhone}</span>
                        )}
                      </div>
                    )}
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
              {deletingTx?.package_id && (
                <div className="flex flex-col gap-1 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs">
                  <span className="font-black flex items-center gap-1.5 uppercase tracking-wide">
                    ⚠️ Atenção: Parcela de Pacote
                  </span>
                  <span>
                    Esta movimentação está vinculada ao pacote{" "}
                    <strong>{deletingTx.packageName || "do cliente"}</strong>.
                    Excluir esta parcela apenas removerá o lançamento
                    financeiro, mantendo o pacote ativo para o cliente.
                  </span>
                </div>
              )}
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
            refreshData();
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

      {/* Speed Dial Flutuante para Lançamento Rápido de Receita e Despesa */}
      <FinanceSpeedDial onSuccess={refreshData} />
    </>
  );
}

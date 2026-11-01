"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { 
  Receipt, 
  Search, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  Filter, 
  User, 
  Clock, 
  Calendar,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { 
  getPaginatedLoyaltyTransactions, 
  adjustClientLoyaltyPoints,
  getPaginatedLoyaltyClients
} from "@/app/actions/loyalty";

interface TransactionItem {
  id: string;
  clientName: string;
  clientId: string;
  clientPhone: string;
  type: string;
  points: number;
  balanceAfter: number;
  description: string;
  createdAt: string | Date;
  createdByName: string;
}

export function LoyaltyTransactionsTab({ organizationId }: { organizationId: string }) {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ totalGranted: 0, totalSpent: 0, totalTransactions: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const debouncedSearch = useDebounce(search, 400);

  // Modal de Ajuste Manual
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const debouncedClientSearch = useDebounce(clientSearch, 300);
  const [clientOptions, setClientOptions] = useState<{ id: string; name: string; points: number }[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [selectedClient, setSelectedClient] = useState<{ id: string; name: string; points: number } | null>(null);
  const [adjustType, setAdjustType] = useState<"ADD" | "SUBTRACT">("ADD");
  const [adjustPoints, setAdjustPoints] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState("");
  const [isSavingAdjust, setIsSavingAdjust] = useState(false);

  const isFirstRender = useRef(true);

  const fetchTransactions = useCallback(async (page: number, searchQ: string, typeQ: string) => {
    setIsLoading(true);
    try {
      const res = await getPaginatedLoyaltyTransactions({
        page,
        limit: 15,
        search: searchQ,
        type: typeQ,
      });

      if (res.success) {
        setTransactions(res.transactions);
        setTotalPages(res.totalPages);
        setTotalCount(res.total);
        setCurrentPage(res.page);
        if (res.stats) setStats(res.stats);
      } else {
        toast.error(res.error || "Erro ao carregar extrato.");
      }
    } catch (e) {
      toast.error("Erro na comunicação com o servidor.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      fetchTransactions(1, debouncedSearch, typeFilter);
      return;
    }
    fetchTransactions(1, debouncedSearch, typeFilter);
  }, [debouncedSearch, typeFilter, fetchTransactions]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    fetchTransactions(newPage, debouncedSearch, typeFilter);
  };

  // Carrega opções de clientes para o modal de ajuste manual
  useEffect(() => {
    if (!isAdjustModalOpen) return;
    let cancelled = false;

    const loadClients = async () => {
      setIsLoadingClients(true);
      try {
        const res = await getPaginatedLoyaltyClients({
          page: 1,
          limit: 10,
          search: debouncedClientSearch,
          scope: "global",
        });
        if (!cancelled && res.success) {
          setClientOptions(res.clients.map((c: any) => ({
            id: c.id,
            name: c.name,
            points: c.points,
          })));
        }
      } catch (e) {
        if (!cancelled) toast.error("Erro ao carregar clientes.");
      } finally {
        if (!cancelled) setIsLoadingClients(false);
      }
    };

    loadClients();
    return () => {
      cancelled = true;
    };
  }, [isAdjustModalOpen, debouncedClientSearch]);

  const handleSaveAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) {
      toast.error("Selecione um cliente para o ajuste.");
      return;
    }
    if (!adjustPoints || adjustPoints <= 0) {
      toast.error("A pontuação deve ser maior que zero.");
      return;
    }
    if (!adjustReason.trim()) {
      toast.error("Informe a justificativa do ajuste.");
      return;
    }

    setIsSavingAdjust(true);
    try {
      const finalPoints = adjustType === "ADD" ? adjustPoints : -adjustPoints;
      const res = await adjustClientLoyaltyPoints({
        clientId: selectedClient.id,
        points: finalPoints,
        reason: adjustReason.trim(),
      });

      if (res.success) {
        toast.success(`Ajuste de ${finalPoints > 0 ? `+${finalPoints}` : finalPoints} pontos registrado com sucesso!`);
        setIsAdjustModalOpen(false);
        setSelectedClient(null);
        setAdjustReason("");
        setAdjustPoints(10);
        fetchTransactions(1, debouncedSearch, typeFilter);
      } else {
        toast.error(res.error || "Erro ao registrar ajuste.");
      }
    } catch (err) {
      toast.error("Erro interno ao processar o ajuste.");
    } finally {
      setIsSavingAdjust(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "CHECK_IN":
        return <span className="bg-blue-100 text-blue-800 border border-blue-200 text-[11px] font-bold px-2 py-0.5 rounded-full">Check-in</span>;
      case "APPOINTMENT":
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded-full">Agendamento</span>;
      case "REWARD_REDEEM":
        return <span className="bg-rose-100 text-rose-800 border border-rose-200 text-[11px] font-bold px-2 py-0.5 rounded-full">Resgate</span>;
      case "MANUAL_BONUS":
        return <span className="bg-purple-100 text-purple-800 border border-purple-200 text-[11px] font-bold px-2 py-0.5 rounded-full">Bônus Manual</span>;
      case "MANUAL_ADJUST":
        return <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold px-2 py-0.5 rounded-full">Ajuste Manual</span>;
      case "REVERT_APPOINTMENT":
      case "REVERT_CHECK_IN":
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold px-2 py-0.5 rounded-full">Estorno</span>;
      default:
        return <span className="bg-muted text-muted-foreground text-[11px] font-bold px-2 py-0.5 rounded-full">{type}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. CARDS DE KPIS DO LIVRO-RAZÃO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-3xl border-border/70 shadow-xs bg-gradient-to-br from-card to-emerald-500/5">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Pontos Concedidos
              </p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">
                +{stats.totalGranted.toLocaleString("pt-BR")} <span className="text-sm font-bold text-muted-foreground">pts</span>
              </h3>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 shadow-xs bg-gradient-to-br from-card to-rose-500/5">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Pontos Resgatados
              </p>
              <h3 className="text-2xl font-black text-rose-600 mt-1">
                -{stats.totalSpent.toLocaleString("pt-BR")} <span className="text-sm font-bold text-muted-foreground">pts</span>
              </h3>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <ArrowDownRight className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 shadow-xs bg-gradient-to-br from-card to-primary/5">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total de Lançamentos
              </p>
              <h3 className="text-2xl font-black text-foreground mt-1">
                {stats.totalTransactions.toLocaleString("pt-BR")} <span className="text-sm font-bold text-muted-foreground">reg.</span>
              </h3>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Receipt className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. BARRA DE FILTROS E NOVO AJUSTE MANUAL */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 items-center flex-1">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-full bg-card h-10"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-52 rounded-full bg-card h-10 text-xs sm:text-sm">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl text-xs sm:text-sm">
              <SelectItem value="ALL" className="rounded-xl">Todos os Eventos</SelectItem>
              <SelectItem value="CHECK_IN" className="rounded-xl">Check-in Presencial</SelectItem>
              <SelectItem value="APPOINTMENT" className="rounded-xl">Agendamentos</SelectItem>
              <SelectItem value="REWARD_REDEEM" className="rounded-xl">Resgate de Prêmios</SelectItem>
              <SelectItem value="MANUAL_BONUS" className="rounded-xl">Bônus Manuais</SelectItem>
              <SelectItem value="MANUAL_ADJUST" className="rounded-xl">Ajustes Manuais</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => {
            setSelectedClient(null);
            setClientSearch("");
            setIsAdjustModalOpen(true);
          }}
          className="rounded-full flex items-center gap-2 h-10 px-5 font-bold shadow-xs shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          Novo Ajuste / Bônus
        </Button>
      </div>

      {/* 3. TABELA / LISTA DE TRANSAÇÕES DO LIVRO-RAZÃO */}
      <div className="bg-card border border-border/70 rounded-3xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Receipt className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-lg text-foreground">Nenhum lançamento encontrado</h4>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {search || typeFilter !== "ALL"
                ? "Nenhuma movimentação corresponde aos filtros informados. Tente ajustar a busca."
                : "Os lançamentos de fidelidade (check-ins, agendamentos, resgates e bônus) serão registrados aqui automaticamente."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider border-b border-border/60">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6 font-semibold">Data / Hora</th>
                  <th className="py-3.5 px-4 sm:px-6 font-semibold">Cliente</th>
                  <th className="py-3.5 px-4 sm:px-6 font-semibold">Evento</th>
                  <th className="py-3.5 px-4 sm:px-6 font-semibold">Descrição</th>
                  <th className="py-3.5 px-4 sm:px-6 font-semibold text-right">Movimentação</th>
                  <th className="py-3.5 px-4 sm:px-6 font-semibold text-right">Saldo Final</th>
                  <th className="py-3.5 px-4 sm:px-6 font-semibold">Operador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {transactions.map((tx) => {
                  const isPositive = tx.points > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-xs text-muted-foreground">
                        <div className="font-medium text-foreground">
                          {new Date(tx.createdAt).toLocaleDateString("pt-BR")}
                        </div>
                        <div className="text-[11px]">
                          {new Date(tx.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                        <div className="font-bold text-foreground text-sm">{tx.clientName}</div>
                        {tx.clientPhone && (
                          <div className="text-xs text-muted-foreground">{tx.clientPhone}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                        {getTypeBadge(tx.type)}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-foreground text-xs font-medium max-w-xs truncate">
                        {tx.description}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-right font-black text-sm">
                        <span className={isPositive ? "text-emerald-600" : "text-rose-600"}>
                          {isPositive ? `+${tx.points}` : tx.points} pts
                        </span>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-right font-semibold text-xs text-foreground">
                        {tx.balanceAfter} pts
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-xs text-muted-foreground">
                        {tx.createdByName}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. PAGINAÇÃO */}
      {totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(currentPage - 1);
                }}
                className={cn("rounded-full", (currentPage <= 1 || isLoading) && "pointer-events-none opacity-50")}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2)
              .map((page, idx, array) => {
                const prev = array[idx - 1];
                return (
                  <div key={page} className="flex items-center">
                    {prev && page - prev > 1 && (
                      <span className="px-2 text-muted-foreground text-sm">...</span>
                    )}
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === page}
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(page);
                        }}
                        className="rounded-full"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  </div>
                );
              })}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(currentPage + 1);
                }}
                className={cn("rounded-full", (currentPage >= totalPages || isLoading) && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* 5. MODAL DE AJUSTE MANUAL DE PONTOS */}
      <Dialog open={isAdjustModalOpen} onOpenChange={setIsAdjustModalOpen}>
        <DialogContent className="rounded-3xl max-w-md bg-card">
          <form onSubmit={handleSaveAdjust}>
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" />
                Livro-Razão de Pontos
              </div>
              <DialogTitle className="text-xl font-bold">
                Novo Ajuste / Bônus Manual
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Lance uma bonificação de cortesia ou faça um ajuste corretivo auditado.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-3">
              {/* Seleção do Cliente */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Cliente</Label>
                {selectedClient ? (
                  <div className="flex items-center justify-between p-3 rounded-2xl border border-primary/40 bg-primary/5">
                    <div>
                      <p className="font-bold text-sm text-foreground">{selectedClient.name}</p>
                      <p className="text-xs text-muted-foreground">Saldo atual: <strong>{selectedClient.points} pts</strong></p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedClient(null)}
                      className="rounded-full text-xs h-8 text-muted-foreground hover:text-foreground"
                    >
                      Alterar
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      placeholder="Buscar cliente por nome..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="rounded-full text-xs"
                    />
                    <div className="max-h-36 overflow-y-auto space-y-1.5 p-1 border rounded-2xl bg-muted/20">
                      {isLoadingClients ? (
                        <div className="p-2 space-y-1.5">
                          <Skeleton className="h-8 w-full rounded-xl" />
                          <Skeleton className="h-8 w-full rounded-xl" />
                        </div>
                      ) : clientOptions.length === 0 ? (
                        <div className="p-3 text-center text-xs text-muted-foreground">
                          Nenhum cliente encontrado.
                        </div>
                      ) : (
                        clientOptions.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => setSelectedClient(c)}
                            className="p-2.5 rounded-xl hover:bg-card border border-transparent hover:border-border cursor-pointer flex items-center justify-between text-xs transition-all"
                          >
                            <span className="font-semibold text-foreground">{c.name}</span>
                            <span className="text-muted-foreground font-mono">{c.points} pts</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Tipo de Operação */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Tipo de Lançamento</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={adjustType === "ADD" ? "default" : "outline"}
                    onClick={() => setAdjustType("ADD")}
                    className={cn(
                      "rounded-2xl text-xs font-bold h-10",
                      adjustType === "ADD" && "bg-emerald-600 hover:bg-emerald-700 text-white"
                    )}
                  >
                    + Adicionar Bônus
                  </Button>
                  <Button
                    type="button"
                    variant={adjustType === "SUBTRACT" ? "default" : "outline"}
                    onClick={() => setAdjustType("SUBTRACT")}
                    className={cn(
                      "rounded-2xl text-xs font-bold h-10",
                      adjustType === "SUBTRACT" && "bg-rose-600 hover:bg-rose-700 text-white"
                    )}
                  >
                    - Deduzir Pontos
                  </Button>
                </div>
              </div>

              {/* Quantidade de Pontos */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Quantidade de Pontos</Label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={adjustPoints}
                  onChange={(e) => setAdjustPoints(Math.max(1, Number(e.target.value)))}
                  className="rounded-2xl h-10 font-bold text-center"
                />
              </div>

              {/* Justificativa Obrigatória */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Justificativa / Motivo</Label>
                <Input
                  placeholder="Ex: Bonificação de aniversário, cortesia gerência..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="rounded-2xl h-10 text-xs"
                  required
                />
              </div>
            </div>

            <DialogFooter className="mt-5 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAdjustModalOpen(false)}
                className="rounded-full"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSavingAdjust || !selectedClient}
                className="rounded-full font-bold"
              >
                {isSavingAdjust ? "Gravando..." : "Gravar Lançamento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


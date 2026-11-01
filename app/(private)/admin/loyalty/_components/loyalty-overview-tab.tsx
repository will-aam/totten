"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Trophy, Plus, Star } from "@boxicons/react";
import { Download, CreditCard, Ticket, AlertTriangle, Loader2, CheckCircle2, Clock, User, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  enrollClientInLoyalty,
  getClientLoyaltyHistory,
  markVoucherAsUsed,
  reactivateVoucher,
  findVoucherByPin,
  getPaginatedLoyaltyClients,
  getUnenrolledClients
} from "@/app/actions/loyalty";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/components/ui/use-mobile";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Client {
  id: string;
  name: string;
  points: number;
  lastCheckIn: string;
  tier: string;
  enrolledAt: Date | null;
}

interface Reward {
  id: string | number;
  title: string;
  pointsCost: number;
  conditions: string;
}

interface LoyaltyOverviewTabProps {
  isProgramActive: boolean;
  setIsProgramActive: (active: boolean) => void;
  programScope: "global" | "specific";
  initialClients: Client[];
  initialTotal: number;
  initialTotalPages: number;
  rewards: Reward[];
  onOpenVoucher: (client: Client) => void;
}

export function LoyaltyOverviewTab({
  isProgramActive,
  setIsProgramActive,
  programScope,
  initialClients,
  initialTotal,
  initialTotalPages,
  rewards,
  onOpenVoucher,
}: LoyaltyOverviewTabProps) {
  const [clients, setClients] = useState<Client[]>(initialClients || []);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages || 1);
  const [, setTotalCount] = useState(initialTotal || 0);
  const [isLoadingClients, setIsLoadingClients] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);

  // Modal para incluir cliente
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const debouncedModalSearch = useDebounce(modalSearchQuery, 300);
  const [unenrolledClients, setUnenrolledClients] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingUnenrolled, setIsLoadingUnenrolled] = useState(false);

  const [addingClient, setAddingClient] = useState<string | null>(null);
  const [clientToRemove, setClientToRemove] = useState<Client | null>(null);

  // Validação rápida de Voucher por PIN
  const [pinQuery, setPinQuery] = useState("");
  const [isSearchingPin, setIsSearchingPin] = useState(false);
  const [foundVouchers, setFoundVouchers] = useState<any[]>([]);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isUsingPinVoucher, setIsUsingPinVoucher] = useState(false);

  // Histórico
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<Client | null>(null);
  const [clientHistory, setClientHistory] = useState<any[]>([]);
  const [clientVouchers, setClientVouchers] = useState<any[]>([]);
  const [historyCache, setHistoryCache] = useState<Record<string, { history: any[], vouchers: any[], points?: number }>>({});
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const itemsPerPage = 8;
  const isMobile = useIsMobile();
  const isFirstRender = useRef(true);

  // Busca clientes paginados no servidor
  const fetchClients = useCallback(async (page: number, search: string, scope: "global" | "specific") => {
    setIsLoadingClients(true);
    try {
      const res = await getPaginatedLoyaltyClients({
        page,
        limit: itemsPerPage,
        search,
        scope,
      });

      if (res.success) {
        setClients(res.clients);
        setTotalPages(res.totalPages);
        setTotalCount(res.total);
        setCurrentPage(res.page);
      } else {
        toast.error(res.error || "Erro ao carregar clientes.");
      }
    } catch (e) {
      toast.error("Erro na comunicação com o servidor.");
    } finally {
      setIsLoadingClients(false);
    }
  }, [itemsPerPage]);

  // Recarrega quando busca ou escopo mudam
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchClients(1, debouncedSearch, programScope);
  }, [debouncedSearch, programScope, fetchClients]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    fetchClients(newPage, debouncedSearch, programScope);
  };

  // Carrega clientes não matriculados sob demanda
  useEffect(() => {
    if (!isAddClientOpen) return;
    let isCancelled = false;

    const loadUnenrolled = async () => {
      setIsLoadingUnenrolled(true);
      try {
        const res = await getUnenrolledClients(debouncedModalSearch, 20);
        if (!isCancelled && res.success && res.clients) {
          setUnenrolledClients(res.clients);
        }
      } catch (e) {
        if (!isCancelled) toast.error("Erro ao carregar lista de clientes.");
      } finally {
        if (!isCancelled) setIsLoadingUnenrolled(false);
      }
    };

    loadUnenrolled();

    return () => {
      isCancelled = true;
    };
  }, [isAddClientOpen, debouncedModalSearch]);

  const handleEnroll = async (clientId: string) => {
    setAddingClient(clientId);
    const res = await enrollClientInLoyalty(clientId, true);
    setAddingClient(null);
    if (res.success) {
      toast.success("Cliente adicionado ao programa com sucesso!");
      setUnenrolledClients((prev) => prev.filter((c) => c.id !== clientId));
      fetchClients(currentPage, debouncedSearch, programScope);
    } else {
      toast.error(res.error || "Erro ao adicionar cliente.");
    }
  };

  const confirmRemove = async () => {
    if (!clientToRemove) return;
    const clientId = clientToRemove.id;
    setClientToRemove(null);
    const res = await enrollClientInLoyalty(clientId, false);
    if (res.success) {
      toast.success("Cliente removido do programa.");
      fetchClients(currentPage, debouncedSearch, programScope);
    } else {
      toast.error(res.error || "Erro ao remover cliente.");
    }
  };

  const handleSearchPin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pinQuery.trim()) return;

    setIsSearchingPin(true);
    try {
      const res = await findVoucherByPin(pinQuery.trim());
      if (res.success && res.vouchers && res.vouchers.length > 0) {
        setFoundVouchers(res.vouchers);
        setIsPinModalOpen(true);
      } else {
        toast.error(res.error || "Nenhum voucher encontrado com este código PIN.");
      }
    } catch (err) {
      toast.error("Erro ao localizar voucher.");
    } finally {
      setIsSearchingPin(false);
    }
  };

  const handleUsePinVoucher = async (voucherId: string, forceIfExpired = false) => {
    setIsUsingPinVoucher(true);
    try {
      const res = await markVoucherAsUsed(voucherId, forceIfExpired);
      if (res.success) {
        toast.success(forceIfExpired ? "Voucher autorizado e baixado como cortesia!" : "Voucher baixado com sucesso!");
        setFoundVouchers((prev) =>
          prev.map((v) =>
            v.id === voucherId
              ? { ...v, status: "UTILIZADO", usedAt: new Date() }
              : v
          )
        );
        fetchClients(currentPage, debouncedSearch, programScope);
      } else {
        toast.error(res.error || "Não foi possível utilizar o voucher.");
      }
    } catch (err) {
      toast.error("Erro interno ao dar baixa no voucher.");
    } finally {
      setIsUsingPinVoucher(false);
    }
  };

  const handleReactivatePinVoucher = async (voucherId: string, days = 30) => {
    setIsUsingPinVoucher(true);
    try {
      const res = await reactivateVoucher(voucherId, days);
      if (res.success && res.voucher) {
        toast.success(`Voucher reativado com sucesso por mais ${days} dias!`);
        setFoundVouchers((prev) =>
          prev.map((v) =>
            v.id === voucherId
              ? { ...v, status: "DISPONIVEL", expiresAt: res.voucher.expires_at }
              : v
          )
        );
        fetchClients(currentPage, debouncedSearch, programScope);
      } else {
        toast.error(res.error || "Erro ao reativar voucher.");
      }
    } catch (err) {
      toast.error("Erro interno ao reativar voucher.");
    } finally {
      setIsUsingPinVoucher(false);
    }
  };

  const openHistory = async (client: Client) => {
    setSelectedClientForHistory(client);

    // Cache de histórico se disponível
    if (historyCache[client.id]) {
      setClientHistory(historyCache[client.id].history);
      setClientVouchers(historyCache[client.id].vouchers);
      if (historyCache[client.id].points !== undefined) {
        setSelectedClientForHistory((prev) => prev ? { ...prev, points: historyCache[client.id].points! } : null);
      }
      return;
    }

    setIsLoadingHistory(true);
    const res = await getClientLoyaltyHistory(client.id);
    if (res.success && res.history) {
      setClientHistory(res.history);
      setClientVouchers(res.vouchers || []);
      if (res.points !== undefined) {
        setSelectedClientForHistory((prev) => prev ? { ...prev, points: res.points } : null);
      }
      setHistoryCache((prev) => ({
        ...prev,
        [client.id]: {
          history: res.history,
          vouchers: res.vouchers || [],
          points: res.points
        }
      }));
    } else {
      toast.error(res.error || "Erro ao carregar histórico.");
      setClientHistory([]);
      setClientVouchers([]);
    }
    setIsLoadingHistory(false);
  };

  const handleMarkVoucherUsed = async (voucherId: string, forceIfExpired = false) => {
    const res = await markVoucherAsUsed(voucherId, forceIfExpired);
    if (res.success) {
      toast.success(forceIfExpired ? "Voucher autorizado e baixado como cortesia!" : "Voucher marcado como utilizado!");
      setClientVouchers((prev) => prev.map((v) => v.id === voucherId ? { ...v, status: "UTILIZADO" } : v));
      if (selectedClientForHistory) {
        setHistoryCache((prev) => {
          const cache = prev[selectedClientForHistory.id];
          if (!cache) return prev;
          return {
            ...prev,
            [selectedClientForHistory.id]: {
              ...cache,
              vouchers: cache.vouchers.map((v) => v.id === voucherId ? { ...v, status: "UTILIZADO" } : v)
            }
          };
        });
      }
    } else {
      toast.error(res.error || "Erro ao utilizar voucher.");
    }
  };

  const handleReactivateVoucher = async (voucherId: string, days = 30) => {
    try {
      const res = await reactivateVoucher(voucherId, days);
      if (res.success && res.voucher) {
        toast.success(`Voucher reativado com sucesso por mais ${days} dias!`);
        setClientVouchers((prev) =>
          prev.map((v) =>
            v.id === voucherId
              ? { ...v, status: "DISPONIVEL", expires_at: res.voucher.expires_at }
              : v
          )
        );
        if (selectedClientForHistory) {
          setHistoryCache((prev) => {
            const cache = prev[selectedClientForHistory.id];
            if (!cache) return prev;
            return {
              ...prev,
              [selectedClientForHistory.id]: {
                ...cache,
                vouchers: cache.vouchers.map((v) =>
                  v.id === voucherId
                    ? { ...v, status: "DISPONIVEL", expires_at: res.voucher.expires_at }
                    : v
                ),
              },
            };
          });
        }
      } else {
        toast.error(res.error || "Erro ao reativar voucher.");
      }
    } catch (e) {
      toast.error("Erro interno ao reativar voucher.");
    }
  };

  if (!isProgramActive) {
    return (
      <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
            <Trophy size="md" />
            Fidelize seus clientes
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Configure regras de pontos para cada check-in realizado e ofereça
            recompensas incríveis para quem mais frequenta o seu espaço.
          </p>
        </div>
        <Button variant="default" className="rounded-full shrink-0" onClick={() => setIsProgramActive(true)}>
          Ativar Programa
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Barra de Ações Superior (Chapada e Minimalista) */}
      <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center">
        {/* Busca de Cliente */}
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente por nome..."
            className="pl-10 rounded-full bg-card h-10 border-border/70"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Validador Rápido de Voucher por PIN + Incluir Cliente */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:w-auto">
          <form onSubmit={handleSearchPin} className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-60">
              <Ticket className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder=""
                value={pinQuery}
                onChange={(e) => setPinQuery(e.target.value.toUpperCase())}
                className="pl-10 rounded-full bg-card font-mono text-xs sm:text-sm uppercase tracking-wider h-10 border-border/70"
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              disabled={isSearchingPin || !pinQuery.trim()}
              className="rounded-full shrink-0 font-medium h-10 px-4 hover:border-primary/50 text-xs sm:text-sm"
            >
              {isSearchingPin ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Validar Voucher"
              )}
            </Button>
          </form>

          {programScope === "specific" && (
            <Button
              className="rounded-full w-full sm:w-auto flex items-center justify-center gap-1.5 h-10 px-4 text-xs sm:text-sm font-semibold shrink-0"
              onClick={() => {
                setModalSearchQuery("");
                setIsAddClientOpen(true);
              }}
            >
              <Plus size="xs" />
              Incluir Cliente
            </Button>
          )}
        </div>
      </div>

      {isLoadingClients ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: itemsPerPage }).map((_, i) => (
            <Card key={i} className="rounded-2xl shadow-sm border-border/50 p-5 flex flex-col items-center text-center gap-3">
              <Skeleton className="h-6 w-32 rounded-full mt-2" />
              <Skeleton className="h-4 w-24 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full mt-2" />
              <Skeleton className="h-2 w-full rounded-full mt-4" />
              <Skeleton className="h-9 w-full rounded-xl mt-4" />
            </Card>
          ))}
        </div>
      ) : clients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {clients.map((client) => (
            <Card
              key={client.id}
              className="rounded-2xl shadow-sm border-border/50 relative overflow-hidden cursor-pointer hover:border-primary/50 transition-colors group"
              onClick={() => openHistory(client)}
            >
              <Star
                aria-hidden="true"
                type="solid"
                width={100}
                height={100}
                rotate={-15}
                className="pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 text-foreground/5"
              />
              <Star
                aria-hidden="true"
                type="solid"
                width={40}
                height={40}
                rotate={20}
                className="pointer-events-none absolute right-12 -bottom-4 text-foreground/5"
              />

              <CardContent className="relative z-10 p-5 flex flex-col items-center text-center gap-2">
                {programScope === "specific" && (
                  <div className="absolute top-2 right-2 z-20">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setClientToRemove(client);
                      }}
                    >
                      &times;
                    </Button>
                  </div>
                )}
                <div className="space-y-1 mt-2 pointer-events-none">
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{client.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    Último Check-in: {client.lastCheckIn}
                  </p>
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 bg-secondary/50 px-3 py-1 rounded-full text-sm font-medium pointer-events-none">
                  <span className="text-primary font-bold">{client.points}</span>
                  <span>pts</span>
                </div>

                {/* Barra de progresso para a próxima recompensa */}
                {(() => {
                  const currentPoints = client.points || 0;
                  const nextReward = rewards.slice().sort((a, b) => a.pointsCost - b.pointsCost).find((r) => currentPoints < r.pointsCost);
                  const percentage = nextReward ? Math.min(100, Math.round((currentPoints / nextReward.pointsCost) * 100)) : (rewards.length > 0 ? 100 : 0);

                  if (rewards.length === 0) return null;

                  return (
                    <div className="w-full mt-3 px-2">
                      {nextReward ? (
                        <div className="flex justify-between items-center mb-1 text-[10px] text-muted-foreground">
                          <span>Faltam {nextReward.pointsCost - currentPoints} pts para {nextReward.title}</span>
                          <span className="font-bold">{percentage}%</span>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center mb-1 text-[10px] text-primary">
                          <span className="font-bold">Todas as recompensas alcançadas!</span>
                          <span className="font-bold">100%</span>
                        </div>
                      )}
                      <Progress value={percentage} className="h-1.5 bg-secondary" indicatorColor="bg-primary" />
                    </div>
                  );
                })()}

                <div className="flex items-center gap-2 mt-4 w-full pt-4 border-t border-border/50">
                  <Button
                    variant="outline"
                    className="rounded-xl flex-1 flex items-center justify-center gap-1.5 h-9 text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all z-20 relative font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenVoucher(client);
                    }}
                    disabled={!client.points}
                    title="Visualizar ou compartilhar extrato/cartão digital do cliente"
                  >
                    <CreditCard size={15} />
                    Cartão Digital
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-2xl bg-card">
          <div className="bg-primary/10 p-4 rounded-full text-primary mb-4">
            <Trophy size="md" />
          </div>
          <h3 className="text-lg font-semibold">Nenhum cliente no programa</h3>
          <p className="text-muted-foreground max-w-sm mt-1 text-sm">
            {programScope === "specific"
              ? "Clique em 'Incluir Cliente' para adicionar clientes a este programa."
              : "Não há clientes elegíveis ou cadastrados no momento."}
          </p>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(currentPage - 1);
                }}
                className={cn("rounded-full", (currentPage <= 1 || isLoadingClients) && "pointer-events-none opacity-50")}
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
                className={cn("rounded-full", (currentPage >= totalPages || isLoadingClients) && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Modal: Incluir Cliente */}
      <Dialog
        open={isAddClientOpen}
        onOpenChange={(open) => {
          setIsAddClientOpen(open);
          if (!open) setModalSearchQuery("");
        }}
      >
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Incluir Cliente</DialogTitle>
            <DialogDescription>
              Selecione o cliente que deseja adicionar ao programa de fidelidade.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Buscar cliente..."
              value={modalSearchQuery}
              onChange={(e) => setModalSearchQuery(e.target.value)}
              className="rounded-full"
            />
            <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
              {isLoadingUnenrolled ? (
                <div className="space-y-2 py-2">
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ) : unenrolledClients.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-4">
                  Nenhum cliente disponível encontrado.
                </div>
              ) : (
                unenrolledClients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-3 border rounded-xl">
                    <span className="font-medium text-sm">{client.name}</span>
                    <Button
                      size="sm"
                      className="rounded-full"
                      onClick={() => handleEnroll(client.id)}
                      disabled={addingClient === client.id}
                    >
                      {addingClient === client.id ? "Adicionando..." : "Adicionar"}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DE RESULTADO E BAIXA RÁPIDA DE VOUCHER POR PIN */}
      <Dialog open={isPinModalOpen} onOpenChange={setIsPinModalOpen}>
        <DialogContent className="rounded-3xl max-w-lg bg-card">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
              <Ticket className="w-4 h-4" />
              Validação de Voucher
            </div>
            <DialogTitle className="text-xl font-bold">
              Resultado da Busca por PIN
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Confira os dados do cliente e da recompensa antes de confirmar a baixa.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {foundVouchers.map((v) => {
              const isAvailable = v.status === "DISPONIVEL";
              const isUsed = v.status === "UTILIZADO";
              const isExpired = v.status === "EXPIRADO";

              return (
                <div key={v.id} className="p-4 rounded-2xl border border-border/80 bg-background space-y-4">
                  <div className="flex items-start justify-between gap-3 border-b border-border/50 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm bg-muted px-2 py-0.5 rounded text-foreground border">
                          {v.pin}
                        </span>
                        <span className="font-bold text-base text-foreground">
                          {v.title}
                        </span>
                        {v.rewardType === "PERCENTAGE" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                            {v.discountValue}% OFF
                          </span>
                        )}
                        {v.rewardType === "FIXED_AMOUNT" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 border border-blue-500/20">
                            R$ {Number(v.discountValue || 0).toFixed(2)} OFF
                          </span>
                        )}
                        {v.rewardType === "GIFT" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 border border-purple-500/20">
                            Brinde / Cortesia
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        Cliente: <strong>{v.client?.name}</strong>
                        {v.client?.phone_whatsapp && (
                          <span> &bull; {v.client.phone_whatsapp}</span>
                        )}
                      </p>
                    </div>

                    <span
                      className={cn(
                        "text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0",
                        isAvailable
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : isUsed
                            ? "bg-slate-100 text-slate-700"
                            : "bg-red-100 text-red-700"
                      )}
                    >
                      {isAvailable ? "Disponível" : isUsed ? "Já Utilizado" : "Expirado"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-xl">
                    <div>
                      <span>Pontos debitados:</span>
                      <p className="font-bold text-foreground text-sm">{v.pointsSpent} pts</p>
                    </div>
                    <div>
                      <span>Emitido em:</span>
                      <p className="font-medium text-foreground">
                        {new Date(v.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    {v.expiresAt && (
                      <div className="col-span-2 flex items-center gap-1.5 pt-1 border-t border-border/40">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Validade:</span>
                        <strong className={isExpired ? "text-destructive" : "text-foreground"}>
                          {new Date(v.expiresAt).toLocaleDateString("pt-BR")}
                        </strong>
                      </div>
                    )}
                    {isUsed && v.usedAt && (
                      <div className="col-span-2 text-slate-500 pt-1 border-t border-border/40">
                        Utilizado em: {new Date(v.usedAt).toLocaleDateString("pt-BR")} às {new Date(v.usedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    )}
                  </div>

                  {/* Orientação Operacional / Financeira */}
                  {isAvailable && (
                    <>
                      {v.rewardType === "PERCENTAGE" && (
                        <div className={cn(
                          "p-2.5 rounded-xl border text-xs leading-relaxed",
                          v.autoFinancialDiscount
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                            : "bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300"
                        )}>
                          {v.autoFinancialDiscount ? (
                            <span><strong>Automação Financeira Ativa:</strong> O desconto de {v.discountValue}% será vinculado diretamente ao atendimento do cliente.</span>
                          ) : (
                            <span><strong>Modo Manual (Recepção):</strong> Lembre-se de cobrar o cliente com o abatimento de {v.discountValue}% no caixa ou na maquininha.</span>
                          )}
                        </div>
                      )}

                      {v.rewardType === "FIXED_AMOUNT" && (
                        <div className={cn(
                          "p-2.5 rounded-xl border text-xs leading-relaxed",
                          v.autoFinancialDiscount
                            ? "bg-blue-500/10 border-blue-500/20 text-blue-800 dark:text-blue-300"
                            : "bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300"
                        )}>
                          {v.autoFinancialDiscount ? (
                            <span><strong>Automação Financeira Ativa:</strong> R$ {Number(v.discountValue || 0).toFixed(2)} serão abatidos automaticamente na transação.</span>
                          ) : (
                            <span><strong>Modo Manual (Recepção):</strong> Lembre-se de abater R$ {Number(v.discountValue || 0).toFixed(2)} no valor cobrado ao cliente.</span>
                          )}
                        </div>
                      )}

                      {v.rewardType === "GIFT" && (
                        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-800 dark:text-purple-300 leading-relaxed">
                          <strong>Brinde / Cortesia:</strong> Entregue o brinde físico ou realize o procedimento cortesia acordado com o cliente e confirme a baixa abaixo.
                        </div>
                      )}
                    </>
                  )}

                  <div className="pt-1">
                    {isAvailable ? (
                      <Button
                        onClick={() => handleUsePinVoucher(v.id)}
                        disabled={isUsingPinVoucher}
                        className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 text-sm shadow-sm"
                      >
                        {isUsingPinVoucher ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Confirmando Baixa...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Dar Baixa no Voucher Agora
                          </>
                        )}
                      </Button>
                    ) : isExpired ? (
                      <div className="space-y-2">
                        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                          <strong>Voucher expirado:</strong> Como administrador, você pode reativar a validade para o cliente ou autorizar a baixa imediata como cortesia.
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleReactivatePinVoucher(v.id, 30)}
                            disabled={isUsingPinVoucher}
                            className="rounded-2xl h-11 text-xs font-bold"
                          >
                            Reativar (+30 dias)
                          </Button>
                          <Button
                            type="button"
                            onClick={() => handleUsePinVoucher(v.id, true)}
                            disabled={isUsingPinVoucher}
                            className="rounded-2xl h-11 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
                          >
                            Autorizar Uso Agora
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button disabled variant="outline" className="w-full rounded-2xl h-10 text-xs">
                        Voucher já utilizado anteriormente
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmação de Remoção com Alerta Explícito de Pontos Zerados */}
      <AlertDialog open={!!clientToRemove} onOpenChange={(open) => !open && setClientToRemove(null)}>
        <AlertDialogContent className="rounded-3xl max-w-md">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-2 mx-auto sm:mx-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-foreground">
              Remover cliente do programa?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2 text-sm text-muted-foreground" asChild>
              <div>
                <p>
                  Tem certeza que deseja remover <strong>{clientToRemove?.name}</strong> do programa de fidelidade?
                </p>
                <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5">
                    ⚠️ Atenção: Ação Irreversível!
                  </p>
                  <p className="leading-relaxed">
                    O saldo atual de <strong>{clientToRemove?.points || 0} pontos</strong> deste cliente será <strong>zerado permanentemente</strong> e ele não poderá mais utilizá-los.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold"
            >
              Sim, Zerar Pontos e Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Histórico Mobile (Drawer) */}
      {isMobile ? (
        <Drawer open={!!selectedClientForHistory} onOpenChange={(open) => {
          if (!open) {
            setSelectedClientForHistory(null);
            setClientHistory([]);
          }
        }}>
          <DrawerContent className="bg-card">
            <div className="mx-auto w-full max-w-sm">
              <DrawerHeader>
                <DrawerTitle>Histórico de Pontos</DrawerTitle>
                <DrawerDescription>
                  {selectedClientForHistory?.name}
                </DrawerDescription>
              </DrawerHeader>

              <div className="px-4 pb-4">
                {isLoadingHistory ? (
                  <div className="space-y-3 py-4">
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                  </div>
                ) : (
                  <Tabs defaultValue="history" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="history">Histórico</TabsTrigger>
                      <TabsTrigger value="vouchers">Vouchers</TabsTrigger>
                    </TabsList>

                    <TabsContent value="history" className="mt-2">
                      {clientHistory.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground bg-muted/30 rounded-xl">
                          Nenhuma pontuação registrada para este cliente.
                        </div>
                      ) : (
                        <ScrollArea className="h-[50vh] pr-4">
                          <div className="space-y-4">
                            {clientHistory.map((item, idx) => {
                              const isRedeem = item.points < 0 || item.type === "redeem";
                              return (
                                <div key={idx} className={cn(
                                  "flex items-center justify-between p-3 rounded-xl border",
                                  isRedeem ? "border-destructive/20 bg-destructive/5" : "border-border/50 bg-background"
                                )}>
                                  <div className="flex flex-col gap-1">
                                    <span className={cn("font-medium text-sm", isRedeem && "text-destructive font-semibold")}>
                                      {item.description}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(item.date).toLocaleDateString('pt-BR')} às {new Date(item.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  {isRedeem ? (
                                    <div className="flex items-center gap-1 text-destructive font-bold bg-destructive/10 border border-destructive/20 px-2 py-1 rounded-full text-xs shrink-0">
                                      {item.points} pts
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 text-primary font-bold bg-primary/10 px-2 py-1 rounded-full text-xs shrink-0">
                                      +{item.points} pts
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      )}
                    </TabsContent>

                    <TabsContent value="vouchers" className="mt-2">
                      {clientVouchers.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground bg-muted/30 rounded-xl">
                          Nenhum voucher gerado para este cliente.
                        </div>
                      ) : (
                        <ScrollArea className="h-[50vh] pr-4">
                          <div className="space-y-4">
                            {clientVouchers.map((voucher) => {
                              const isUsed = voucher.status === "UTILIZADO";
                              const isExpired = !isUsed && voucher.expires_at && new Date(voucher.expires_at) < new Date();
                              const displayStatus = isUsed ? "UTILIZADO" : isExpired ? "EXPIRADO" : "DISPONÍVEL";

                              return (
                                <div key={voucher.id} className="flex flex-col gap-2 p-3 rounded-xl border border-border/50 bg-background">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm">{voucher.title}</span>
                                      <span className="font-mono text-[10px] font-bold bg-muted px-1.5 py-0.5 rounded text-muted-foreground border">
                                        #VCH-{voucher.id.slice(-6).toUpperCase()}
                                      </span>
                                    </div>
                                    <span className={cn(
                                      "px-2 py-1 rounded-full text-xs font-bold",
                                      displayStatus === "DISPONÍVEL" ? "bg-green-100 text-green-700" :
                                        displayStatus === "EXPIRADO" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                                    )}>
                                      {displayStatus}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between mt-2">
                                    <div className="flex flex-col gap-1">
                                      <span className="text-xs text-muted-foreground">
                                        Gerado em {new Date(voucher.created_at).toLocaleDateString('pt-BR')}
                                      </span>
                                      {voucher.expires_at && !isUsed && (
                                        <span className="text-xs text-muted-foreground">
                                          Válido até: {new Date(voucher.expires_at).toLocaleDateString('pt-BR')}
                                        </span>
                                      )}
                                    </div>
                                    {displayStatus === "DISPONÍVEL" && (
                                      <Button size="sm" variant="outline" onClick={() => handleMarkVoucherUsed(voucher.id)}>
                                        Marcar como Usado
                                      </Button>
                                    )}
                                    {displayStatus === "EXPIRADO" && (
                                      <div className="flex items-center gap-1.5">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-xs h-8 rounded-xl font-semibold"
                                          onClick={() => handleReactivateVoucher(voucher.id, 30)}
                                        >
                                          Reativar (+30d)
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="text-xs h-8 rounded-xl text-amber-700 hover:text-amber-800 hover:bg-amber-500/10 font-bold"
                                          onClick={() => handleMarkVoucherUsed(voucher.id, true)}
                                        >
                                          Autorizar Uso
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      )}
                    </TabsContent>
                  </Tabs>
                )}

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-border/50 text-sm">
                  <span className="text-muted-foreground">Saldo Total:</span>
                  <span className="font-bold text-lg text-primary">{selectedClientForHistory?.points} pts</span>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        /* Histórico Desktop (Dialog) */
        <Dialog open={!!selectedClientForHistory} onOpenChange={(open) => {
          if (!open) {
            setSelectedClientForHistory(null);
            setClientHistory([]);
          }
        }}>
          <DialogContent className="rounded-2xl max-w-md bg-card">
            <DialogHeader>
              <DialogTitle>Histórico de Pontos</DialogTitle>
              <DialogDescription>
                {selectedClientForHistory?.name}
              </DialogDescription>
            </DialogHeader>

            {isLoadingHistory ? (
              <div className="space-y-3 py-4">
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
              </div>
            ) : (
              <Tabs defaultValue="history" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="history">Histórico</TabsTrigger>
                  <TabsTrigger value="vouchers">Vouchers</TabsTrigger>
                </TabsList>

                <TabsContent value="history" className="mt-2">
                  {clientHistory.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground bg-muted/30 rounded-xl">
                      Nenhuma pontuação registrada para este cliente.
                    </div>
                  ) : (
                    <ScrollArea className="h-[350px] pr-4">
                      <div className="space-y-4">
                        {clientHistory.map((item, idx) => {
                          const isRedeem = item.points < 0 || item.type === "redeem";
                          return (
                            <div key={idx} className={cn(
                              "flex items-center justify-between p-3 rounded-xl border",
                              isRedeem ? "border-destructive/20 bg-destructive/5" : "border-border/50 bg-background"
                            )}>
                              <div className="flex flex-col gap-1">
                                <span className={cn("font-medium text-sm", isRedeem && "text-destructive font-semibold")}>
                                  {item.description}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(item.date).toLocaleDateString('pt-BR')} às {new Date(item.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              {isRedeem ? (
                                <div className="flex items-center gap-1 text-destructive font-bold bg-destructive/10 border border-destructive/20 px-2 py-1 rounded-full text-xs shrink-0">
                                  {item.points} pts
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-primary font-bold bg-primary/10 px-2 py-1 rounded-full text-xs shrink-0">
                                  +{item.points} pts
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>

                <TabsContent value="vouchers" className="mt-2">
                  {clientVouchers.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground bg-muted/30 rounded-xl">
                      Nenhum voucher gerado para este cliente.
                    </div>
                  ) : (
                    <ScrollArea className="h-[350px] pr-4">
                      <div className="space-y-4">
                        {clientVouchers.map((voucher) => {
                          const isUsed = voucher.status === "UTILIZADO";
                          const isExpired = !isUsed && voucher.expires_at && new Date(voucher.expires_at) < new Date();
                          const displayStatus = isUsed ? "UTILIZADO" : isExpired ? "EXPIRADO" : "DISPONÍVEL";

                          return (
                            <div key={voucher.id} className="flex flex-col gap-2 p-3 rounded-xl border border-border/50 bg-background">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{voucher.title}</span>
                                  <span className="font-mono text-[10px] font-bold bg-muted px-1.5 py-0.5 rounded text-muted-foreground border">
                                    #VCH-{voucher.id.slice(-6).toUpperCase()}
                                  </span>
                                </div>
                                <span className={cn(
                                  "px-2 py-1 rounded-full text-xs font-bold",
                                  displayStatus === "DISPONÍVEL" ? "bg-green-100 text-green-700" :
                                    displayStatus === "EXPIRADO" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                                )}>
                                  {displayStatus}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex flex-col gap-1">
                                  <span className="text-xs text-muted-foreground">
                                    Gerado em {new Date(voucher.created_at).toLocaleDateString('pt-BR')}
                                  </span>
                                  {voucher.expires_at && !isUsed && (
                                    <span className="text-xs text-muted-foreground">
                                      Válido até: {new Date(voucher.expires_at).toLocaleDateString('pt-BR')}
                                    </span>
                                  )}
                                </div>
                                {displayStatus === "DISPONÍVEL" && (
                                  <Button size="sm" variant="outline" onClick={() => handleMarkVoucherUsed(voucher.id)}>
                                    Marcar como Usado
                                  </Button>
                                )}
                                {displayStatus === "EXPIRADO" && (
                                  <div className="flex items-center gap-1.5">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs h-8 rounded-xl font-semibold"
                                      onClick={() => handleReactivateVoucher(voucher.id, 30)}
                                    >
                                      Reativar (+30d)
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-xs h-8 rounded-xl text-amber-700 hover:text-amber-800 hover:bg-amber-500/10 font-bold"
                                      onClick={() => handleMarkVoucherUsed(voucher.id, true)}
                                    >
                                      Autorizar Uso
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>
              </Tabs>
            )}

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-border/50 text-sm">
              <span className="text-muted-foreground">Saldo Total:</span>
              <span className="font-bold text-lg text-primary">{selectedClientForHistory?.points} pts</span>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

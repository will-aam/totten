"use client";

import { useState } from "react";
import { Search, Trophy, Plus, Star } from "@boxicons/react";
import { Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { enrollClientInLoyalty, getClientLoyaltyHistory, markVoucherAsUsed } from "@/app/actions/loyalty";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/components/ui/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
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
  clients: Client[];
  rewards: Reward[];
  onOpenVoucher: (client: Client) => void;
}

export function LoyaltyOverviewTab({
  isProgramActive,
  setIsProgramActive,
  programScope,
  clients,
  rewards,
  onOpenVoucher,
}: LoyaltyOverviewTabProps) {
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [addingClient, setAddingClient] = useState<string | null>(null);
  const [clientToRemove, setClientToRemove] = useState<string | null>(null);
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<Client | null>(null);
  const [clientHistory, setClientHistory] = useState<any[]>([]);
  const [clientVouchers, setClientVouchers] = useState<any[]>([]);
  const [historyCache, setHistoryCache] = useState<Record<string, { history: any[], vouchers: any[] }>>({});
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const isMobile = useIsMobile();

  const filteredClients = programScope === "global" ? clients : clients.filter(c => c.enrolledAt !== null);
  
  // Filter by search query and sort by points descending
  const searchedClients = filteredClients
    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => b.points - a.points);

  const totalPages = Math.max(1, Math.ceil(searchedClients.length / itemsPerPage));
  const displayedClients = searchedClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const unenrolledClients = clients.filter(c => c.enrolledAt === null && c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleEnroll = async (clientId: string) => {
    setAddingClient(clientId);
    const res = await enrollClientInLoyalty(clientId, true);
    setAddingClient(null);
    if (res.success) {
      toast.success("Cliente adicionado ao programa com sucesso!");
    } else {
      toast.error(res.error || "Erro ao adicionar cliente.");
    }
  };

  const confirmRemove = async () => {
    if (!clientToRemove) return;
    const clientId = clientToRemove;
    setClientToRemove(null);
    const res = await enrollClientInLoyalty(clientId, false);
    if (res.success) {
      toast.success("Cliente removido do programa.");
    } else {
      toast.error(res.error || "Erro ao remover cliente.");
    }
  };

  const openHistory = async (client: Client) => {
    setSelectedClientForHistory(client);
    
    // Use cached history if available
    if (historyCache[client.id]) {
      setClientHistory(historyCache[client.id].history);
      setClientVouchers(historyCache[client.id].vouchers);
      return;
    }

    setIsLoadingHistory(true);
    const res = await getClientLoyaltyHistory(client.id);
    if (res.success && res.history) {
      setClientHistory(res.history);
      setClientVouchers(res.vouchers || []);
      setHistoryCache(prev => ({ ...prev, [client.id]: { history: res.history, vouchers: res.vouchers || [] } }));
    } else {
      toast.error(res.error || "Erro ao carregar histórico.");
      setClientHistory([]);
      setClientVouchers([]);
    }
    setIsLoadingHistory(false);
  };

  const handleMarkVoucherUsed = async (voucherId: string) => {
    const res = await markVoucherAsUsed(voucherId);
    if (res.success) {
      toast.success("Voucher marcado como utilizado!");
      // Update local state
      setClientVouchers(prev => prev.map(v => v.id === voucherId ? { ...v, status: "UTILIZADO" } : v));
      if (selectedClientForHistory) {
        setHistoryCache(prev => {
          const cache = prev[selectedClientForHistory.id];
          if (!cache) return prev;
          return {
            ...prev,
            [selectedClientForHistory.id]: {
              ...cache,
              vouchers: cache.vouchers.map(v => v.id === voucherId ? { ...v, status: "UTILIZADO" } : v)
            }
          };
        });
      }
    } else {
      toast.error(res.error || "Erro ao utilizar voucher.");
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
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size="sm" />
          <Input
            placeholder="Buscar cliente por nome..."
            className="pl-10 rounded-full bg-card"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {programScope === "specific" && (
          <Button 
            className="rounded-full w-full sm:w-auto flex items-center gap-2"
            onClick={() => setIsAddClientOpen(true)}
          >
            <Plus size="xs" />
            Incluir Cliente
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayedClients.map((client) => (
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
                      setClientToRemove(client.id);
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

              {/* Progress bar to next reward */}
              {(() => {
                const currentPoints = client.points || 0;
                const nextReward = rewards.slice().sort((a,b) => a.pointsCost - b.pointsCost).find(r => currentPoints < r.pointsCost);
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
                  className="rounded-xl flex-1 flex flex-col gap-1 h-auto py-2 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 z-20 relative"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenVoucher(client);
                  }}
                  disabled={!client.points}
                >
                  <Download size={16} />
                  Baixar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {displayedClients.length === 0 && (
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
                  if (currentPage > 1) setCurrentPage(p => p - 1);
                }}
                className={cn("rounded-full", currentPage === 1 && "pointer-events-none opacity-50")} 
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink 
                  href="#" 
                  isActive={currentPage === i + 1}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(i + 1);
                  }}
                  className="rounded-full"
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) setCurrentPage(p => p + 1);
                }}
                className={cn("rounded-full", currentPage === totalPages && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-full"
            />
            <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
              {unenrolledClients.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-4">
                  Nenhum cliente encontrado.
                </div>
              ) : (
                unenrolledClients.map(client => (
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

      <AlertDialog open={!!clientToRemove} onOpenChange={(open) => !open && setClientToRemove(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover do programa?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este cliente do programa de fidelidade? Ele parará de acumular pontos a partir de agora.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRemove}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!clientToRemove} onOpenChange={(open) => !open && setClientToRemove(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover do programa?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este cliente do programa de fidelidade? Ele parará de acumular pontos a partir de agora.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRemove}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                  <div className="flex justify-center p-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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
                            {clientHistory.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background">
                                <div className="flex flex-col gap-1">
                                  <span className="font-medium text-sm">{item.description}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(item.date).toLocaleDateString('pt-BR')} às {new Date(item.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-primary font-bold bg-primary/10 px-2 py-1 rounded-full text-xs shrink-0">
                                  +{item.points} pts
                                </div>
                              </div>
                            ))}
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
                                    <span className="font-medium text-sm">{voucher.title}</span>
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
              <div className="flex justify-center p-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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
                        {clientHistory.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background">
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-sm">{item.description}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(item.date).toLocaleDateString('pt-BR')} às {new Date(item.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-primary font-bold bg-primary/10 px-2 py-1 rounded-full text-xs shrink-0">
                              +{item.points} pts
                            </div>
                          </div>
                        ))}
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
                                <span className="font-medium text-sm">{voucher.title}</span>
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

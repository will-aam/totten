"use client";

import { useState } from "react";
import { Trophy, Gift, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useIsMobile } from "@/components/ui/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getClientLoyaltyHistory } from "@/app/actions/loyalty";

interface LoyaltyInfo {
  success: boolean;
  active: boolean;
  enrolled: boolean;
  points: number;
  maxPoints: number;
  rewards: { id: string; title: string; points_cost: number; conditions?: string; validity_days?: number }[];
  vouchers?: { id: string; title: string; points_spent: number; status: string; created_at: string; expires_at?: string }[];
}

export function ClientLoyalty({ loyaltyInfo, clientName, clientId }: { loyaltyInfo: LoyaltyInfo, clientName: string, clientId: string }) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [clientHistory, setClientHistory] = useState<any[]>([]);
  const [clientVouchers, setClientVouchers] = useState<any[]>([]);
  const isMobile = useIsMobile();

  if (!loyaltyInfo || !loyaltyInfo.success || !loyaltyInfo.active || !loyaltyInfo.enrolled) {
    return null; // Não exibe se inativo ou não matriculado
  }

  const handleOpenHistory = async () => {
    setIsHistoryOpen(true);
    if (clientHistory.length > 0) return; // Cache

    setIsLoadingHistory(true);
    const res = await getClientLoyaltyHistory(clientId);
    if (res.success && res.history) {
      setClientHistory(res.history);
      setClientVouchers(res.vouchers || []);
    } else {
      toast.error(res.error || "Erro ao carregar histórico.");
      setClientHistory([]);
      setClientVouchers([]);
    }
    setIsLoadingHistory(false);
  };

  const currentPoints = loyaltyInfo.points || 0;
  
  // Garante que as recompensas estejam ordenadas da menor para a maior pontuação exigida
  const sortedRewards = [...loyaltyInfo.rewards].sort((a, b) => a.points_cost - b.points_cost);

  // A próxima recompensa é a primeira que custa mais que os pontos atuais
  const nextReward = sortedRewards.find(r => currentPoints < r.points_cost);

  // Recompensas já atingidas
  const vouchers = loyaltyInfo.vouchers || [];
  const hasVouchers = vouchers.length > 0;

  const percentage = nextReward
    ? Math.min(100, Math.round((currentPoints / nextReward.points_cost) * 100))
    : 100;

  return (
    <div className="space-y-6">
      <div
        onClick={handleOpenHistory}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl text-white shadow-md relative overflow-hidden cursor-pointer hover:shadow-lg transition-all"
      >
        {/* Decorative background */}
        <Trophy className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 pointer-events-none" />

        <div className="relative z-10 p-6 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
          <div className="text-center sm:text-left space-y-1">
            <h3 className="font-bold text-xl flex items-center justify-center sm:justify-start gap-2">
              <Trophy className="w-5 h-5 text-yellow-300" />
              Seus pontos
            </h3>
          </div>
          <div className="bg-white/20 px-4 py-2 rounded-2xl backdrop-blur-sm shrink-0">
            <div className="text-sm font-medium text-blue-100 uppercase tracking-wider text-center">Seu Saldo</div>
            <div className="text-3xl font-black text-center">{currentPoints} <span className="text-lg font-bold">pts</span></div>
          </div>
        </div>

        {/* Voucher dashed line and cutouts */}
        <div className="relative z-10">
          <div className="absolute top-0 left-0 right-0 h-px border-t-2 border-dashed border-white/30" />
          <div className="absolute top-0 -left-4 -translate-y-1/2 w-8 h-8 bg-slate-50 rounded-full" />
          <div className="absolute top-0 -right-4 -translate-y-1/2 w-8 h-8 bg-slate-50 rounded-full" />
        </div>

        {nextReward && (
          <div className="relative z-10 px-6 pt-6 pb-6">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-1">Próxima Meta</p>
                <p className="font-bold text-sm">{nextReward.title}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{percentage}%</p>
              </div>
            </div>
            <Progress value={percentage} className="h-3 bg-white/20" indicatorColor="bg-yellow-400" />
            <p className="text-xs text-blue-200 mt-2 text-right">
              Faltam <strong className="text-white">{nextReward.points_cost - currentPoints} pontos</strong>
            </p>
          </div>
        )}
      </div>

      {hasVouchers && (
        <div className="bg-white border rounded-3xl p-6 shadow-sm">
          <h4 className="font-bold text-lg flex items-center gap-2 mb-4">
            <Gift className="h-5 w-5 text-emerald-500" /> Suas Recompensas
          </h4>

          <div className="space-y-4">
            {vouchers.map(voucher => {
              const isUsed = voucher.status === "UTILIZADO";
              return (
                <div key={voucher.id} className={cn("relative border p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", isUsed ? "bg-slate-50 border-slate-200 opacity-70" : "bg-emerald-50 border-emerald-100")}>
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-full", isUsed ? "bg-slate-200 text-slate-500" : "bg-emerald-100 text-emerald-600")}>
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className={cn("font-bold", isUsed ? "text-slate-700" : "text-emerald-800")}>{voucher.title}</h5>
                      <p className={cn("text-xs mt-1", isUsed ? "text-slate-500" : "text-emerald-600/80")}>
                        Emitido: {new Date(voucher.created_at).toLocaleDateString('pt-BR')}
                      </p>
                      {voucher.expires_at && !isUsed && (
                        <p className="text-xs mt-0.5 font-semibold text-orange-600">
                          Expira em: {new Date(voucher.expires_at).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className={cn("text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap shrink-0", isUsed ? "bg-slate-200 text-slate-600" : "bg-emerald-600 text-white")}>
                    {isUsed ? "Utilizado" : "Disponível!"}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Apresente a sua tela do celular na recepção para resgatar sua recompensa.
          </p>
        </div>
      )}

      {isMobile ? (
        <Drawer open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <DrawerContent className="bg-white text-slate-900 border-t border-slate-200">
            <div className="mx-auto w-full max-w-sm">
              <DrawerHeader>
                <DrawerTitle className="text-slate-900">Histórico de Pontos</DrawerTitle>
                <DrawerDescription className="text-slate-500">
                  {clientName}
                </DrawerDescription>
              </DrawerHeader>

              <div className="px-4 pb-4">
                {isLoadingHistory ? (
                  <div className="flex justify-center p-8">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <Tabs defaultValue="history" className="w-full mt-2">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-100 rounded-full p-1">
                      <TabsTrigger value="history" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
                        Histórico
                      </TabsTrigger>
                      <TabsTrigger value="vouchers" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
                        Vouchers
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="history" className="mt-4">
                      {clientHistory.length === 0 ? (
                        <div className="text-center p-8 text-slate-500 bg-slate-50 rounded-xl">
                          Nenhuma pontuação registrada.
                        </div>
                      ) : (
                        <ScrollArea className="h-[40vh] pr-4">
                          <div className="space-y-4">
                            {clientHistory.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white">
                                <div className="flex flex-col gap-1">
                                  <span className="font-medium text-sm text-slate-800">{item.description}</span>
                                  <span className="text-xs text-slate-500">
                                    {new Date(item.date).toLocaleDateString('pt-BR')} às {new Date(item.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-blue-700 font-bold bg-blue-50 px-2 py-1 rounded-full text-xs shrink-0">
                                  +{item.points} pts
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </TabsContent>

                    <TabsContent value="vouchers" className="mt-4">
                      {clientVouchers.length === 0 ? (
                        <div className="text-center p-8 text-slate-500 bg-slate-50 rounded-xl">
                          Você ainda não possui vouchers.
                        </div>
                      ) : (
                        <ScrollArea className="h-[40vh] pr-4">
                          <div className="space-y-4">
                            {clientVouchers.map((voucher) => {
                              const isUsed = voucher.status === "UTILIZADO";
                              const isExpired = !isUsed && voucher.expires_at && new Date(voucher.expires_at) < new Date();
                              const displayStatus = isUsed ? "Utilizado" : isExpired ? "Expirado" : "Disponível";
                              const isInactive = isUsed || isExpired;
                              return (
                                <div key={voucher.id} className={cn("flex flex-col p-3 rounded-xl border gap-2", isInactive ? "bg-slate-50 border-slate-200 opacity-70" : "bg-white border-blue-200")}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-1">
                                      <span className="font-medium text-sm text-slate-800">{voucher.title}</span>
                                      <span className="text-xs text-slate-500">
                                        Custo: {voucher.points_spent} pts
                                      </span>
                                    </div>
                                    <div className={cn("px-2 py-1 rounded-full text-xs font-bold shrink-0", isInactive ? "bg-slate-200 text-slate-600" : "bg-blue-100 text-blue-700")}>
                                      {displayStatus}
                                    </div>
                                  </div>
                                  {!isUsed && voucher.expires_at && (
                                    <div className="text-xs text-slate-500 border-t border-slate-100 pt-2 mt-1">
                                      Válido até: {new Date(voucher.expires_at).toLocaleDateString('pt-BR')}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      )}
                    </TabsContent>
                  </Tabs>
                )}

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200 text-sm">
                  <span className="text-slate-500">Saldo Total:</span>
                  <span className="font-bold text-lg text-blue-700">{currentPoints} pts</span>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <DialogContent className="rounded-2xl max-w-md bg-white text-slate-900">
            <DialogHeader>
              <DialogTitle className="text-slate-900">Histórico de Pontos</DialogTitle>
              <DialogDescription className="text-slate-500">
                {clientName}
              </DialogDescription>
            </DialogHeader>

            {isLoadingHistory ? (
              <div className="flex justify-center p-8">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <Tabs defaultValue="history" className="w-full mt-2">
                <TabsList className="grid w-full grid-cols-2 bg-slate-100 rounded-full p-1">
                  <TabsTrigger value="history" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
                    Histórico
                  </TabsTrigger>
                  <TabsTrigger value="vouchers" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
                    Vouchers
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="history" className="mt-4">
                  {clientHistory.length === 0 ? (
                    <div className="text-center p-8 text-slate-500 bg-slate-50 rounded-xl">
                      Nenhuma pontuação registrada.
                    </div>
                  ) : (
                    <ScrollArea className="h-[350px] pr-4">
                      <div className="space-y-4">
                        {clientHistory.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white">
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-sm text-slate-800">{item.description}</span>
                              <span className="text-xs text-slate-500">
                                {new Date(item.date).toLocaleDateString('pt-BR')} às {new Date(item.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-blue-700 font-bold bg-blue-50 px-2 py-1 rounded-full text-xs shrink-0">
                              +{item.points} pts
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>

                <TabsContent value="vouchers" className="mt-4">
                  {clientVouchers.length === 0 ? (
                    <div className="text-center p-8 text-slate-500 bg-slate-50 rounded-xl">
                      Você ainda não possui vouchers.
                    </div>
                  ) : (
                    <ScrollArea className="h-[350px] pr-4">
                      <div className="space-y-4">
                        {clientVouchers.map((voucher) => {
                          const isUsed = voucher.status === "UTILIZADO";
                          const isExpired = !isUsed && voucher.expires_at && new Date(voucher.expires_at) < new Date();
                          const displayStatus = isUsed ? "Utilizado" : isExpired ? "Expirado" : "Disponível";
                          const isInactive = isUsed || isExpired;
                          return (
                            <div key={voucher.id} className={cn("flex flex-col p-3 rounded-xl border gap-2", isInactive ? "bg-slate-50 border-slate-200 opacity-70" : "bg-white border-blue-200")}>
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                  <span className="font-medium text-sm text-slate-800">{voucher.title}</span>
                                  <span className="text-xs text-slate-500">
                                    Custo: {voucher.points_spent} pts
                                  </span>
                                </div>
                                <div className={cn("px-2 py-1 rounded-full text-xs font-bold shrink-0", isInactive ? "bg-slate-200 text-slate-600" : "bg-blue-100 text-blue-700")}>
                                  {displayStatus}
                                </div>
                              </div>
                              {!isUsed && voucher.expires_at && (
                                <div className="text-xs text-slate-500 border-t border-slate-100 pt-2 mt-1">
                                  Válido até: {new Date(voucher.expires_at).toLocaleDateString('pt-BR')}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>
              </Tabs>
            )}

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200 text-sm">
              <span className="text-slate-500">Saldo Total:</span>
              <span className="font-bold text-lg text-blue-700">{currentPoints} pts</span>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Trophy, Gift, CheckCircle, Sparkles, Loader2, Clock, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/components/ui/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getClientLoyaltyHistory, redeemLoyaltyReward } from "@/app/actions/loyalty";
import { ClientVoucherCard } from "./client-voucher-card";

interface RewardItem {
  id: string;
  title: string;
  points_cost: number;
  conditions?: string;
  validity_days?: number;
  reward_type?: string;
  discount_value?: number | null;
}

interface LoyaltyInfo {
  success: boolean;
  active: boolean;
  enrolled: boolean;
  points: number;
  maxPoints: number;
  rewards: RewardItem[];
  vouchers?: { id: string; title: string; points_spent: number; status: string; created_at: string; expires_at?: string }[];
}

export function ClientLoyalty({ loyaltyInfo, clientName, clientId }: { loyaltyInfo: LoyaltyInfo, clientName: string, clientId: string }) {
  const [currentPoints, setCurrentPoints] = useState(loyaltyInfo?.points || 0);
  const [vouchers, setVouchers] = useState<any[]>(loyaltyInfo?.vouchers || []);
  const [rewardToRedeem, setRewardToRedeem] = useState<RewardItem | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [clientHistory, setClientHistory] = useState<any[]>([]);
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
      if (res.vouchers) setVouchers(res.vouchers);
    } else {
      toast.error(res.error || "Erro ao carregar histórico.");
      setClientHistory([]);
    }
    setIsLoadingHistory(false);
  };

  const handleConfirmRedeem = async () => {
    if (!rewardToRedeem) return;
    setIsRedeeming(true);
    try {
      const res = await redeemLoyaltyReward(clientId, rewardToRedeem.id);
      if (res.success && res.voucher) {
        const remaining = res.newPoints !== undefined ? res.newPoints : Math.max(0, currentPoints - rewardToRedeem.points_cost);
        setCurrentPoints(remaining);
        setVouchers(prev => [res.voucher, ...prev]);
        toast.success(`Parabéns! Recompensa "${rewardToRedeem.title}" resgatada com sucesso!`);
        setRewardToRedeem(null);
      } else {
        toast.error(res.error || "Não foi possível resgatar a recompensa.");
      }
    } catch (e) {
      toast.error("Erro na comunicação com o servidor ao resgatar.");
    } finally {
      setIsRedeeming(false);
    }
  };

  // Garante que as recompensas estejam ordenadas da menor para a maior pontuação exigida
  const sortedRewards = [...(loyaltyInfo.rewards || [])].sort((a, b) => a.points_cost - b.points_cost);

  // A próxima meta é a primeira que custa mais que os pontos atuais
  const nextReward = sortedRewards.find(r => currentPoints < r.points_cost);
  const hasVouchers = vouchers.length > 0;

  const nextRewardPercentage = nextReward
    ? Math.min(100, Math.round((currentPoints / nextReward.points_cost) * 100))
    : 100;

  return (
    <div className="space-y-6">
      {/* CARD DO SALDO DE PONTOS */}
      <div
        onClick={handleOpenHistory}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl text-white shadow-md relative overflow-hidden cursor-pointer hover:shadow-lg transition-all"
      >
        <Trophy className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 pointer-events-none" />

        <div className="relative z-10 p-6 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
          <div className="text-center sm:text-left space-y-1">
            <h3 className="font-bold text-xl flex items-center justify-center sm:justify-start gap-2">
              <Trophy className="w-5 h-5 text-yellow-300" />
              Seus pontos de fidelidade
            </h3>
            <p className="text-xs text-blue-100">
              Toque aqui para ver seu histórico detalhado de pontos
            </p>
          </div>
          <div className="bg-white/20 px-4 py-2 rounded-2xl backdrop-blur-sm shrink-0">
            <div className="text-xs font-semibold text-blue-100 uppercase tracking-wider text-center">Saldo Atual</div>
            <div className="text-3xl font-black text-center">{currentPoints} <span className="text-lg font-bold">pts</span></div>
          </div>
        </div>

        {/* Linha serrilhada decorativa */}
        <div className="relative z-10">
          <div className="absolute top-0 left-0 right-0 h-px border-t-2 border-dashed border-white/30" />
          <div className="absolute top-0 -left-4 -translate-y-1/2 w-8 h-8 bg-slate-50 rounded-full" />
          <div className="absolute top-0 -right-4 -translate-y-1/2 w-8 h-8 bg-slate-50 rounded-full" />
        </div>

        {nextReward && (
          <div className="relative z-10 px-6 pt-6 pb-6">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-1">Próximo Objetivo</p>
                <p className="font-bold text-sm">{nextReward.title}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{nextRewardPercentage}%</p>
              </div>
            </div>
            <Progress value={nextRewardPercentage} className="h-3 bg-white/20" indicatorColor="bg-yellow-400" />
            <p className="text-xs text-blue-200 mt-2 text-right">
              Faltam <strong className="text-white">{nextReward.points_cost - currentPoints} pontos</strong>
            </p>
          </div>
        )}
      </div>

      {/* CATÁLOGO DE RECOMPENSAS DISPONÍVEIS */}
      {sortedRewards.length > 0 && (
        <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                <Gift className="h-5 w-5 text-indigo-600" /> Recompensas Disponíveis
              </h4>
              <p className="text-xs text-muted-foreground">
                Escolha a recompensa desejada e resgate quando quiser.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-2">
            {sortedRewards.map((reward) => {
              const canAfford = currentPoints >= reward.points_cost;
              const missingPoints = reward.points_cost - currentPoints;
              const progress = canAfford ? 100 : Math.round((currentPoints / reward.points_cost) * 100);

              return (
                <div
                  key={reward.id}
                  className={cn(
                    "p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
                    canAfford
                      ? "bg-indigo-50/50 border-indigo-200 hover:border-indigo-400 shadow-xs"
                      : "bg-slate-50/70 border-slate-200 opacity-85"
                  )}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm sm:text-base">
                        {reward.title}
                      </span>
                      {reward.reward_type === "PERCENTAGE" && (
                        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {reward.discount_value}% OFF
                        </span>
                      )}
                      {reward.reward_type === "FIXED_AMOUNT" && (
                        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          R$ {Number(reward.discount_value || 0).toFixed(2)} OFF
                        </span>
                      )}
                      {canAfford && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Disponível
                        </span>
                      )}
                    </div>
                    {reward.conditions && (
                      <p className="text-xs text-slate-500">{reward.conditions}</p>
                    )}
                    {reward.validity_days && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Válido por {reward.validity_days} dias após o resgate
                      </p>
                    )}
                    {!canAfford && (
                      <div className="pt-2 max-w-xs">
                        <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                          <span>Faltam {missingPoints} pts</span>
                          <span className="font-bold">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5 bg-slate-200" indicatorColor="bg-indigo-500" />
                      </div>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0">
                    <div className="font-black text-indigo-700 text-base sm:text-lg">
                      {reward.points_cost} <span className="text-xs font-semibold text-slate-500">pts</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setRewardToRedeem(reward)}
                      disabled={!canAfford}
                      className={cn(
                        "rounded-full px-4 h-9 font-bold text-xs shadow-xs",
                        canAfford
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      )}
                    >
                      {canAfford ? "Resgatar" : "Bloqueado"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VOUCHERS RESGATADOS */}
      {hasVouchers && (
        <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                <CheckCircle className="h-5 w-5 text-emerald-500" /> Seus Vouchers Resgatados
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Apresente o PIN do voucher na recepção para utilizar seu benefício.
              </p>
            </div>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200">
              {vouchers.length} {vouchers.length === 1 ? "voucher" : "vouchers"}
            </span>
          </div>

          <div className="space-y-3">
            {vouchers.map((voucher) => (
              <ClientVoucherCard key={voucher.id} voucher={voucher} />
            ))}
          </div>
        </div>
      )}

      {/* DIÁLOGO DE CONFIRMAÇÃO DE RESGATE */}
      <AlertDialog open={!!rewardToRedeem} onOpenChange={(open) => !open && !isRedeeming && setRewardToRedeem(null)}>
        <AlertDialogContent className="rounded-3xl max-w-md bg-white">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 mx-auto sm:mx-0">
              <Gift className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-xl font-black text-slate-900">
              Confirmar Resgate
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 text-sm space-y-2 pt-1" asChild>
              <div>
                <p>
                  Você está prestes a resgatar <strong>{rewardToRedeem?.title}</strong>.
                </p>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1 my-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Custo da recompensa:</span>
                    <strong className="text-indigo-600 font-bold">{rewardToRedeem?.points_cost} pts</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Saldo atual:</span>
                    <span className="font-semibold text-slate-700">{currentPoints} pts</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1">
                    <span className="text-slate-500">Saldo restante após resgate:</span>
                    <span className="font-bold text-slate-900">{Math.max(0, currentPoints - (rewardToRedeem?.points_cost || 0))} pts</span>
                  </div>
                </div>
                {rewardToRedeem?.conditions && (
                  <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    Regra: {rewardToRedeem.conditions}
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel disabled={isRedeeming} className="rounded-full">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmRedeem();
              }}
              disabled={isRedeeming}
              className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              {isRedeeming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resgatando...
                </>
              ) : (
                "Sim, Resgatar Agora"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DRAWER / MODAL DE HISTÓRICO DE PONTOS */}
      {isMobile ? (
        <Drawer open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <DrawerContent className="bg-white text-slate-900 border-t border-slate-200">
            <div className="mx-auto w-full max-w-sm">
              <DrawerHeader>
                <DrawerTitle className="text-slate-900">Extrato de Pontos</DrawerTitle>
                <DrawerDescription className="text-slate-500">
                  {clientName} &bull; Histórico detalhado de movimentações
                </DrawerDescription>
              </DrawerHeader>

              <div className="px-4 pb-6">
                {isLoadingHistory ? (
                  <div className="flex justify-center p-8">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : clientHistory.length === 0 ? (
                  <div className="text-center p-8 text-slate-500 bg-slate-50 rounded-2xl border">
                    Nenhuma pontuação registrada.
                  </div>
                ) : (
                  <ScrollArea className="h-[45vh] pr-3 mt-2">
                    <div className="space-y-3">
                      {clientHistory.map((item, idx) => {
                        const isRedeem = item.points < 0 || item.type === "redeem";
                        return (
                          <div key={idx} className={cn(
                            "flex items-center justify-between p-3 rounded-xl border bg-white",
                            isRedeem ? "border-rose-100 bg-rose-50/20" : "border-slate-200"
                          )}>
                            <div className="flex flex-col gap-0.5">
                              <span className={cn("font-medium text-sm", isRedeem ? "text-rose-950 font-semibold" : "text-slate-800")}>
                                {item.description}
                              </span>
                              <span className="text-xs text-slate-400">
                                {new Date(item.date).toLocaleDateString('pt-BR')} às {new Date(item.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {isRedeem ? (
                              <div className="flex items-center gap-1 text-rose-700 font-bold bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full text-xs shrink-0">
                                {item.points} pts
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-blue-700 font-bold bg-blue-50 px-2.5 py-1 rounded-full text-xs shrink-0">
                                +{item.points} pts
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200 text-sm">
                  <span className="text-slate-500">Saldo Atual:</span>
                  <span className="font-black text-xl text-blue-700">{currentPoints} pts</span>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <DialogContent className="rounded-2xl max-w-md bg-white text-slate-900">
            <DialogHeader>
              <DialogTitle className="text-slate-900">Extrato de Pontos</DialogTitle>
              <DialogDescription className="text-slate-500">
                {clientName} &bull; Histórico detalhado de movimentações
              </DialogDescription>
            </DialogHeader>

            {isLoadingHistory ? (
              <div className="flex justify-center p-8">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : clientHistory.length === 0 ? (
              <div className="text-center p-8 text-slate-500 bg-slate-50 rounded-2xl border">
                Nenhuma pontuação registrada.
              </div>
            ) : (
              <ScrollArea className="h-[350px] pr-3 mt-2">
                <div className="space-y-3">
                  {clientHistory.map((item, idx) => {
                    const isRedeem = item.points < 0 || item.type === "redeem";
                    return (
                      <div key={idx} className={cn(
                        "flex items-center justify-between p-3 rounded-xl border bg-white",
                        isRedeem ? "border-rose-100 bg-rose-50/20" : "border-slate-200"
                      )}>
                        <div className="flex flex-col gap-0.5">
                          <span className={cn("font-medium text-sm", isRedeem ? "text-rose-950 font-semibold" : "text-slate-800")}>
                            {item.description}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(item.date).toLocaleDateString('pt-BR')} às {new Date(item.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {isRedeem ? (
                          <div className="flex items-center gap-1 text-rose-700 font-bold bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full text-xs shrink-0">
                            {item.points} pts
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-blue-700 font-bold bg-blue-50 px-2.5 py-1 rounded-full text-xs shrink-0">
                            +{item.points} pts
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200 text-sm">
              <span className="text-slate-500">Saldo Atual:</span>
              <span className="font-black text-xl text-blue-700">{currentPoints} pts</span>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

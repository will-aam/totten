"use client";

import { Trophy, Gift, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface LoyaltyInfo {
  success: boolean;
  active: boolean;
  enrolled: boolean;
  points: number;
  maxPoints: number;
  rewards: { id: string; title: string; points_cost: number; conditions?: string }[];
}

export function ClientLoyalty({ loyaltyInfo, clientName }: { loyaltyInfo: LoyaltyInfo, clientName: string }) {
  if (!loyaltyInfo || !loyaltyInfo.success || !loyaltyInfo.active || !loyaltyInfo.enrolled) {
    return null; // Não exibe se inativo ou não matriculado
  }

  const currentPoints = loyaltyInfo.points || 0;
  
  // A próxima recompensa é a primeira que custa mais que os pontos atuais
  const nextReward = loyaltyInfo.rewards.find(r => currentPoints < r.points_cost);
  
  // Recompensas já atingidas
  const unlockedRewards = loyaltyInfo.rewards.filter(r => currentPoints >= r.points_cost);
  const hasUnlocked = unlockedRewards.length > 0;
  
  const percentage = nextReward 
    ? Math.min(100, Math.round((currentPoints / nextReward.points_cost) * 100))
    : 100;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        {/* Decorative background */}
        <Trophy className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
          <div className="text-center sm:text-left space-y-1">
            <h3 className="font-bold text-xl flex items-center justify-center sm:justify-start gap-2">
              <Trophy className="w-5 h-5 text-yellow-300" />
              Programa de Fidelidade
            </h3>
            <p className="text-blue-100 text-sm">Continue realizando serviços para ganhar prêmios!</p>
          </div>
          <div className="bg-white/20 px-4 py-2 rounded-2xl backdrop-blur-sm shrink-0">
            <div className="text-sm font-medium text-blue-100 uppercase tracking-wider text-center">Seu Saldo</div>
            <div className="text-3xl font-black text-center">{currentPoints} <span className="text-lg font-bold">pts</span></div>
          </div>
        </div>

        {nextReward && (
          <div className="relative z-10 mt-6 pt-6 border-t border-white/20">
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

      {hasUnlocked && (
        <div className="bg-white border rounded-3xl p-6 shadow-sm">
          <h4 className="font-bold text-lg flex items-center gap-2 mb-4">
            <Gift className="h-5 w-5 text-emerald-500" /> Suas Recompensas
          </h4>
          
          <div className="space-y-4">
            {unlockedRewards.map(reward => (
              <div key={reward.id} className="relative bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-emerald-800">{reward.title}</h5>
                    {reward.conditions && (
                      <p className="text-xs text-emerald-600/80 mt-1">{reward.conditions}</p>
                    )}
                  </div>
                </div>
                <div className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap shrink-0">
                  Desbloqueado!
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-xs text-muted-foreground text-center mt-6">
            Apresente a sua tela do celular na recepção para resgatar sua recompensa.
          </p>
        </div>
      )}
    </div>
  );
}

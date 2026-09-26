"use client";

import { useState } from "react";
import { InfoCircle, Plus, Gift } from "@boxicons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { LoyaltyRewardModal } from "./loyalty-reward-modal";
import { toast } from "sonner";

interface Reward {
  id: number | string;
  title: string;
  pointsCost: number;
  conditions?: string;
}

interface LoyaltySettingsTabProps {
  rewards: Reward[];
  setRewards: (rewards: Reward[]) => void;
  programScope: "global" | "specific";
  setProgramScope: (scope: "global" | "specific") => void;
}

export function LoyaltySettingsTab({
  rewards,
  setRewards,
  programScope,
  setProgramScope,
}: LoyaltySettingsTabProps) {
  const [pendingScope, setPendingScope] = useState<"global" | "specific" | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);

  const [checkInActive, setCheckInActive] = useState(true);
  const [scheduleActive, setScheduleActive] = useState(true);

  const handleScopeChange = (value: "global" | "specific") => {
    if (value !== programScope) {
      setPendingScope(value);
      setIsAlertOpen(true);
    }
  };

  const confirmScopeChange = () => {
    if (pendingScope) {
      setProgramScope(pendingScope);
    }
    setIsAlertOpen(false);
  };

  const handleCheckInToggle = (checked: boolean) => {
    if (!checked && !scheduleActive) {
      toast.error("Ao menos uma regra de ganho deve ficar ativa!");
      return;
    }
    setCheckInActive(checked);
  };

  const handleScheduleToggle = (checked: boolean) => {
    if (!checked && !checkInActive) {
      toast.error("Ao menos uma regra de ganho deve ficar ativa!");
      return;
    }
    setScheduleActive(checked);
  };

  const handleSaveReward = (reward: Reward) => {
    // If it's editing an existing one or adding new
    setRewards((prev) => {
      const exists = prev.find((r) => r.id === reward.id);
      if (exists) {
        return prev.map((r) => (r.id === reward.id ? reward : r));
      }
      return [...prev, reward];
    });
  };

  return (
    <div className="flex flex-col gap-8 md:gap-10 pt-4">
      {/* Seção 1: Abrangência */}
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold">Abrangência do Programa</h3>
          <p className="text-sm text-muted-foreground">
            Defina se o sistema de pontos será aplicado a todos os clientes ou apenas a clientes selecionados.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={programScope} onValueChange={handleScopeChange}>
              <SelectTrigger className="w-full sm:w-80 rounded-2xl bg-card">
                <SelectValue placeholder="Selecione a abrangência" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="global" className="rounded-xl">Global (Todos os clientes participam)</SelectItem>
                <SelectItem value="specific" className="rounded-xl">Específico (Apenas clientes adicionados)</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <button className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors shrink-0">
                  <InfoCircle size="sm" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 rounded-2xl text-sm leading-relaxed shadow-xl">
                <div className="space-y-2">
                  <p><strong>Global:</strong> Todos os clientes começam a acumular pontos automaticamente a partir do momento em que o programa é ativado.</p>
                  <p><strong>Específico:</strong> Apenas os clientes que você adicionar manualmente irão acumular pontos.</p>
                  <p className="text-xs text-muted-foreground mt-2 border-t pt-2 border-border/50">
                    Nota: Pontos não são retroativos. Eles só passam a contar a partir da data de ativação ou adição do cliente no programa.
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className="h-px bg-border/50 w-full" />

      {/* Seção 2: Limites */}
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold">Limites de Pontuação</h3>
          <p className="text-sm text-muted-foreground">
            Defina o limite máximo de pontos que um cliente pode acumular. Isso ajuda a controlar o resgate de recompensas.
          </p>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">Limite Máximo de Pontos</Label>
            <p className="text-sm text-muted-foreground max-w-[200px] sm:max-w-none">
              O saldo do cliente não ultrapassará este valor.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Input type="number" defaultValue={500} className="w-20 text-center rounded-2xl bg-card" />
          </div>
        </div>
      </div>

      <div className="h-px bg-border/50 w-full" />

      {/* Seção 3: Regras de Ganho */}
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold">Regras de Ganho</h3>
          <p className="text-sm text-muted-foreground">
            Defina quantos pontos o cliente ganha ao realizar ações no sistema. Atenção: estes valores não podem ultrapassar o limite máximo.
          </p>
        </div>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Pontos por Check-in</Label>
              <p className="text-sm text-muted-foreground max-w-[200px] sm:max-w-none">
                Quantidade recebida cada vez que o status mudar para "Atendido".
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Input 
                type="number" 
                defaultValue={10} 
                disabled={!checkInActive}
                className="w-16 sm:w-20 text-center rounded-2xl bg-card disabled:opacity-50" 
              />
              <Switch 
                checked={checkInActive} 
                onCheckedChange={handleCheckInToggle} 
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Pontos por Agendamento</Label>
              <p className="text-sm text-muted-foreground max-w-[200px] sm:max-w-none">
                Bônus extra para clientes que agendam pelo link.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Input 
                type="number" 
                defaultValue={5} 
                disabled={!scheduleActive}
                className="w-16 sm:w-20 text-center rounded-2xl bg-card disabled:opacity-50" 
              />
              <Switch 
                checked={scheduleActive} 
                onCheckedChange={handleScheduleToggle} 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-border/50 w-full" />

      {/* Seção 4: Recompensas */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Recompensas e Resgates</h3>
            <p className="text-sm text-muted-foreground">
              O que o cliente pode fazer com os pontos.
            </p>
          </div>
          <Button 
            size="sm" 
            className="rounded-full flex items-center gap-1 w-fit"
            onClick={() => setIsRewardModalOpen(true)}
          >
            <Plus size="xs" />
            <span>Nova Recompensa</span>
          </Button>
        </div>
        <div className="space-y-3">
          {rewards.map((reward) => (
            <div key={reward.id} className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full text-primary">
                  <Gift size="sm" />
                </div>
                <div>
                  <span className="font-medium text-sm sm:text-base">{reward.title}</span>
                  {reward.conditions && (
                    <p className="text-xs text-muted-foreground">{reward.conditions}</p>
                  )}
                </div>
              </div>
              <div className="font-bold text-primary whitespace-nowrap ml-2">
                {reward.pointsCost} pts
              </div>
            </div>
          ))}
          
          {rewards.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-2xl">
              Nenhuma recompensa cadastrada.
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja mudar a abrangência?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2" asChild>
              <div>
                <div>
                  Mudar de <strong>{programScope === "global" ? "Global" : "Específico"}</strong> para <strong>{pendingScope === "global" ? "Global" : "Específico"}</strong> pode alterar quem recebe pontos.
                </div>
                <div className="text-destructive font-medium">
                  Atenção: Os pontos começam a ser contabilizados apenas a partir de agora. Se você estiver restringindo o programa, clientes removidos poderão perder o acesso aos pontos atuais.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="rounded-full" onClick={confirmScopeChange}>
              Confirmar Mudança
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LoyaltyRewardModal 
        open={isRewardModalOpen} 
        onOpenChange={setIsRewardModalOpen} 
        onSave={handleSaveReward}
      />
    </div>
  );
}

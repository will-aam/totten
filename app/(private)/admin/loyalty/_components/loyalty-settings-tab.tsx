"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { InfoCircle, Plus, Gift, Save } from "@boxicons/react";
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
import { updateLoyaltySettings } from "@/app/actions/loyalty";

interface Reward {
  id: number | string;
  title: string;
  pointsCost: number;
  conditions?: string;
  validityDays?: number;
}

interface LoyaltySettingsTabProps {
  organizationId: string;
  settings: any;
  rewards: Reward[];
  setRewards: (rewards: Reward[]) => void;
  programScope: "global" | "specific";
  setProgramScope: (scope: "global" | "specific") => void;
  isProgramActive: boolean;
  setIsProgramActive: (active: boolean) => void;
}

export function LoyaltySettingsTab({
  organizationId,
  settings,
  rewards,
  setRewards,
  programScope,
  setProgramScope,
  isProgramActive,
  setIsProgramActive
}: LoyaltySettingsTabProps) {
  const [pendingScope, setPendingScope] = useState<"global" | "specific" | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);

  const [checkInActive, setCheckInActive] = useState(settings?.check_in_active ?? (settings?.check_in_points > 0));
  const [scheduleActive, setScheduleActive] = useState(settings?.schedule_active ?? (settings?.schedule_points > 0));

  const [pointsPerCheckin, setPointsPerCheckin] = useState(settings?.check_in_points || 10);
  const [pointsPerAppointment, setPointsPerAppointment] = useState(settings?.schedule_points || 5);
  const [maxPoints, setMaxPoints] = useState(settings?.max_points || 500);

  const [isSaving, setIsSaving] = useState(false);

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

  const handleSaveReward = async (reward: Reward) => {
    const exists = rewards.find((r) => r.id === reward.id);
    let newRewards;
    if (exists) {
      newRewards = rewards.map((r) => (r.id === reward.id ? reward : r));
    } else {
      newRewards = [...rewards, reward];
    }
    setRewards(newRewards);
    
    // Auto-save
    try {
      const data = {
        scope: programScope,
        max_points: maxPoints,
        points_per_checkin: checkInActive ? pointsPerCheckin : 0,
        points_per_appointment: scheduleActive ? pointsPerAppointment : 0,
        rewards: newRewards.map(r => ({
          title: r.title,
          points_cost: r.pointsCost,
          conditions: r.conditions
        }))
      };
      await updateLoyaltySettings(organizationId, data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveReward = async (rewardId: string | number) => {
    const newRewards = rewards.filter(r => r.id !== rewardId);
    setRewards(newRewards);
    
    // Auto-save
    try {
      const data = {
        scope: programScope,
        max_points: maxPoints,
        points_per_checkin: checkInActive ? pointsPerCheckin : 0,
        points_per_appointment: scheduleActive ? pointsPerAppointment : 0,
        rewards: newRewards.map(r => ({
          title: r.title,
          points_cost: r.pointsCost,
          conditions: r.conditions,
          validity_days: r.validityDays
        }))
      };
      await updateLoyaltySettings(organizationId, data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const data = {
        scope: programScope,
        max_points: maxPoints,
        points_per_checkin: checkInActive ? pointsPerCheckin : 0,
        points_per_appointment: scheduleActive ? pointsPerAppointment : 0,
        rewards: rewards.map(r => ({
          title: r.title,
          points_cost: r.pointsCost,
          conditions: r.conditions,
          validity_days: r.validityDays
        }))
      };

      const res = await updateLoyaltySettings(organizationId, data);
      if (res.success) {
        toast.success("Configurações salvas com sucesso!");
      } else {
        toast.error("Erro ao salvar as configurações.");
      }
    } catch (e) {
      toast.error("Erro na comunicação com o servidor.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 md:gap-10 pt-4 relative pb-20">

      {/* Toggle para ativar/desativar programa de fidelidade */}
      <div className="flex items-center justify-between p-6 bg-card rounded-3xl border shadow-sm">
        <div className="space-y-1 pr-4">
          <h3 className="font-bold text-primary flex items-center gap-2">
            <Gift size="sm" className="hidden sm:inline-block" />
            Programa de Fidelidade Ativo
          </h3>
          <p className="text-sm text-muted-foreground">
            Ative para permitir que seus clientes acumulem pontos e resgatem recompensas.
          </p>
        </div>
        <Switch
          checked={isProgramActive}
          onCheckedChange={setIsProgramActive}
          className="data-[state=checked]:bg-primary"
        />
      </div>

      <div className={cn("flex flex-col gap-8 md:gap-10 transition-opacity duration-300", !isProgramActive && "opacity-50 pointer-events-none")}>

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
              <Input
                type="number"
                value={maxPoints}
                onChange={(e) => setMaxPoints(Number(e.target.value))}
                className="w-20 text-center rounded-2xl bg-card"
              />
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
                  value={pointsPerCheckin}
                  onChange={(e) => setPointsPerCheckin(Number(e.target.value))}
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
                  value={pointsPerAppointment}
                  onChange={(e) => setPointsPerAppointment(Number(e.target.value))}
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
              <div key={reward.id} className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card relative group">
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
                <div className="flex items-center gap-4">
                  <div className="font-bold text-primary whitespace-nowrap">
                    {reward.pointsCost} pts
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveReward(reward.id)}
                  >
                    Remover
                  </Button>
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

        <div className="fixed bottom-6 right-6 z-40">
          <Button
            size="lg"
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="rounded-full shadow-xl flex items-center gap-2"
          >
            <Save size="sm" />
            {isSaving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </div>
    </div>
  );
}

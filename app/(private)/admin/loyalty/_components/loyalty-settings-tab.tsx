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
import { LoyaltyRewardModal, type Reward } from "./loyalty-reward-modal";
import { toast } from "sonner";
import { updateLoyaltySettings, expireInactiveLoyaltyPoints } from "@/app/actions/loyalty";
import { Percent, DollarSign, Gift as GiftIcon, BadgeCheck, Pencil, Trash2, Clock, Hourglass, RefreshCw } from "lucide-react";

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
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  const [checkInActive, setCheckInActive] = useState(settings?.check_in_active ?? (settings?.check_in_points > 0));
  const [scheduleActive, setScheduleActive] = useState(settings?.schedule_active ?? (settings?.schedule_points > 0));

  const [pointsPerCheckin, setPointsPerCheckin] = useState(settings?.check_in_points || 10);
  const [pointsPerAppointment, setPointsPerAppointment] = useState(settings?.schedule_points || 5);
  const [maxPoints, setMaxPoints] = useState(settings?.max_points || 500);

  // Integração com o Financeiro: Manual vs Automático
  const [autoFinancialDiscount, setAutoFinancialDiscount] = useState<boolean>(
    settings?.auto_financial_discount ?? false
  );

  // Expiração de Pontos por Inatividade
  const [pointsExpiryActive, setPointsExpiryActive] = useState<boolean>(
    settings?.points_expiry_active ?? false
  );
  const [pointsExpiryDays, setPointsExpiryDays] = useState<number>(
    settings?.points_expiry_days || 180
  );
  const [isExpiringPoints, setIsExpiringPoints] = useState(false);

  // Pontuação por Valor Gasto (Cashback em Pontos)
  const [spendPointsActive, setSpendPointsActive] = useState<boolean>(
    settings?.spend_points_active ?? false
  );
  const [spendPointsRatio, setSpendPointsRatio] = useState<number>(
    settings?.spend_points_ratio !== undefined ? Number(settings.spend_points_ratio) : 10
  );
  const [spendPointsAmount, setSpendPointsAmount] = useState<number>(
    settings?.spend_points_amount || 1
  );

  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleScopeChange = (value: "global" | "specific") => {
    if (value !== programScope) {
      setPendingScope(value);
      setIsAlertOpen(true);
    }
  };

  const confirmScopeChange = () => {
    if (pendingScope) {
      setProgramScope(pendingScope);
      setHasUnsavedChanges(true);
    }
    setIsAlertOpen(false);
  };

  const handleCheckInToggle = (checked: boolean) => {
    if (!checked && !scheduleActive && !spendPointsActive) {
      toast.error("Ao menos uma regra de ganho deve ficar ativa!");
      return;
    }
    setCheckInActive(checked);
    setHasUnsavedChanges(true);
  };

  const handleScheduleToggle = (checked: boolean) => {
    if (!checked && !checkInActive && !spendPointsActive) {
      toast.error("Ao menos uma regra de ganho deve ficar ativa!");
      return;
    }
    setScheduleActive(checked);
    setHasUnsavedChanges(true);
  };

  const handleSpendPointsToggle = (checked: boolean) => {
    if (!checked && !checkInActive && !scheduleActive) {
      toast.error("Ao menos uma regra de ganho deve ficar ativa!");
      return;
    }
    setSpendPointsActive(checked);
    setHasUnsavedChanges(true);
  };

  const handleFinancialAutoToggle = (checked: boolean) => {
    setAutoFinancialDiscount(checked);
    setHasUnsavedChanges(true);
  };

  const handleOpenNewRewardModal = () => {
    setEditingReward(null);
    setIsRewardModalOpen(true);
  };

  const handleOpenEditRewardModal = (reward: Reward) => {
    setEditingReward(reward);
    setIsRewardModalOpen(true);
  };

  const handleSaveReward = (reward: Reward) => {
    const exists = rewards.find((r) => r.id === reward.id);
    let newRewards: Reward[];
    if (exists) {
      newRewards = rewards.map((r) => (r.id === reward.id ? reward : r));
    } else {
      newRewards = [...rewards, { ...reward, id: reward.id || `temp-${Date.now()}` }];
    }
    setRewards(newRewards);
    setHasUnsavedChanges(true);
    toast.success("Recompensa atualizada na lista! Clique em 'Salvar ConfiguraÃ§Ãµes' para gravar.");
  };

  const handleRemoveReward = (rewardId: string | number) => {
    const newRewards = rewards.filter(r => r.id !== rewardId);
    setRewards(newRewards);
    setHasUnsavedChanges(true);
    toast.info("Recompensa removida da lista! Clique em 'Salvar ConfiguraÃ§Ãµes' para gravar.");
  };

  const handleRunExpiryCheck = async () => {
    try {
      setIsExpiringPoints(true);
      const res = await expireInactiveLoyaltyPoints(organizationId);
      if (res.success) {
        if ((res.expiredCount ?? 0) > 0) {
          toast.success(`Varredura concluída! ${res.expiredCount} cliente(s) inativo(s) tiveram seus pontos expirados (total: ${res.totalPointsExpired} pts).`);
        } else {
          toast.info("Varredura concluída! Nenhum cliente com saldo inativo para expirar.");
        }
      } else {
        toast.error(res.error || "Erro ao executar varredura de expiração.");
      }
    } catch {
      toast.error("Falha ao comunicar com o servidor.");
    } finally {
      setIsExpiringPoints(false);
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
        auto_financial_discount: autoFinancialDiscount,
        points_expiry_active: pointsExpiryActive,
        points_expiry_days: pointsExpiryDays,
        spend_points_active: spendPointsActive,
        spend_points_ratio: spendPointsRatio,
        spend_points_amount: spendPointsAmount,
        rewards: rewards.map(r => ({
          id: typeof r.id === "string" ? r.id : undefined,
          title: r.title,
          points_cost: r.pointsCost,
          conditions: r.conditions,
          validity_days: r.validityDays,
          reward_type: r.rewardType || "GIFT",
          discount_value: r.discountValue ?? null,
        }))
      };

      const res = await updateLoyaltySettings(organizationId, data);
      if (res.success) {
        if (res.settings?.rewards) {
          setRewards(res.settings.rewards.map((r: any) => ({
            id: r.id,
            title: r.title,
            pointsCost: r.points_cost,
            conditions: r.conditions,
            validityDays: r.validity_days,
            rewardType: r.reward_type || "GIFT",
            discountValue: r.discount_value !== null ? Number(r.discount_value) : null,
          })));
        }
        toast.success("ConfiguraÃ§Ãµes salvas com sucesso!");
        setHasUnsavedChanges(false);
      } else {
        toast.error("Erro ao salvar as configuraÃ§Ãµes.");
      }
    } catch (e) {
      toast.error("Erro na comunicaÃ§Ã£o com o servidor.");
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

        {/* SeÃ§Ã£o 1: AbrangÃªncia */}
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-semibold">AbrangÃªncia do Programa</h3>
            <p className="text-sm text-muted-foreground">
              Defina se o sistema de pontos serÃ¡ aplicado a todos os clientes ou apenas a clientes selecionados.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={programScope} onValueChange={handleScopeChange}>
                <SelectTrigger className="w-full sm:w-80 rounded-2xl bg-card">
                  <SelectValue placeholder="Selecione a abrangÃªncia" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="global" className="rounded-xl">Global (Todos os clientes participam)</SelectItem>
                  <SelectItem value="specific" className="rounded-xl">EspecÃ­fico (Apenas clientes adicionados)</SelectItem>
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
                    <p><strong>Global:</strong> Todos os clientes comeÃ§am a acumular pontos automaticamente a partir do momento em que o programa Ã© ativado.</p>
                    <p><strong>EspecÃ­fico:</strong> Apenas os clientes que vocÃª adicionar manualmente irÃ£o acumular pontos.</p>
                    <p className="text-xs text-muted-foreground mt-2 border-t pt-2 border-border/50">
                      Nota: Pontos nÃ£o sÃ£o retroativos. Eles sÃ³ passam a contar a partir da data de ativaÃ§Ã£o ou adiÃ§Ã£o do cliente no programa.
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <div className="h-px bg-border/50 w-full" />

        {/* SeÃ§Ã£o 2: IntegraÃ§Ã£o com o Financeiro (Manual vs AutomÃ¡tica) */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">IntegraÃ§Ã£o com o Financeiro</h3>
                <span className={cn(
                  "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border",
                  autoFinancialDiscount 
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                    : "bg-slate-500/10 text-slate-600 border-slate-500/20"
                )}>
                  {autoFinancialDiscount ? "AutomÃ¡tico" : "Manual"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Escolha se o sistema deve abater automaticamente os descontos no financeiro ou se prefere controle manual pela recepÃ§Ã£o.
              </p>
            </div>
            <Switch
              checked={autoFinancialDiscount}
              onCheckedChange={handleFinancialAutoToggle}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className={cn(
              "p-4 rounded-2xl border transition-all space-y-1.5",
              !autoFinancialDiscount 
                ? "bg-card border-primary/40 shadow-xs ring-1 ring-primary/20" 
                : "bg-muted/20 border-border/60 opacity-70"
            )}>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-foreground">Modo Manual (RecepÃ§Ã£o / ConferÃªncia)</span>
                {!autoFinancialDiscount && <BadgeCheck className="w-4 h-4 text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A recepcionista valida o PIN do voucher e dÃ¡ baixa como comprovante. O lanÃ§amento de pagamentos ou eventuais descontos Ã© cobrado manualmente no checkout ou na maquininha.
              </p>
            </div>

            <div className={cn(
              "p-4 rounded-2xl border transition-all space-y-1.5",
              autoFinancialDiscount 
                ? "bg-emerald-500/5 border-emerald-500/40 shadow-xs ring-1 ring-emerald-500/20" 
                : "bg-muted/20 border-border/60 opacity-70"
            )}>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-foreground">Modo AutomÃ¡tico (AutomaÃ§Ã£o Integrada)</span>
                {autoFinancialDiscount && <BadgeCheck className="w-4 h-4 text-emerald-600" />}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ideal para quem opera sozinho ou deseja agilidade. Vouchers com desconto (% ou R$) sÃ£o reconhecidos pelo sistema, que calcula e abate o valor diretamente na fatura/agendamento.
              </p>
            </div>
          </div>
        </div>

        <div className="h-px bg-border/50 w-full" />

        {/* SeÃ§Ã£o 3: Limites */}
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-semibold">Limites de PontuaÃ§Ã£o</h3>
            <p className="text-sm text-muted-foreground">
              Defina o limite mÃ¡ximo de pontos que um cliente pode acumular. Isso ajuda a controlar o resgate de recompensas.
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Limite MÃ¡ximo de Pontos</Label>
              <p className="text-sm text-muted-foreground max-w-[200px] sm:max-w-none">
                O saldo do cliente nÃ£o ultrapassarÃ¡ este valor.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                value={maxPoints}
                onChange={(e) => {
                  setMaxPoints(Number(e.target.value));
                  setHasUnsavedChanges(true);
                }}
                className="w-20 text-center rounded-2xl bg-card"
              />
            </div>
          </div>
        </div>

        <div className="h-px bg-border/50 w-full" />

        {/* SeÃ§Ã£o 4: Regras de Ganho */}
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-semibold">Regras de Ganho</h3>
            <p className="text-sm text-muted-foreground">
              Defina quantos pontos o cliente ganha ao realizar aÃ§Ãµes no sistema. AtenÃ§Ã£o: estes valores nÃ£o podem ultrapassar o limite mÃ¡ximo.
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
                  onChange={(e) => {
                    setPointsPerCheckin(Number(e.target.value));
                    setHasUnsavedChanges(true);
                  }}
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
                  onChange={(e) => {
                    setPointsPerAppointment(Number(e.target.value));
                    setHasUnsavedChanges(true);
                  }}
                  disabled={!scheduleActive}
                  className="w-16 sm:w-20 text-center rounded-2xl bg-card disabled:opacity-50"
                />
                <Switch
                  checked={scheduleActive}
                  onCheckedChange={handleScheduleToggle}
                />
              </div>
            </div>

            {/* Pontuação por Valor Gasto (R$) */}
            <div className="pt-4 border-t border-border/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-medium">Pontos por Valor Gasto (Cashback em Pontos)</Label>
                    <span className={cn(
                      "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border",
                      spendPointsActive 
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                        : "bg-slate-500/10 text-slate-600 border-slate-500/20"
                    )}>
                      {spendPointsActive ? "Ativo" : "Desativado"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-[280px] sm:max-w-none">
                    Concede pontos proporcionais ao valor financeiro líquido pago no atendimento.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={spendPointsActive}
                    onCheckedChange={handleSpendPointsToggle}
                  />
                </div>
              </div>

              {spendPointsActive && (
                <div className="p-4 rounded-2xl border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-300">
                  <div className="text-sm font-medium text-foreground">
                    Regra de Conversão:
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    <span className="text-muted-foreground">A cada R$</span>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={spendPointsRatio}
                      onChange={(e) => {
                        setSpendPointsRatio(Math.max(1, Number(e.target.value)));
                        setHasUnsavedChanges(true);
                      }}
                      className="w-20 text-center rounded-xl bg-card font-semibold"
                    />
                    <span className="text-muted-foreground">gastos, ganha</span>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={spendPointsAmount}
                      onChange={(e) => {
                        setSpendPointsAmount(Math.max(1, Number(e.target.value)));
                        setHasUnsavedChanges(true);
                      }}
                      className="w-16 text-center rounded-xl bg-card font-semibold"
                    />
                    <span className="text-muted-foreground">ponto(s)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="h-px bg-border/50 w-full" />

        {/* Seção 5: Expiração de Pontos por Inatividade */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Expiração de Pontos por Inatividade</h3>
                <span className={cn(
                  "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border",
                  pointsExpiryActive 
                    ? "bg-amber-500/10 text-amber-600 border-amber-500/20" 
                    : "bg-slate-500/10 text-slate-600 border-slate-500/20"
                )}>
                  {pointsExpiryActive ? "Ativo" : "Desativado"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Evita acúmulo de passivo perpétuo expirando o saldo de clientes que passarem muito tempo sem comparecer ou agendar.
              </p>
            </div>
            <Switch
              checked={pointsExpiryActive}
              onCheckedChange={(checked) => {
                setPointsExpiryActive(checked);
                setHasUnsavedChanges(true);
              }}
            />
          </div>

          {pointsExpiryActive && (
            <div className="p-4 rounded-2xl border bg-card/60 space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Prazo de Inatividade para Expirar</Label>
                  <p className="text-xs text-muted-foreground">
                    Se o cliente ficar esse período sem visitas ou agendamentos, o saldo de pontos será zerado.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={String(pointsExpiryDays)}
                    onValueChange={(val) => {
                      setPointsExpiryDays(Number(val));
                      setHasUnsavedChanges(true);
                    }}
                  >
                    <SelectTrigger className="w-44 rounded-xl bg-card">
                      <SelectValue placeholder="Selecione o prazo" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="60">60 dias (~2 meses)</SelectItem>
                      <SelectItem value="90">90 dias (~3 meses)</SelectItem>
                      <SelectItem value="180">180 dias (~6 meses)</SelectItem>
                      <SelectItem value="365">365 dias (1 ano)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/40">
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Hourglass className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>
                    A expiração é verificada automaticamente no momento do resgate, ou você pode rodar a varredura em lote agora.
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isExpiringPoints}
                  onClick={handleRunExpiryCheck}
                  className="rounded-xl shrink-0 gap-1.5 text-xs h-8 hover:bg-amber-500/10 hover:text-amber-600 hover:border-amber-500/30"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isExpiringPoints && "animate-spin")} />
                  {isExpiringPoints ? "Verificando..." : "Executar Varredura Agora"}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-border/50 w-full" />

        {/* SeÃ§Ã£o 5: Recompensas */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Recompensas e Resgates</h3>
              <p className="text-sm text-muted-foreground">
                Cadastre os benefÃ­cios que os clientes podem resgatar utilizando pontos.
              </p>
            </div>
            <Button
              size="sm"
              className="rounded-full flex items-center gap-1 w-fit"
              onClick={handleOpenNewRewardModal}
            >
              <Plus size="xs" />
              <span>Nova Recompensa</span>
            </Button>
          </div>

          <div className="space-y-3">
            {rewards.map((reward) => {
              const rType = reward.rewardType || "GIFT";
              return (
                <div key={reward.id} className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card relative group hover:border-primary/40 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2.5 rounded-xl flex items-center justify-center shrink-0",
                      rType === "PERCENTAGE" 
                        ? "bg-emerald-500/10 text-emerald-600" 
                        : rType === "FIXED_AMOUNT" 
                        ? "bg-blue-500/10 text-blue-600" 
                        : "bg-purple-500/10 text-purple-600"
                    )}>
                      {rType === "PERCENTAGE" && <Percent className="w-5 h-5" />}
                      {rType === "FIXED_AMOUNT" && <DollarSign className="w-5 h-5" />}
                      {rType === "GIFT" && <GiftIcon className="w-5 h-5" />}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm sm:text-base">{reward.title}</span>
                        {rType === "PERCENTAGE" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                            {reward.discountValue ?? 0}% OFF
                          </span>
                        )}
                        {rType === "FIXED_AMOUNT" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 border border-blue-500/20">
                            R$ {Number(reward.discountValue || 0).toFixed(2)} OFF
                          </span>
                        )}
                        {rType === "GIFT" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 border border-purple-500/20">
                            Brinde / Cortesia
                          </span>
                        )}
                      </div>
                      {reward.conditions && (
                        <p className="text-xs text-muted-foreground">{reward.conditions}</p>
                      )}
                      {reward.validityDays && (
                        <p className="text-[11px] text-muted-foreground">
                          VÃ¡lido por {reward.validityDays} dias apÃ³s resgate
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="font-bold text-primary whitespace-nowrap text-sm sm:text-base">
                      {reward.pointsCost} pts
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                      onClick={() => handleOpenEditRewardModal(reward)}
                      title="Editar recompensa"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveReward(reward.id)}
                      title="Remover recompensa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}

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
              <AlertDialogTitle>Tem certeza que deseja mudar a abrangÃªncia?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2" asChild>
                <div>
                  <div>
                    Mudar de <strong>{programScope === "global" ? "Global" : "EspecÃ­fico"}</strong> para <strong>{pendingScope === "global" ? "Global" : "EspecÃ­fico"}</strong> pode alterar quem recebe pontos.
                  </div>
                  <div className="text-destructive font-medium">
                    AtenÃ§Ã£o: Os pontos comeÃ§am a ser contabilizados apenas a partir de agora. Se vocÃª estiver restringindo o programa, clientes removidos poderÃ£o perder o acesso aos pontos atuais.
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
              <AlertDialogAction className="rounded-full" onClick={confirmScopeChange}>
                Confirmar MudanÃ§a
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <LoyaltyRewardModal
          open={isRewardModalOpen}
          onOpenChange={setIsRewardModalOpen}
          onSave={handleSaveReward}
          initialData={editingReward}
        />

        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
          {hasUnsavedChanges && (
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 text-xs font-semibold px-3 py-2 rounded-full shadow-lg backdrop-blur-md">
              AlteraÃ§Ãµes nÃ£o salvas
            </div>
          )}
          <Button
            size="lg"
            onClick={handleSaveSettings}
            disabled={isSaving}
            className={cn(
              "rounded-full shadow-xl flex items-center gap-2",
              hasUnsavedChanges ? "ring-2 ring-primary ring-offset-2" : ""
            )}
          >
            <Save size="sm" />
            {isSaving ? "Salvando..." : "Salvar ConfiguraÃ§Ãµes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

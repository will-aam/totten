"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useIsMobile } from "@/components/ui/use-mobile";
import { Gift, Percentage, Dollar } from "@boxicons/react";

export type RewardType = "GIFT" | "PERCENTAGE" | "FIXED_AMOUNT";

export interface Reward {
  id: number | string;
  title: string;
  pointsCost: number;
  conditions?: string;
  validityDays?: number | null;
  rewardType?: RewardType;
  discountValue?: number | null;
}

export interface LoyaltyRewardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (reward: Reward) => void | Promise<void>;
  initialData?: Reward | null;
}

export function LoyaltyRewardModal({ open, onOpenChange, onSave, initialData }: LoyaltyRewardModalProps) {
  const isMobile = useIsMobile();
  const [title, setTitle] = useState(initialData?.title || "");
  const [pointsCost, setPointsCost] = useState(initialData?.pointsCost?.toString() || "");
  const [conditions, setConditions] = useState(initialData?.conditions || "");
  const [validityDays, setValidityDays] = useState(initialData?.validityDays?.toString() || "30");
  const [rewardType, setRewardType] = useState<RewardType>(initialData?.rewardType || "GIFT");
  const [discountValue, setDiscountValue] = useState(initialData?.discountValue?.toString() || "");

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setTitle(initialData?.title || "");
      setPointsCost(initialData?.pointsCost?.toString() || "");
      setConditions(initialData?.conditions || "");
      setValidityDays(initialData?.validityDays?.toString() || "30");
      setRewardType(initialData?.rewardType || "GIFT");
      setDiscountValue(initialData?.discountValue?.toString() || "");
    }
    onOpenChange(isOpen);
  };

  const handleSave = () => {
    if (!title.trim() || !pointsCost.trim()) {
      toast.error("Preencha o título e o custo em pontos.");
      return;
    }

    const cost = parseInt(pointsCost, 10);
    if (isNaN(cost) || cost <= 0) {
      toast.error("O custo em pontos deve ser maior que zero.");
      return;
    }

    let parsedDiscount: number | null = null;
    if (rewardType === "PERCENTAGE" || rewardType === "FIXED_AMOUNT") {
      parsedDiscount = parseFloat(discountValue.replace(",", "."));
      if (isNaN(parsedDiscount) || parsedDiscount <= 0) {
        toast.error(
          rewardType === "PERCENTAGE"
            ? "Informe uma porcentagem de desconto válida (ex: 10 para 10%)."
            : "Informe um valor de desconto válido em reais (ex: 25.00)."
        );
        return;
      }
      if (rewardType === "PERCENTAGE" && parsedDiscount > 100) {
        toast.error("A porcentagem de desconto não pode ser superior a 100%.");
        return;
      }
    }

    onSave({
      id: initialData?.id || Date.now(),
      title: title.trim(),
      pointsCost: cost,
      conditions: conditions.trim(),
      validityDays: validityDays ? parseInt(validityDays, 10) : null,
      rewardType,
      discountValue: parsedDiscount,
    });

    toast.success(initialData ? "Recompensa atualizada!" : "Recompensa criada com sucesso!");
    onOpenChange(false);
  };

  const formContent = (
    <div className="space-y-4 py-4 px-4 sm:px-0">
      <div className="space-y-2">
        <Label htmlFor="reward-type">Tipo de Recompensa</Label>
        <Select value={rewardType} onValueChange={(val: RewardType) => setRewardType(val)}>
          <SelectTrigger id="reward-type" className="rounded-xl">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="GIFT">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-purple-600" />
                <span>Brinde / Cortesia / Serviço Grátis</span>
              </div>
            </SelectItem>
            <SelectItem value="PERCENTAGE">
              <div className="flex items-center gap-2">
                <Percentage className="w-4 h-4 text-emerald-600" />
                <span>Desconto em Porcentagem (%)</span>
              </div>
            </SelectItem>
            <SelectItem value="FIXED_AMOUNT">
              <div className="flex items-center gap-2">
                <Dollar className="w-4 h-4 text-blue-600" />
                <span>Desconto em Valor Fixo (R$)</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground">
          {rewardType === "GIFT" && "Entrega física de produto ou serviço cortesia (sem abatimento no caixa)."}
          {rewardType === "PERCENTAGE" && "Abatimento percentual calculado sobre o valor do atendimento no caixa."}
          {rewardType === "FIXED_AMOUNT" && "Abatimento de valor fixo em reais no total da fatura ou agendamento."}
        </p>
      </div>

      {rewardType !== "GIFT" && (
        <div className="space-y-2 bg-muted/40 p-3 rounded-2xl border border-border/60">
          <Label htmlFor="reward-discount-val">
            {rewardType === "PERCENTAGE" ? "Porcentagem de Desconto (%)" : "Valor do Desconto (R$)"}
          </Label>
          <Input
            id="reward-discount-val"
            type="number"
            step="0.01"
            placeholder={rewardType === "PERCENTAGE" ? "Ex: 10 (para 10%)" : "Ex: 25.00"}
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            className="rounded-xl bg-background"
          />
          <p className="text-[11px] text-muted-foreground">
            {rewardType === "PERCENTAGE"
              ? "Este percentual será deduzido quando integrado ao financeiro."
              : "Este valor em reais será abatido quando integrado ao financeiro."}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="reward-title">Título da Recompensa</Label>
        <Input
          id="reward-title"
          placeholder={rewardType === "PERCENTAGE" ? "Ex: 10% de Desconto em Qualquer Atendimento" : rewardType === "FIXED_AMOUNT" ? "Ex: R$ 30 de Desconto no Caixa" : "Ex: 1 Hidratação Facial Cortesia"}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reward-cost">Custo (em Pontos)</Label>
        <Input
          id="reward-cost"
          type="number"
          placeholder="Ex: 50"
          value={pointsCost}
          onChange={(e) => setPointsCost(e.target.value)}
          className="rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reward-conditions">Regras e Condições (Opcional)</Label>
        <Textarea
          id="reward-conditions"
          placeholder="Ex: Válido apenas de terça a quinta. Não cumulativo com outras promoções."
          value={conditions}
          onChange={(e) => setConditions(e.target.value)}
          className="rounded-xl resize-none h-20"
        />
        <p className="text-xs text-muted-foreground">
          Deixe claro para o cliente como ele pode utilizar essa recompensa.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reward-validity">Validade do Voucher (em Dias)</Label>
        <Input
          id="reward-validity"
          type="number"
          placeholder="Ex: 30"
          value={validityDays}
          onChange={(e) => setValidityDays(e.target.value)}
          className="rounded-xl"
        />
        <p className="text-xs text-muted-foreground">Prazo após o resgate para utilizar na clínica (padrão: 30 dias).</p>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="rounded-t-3xl max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{initialData ? "Editar Recompensa" : "Nova Recompensa"}</DrawerTitle>
            <DrawerDescription>
              Defina o benefício, tipo e quantos pontos serão necessários para o resgate.
            </DrawerDescription>
          </DrawerHeader>

          <div className="overflow-y-auto px-4">
            {formContent}
          </div>

          <DrawerFooter className="pt-2">
            <Button onClick={handleSave} className="rounded-xl w-full">
              Salvar Recompensa
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl w-full">
              Cancelar
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Recompensa" : "Nova Recompensa"}</DialogTitle>
          <DialogDescription>
            Defina o benefício, tipo e quantos pontos serão necessários para o resgate.
          </DialogDescription>
        </DialogHeader>

        {formContent}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="rounded-xl">
            Salvar Recompensa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

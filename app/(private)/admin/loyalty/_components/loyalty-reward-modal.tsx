"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useIsMobile } from "@/components/ui/use-mobile";

interface Reward {
  id: number | string;
  title: string;
  pointsCost: number;
  conditions?: string;
}

interface LoyaltyRewardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (reward: Reward) => void;
  // If editing an existing one
  initialData?: Reward | null;
}

export function LoyaltyRewardModal({ open, onOpenChange, onSave, initialData }: LoyaltyRewardModalProps) {
  const isMobile = useIsMobile();
  const [title, setTitle] = useState(initialData?.title || "");
  const [pointsCost, setPointsCost] = useState(initialData?.pointsCost?.toString() || "");
  const [conditions, setConditions] = useState(initialData?.conditions || "");

  // Reset form when modal opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setTitle(initialData?.title || "");
      setPointsCost(initialData?.pointsCost?.toString() || "");
      setConditions(initialData?.conditions || "");
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

    onSave({
      id: initialData?.id || Date.now(),
      title: title.trim(),
      pointsCost: cost,
      conditions: conditions.trim(),
    });

    toast.success(initialData ? "Recompensa atualizada!" : "Recompensa criada com sucesso!");
    onOpenChange(false);
  };

  const formContent = (
    <div className="space-y-4 py-4 px-4 sm:px-0">
      <div className="space-y-2">
        <Label htmlFor="reward-title">Título da Recompensa</Label>
        <Input 
          id="reward-title" 
          placeholder="Ex: Desconto de 10%, Sessão Grátis..." 
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
          placeholder="Ex: Válido apenas de terça a quinta. Não cumulativo." 
          value={conditions}
          onChange={(e) => setConditions(e.target.value)}
          className="rounded-xl resize-none h-20"
        />
        <p className="text-xs text-muted-foreground">
          Deixe claro para o cliente como ele pode utilizar essa recompensa.
        </p>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="rounded-t-3xl">
          <DrawerHeader className="text-left">
            <DrawerTitle>{initialData ? "Editar Recompensa" : "Nova Recompensa"}</DrawerTitle>
            <DrawerDescription>
              Defina o que o cliente ganhará e quantos pontos precisará resgatar.
            </DrawerDescription>
          </DrawerHeader>
          
          {formContent}

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
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Recompensa" : "Nova Recompensa"}</DialogTitle>
          <DialogDescription>
            Defina o que o cliente ganhará e quantos pontos precisará resgatar.
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

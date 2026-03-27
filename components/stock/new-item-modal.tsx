"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface NewStockItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void; // Por enquanto 'any', depois tipamos com o Prisma
}

export function NewStockItemModal({
  isOpen,
  onClose,
  onSave,
}: NewStockItemModalProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [isAutoDeduct, setIsAutoDeduct] = useState(false);
  const [createExpense, setCreateExpense] = useState(false);

  // Calcula o valor unitário dinamicamente para feedback visual
  const parsedQty = parseFloat(quantity) || 0;
  const parsedCost = parseFloat(totalCost) || 0;
  const unitCost = parsedQty > 0 ? parsedCost / parsedQty : 0;

  const handleSave = () => {
    // Aqui estamos mockando o envio. Depois chamaremos a Server Action.
    const newItem = {
      id: Math.random().toString(), // Mock ID
      name,
      quantity: parsedQty,
      unit_cost: unitCost,
      isAutoDeduct,
      createExpense, // Flag para sabermos se devemos criar despesa no backend
    };

    onSave(newItem);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setName("");
    setQuantity("");
    setTotalCost("");
    setIsAutoDeduct(false);
    setCreateExpense(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Cadastro</DialogTitle>
          <DialogDescription>
            Adicione um novo item ao seu estoque. Você pode optar por já lançar
            o valor pago como uma <strong>despesa financeira.</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Insumo (ex: Óleo 500ml)</Label>
            <Input
              id="name"
              placeholder="Digite o nome..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade Total</Label>
              <Input
                id="quantity"
                type="number"
                step="0.1"
                placeholder="Ex: 10"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalCost">Valor Pago Total (R$)</Label>
              <Input
                id="totalCost"
                type="number"
                step="0.01"
                placeholder="Ex: 150.00"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
              />
            </div>
          </div>

          {/* Feedback visual do custo unitário */}
          {unitCost > 0 && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <span>Custo Unitário Calculado:</span>
              <Badge variant="secondary">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(unitCost)}
              </Badge>
            </div>
          )}

          <div className="my-2 border-t" />

          {/* Toggles de Configuração */}
          <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <Label>Baixa Automática</Label>
              <p className="text-[0.8rem] text-muted-foreground">
                Abater 1 a 1 automaticamente no Check-in.
              </p>
            </div>
            <Switch checked={isAutoDeduct} onCheckedChange={setIsAutoDeduct} />
          </div>

          <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <Label>Lançar como Despesa</Label>
              <p className="text-[0.8rem] text-muted-foreground">
                Criar uma saída no fluxo de caixa agora.
              </p>
            </div>
            <Switch
              checked={createExpense}
              onCheckedChange={setCreateExpense}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name || parsedQty <= 0 || parsedCost <= 0}
          >
            Salvar Insumo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

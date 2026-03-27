"use client";

import { useState } from "react";
import { StockItem } from "./stock-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface StockMobileItemProps {
  item: StockItem;
  onUpdate: (id: string, updates: Partial<StockItem>) => void;
}

const hideArrowsClass =
  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

export function StockMobileItem({ item, onUpdate }: StockMobileItemProps) {
  const [isEditingName, setIsEditingName] = useState(false);

  const total = item.unit_cost * item.quantity;

  return (
    <div className="flex flex-col p-4 bg-card border border-border rounded-xl shadow-sm mb-3 transition-all active:scale-[0.99]">
      {/* Cabeçalho: Nome com Double Click */}
      <div
        className="mb-4 min-h-6"
        onDoubleClick={() => setIsEditingName(true)}
      >
        {isEditingName ? (
          <Input
            autoFocus
            className="h-9"
            defaultValue={item.name}
            onBlur={(e) => {
              onUpdate(item.id, { name: e.target.value });
              setIsEditingName(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          />
        ) : (
          <h3 className="text-base font-bold text-foreground leading-tight">
            {item.name}
          </h3>
        )}
        <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
          Dê dois cliques no nome para editar
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Lado Esquerdo: Configurações */}
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">
              Tipo de Baixa
            </label>
            <Select
              value={item.isAutoDeduct ? "auto" : "manual"}
              onValueChange={(val) =>
                onUpdate(item.id, { isAutoDeduct: val === "auto" })
              }
            >
              <SelectTrigger className="h-9 w-full bg-muted/50 border-none focus:ring-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automática</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">
              Custo Unitário
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                R$
              </span>
              <Input
                type="number"
                className={cn(
                  "h-9 pl-9 bg-muted/50 border-none",
                  hideArrowsClass,
                )}
                defaultValue={item.unit_cost}
                onChange={(e) =>
                  onUpdate(item.id, {
                    unit_cost: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* Lado Direito: Quantidade e Total */}
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">
              Qtd. em Estoque
            </label>
            <Input
              type="number"
              step="0.1"
              disabled={item.isAutoDeduct}
              className={cn(
                "h-9 text-center font-bold bg-muted/50 border-none",
                item.isAutoDeduct && "opacity-40",
                hideArrowsClass,
              )}
              defaultValue={item.quantity}
              onChange={(e) =>
                onUpdate(item.id, { quantity: parseFloat(e.target.value) || 0 })
              }
            />
          </div>

          <div className="flex flex-col justify-end h-11 text-right">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase">
              Valor Total
            </label>
            <span className="text-lg font-black text-primary">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

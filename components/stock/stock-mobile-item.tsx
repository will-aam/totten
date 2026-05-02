"use client";

import { useState } from "react";
import { StockItem } from "./stock-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"; // 🔥 Importamos o Button
import { Trash } from "@boxicons/react"; // 🔥 Importamos o ícone da Lixeira
import { cn } from "@/lib/utils";

interface StockMobileItemProps {
  item: StockItem;
  onUpdate: (id: string, updates: Partial<StockItem>) => void;
  onDelete: (id: string) => void; // 🔥 Adicionamos a prop de deletar
}

const hideArrowsClass =
  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

export function StockMobileItem({
  item,
  onUpdate,
  onDelete,
}: StockMobileItemProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const total = item.unit_cost * item.quantity;

  return (
    <div className="flex flex-col p-5 bg-card border border-border rounded-2xl shadow-sm mb-4">
      {/* Cabeçalho: Nome do Insumo + Botão de Excluir */}
      <div className="flex justify-between items-start mb-5 min-h-7 gap-4">
        <div className="flex-1" onDoubleClick={() => setIsEditingName(true)}>
          {isEditingName ? (
            <Input
              autoFocus
              className="h-10 text-base"
              defaultValue={item.name}
              onBlur={(e) => {
                onUpdate(item.id, { name: e.target.value });
                setIsEditingName(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            />
          ) : (
            <h3 className="text-lg font-bold text-foreground tracking-tight">
              {item.name}
            </h3>
          )}
          <p className="text-[9px] text-muted-foreground/60 mt-1 uppercase font-medium">
            Toque duas vezes para renomear
          </p>
        </div>

        {/* 🔥 Botão de Excluir */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(item.id)}
          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-full"
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>

      {/* Valores Editáveis Lado a Lado */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-[10px] font-bold text-muted-foreground/80 uppercase mb-1.5 block tracking-widest">
            Custo Unitário
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
              R$
            </span>
            <Input
              type="number"
              step="0.01"
              className={cn(
                "h-10 pl-9 bg-muted/40 border-none text-sm font-semibold",
                hideArrowsClass,
              )}
              defaultValue={item.unit_cost}
              onBlur={(e) =>
                onUpdate(item.id, {
                  unit_cost: parseFloat(e.target.value) || 0,
                })
              }
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-muted-foreground/80 uppercase mb-1.5 block tracking-widest">
            Quantidade
          </label>
          <Input
            type="number"
            step="0.1"
            className={cn(
              "h-10 text-center font-bold bg-muted/40 border-none text-base",
              hideArrowsClass,
            )}
            defaultValue={item.quantity}
            onBlur={(e) =>
              onUpdate(item.id, { quantity: parseFloat(e.target.value) || 0 })
            }
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          />
        </div>
      </div>

      {/* Subtotal (Totalmente Separado e Alinhado na base) */}
      <div className="flex items-center justify-between border-t border-border/50 pt-4 mt-1">
        <label className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">
          Subtotal do Insumo
        </label>
        <span className="text-xl font-black text-foreground">
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(total)}
        </span>
      </div>
    </div>
  );
}

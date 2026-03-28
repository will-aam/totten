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
    <div className="flex flex-col p-5 bg-card border border-border rounded-2xl shadow-sm mb-4">
      {/* Cabeçalho Limpo */}
      <div
        className="mb-5 min-h-7"
        onDoubleClick={() => setIsEditingName(true)}
      >
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

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground/80 uppercase mb-1.5 block tracking-widest">
              Tipo de Baixa
            </label>
            <Select
              value={item.isAutoDeduct ? "auto" : "manual"}
              onValueChange={(val) =>
                onUpdate(item.id, { isAutoDeduct: val === "auto" })
              }
            >
              <SelectTrigger className="h-10 w-full bg-muted/40 border-none focus:ring-1 text-sm font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automática</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
                className={cn(
                  "h-10 pl-9 bg-muted/40 border-none text-sm font-semibold",
                  hideArrowsClass,
                )}
                defaultValue={item.unit_cost}
                // 🔥 CORREÇÃO SÊNIOR: onBlur em vez de onChange
                onBlur={(e) =>
                  onUpdate(item.id, {
                    unit_cost: parseFloat(e.target.value) || 0,
                  })
                }
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground/80 uppercase mb-1.5 block tracking-widest">
              Qtd. Atual
            </label>
            <Input
              type="number"
              step="0.1"
              disabled={item.isAutoDeduct}
              className={cn(
                "h-10 text-center font-bold bg-muted/40 border-none text-base",
                item.isAutoDeduct && "opacity-30 grayscale",
                hideArrowsClass,
              )}
              defaultValue={item.quantity}
              // 🔥 CORREÇÃO SÊNIOR: onBlur em vez de onChange
              onBlur={(e) =>
                onUpdate(item.id, { quantity: parseFloat(e.target.value) || 0 })
              }
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            />
          </div>

          <div className="flex flex-col justify-end h-12 text-right">
            <label className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">
              Subtotal
            </label>
            <span className="text-xl font-black text-primary">
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

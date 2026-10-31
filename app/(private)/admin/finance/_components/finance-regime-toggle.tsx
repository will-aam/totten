// app/(private)/admin/finance/_components/finance-regime-toggle.tsx
"use client";

import React, { useState } from "react";
import { FinanceViewMode } from "@/types/finance";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Info, TrendingUp, Landmark, CalendarDays } from "lucide-react";

interface FinanceRegimeToggleProps {
  viewMode: FinanceViewMode;
  onViewModeChange: (mode: FinanceViewMode) => void;
  className?: string;
}

export function FinanceRegimeModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[calc(100vw-2rem)] sm:w-full p-5 sm:p-6 rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-border/40 text-left">
          <DialogTitle className="text-base sm:text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
            Entendendo os Regimes Contábeis
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            A diferença entre o volume de vendas da clínica e o dinheiro que realmente entra na sua conta bancária.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2 text-xs sm:text-sm">
          {/* Competência */}
          <div className="space-y-1.5 p-3 rounded-xl bg-muted/40 border border-border/40">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <TrendingUp className="size-4 text-blue-500" />
                Regime de Competência (Vendas)
              </span>
              <Badge variant="secondary" className="text-[10px] uppercase font-semibold">
                Faturamento
              </Badge>
            </div>
            <p className="text-muted-foreground leading-relaxed text-xs">
              Registra a movimentação no <strong>dia em que a venda foi realizada</strong>,
              independentemente se o cliente pagou à vista, no Pix ou parcelou em várias vezes.
            </p>
            <p className="text-[11px] text-muted-foreground/90 font-medium pt-1">
              🎯 <strong>Para que serve:</strong> Medir a força de vendas, metas da clínica e volume produzido no mês.
            </p>
          </div>

          {/* Caixa D+X */}
          <div className="space-y-1.5 p-3 rounded-xl bg-muted/40 border border-border/40">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Landmark className="size-4 text-emerald-500" />
                Regime de Caixa (Depósitos D+X)
              </span>
              <Badge variant="secondary" className="text-[10px] uppercase font-semibold">
                Saldo Real
              </Badge>
            </div>
            <p className="text-muted-foreground leading-relaxed text-xs">
              Registra o dinheiro na <strong>data em que ele é creditado no banco</strong>,
              já com as taxas de maquininha descontadas e respeitando o prazo de liquidação (<strong>D+X</strong>).
            </p>
            <div className="text-[11px] text-muted-foreground/90 font-medium pt-1 space-y-0.5">
              <p>🏦 <strong>Para que serve:</strong> Conciliação bancária, fluxo de caixa e saber o dinheiro real disponível para pagar contas.</p>
              <p className="text-muted-foreground/75">
                • <strong>D+0 (Pix / Dinheiro):</strong> cai no mesmo dia.<br />
                • <strong>D+1 (Débito):</strong> cai no dia útil seguinte.<br />
                • <strong>D+30 (Crédito):</strong> compensa em 30 dias (ou a cada mês por parcela).
              </p>
            </div>
          </div>

          {/* Exemplo Prático */}
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <CalendarDays className="size-4" />
              <span>Exemplo Prático: Procedimento de R$ 1.000 em 2x no Cartão</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-background/80 border border-border/40">
                <span className="font-semibold text-foreground block mb-0.5">Visão Competência</span>
                <p className="text-muted-foreground text-[11px]">
                  <strong>R$ 1.000</strong> constam no faturamento de <strong>hoje</strong>.
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-background/80 border border-border/40">
                <span className="font-semibold text-foreground block mb-0.5">Visão Caixa (D+X)</span>
                <p className="text-muted-foreground text-[11px]">
                  <strong>R$ 500</strong> entram em 30 dias (D+30) e <strong>R$ 500</strong> em 60 dias (D+60), já líquidos das taxas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function FinanceRegimeToggle({
  viewMode,
  onViewModeChange,
  className,
}: FinanceRegimeToggleProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <div className="inline-flex items-center p-0.5 bg-muted/60 rounded-lg text-xs">
        <button
          type="button"
          onClick={() => onViewModeChange("COMPETENCIA")}
          className={cn(
            "px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5",
            viewMode === "COMPETENCIA"
              ? "bg-background text-foreground shadow-2xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <TrendingUp className="size-3.5 text-blue-500 opacity-80" />
          <span>Competência</span>
        </button>

        <button
          type="button"
          onClick={() => onViewModeChange("CAIXA")}
          className={cn(
            "px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5",
            viewMode === "CAIXA"
              ? "bg-background text-foreground shadow-2xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Landmark className="size-3.5 text-emerald-500 opacity-80" />
          <span>Caixa (D+X)</span>
        </button>
      </div>

      <button
        type="button"
        onClick={() => setModalOpen(true)}
        aria-label="Como funcionam os regimes de Competência e Caixa"
        className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
        title="Entenda a diferença entre Competência e Caixa D+X"
      >
        <Info className="size-4" />
      </button>

      <FinanceRegimeModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}

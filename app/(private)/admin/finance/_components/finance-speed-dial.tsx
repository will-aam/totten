// app/(private)/admin/finance/_components/finance-speed-dial.tsx
"use client";

import { useState, useEffect } from "react";
import { Plus, MinusCircle, PlusCircle, X } from "@boxicons/react";
import { cn } from "@/lib/utils";
import { TransactionModal } from "./transaction-modal";

interface FinanceSpeedDialProps {
  isHidden: boolean;
  onSuccess?: () => void;
}

export function FinanceSpeedDial({
  isHidden,
  onSuccess,
}: FinanceSpeedDialProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"INCOME" | "EXPENSE">(
    "INCOME",
  );

  const handleNewIncome = () => {
    setTransactionType("INCOME");
    setIsModalOpen(true);
    setIsOpen(false);
  };

  const handleNewExpense = () => {
    setTransactionType("EXPENSE");
    setIsModalOpen(true);
    setIsOpen(false);
  };

  // Correção de Performance do React mantida:
  // Fecha o menu flutuante automaticamente se o usuário começar a rolar a tela para baixo
  useEffect(() => {
    if (isHidden && isOpen) {
      setIsOpen(false);
    }
  }, [isHidden, isOpen]);

  return (
    <>
      {/* Container fixo no canto inferior direito. Só aparece no mobile. */}
      <div
        className={cn(
          "md:hidden fixed bottom-24 right-4 z-50 flex flex-col items-center gap-4 transition-all duration-500",
          isHidden
            ? "translate-y-12 opacity-0 pointer-events-none"
            : "translate-y-0 opacity-100",
        )}
      >
        {/* Opções (Despesa e Receita) */}
        <div
          className={cn(
            "flex flex-col items-center gap-4 transition-all duration-300 origin-bottom",
            isOpen
              ? "scale-100 opacity-100 translate-y-0"
              : "scale-75 opacity-0 translate-y-4 pointer-events-none",
          )}
        >
          {/* Botão de Despesa */}
          <button
            onClick={handleNewExpense}
            aria-label="Nova Despesa"
            className="flex items-center justify-center h-14 w-14 rounded-full bg-rose-500/90 backdrop-blur-md text-white shadow-[0_8px_25px_rgb(244,63,94,0.4)] hover:bg-rose-500 active:scale-90 transition-all border border-rose-400/30"
          >
            <MinusCircle className="h-7 w-7" />
          </button>

          {/* Botão de Receita */}
          <button
            onClick={handleNewIncome}
            aria-label="Nova Receita"
            className="flex items-center justify-center h-14 w-14 rounded-full bg-emerald-500/90 backdrop-blur-md text-white shadow-[0_8px_25px_rgb(16,185,129,0.4)] hover:bg-emerald-500 active:scale-90 transition-all border border-emerald-400/30"
          >
            <PlusCircle className="h-7 w-7" />
          </button>
        </div>

        {/* Botão Flutuante Principal (+ ou X) com Glassmorphism Premium */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Menu Financeiro"
          className={cn(
            "flex items-center justify-center h-14 w-14 rounded-full transition-all active:scale-90 duration-300 border border-border/20 z-50 relative",
            isOpen
              ? "bg-muted/80 backdrop-blur-md text-foreground rotate-90 shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
              : "bg-primary/95 backdrop-blur-md text-primary-foreground rotate-0 shadow-[0_8px_25px_rgb(var(--primary)/0.4)]",
          )}
        >
          {isOpen ? <X className="h-7 w-7" /> : <Plus className="h-7 w-7" />}
        </button>
      </div>

      {/* OTIMIZAÇÃO DE BANCO DE DADOS (Lazy Mount) */}
      {isModalOpen && (
        <TransactionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            if (onSuccess) onSuccess();
          }}
          type={transactionType}
        />
      )}
    </>
  );
}

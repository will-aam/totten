// components/finance/finance-speed-dial.tsx
"use client";

import { useState, useEffect } from "react";
import { Plus, MinusCircle, PlusCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TransactionModal } from "@/components/finance/transaction-modal";

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

  // 🔥 Correção de Performance do React:
  // Nunca altere estados soltos no corpo do componente. Sempre use useEffect.
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
          "md:hidden fixed bottom-24 right-4 z-50 flex flex-col items-center gap-3 transition-all duration-300",
          isHidden
            ? "translate-y-10 opacity-0 pointer-events-none"
            : "translate-y-0 opacity-100",
        )}
      >
        {/* Opções (Despesa e Receita) */}
        <div
          className={cn(
            "flex flex-col items-center gap-3 transition-all duration-300 origin-bottom",
            isOpen
              ? "scale-100 opacity-100 mb-2"
              : "scale-50 opacity-0 mb-0 pointer-events-none",
          )}
        >
          {/* Botão de Despesa */}
          <button
            onClick={handleNewExpense}
            aria-label="Nova Despesa"
            className="flex items-center justify-center h-14 w-14 rounded-3xl bg-rose-600 text-white hover:bg-rose-700 active:scale-95 transition-all border-none"
          >
            <MinusCircle className="h-6 w-6" />
          </button>

          {/* Botão de Receita */}
          <button
            onClick={handleNewIncome}
            aria-label="Nova Receita"
            className="flex items-center justify-center h-14 w-14 rounded-3xl bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all border-none"
          >
            <PlusCircle className="h-6 w-6" />
          </button>
        </div>

        {/* Botão Flutuante Principal (+ ou X) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Menu Financeiro"
          className={cn(
            "flex items-center justify-center h-14 w-14 rounded-3xl transition-all active:scale-95 duration-300 border-none",
            isOpen
              ? "bg-slate-800 text-white rotate-90"
              : "bg-primary text-primary-foreground rotate-0",
          )}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </button>
      </div>

      {/* 🔥 OTIMIZAÇÃO DE BANCO DE DADOS (Lazy Mount):
          O modal só passa a existir no código quando a variável isModalOpen for TRUE.
          Isso impede que o modal dispare consultas no BD desnecessariamente quando a página carrega.
      */}
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

// app/(private)/admin/finance/_components/finance-speed-dial.tsx
"use client";

import { useState } from "react";
import { Plus, ArrowUpRight, ArrowDownRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { TransactionModal } from "./transaction-modal";
import { ClosingReportModal } from "./closing-report-modal";

interface FinanceSpeedDialProps {
  showScrollTop?: boolean;
  onSuccess?: () => void;
}

export function FinanceSpeedDial({
  showScrollTop = false,
  onSuccess,
}: FinanceSpeedDialProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"INCOME" | "EXPENSE">(
    "INCOME",
  );

  const toggle = () => setIsOpen(!isOpen);

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

  const handleOpenClosingReport = () => {
    setIsClosingModalOpen(true);
    setIsOpen(false);
  };

  const actions = [
    {
      name: "Nova Receita",
      icon: <ArrowUpRight className="w-5 h-5" />,
      onClick: handleNewIncome,
      color: "text-emerald-500 bg-emerald-500/10",
    },
    {
      name: "Nova Despesa",
      icon: <ArrowDownRight className="w-5 h-5" />,
      onClick: handleNewExpense,
      color: "text-rose-500 bg-rose-500/10",
    },
    {
      name: "Exportar Fechamento",
      icon: <FileText className="w-5 h-5" />,
      onClick: handleOpenClosingReport,
      color: "text-blue-500 bg-blue-500/10",
    },
  ];

  return (
    <>
      <div
        className={cn(
          "fixed bottom-28 right-4 md:bottom-8 md:right-8 z-50 flex flex-col items-end transition-all duration-300",
          showScrollTop
            ? "translate-y-16 opacity-0 pointer-events-none"
            : "translate-y-0 opacity-100",
        )}
      >
        {isOpen && (
          <div className="flex flex-col items-end gap-3 mb-4">
            {actions.map((action, i) => (
              <button
                key={i}
                type="button"
                onClick={action.onClick}
                className="flex items-center gap-3 bg-background/80 dark:bg-card/90 backdrop-blur-md rounded-full py-1.5 pl-1.5 pr-5 border border-border/50 hover:bg-background transition-colors animate-in fade-in slide-in-from-bottom-5 active:scale-[0.98] shadow-lg"
                style={{
                  animationDelay: `${(actions.length - i) * 50}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                    action.color,
                  )}
                >
                  {action.icon}
                </div>
                <span className="text-sm font-bold text-foreground whitespace-nowrap">
                  {action.name}
                </span>
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={toggle}
          aria-label={isOpen ? "Fechar menu" : "Abrir menu financeiro"}
          className={cn(
            "w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-primary-foreground transition-all duration-300 active:scale-95",
            isOpen ? "bg-red-500 rotate-45" : "bg-primary hover:scale-110",
          )}
        >
          <Plus className="w-7 h-7" />
        </button>

        {/* Overlay invisível para fechar ao clicar fora */}
        {isOpen && (
          <div
            className="fixed inset-0 z-[-1]"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>

      {/* MODAL DE TRANSAÇÃO (Receita / Despesa) */}
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

      {/* MODAL DE EXPORTAÇÃO DE FECHAMENTO */}
      {isClosingModalOpen && (
        <ClosingReportModal
          isOpen={isClosingModalOpen}
          onClose={() => setIsClosingModalOpen(false)}
        />
      )}
    </>
  );
}

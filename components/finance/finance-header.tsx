// components/finance/finance-header.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MinusCircle, PlusCircle, FileDetail } from "@boxicons/react";
import { TransactionModal } from "@/components/finance/transaction-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FinanceHeaderProps {
  onSuccess?: () => void;
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (m: number) => void;
  onYearChange: (y: number) => void;
}

const MONTHS = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

export function FinanceHeader({
  onSuccess,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
}: FinanceHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"INCOME" | "EXPENSE">(
    "INCOME",
  );

  const currentYear = new Date().getFullYear();
  const startYear = 2026;
  const YEARS = Array.from(
    { length: currentYear - startYear + 2 },
    (_, i) => startYear + i,
  );

  const handleNewIncome = () => {
    setTransactionType("INCOME");
    setIsModalOpen(true);
  };

  const handleNewExpense = () => {
    setTransactionType("EXPENSE");
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Acompanhe e gira as movimentações do seu negócio.
          </p>
        </div>

        <div className="flex flex-row items-center justify-between w-full lg:w-auto mt-2 lg:mt-0 gap-2">
          {/* 🔥 FILTROS DE MÊS E ANO - DESIGN ORIGINAL RESTAURADO */}
          <div className="flex items-center justify-start gap-1 shrink-0">
            <Select
              value={selectedMonth.toString()}
              onValueChange={(val) => onMonthChange(Number(val))}
            >
              <SelectTrigger className="h-10 w-28 sm:w-32 border-none bg-transparent shadow-none focus:ring-0 font-bold text-base sm:text-lg px-2 hover:text-primary transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {MONTHS.map((m) => (
                  <SelectItem
                    key={m.value}
                    value={m.value.toString()}
                    className="rounded-lg"
                  >
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedYear.toString()}
              onValueChange={(val) => onYearChange(Number(val))}
            >
              <SelectTrigger className="h-10 w-20 sm:w-24 border-none bg-transparent shadow-none focus:ring-0 font-bold text-base sm:text-lg px-2 hover:text-primary transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {YEARS.map((y) => (
                  <SelectItem
                    key={y}
                    value={y.toString()}
                    className="rounded-lg"
                  >
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="h-8 w-px bg-border/50 hidden sm:block mx-1" />

          {/* 🔥 BOTÕES DE AÇÃO - DESIGN ORIGINAL RESTAURADO */}
          <TooltipProvider delayDuration={200}>
            <div className="flex flex-row items-center justify-end gap-2 sm:gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="hidden md:flex text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 dark:text-rose-500 dark:border-rose-900 dark:hover:bg-rose-950/50 h-11 w-11 sm:h-10 sm:w-10 rounded-xl shrink-0 transition-transform active:scale-95"
                    onClick={handleNewExpense}
                  >
                    <MinusCircle className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <p>Adicionar Despesa</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    className="hidden md:flex bg-emerald-600 hover:bg-emerald-700 text-white h-11 w-11 sm:h-10 sm:w-10 rounded-xl shrink-0 transition-transform active:scale-95"
                    onClick={handleNewIncome}
                  >
                    <PlusCircle className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <p>Adicionar Receita</p>
                </TooltipContent>
              </Tooltip>

              <Button
                variant="outline"
                asChild
                className="h-11 sm:h-10 px-3 sm:px-4 rounded-xl shrink-0 border-border/50 text-muted-foreground hover:text-foreground transition-transform active:scale-95 flex items-center gap-2"
              >
                <Link href="/admin/finance/reports">
                  <FileDetail className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="font-medium text-sm">Relatórios</span>
                </Link>
              </Button>
            </div>
          </TooltipProvider>
        </div>
      </div>

      {/* 🔥 OTIMIZAÇÃO: Modal só é montado quando necessário (Lazy Mount) */}
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

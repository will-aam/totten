// app/(private)/admin/finance/_components/finance-header.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MinusCircle, PlusCircle, FileDetail } from "@boxicons/react";
import { TransactionModal } from "./transaction-modal";
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-20">
        <div className="flex flex-col">
          <h1 className="text-3xl font-black tracking-tight bg-linear-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Financeiro
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5 font-medium">
            Acompanhe e faça a gestão das movimentações do seu negócio.
          </p>
        </div>

        <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full md:w-auto">
          {/* FILTROS DE DATA - DESIGN CAPSULA (GLASSMORPHISM) */}
          <div className="flex items-center bg-muted/40 backdrop-blur-md border border-border/60 rounded-2xl p-1 shadow-sm shrink-0">
            <Select
              value={selectedMonth.toString()}
              onValueChange={(val) => onMonthChange(Number(val))}
            >
              <SelectTrigger className="h-10 w-28 sm:w-32 border-none bg-transparent shadow-none focus:ring-0 font-bold text-sm sm:text-base px-3 hover:bg-background/60 rounded-xl transition-all">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border/50 shadow-xl">
                {MONTHS.map((m) => (
                  <SelectItem
                    key={m.value}
                    value={m.value.toString()}
                    className="rounded-xl font-medium focus:bg-primary/10 focus:text-primary"
                  >
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="w-px h-5 bg-border/80 mx-1" />

            <Select
              value={selectedYear.toString()}
              onValueChange={(val) => onYearChange(Number(val))}
            >
              <SelectTrigger className="h-10 w-20 sm:w-24 border-none bg-transparent shadow-none focus:ring-0 font-bold text-sm sm:text-base px-3 hover:bg-background/60 rounded-xl transition-all">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border/50 shadow-xl">
                {YEARS.map((y) => (
                  <SelectItem
                    key={y}
                    value={y.toString()}
                    className="rounded-xl font-medium focus:bg-primary/10 focus:text-primary"
                  >
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* BOTÕES DE AÇÃO - DESIGN PREMIUM */}
          <TooltipProvider delayDuration={200}>
            <div className="flex items-center gap-2 sm:gap-3 ml-auto md:ml-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="hidden md:flex bg-rose-500/10 text-rose-600 hover:text-rose-700 hover:bg-rose-500/20 border-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/20 h-12 w-12 rounded-2xl shrink-0 transition-all duration-300 active:scale-95 shadow-sm"
                    onClick={handleNewExpense}
                  >
                    <MinusCircle className="h-6 w-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="text-xs font-semibold rounded-xl"
                >
                  <p>Adicionar Despesa</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    className="hidden md:flex bg-emerald-500 hover:bg-emerald-600 text-white h-12 w-12 rounded-2xl shrink-0 transition-all duration-300 active:scale-95 shadow-[0_4px_20px_rgb(16,185,129,0.3)] hover:shadow-[0_4px_25px_rgb(16,185,129,0.5)] border-none"
                    onClick={handleNewIncome}
                  >
                    <PlusCircle className="h-6 w-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="text-xs font-semibold rounded-xl"
                >
                  <p>Adicionar Receita</p>
                </TooltipContent>
              </Tooltip>

              <Button
                variant="outline"
                asChild
                className="h-12 px-4 rounded-2xl shrink-0 border-border/60 bg-background/50 backdrop-blur-sm text-foreground hover:bg-muted shadow-sm transition-all duration-300 active:scale-95 flex items-center gap-2"
              >
                <Link href="/admin/finance/reports">
                  <FileDetail className="h-5 w-5 text-muted-foreground" />
                  <span className="font-bold text-sm">Relatórios</span>
                </Link>
              </Button>
            </div>
          </TooltipProvider>
        </div>
      </div>

      {/* OTIMIZAÇÃO: Modal só é montado quando necessário (Lazy Mount) */}
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

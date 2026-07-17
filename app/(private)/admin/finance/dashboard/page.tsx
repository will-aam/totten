// app/(private)/admin/finance/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header"; // Ajustado para o caminho do arquivo zipado
import { FinanceHeader } from "../_components/finance-header";
import { FinanceSecondaryIndicators } from "../_components/finance-secondary-indicators";
import { FinanceSummaryCards } from "../_components/finance-summary-cards";
import { RecentTransactionsList } from "../_components/recent-transactions-list";
import { FinanceSpeedDial } from "../_components/finance-speed-dial";
import { ChevronUp, WalletAlt, ChevronRight } from "@boxicons/react";
import { cn } from "@/lib/utils";
import { getFinanceDashboardData } from "@/app/actions/finance-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

// Tipagem estrita para a chave do SWR
const fetchDashboard = async ([, month, year]: [string, number, number]) => {
  return await getFinanceDashboardData(month, year);
};

export default function FinanceDashboardPage() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data, isLoading, mutate } = useSWR(
    ["finance-dashboard", selectedMonth, selectedYear],
    fetchDashboard,
    {
      keepPreviousData: true,
      dedupingInterval: 10000,
      revalidateOnFocus: true,
    },
  );

  const summaryData = data?.summary;
  const secondaryData = data?.secondary;
  const recentTransactions = data?.recentTransactions || [];

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      <AdminHeader title="Financeiro" />

      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full pb-24 md:pb-12 relative animate-in fade-in duration-700 min-h-[calc(100vh-100px)]">
        <FinanceHeader
          onSuccess={() => mutate()}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />

        {isLoading && !data ? (
          <div className="flex flex-col gap-6 animate-pulse">
            {/* Skeletons de Alta Fidelidade para o Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Skeleton className="h-30 w-full rounded-2xl bg-muted/60 border border-border/50" />
              <Skeleton className="h-30 w-full rounded-2xl bg-muted/60 border border-border/50 hidden md:block" />
              <Skeleton className="h-30 w-full rounded-2xl bg-muted/60 border border-border/50 hidden md:block" />
              <Skeleton className="h-30 w-full rounded-2xl bg-primary/5 border border-primary/10 hidden md:block" />
            </div>

            {/* Skeleton do Banner Contas a Receber */}
            <Skeleton className="h-24 w-full rounded-2xl bg-emerald-500/5 border border-emerald-500/10 hidden md:block" />

            {/* Skeletons dos Indicadores Secundários */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Skeleton className="h-20 w-full rounded-2xl bg-muted/60 border border-border/50" />
              <Skeleton className="h-20 w-full rounded-2xl bg-muted/60 border border-border/50" />
              <Skeleton className="h-20 w-full rounded-2xl bg-muted/60 border border-border/50" />
              <Skeleton className="h-20 w-full rounded-2xl bg-muted/60 border border-border/50" />
            </div>

            {/* Skeletons da Lista de Transações */}
            <div className="flex flex-col gap-3 mt-4">
              <Skeleton className="h-16 w-full rounded-2xl bg-muted/60 border border-border/50" />
              <Skeleton className="h-16 w-full rounded-2xl bg-muted/60 border border-border/50" />
              <Skeleton className="h-16 w-full rounded-2xl bg-muted/60 border border-border/50" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8 animate-in slide-in-from-bottom-4 duration-700 fade-in">
            {summaryData && <FinanceSummaryCards data={summaryData} />}

            <Link
              href="/admin/finance/receivables"
              className="hidden md:block outline-none rounded-2xl focus-visible:ring-2 focus-visible:ring-primary/20 group"
            >
              <div className="relative overflow-hidden bg-linear-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 dark:border-emerald-500/10 rounded-2xl p-5 flex items-center justify-between transition-all duration-300 hover:border-emerald-500/40 hover:shadow-[0_8px_30px_rgb(16,185,129,0.12)]">
                {/* Efeito de brilho no fundo */}
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-500/20 blur-3xl rounded-full group-hover:bg-emerald-500/30 transition-all duration-500" />

                <div className="flex items-center gap-5 relative z-10">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <WalletAlt size="md" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-base font-black text-foreground tracking-tight uppercase">
                      Contas a Receber
                    </h3>
                    <p className="text-sm font-medium text-muted-foreground mt-0.5">
                      Dê baixa rápida em agendamentos e faturas pendentes
                    </p>
                  </div>
                </div>
                <div className="relative z-10 w-10 h-10 flex items-center justify-center rounded-full bg-emerald-500/10 group-hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 group-hover:text-white transition-all duration-300">
                  <ChevronRight
                    size="sm"
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </div>
              </div>
            </Link>

            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary/50"></span>
                Visão Rápida (Semana Atual)
              </h3>
              {secondaryData && (
                <FinanceSecondaryIndicators data={secondaryData} />
              )}
            </div>

            <div className="flex flex-col gap-4 mt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/30"></span>
                Últimas Movimentações
              </h3>
              <RecentTransactionsList data={recentTransactions} />
            </div>
          </div>
        )}
      </div>

      <FinanceSpeedDial isHidden={showScrollTop} onSuccess={() => mutate()} />

      <button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-20 right-4 md:bottom-8 md:right-8 h-12 w-12 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 z-50 hover:bg-primary/90",
          showScrollTop
            ? "translate-y-0 opacity-100 hover:scale-105"
            : "translate-y-16 opacity-0 pointer-events-none",
        )}
      >
        <ChevronUp size="base" removePadding />
      </button>
    </>
  );
}

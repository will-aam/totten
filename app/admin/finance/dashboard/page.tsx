// app/admin/finance/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { AdminHeader } from "@/components/admin-header";
import { FinanceHeader } from "@/components/finance/finance-header";
import { FinanceSecondaryIndicators } from "@/components/finance/finance-secondary-indicators";
import { FinanceSummaryCards } from "@/components/finance/finance-summary-cards";
import { RecentTransactionsList } from "@/components/finance/recent-transactions-list";
import { FinanceSpeedDial } from "@/components/finance/finance-speed-dial";
import { ChevronUp, WalletAlt, ChevronRight } from "@boxicons/react";
import { cn } from "@/lib/utils";
import { getFinanceDashboardData } from "@/app/actions/finance-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

const fetchDashboard = async ([_, month, year]: [string, number, number]) => {
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

      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-350 mx-auto w-full pb-24 md:pb-12 relative animate-in fade-in duration-500 min-h-[calc(100vh-100px)]">
        <FinanceHeader
          onSuccess={() => mutate()}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />

        {isLoading && !data ? (
          <div className="flex flex-col gap-6 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-32 w-full rounded-3xl bg-muted/50 border border-border/50" />
              <Skeleton className="h-32 w-full rounded-3xl bg-muted/50 border border-border/50 hidden md:block" />
              <Skeleton className="h-32 w-full rounded-3xl bg-muted/50 border border-border/50 hidden md:block" />
            </div>
            <Skeleton className="h-24 w-full rounded-3xl bg-muted/50 border border-border/50 hidden md:block" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Skeleton className="h-24 w-full rounded-3xl bg-muted/50 border border-border/50" />
              <Skeleton className="h-24 w-full rounded-3xl bg-muted/50 border border-border/50" />
              <Skeleton className="h-24 w-full rounded-3xl bg-muted/50 border border-border/50" />
              <Skeleton className="h-24 w-full rounded-3xl bg-muted/50 border border-border/50" />
            </div>
            <div className="flex flex-col gap-3 mt-4">
              <Skeleton className="h-20 w-full rounded-3xl bg-muted/50 border border-border/50" />
              <Skeleton className="h-20 w-full rounded-3xl bg-muted/50 border border-border/50" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-2 duration-500">
            {summaryData && <FinanceSummaryCards data={summaryData} />}

            <Link
              href="/admin/finance/receivables"
              className="hidden md:block outline-none rounded-2xl focus-visible:ring-2 focus-visible:ring-primary/20"
            >
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-5 flex items-center justify-between hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-colors shadow-sm group">
                <div className="flex items-center gap-5">
                  <WalletAlt size="md" className="text-emerald-500 shrink-0" />
                  <div className="flex flex-col">
                    <h3 className="text-base font-black text-foreground tracking-tight uppercase text-[13px]">
                      Contas a Receber
                    </h3>
                    <p className="text-sm font-medium text-muted-foreground">
                      Dê baixa rápida em agendamentos pendentes
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size="sm"
                  className="text-emerald-900 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all"
                />
              </div>
            </Link>

            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                Visão Rápida (Semana Atual)
              </h3>
              {secondaryData && (
                <FinanceSecondaryIndicators data={secondaryData} />
              )}
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
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
          "fixed bottom-20 right-4 md:bottom-8 md:right-8 h-14 w-14 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-300 z-50",
          showScrollTop
            ? "translate-y-0 opacity-100 hover:scale-110"
            : "translate-y-16 opacity-0 pointer-events-none",
        )}
      >
        <ChevronUp size="base" removePadding />
      </button>
    </>
  );
}

// app/admin/finance/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminHeader } from "@/components/admin-header";
import { FinanceHeader } from "@/components/finance/finance-header";
import { FinanceSecondaryIndicators } from "@/components/finance/finance-secondary-indicators";
import { FinanceSummaryCards } from "@/components/finance/finance-summary-cards";
import { RecentTransactionsList } from "@/components/finance/recent-transactions-list";
import { FinanceSpeedDial } from "@/components/finance/finance-speed-dial"; // <-- Importação do Speed Dial
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFinanceDashboardData } from "@/app/actions/finance-dashboard";
import {
  FinanceSummary,
  SecondaryIndicators,
  Transaction,
} from "@/types/finance";
import { Skeleton } from "@/components/ui/skeleton";

export default function FinanceDashboardPage() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros de Data
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [summaryData, setSummaryData] = useState<FinanceSummary | null>(null);
  const [secondaryData, setSecondaryData] =
    useState<SecondaryIndicators | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    [],
  );

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getFinanceDashboardData(selectedMonth, selectedYear);
      if (data) {
        setSummaryData(data.summary);
        setSecondaryData(data.secondary);
        setRecentTransactions(data.recentTransactions);
      }
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  // Recarrega sempre que o mês ou o ano mudarem
  useEffect(() => {
    loadDashboard();

    const handleScroll = () => setShowScrollTop(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadDashboard]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      <AdminHeader title="Financeiro" />

      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-6xl mx-auto w-full pb-24 md:pb-6 relative">
        <FinanceHeader
          onSuccess={loadDashboard}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />

        {isLoading ? (
          <div className="space-y-8">
            <div className="flex gap-4 overflow-hidden">
              <Skeleton className="h-32 min-w-[85vw] md:min-w-0 md:flex-1 rounded-2xl" />
              <Skeleton className="h-32 min-w-[85vw] md:min-w-0 md:flex-1 rounded-2xl md:block hidden" />
              <Skeleton className="h-32 min-w-[85vw] md:min-w-0 md:flex-1 rounded-2xl lg:block hidden" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
          </div>
        ) : (
          <>
            {summaryData && <FinanceSummaryCards data={summaryData} />}

            <div className="mt-2 md:mt-0">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
                Visão Rápida (Semana Atual)
              </h3>
              {secondaryData && (
                <FinanceSecondaryIndicators data={secondaryData} />
              )}
            </div>

            <div className="mt-2 md:mt-0">
              <RecentTransactionsList data={recentTransactions} />
            </div>
          </>
        )}
      </div>

      {/* REVEZAMENTO INTELIGENTE: SPEED DIAL vs ARROW UP */}

      {/* 1. Speed Dial: Esconde-se quando showScrollTop é verdadeiro */}
      <FinanceSpeedDial isHidden={showScrollTop} onSuccess={loadDashboard} />

      {/* 2. Arrow Up: Só aparece quando showScrollTop é verdadeiro */}
      <button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-24 md:bottom-8 right-4 md:right-8 p-3.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 z-50",
          showScrollTop
            ? "translate-y-0 opacity-100"
            : "translate-y-10 opacity-0 pointer-events-none md:translate-y-0 md:opacity-100 md:pointer-events-auto",
          // Nota de Sênior: no desktop (md:), o ArrowUp obedece a lógica padrão, já que o Speed Dial não existe no desktop.
        )}
      >
        <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </>
  );
}

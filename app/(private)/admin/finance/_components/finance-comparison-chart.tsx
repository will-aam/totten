// app/(private)/admin/finance/_components/finance-comparison-chart.tsx
"use client";

import useSWR from "swr";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getReportsData } from "@/app/actions/reports";
import { TrendingUp, ArrowDownRight, ArrowUpRight, Scale, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinanceVisibility } from "./finance-visibility-context";

export function FinanceComparisonChart() {
  const { hideValues } = useFinanceVisibility();

  const formatCurrency = (val: number) => {
    if (hideValues) return "••••••";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  const { data: res, isLoading } = useSWR(
    "finance-reports-data",
    async () => {
      return await getReportsData();
    },
    { revalidateOnFocus: true, dedupingInterval: 5000 },
  );

  const monthlyData = res?.monthlyData || [];

  const totalReceitas = monthlyData.reduce((acc, curr) => acc + (curr.receitas || 0), 0);
  const totalDespesas = monthlyData.reduce((acc, curr) => acc + (curr.despesas || 0), 0);
  const saldoLiquido = totalReceitas - totalDespesas;

  return (
    <Card className="border-none shadow-none bg-transparent flex flex-col w-full h-full transition-all">
      <CardHeader className="py-3 px-4 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="text-base font-bold text-foreground">
              Receitas vs Despesas
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Comparativo financeiro mensal dos últimos 6 meses.
            </p>
          </div>
        </div>

        {/* Resumo Rápido em Linha Discreta */}
        <div className="flex items-center gap-6 pt-2 mt-1 border-t border-border/40 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Receitas:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalReceitas)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Despesas:</span>
            <span className="font-bold text-rose-500">
              {formatCurrency(totalDespesas)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-1 flex-1 flex flex-col min-h-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center flex-1 py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground mt-2 font-medium">
              Carregando comparativo...
            </span>
          </div>
        ) : monthlyData.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-12 text-center text-muted-foreground">
            <p className="text-xs font-medium">Nenhum dado disponível.</p>
          </div>
        ) : (
          <div className="w-full h-[220px] sm:h-full flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
              <BarChart
                data={monthlyData}
                margin={{ top: 8, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="currentColor"
                  className="opacity-10"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#71717a", fontSize: 11, fontWeight: 500 }}
                  dy={6}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) =>
                    hideValues
                      ? "•••"
                      : `R$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`
                  }
                  tick={{ fill: "#71717a", fontSize: 10 }}
                  dx={-4}
                />
                <Tooltip
                  cursor={{ fill: "currentColor", opacity: 0.05 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      const lucro = (item.receitas || 0) - (item.despesas || 0);
                      return (
                        <div className="rounded-xl border border-border/80 bg-popover/95 p-2.5 shadow-lg backdrop-blur-md text-xs">
                          <div className="font-bold text-foreground mb-1.5">
                            {item.month}
                          </div>
                          <div className="flex items-center justify-between gap-3 mb-0.5">
                            <span className="text-muted-foreground">Receitas:</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(item.receitas)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3 mb-0.5">
                            <span className="text-muted-foreground">Despesas:</span>
                            <span className="font-bold text-rose-500">
                              {formatCurrency(item.despesas)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/40 mt-1">
                            <span className="font-semibold text-foreground">Saldo:</span>
                            <span
                              className={cn(
                                "font-black",
                                lucro >= 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-rose-500",
                              )}
                            >
                              {formatCurrency(lucro)}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="receitas"
                  name="Receitas"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  barSize={16}
                />
                <Bar
                  dataKey="despesas"
                  name="Despesas"
                  fill="#f43f5e"
                  radius={[6, 6, 0, 0]}
                  barSize={16}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

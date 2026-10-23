// app/(private)/admin/finance/_components/finance-monthly-revenue-chart.tsx
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
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getReportsData } from "@/app/actions/reports";
import { TrendingUp, BarChart3, Loader2 } from "lucide-react";

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);
};

export function FinanceMonthlyRevenueChart() {
  const { data: res, isLoading } = useSWR(
    "finance-reports-data",
    async () => {
      return await getReportsData();
    },
    { keepPreviousData: true },
  );

  const monthlyData = res?.monthlyData || [];

  // Encontrar o mês com maior receita (mês mais produtivo)
  let bestMonth = { month: "", receitas: 0 };
  let totalRevenue = 0;

  monthlyData.forEach((m) => {
    totalRevenue += m.receitas || 0;
    if ((m.receitas || 0) > bestMonth.receitas) {
      bestMonth = { month: m.month, receitas: m.receitas || 0 };
    }
  });

  return (
    <Card className="border-none shadow-none bg-transparent flex flex-col w-full h-full transition-all">
      <CardHeader className="py-3 px-4 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-500" />
              Receita Mensal
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Faturamento mensal dos últimos 6 meses.
            </p>
          </div>
        </div>

        {/* Resumo Rápido */}
        <div className="flex items-center gap-6 pt-2 mt-1 border-t border-border/40 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Faturamento Acumulado:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalRevenue)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-1 flex-1 flex flex-col min-h-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center flex-1 py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground mt-2 font-medium">
              Carregando dados...
            </span>
          </div>
        ) : monthlyData.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-12 text-center opacity-60">
            <p className="text-xs font-medium">Nenhum dado financeiro disponível.</p>
          </div>
        ) : (
          <div className="w-full h-[220px] sm:h-full flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
              <BarChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="currentColor"
                  className="text-border/40"
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
                  tick={{ fill: "#71717a", fontSize: 10 }}
                  tickFormatter={(val) =>
                    val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val
                  }
                />
                <Tooltip
                  cursor={{ fill: "currentColor", className: "text-muted/20" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      const isBest = item.month === bestMonth.month;
                      return (
                        <div className="rounded-xl border border-border/80 bg-popover/95 p-3 shadow-lg backdrop-blur-md text-xs">
                          <p className="font-bold text-foreground mb-1">
                            {item.month}
                          </p>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />
                              Receita:
                            </span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(item.receitas)}
                            </span>
                          </div>
                          {isBest && (
                            <div className="mt-1.5 pt-1.5 border-t border-border/50 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" /> Mês mais produtivo do período
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="receitas"
                  name="Receitas"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                >
                  {monthlyData.map((entry, index) => {
                    const isBest = entry.month === bestMonth.month && bestMonth.receitas > 0;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={isBest ? "#059669" : "#10b981"}
                        className={isBest ? "opacity-100" : "opacity-85 hover:opacity-100 transition-opacity"}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

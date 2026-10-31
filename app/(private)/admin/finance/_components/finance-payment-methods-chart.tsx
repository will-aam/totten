// app/(private)/admin/finance/_components/finance-payment-methods-chart.tsx
"use client";

import useSWR from "swr";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getFinanceDashboardData } from "@/app/actions/finance-dashboard";
import { CreditCard } from "lucide-react";
import { useFinanceVisibility } from "./finance-visibility-context";

const COLORS = [
  "#10b981", // Emerald — Pix
  "#6366f1", // Indigo  — Crédito
  "#f59e0b", // Amber   — Débito
  "#06b6d4", // Cyan    — Dinheiro
  "#8b5cf6", // Violet  — Outros
  "#ec4899", // Pink
];

function formatMethodName(method: string | null | undefined): string {
  if (!method) return "Outros";
  const m = method.toUpperCase();
  if (m.includes("PIX")) return "Pix";
  if (m.includes("CREDIT") || m.includes("CREDITO")) return "Cartão de Crédito";
  if (m.includes("DEBIT") || m.includes("DEBITO")) return "Cartão de Débito";
  if (m.includes("CASH") || m.includes("DINHEIRO")) return "Dinheiro";
  return method;
}

function formatCurrencyFull(val: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);
}

export function FinancePaymentMethodsChart() {
  const { hideValues } = useFinanceVisibility();

  const fmt = (val: number) =>
    hideValues ? "••••••" : formatCurrencyFull(val);

  const { data: res, isLoading } = useSWR(
    "finance-dashboard-action-data",
    () => getFinanceDashboardData(),
    { keepPreviousData: true },
  );

  const chartData =
    res?.byPaymentMethod && res.byPaymentMethod.length > 0
      ? res.byPaymentMethod
      : (() => {
          const transactions = res?.recentTransactions || [];
          const methodMap: Record<string, number> = {};
          transactions.forEach((tx) => {
            if (tx.type === "RECEITA" && tx.status === "PAGO") {
              const label = formatMethodName(tx.paymentMethod);
              methodMap[label] = (methodMap[label] || 0) + tx.amount;
            }
          });
          return Object.entries(methodMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
        })();

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <Card className="border-none shadow-none bg-transparent flex flex-col w-full h-full">
      <CardHeader className="py-3 px-4 pb-2">
        <div className="flex flex-col gap-0.5">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-emerald-500" />
            Meios de Pagamento
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Distribuição da receita por forma de recebimento.
          </p>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-1 flex-1 flex flex-col min-h-0">
        {isLoading ? (
          <div className="flex flex-col sm:flex-row items-center gap-6 flex-1 py-4">
            <Skeleton className="w-40 h-40 rounded-full shrink-0" />
            <div className="flex flex-col gap-2.5 w-full">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-12 text-center opacity-60">
            <p className="text-xs font-medium text-muted-foreground">
              Nenhuma transação com forma de pagamento registrada.
            </p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full flex-1 min-h-0">

            {/* ——— Coluna do Donut com Total Embaixo ——— */}
            <div className="relative shrink-0 flex flex-col items-center justify-center">
              <div className="w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      wrapperStyle={{ zIndex: 100, pointerEvents: "none" }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const item = payload[0];
                        const idx = chartData.findIndex((c) => c.name === item.name);
                        const color = item.payload?.fill ?? COLORS[idx % COLORS.length];
                        const percent =
                          total > 0
                            ? ((Number(item.value) / total) * 100).toFixed(1)
                            : "0";
                        return (
                          <div className="rounded-xl border border-border/60 bg-popover/95 p-3 shadow-xl backdrop-blur-md text-xs">
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: color }}
                              />
                              <p className="font-semibold text-foreground">{item.name}</p>
                            </div>
                            <div className="flex items-center justify-between gap-5">
                              <span className="text-muted-foreground">Valor</span>
                              <span className="font-bold text-foreground">
                                {fmt(Number(item.value))}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-5 mt-0.5">
                              <span className="text-muted-foreground">Participação</span>
                              <span className="font-semibold text-foreground">{percent}%</span>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Pie
                      data={chartData}
                      innerRadius="60%"
                      outerRadius="88%"
                      paddingAngle={3}
                      cornerRadius={4}
                      stroke="none"
                      strokeWidth={0}
                      dataKey="value"
                      isAnimationActive
                      animationDuration={700}
                      animationEasing="ease-out"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {chartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          stroke="none"
                          strokeWidth={0}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Total posicionado embaixo do donut */}
              <div className="flex flex-col items-center justify-center pt-2 text-center select-none">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Total
                </span>
                <span className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                  {hideValues ? "••••••" : formatCurrencyFull(total)}
                </span>
              </div>
            </div>

            {/* ——— Legenda limpa ——— */}
            <div className="w-full sm:flex-1 flex flex-col gap-1.5 overflow-auto min-h-0">
              {chartData.map((item, index) => {
                const color = COLORS[index % COLORS.length];
                const percent =
                  total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";

                return (
                  <div
                    key={item.name}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-muted/40 transition-colors group"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />

                    <span className="text-xs text-foreground font-medium truncate flex-1 min-w-0">
                      {item.name}
                    </span>

                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                      <span className="text-xs font-semibold text-foreground">
                        {fmt(item.value)}
                      </span>
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md tabular-nums"
                        style={{
                          backgroundColor: `${color}1a`,
                          color: color,
                        }}
                      >
                        {percent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

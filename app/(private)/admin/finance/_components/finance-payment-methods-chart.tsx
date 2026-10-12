// app/(private)/admin/finance/_components/finance-payment-methods-chart.tsx
"use client";

import useSWR from "swr";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getFinanceDashboardData } from "@/app/actions/finance-dashboard";
import { CreditCard, Loader2 } from "lucide-react";
import { useFinanceVisibility } from "./finance-visibility-context";

import { cn } from "@/lib/utils";

const COLORS = [
  "#10b981", // Emerald (Pix / principal)
  "#6366f1", // Indigo (Cartão de Crédito)
  "#f59e0b", // Amber (Cartão de Débito)
  "#06b6d4", // Cyan (Dinheiro)
  "#8b5cf6", // Purple (Outros)
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

export function FinancePaymentMethodsChart() {
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
    "finance-dashboard-action-data",
    async () => {
      return await getFinanceDashboardData();
    },
    { revalidateOnFocus: true, dedupingInterval: 5000 },
  );

  const transactions = res?.recentTransactions || [];

  // Agrupar receitas por meio de pagamento
  const methodMap: Record<string, number> = {};
  transactions.forEach((tx) => {
    if (tx.type === "RECEITA" && tx.status === "PAGO") {
      const label = formatMethodName(tx.paymentMethod);
      methodMap[label] = (methodMap[label] || 0) + tx.amount;
    }
  });

  const chartData = Object.entries(methodMap)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => b.value - a.value);

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <Card className="border-none shadow-none bg-transparent flex flex-col w-full h-full transition-all">
      <CardHeader className="py-3 px-4 pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-500" />
              Meios de Pagamento
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Distribuição da receita por forma de recebimento.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-3 pt-1 flex-1 flex flex-col min-h-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center flex-1 py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground mt-2 font-medium">
              Carregando dados...
            </span>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-12 text-center opacity-60">
            <p className="text-xs font-medium">
              Nenhuma transação com forma de pagamento registrada.
            </p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full h-full flex-1 min-h-0">
            {/* Gráfico Donut Gourmet Arredondado sem Borda Branca com Total Embaixo */}
            <div className="relative w-full sm:w-[45%] h-full flex flex-col items-center justify-center shrink-0">
              <div className="w-full flex-1 min-h-[140px] sm:min-h-[170px] flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart className="outline-none [&_.recharts-sector]:stroke-none! [&_.recharts-sector]:outline-none! [&_.recharts-sector[stroke='#fff']]:stroke-transparent!">
                    <Tooltip
                      wrapperStyle={{ zIndex: 100, pointerEvents: "none" }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0];
                          const itemColor =
                            item.payload?.fill ||
                            COLORS[
                              chartData.findIndex((c) => c.name === item.name) %
                                COLORS.length
                            ];
                          const percent =
                            total > 0
                              ? ((Number(item.value) / total) * 100).toFixed(1)
                              : "0";
                          return (
                            <div className="relative z-50 rounded-2xl border border-border/80 bg-popover/95 p-3 shadow-2xl backdrop-blur-md text-xs select-none">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: itemColor }}
                                />
                                <p className="font-bold text-foreground">
                                  {item.name}
                                </p>
                              </div>
                              <div className="flex items-center justify-between gap-4 mb-0.5">
                                <span className="text-muted-foreground">Valor:</span>
                                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                  {formatCurrency(Number(item.value))}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4 pt-1 border-t border-border/40 text-[11px]">
                                <span className="text-muted-foreground">
                                  Participação:
                                </span>
                                <span className="font-semibold text-foreground">
                                  {percent}%
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Pie
                      data={chartData}
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={5}
                      cornerRadius={10}
                      stroke="none"
                      strokeWidth={0}
                      dataKey="value"
                      isAnimationActive={true}
                      animationDuration={600}
                      className="outline-none"
                    >
                      {chartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          stroke="none"
                          strokeWidth={0}
                          className="outline-none"
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Total posicionado com clareza embaixo do gráfico */}
              <div className="flex flex-col items-center justify-center pt-1 pb-1 shrink-0 text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70">
                  Total
                </span>
                <span className="text-xs sm:text-sm font-black text-foreground tracking-tight">
                  {hideValues ? "••••••" : formatCurrency(total)}
                </span>
              </div>
            </div>

            {/* Lista Gourmet que cresce e aproveita todo o espaço inferior sem rolagem */}
            <div
              className="w-full sm:w-[55%] flex-1 flex flex-col h-full min-h-0 justify-between gap-2 overflow-visible"
            >
              {chartData.map((item, index) => {
                const percent =
                  total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
                const color = COLORS[index % COLORS.length];

                return (
                  <div
                    key={item.name}
                    className="relative flex-1 min-h-[40px] max-h-[64px] flex items-center justify-between px-3 py-2 rounded-xl hover:bg-muted/40 transition-all group overflow-hidden border border-border/30 bg-card/30"
                  >
                    {/* Barra de progresso proporcional e sutil no fundo */}
                    <div
                      className="absolute left-0 top-0 bottom-0 transition-all duration-500 pointer-events-none opacity-15"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: color,
                      }}
                    />

                    <div className="flex items-center gap-2.5 min-w-0 z-10">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0 ring-1 ring-border/50"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-semibold text-xs sm:text-sm text-foreground truncate">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2 z-10">
                      <span className="text-xs sm:text-sm font-bold text-foreground">
                        {formatCurrency(item.value)}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/40">
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

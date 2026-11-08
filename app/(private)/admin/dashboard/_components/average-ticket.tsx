// app/(private)/admin/dashboard/_components/average-ticket.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "@boxicons/react";
import { AreaChart, Area, YAxis, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

import { useFinanceVisibility } from "@/app/(private)/admin/finance/_components/finance-visibility-context";

const chartConfig = {
  value: {
    label: "Ticket (R$)",
    color: "#10b981", // emerald-500 fixo para garantir visibilidade no light/dark mode
  },
} satisfies ChartConfig;

export function AverageTicket({
  data: propData,
}: {
  data?: {
    current: number;
    percentageChange: number;
    history: { day: string; value: number }[];
  };
}) {
  const { hideValues } = useFinanceVisibility();

  const chartData = propData?.history || [];
  const currentTicket = propData?.current || 0;
  const percentageChange = propData?.percentageChange || 0;
  const isPositive = percentageChange >= 0;

  return (
    <Card className="border-none shadow-none bg-transparent flex flex-col w-full h-full transition-all">
      <CardHeader className="py-3 px-4 pb-0">
        <div className="flex flex-col gap-0.5">
          <CardTitle className="text-base font-bold text-foreground">
            Ticket Médio
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Média de faturamento por atendimento nos últimos 30 dias.
          </p>
        </div>
      </CardHeader>

      <CardContent className="px-4 py-4 flex-1 flex flex-col min-h-0">
        {!propData ? (
          <div className="flex flex-col justify-between flex-1 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-32 rounded-lg" />
              <Skeleton className="h-4 w-40 rounded-lg" />
            </div>
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <div className="flex items-end justify-between mb-4 shrink-0">
              <div>
                <div className="text-3xl font-bold text-foreground tracking-tight">
                  R$ {hideValues ? "••••••" : currentTicket.toFixed(2).replace(".", ",")}
                </div>
                {!hideValues && (
                  <div
                    className={`flex items-center gap-1 mt-1 text-xs font-medium ${isPositive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                      }`}
                  >
                    {isPositive ? <TrendingUp size="xs" /> : <TrendingDown size="xs" />}
                    <span>{Math.abs(percentageChange).toFixed(1)}% vs. mês passado</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 w-full mt-2 min-h-0">
              {chartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                  <p className="text-xs font-medium">Nenhum dado disponível.</p>
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                    />
                    <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                    <ChartTooltip
                      cursor={{ stroke: "#10b981", strokeWidth: 1, strokeDasharray: "3 3" }}
                      content={<ChartTooltipContent indicator="line" />}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

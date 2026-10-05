// app/(private)/admin/dashboard/_components/average-ticket.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dollar, TrendingUp, TrendingDown } from "@boxicons/react";
import { AreaChart, Area, YAxis, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const chartConfig = {
  value: {
    label: "Ticket (R$)",
    color: "#10b981", // emerald-500 fixo para garantir visibilidade no light/dark mode
  },
} satisfies ChartConfig;


export function AverageTicket({ data: backendData }: { data?: { current: number, percentageChange: number, history: { day: string, value: number }[] } }) {
  const chartData = backendData?.history || [];
  const currentTicket = backendData?.current || 0;
  const percentageChange = backendData?.percentageChange || 0;
  const isPositive = percentageChange >= 0;

  return (
    <Card className="border-none shadow-none bg-transparent flex flex-col w-full h-full transition-all">
      <CardHeader className="py-3 px-4 pb-0">
        <CardTitle className="text-base font-bold text-foreground">
          Ticket Médio
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 py-4 flex-1 flex flex-col min-h-0">
        <div className="flex items-end justify-between mb-4 shrink-0">
          <div>
            <div className="text-3xl font-bold text-foreground tracking-tight">
              R$ {currentTicket.toFixed(2).replace(".", ",")}
            </div>
            <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
              {isPositive ? <TrendingUp size="xs" /> : <TrendingDown size="xs" />}
              <span>{Math.abs(percentageChange).toFixed(1)}% vs. mês passado</span>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full mt-4 min-h-0">
          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
              <p className="text-xs font-medium">Nenhum dado disponível.</p>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-full w-full">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <ChartTooltip 
                cursor={false}
                content={<ChartTooltipContent hideLabel />} 
              />
              <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
              <XAxis dataKey="day" hide />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="var(--color-value)" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#fillValue)"
              />
            </AreaChart>
            </ChartContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

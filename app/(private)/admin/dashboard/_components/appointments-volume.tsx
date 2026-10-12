// app/(private)/admin/dashboard/_components/appointments-volume.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { TrendingUp, CalendarCheck } from "lucide-react";

const chartConfig = {
  agendamentos: {
    label: "Atendimentos",
    color: "#6366f1", // Indigo moderno
  },
} satisfies ChartConfig;

type VolumeData = {
  total: number;
  monthly: { month: string; agendamentos: number }[];
};

export function AppointmentsVolume({
  data: backendData,
}: {
  data?: VolumeData;
}) {
  const chartData = backendData?.monthly || [];
  const total = backendData?.total || 0;

  return (
    <Card className="border-none shadow-none bg-transparent flex flex-col w-full h-full transition-all">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-indigo-500" />
            Volume de Agendamentos
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Quantidade de atendimentos realizados nos últimos 6 meses.
          </p>
        </div>

        {total > 0 && (
          <div className="flex items-center gap-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full text-xs font-bold shrink-0">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>{total} total</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-2 flex-1 flex flex-col min-h-0">
        <div className="flex-1 w-full min-h-0">
          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
              <p className="text-xs font-medium">Nenhum dado disponível.</p>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 12, right: 10, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="indigoGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    tick={{ fontSize: 11, fontWeight: 500 }}
                  />
                  <YAxis hide={true} domain={["auto", "auto"]} />
                  <ChartTooltip
                    cursor={{
                      stroke: "#6366f1",
                      strokeWidth: 1.5,
                      strokeDasharray: "3 3",
                      opacity: 0.4,
                    }}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Area
                    type="monotone"
                    dataKey="agendamentos"
                    stroke="#6366f1"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#indigoGradient)"
                    activeDot={{
                      r: 5,
                      fill: "#ffffff",
                      stroke: "#6366f1",
                      strokeWidth: 2.5,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

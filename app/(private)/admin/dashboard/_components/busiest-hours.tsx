// app/(private)/admin/dashboard/_components/busiest-hours.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "@boxicons/react";
import { BarChart, Bar, XAxis, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";


const chartConfig = {
  appointments: {
    label: "Agendamentos",
    color: "#3b82f6", // blue-500 fixo para garantir visibilidade no light/dark mode
  },
} satisfies ChartConfig;

export function BusiestHours({ data: backendData }: { data?: { time: string, appointments: number }[] }) {
  const chartData = backendData || [];
  const maxAppointments = chartData.length > 0 ? Math.max(...chartData.map(d => d.appointments)) : 0;

  return (
    <Card className="border-none shadow-none bg-transparent flex flex-col w-full h-full transition-all">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-base font-bold text-foreground">
          Horários mais movimentados
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-2 flex-1 flex flex-col min-h-0">
        <p className="text-xs text-muted-foreground mb-4 shrink-0">
          Volume de agendamentos por faixa de horário (média da semana).
        </p>

        <div className="flex-1 w-full min-h-0">
          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
              <p className="text-xs font-medium">Nenhum dado disponível.</p>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.2} />
                </linearGradient>
                <linearGradient id="barGradientMax" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={1} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tickMargin={10}
              />
              <ChartTooltip
                cursor={{ fill: "var(--color-appointments)", opacity: 0.05 }}
                content={<ChartTooltipContent hideIndicator />}
              />
              <Bar dataKey="appointments" radius={[8, 8, 0, 0]} barSize={24}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.appointments === maxAppointments ? "url(#barGradientMax)" : "url(#barGradient)"}
                    fillOpacity={entry.appointments === maxAppointments ? 1 : 0.6}
                  />
                ))}
              </Bar>
            </BarChart>
            </ChartContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

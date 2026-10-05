// app/(private)/admin/dashboard/_components/busiest-hours.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "@boxicons/react";
import { BarChart, Bar, XAxis, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const data = [
  { time: "08:00", appointments: 2 },
  { time: "09:00", appointments: 5 },
  { time: "10:00", appointments: 8 },
  { time: "11:00", appointments: 4 },
  { time: "12:00", appointments: 2 },
  { time: "13:00", appointments: 6 },
  { time: "14:00", appointments: 9 },
  { time: "15:00", appointments: 12 },
  { time: "16:00", appointments: 7 },
  { time: "17:00", appointments: 5 },
  { time: "18:00", appointments: 3 },
];

const chartConfig = {
  appointments: {
    label: "Agendamentos",
    color: "#3b82f6", // blue-500 fixo para garantir visibilidade no light/dark mode
  },
} satisfies ChartConfig;

export function BusiestHours({ data: backendData }: { data?: { time: string, appointments: number }[] }) {
  const chartData = backendData || data;
  const maxAppointments = Math.max(...chartData.map(d => d.appointments));

  return (
    <Card className="border-border/50 shadow-md bg-card flex flex-col w-full h-full rounded-2xl dark:border-white/10 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] transition-all">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
          <div className="bg-blue-500/10 p-1.5 rounded-lg text-blue-600 dark:text-blue-400">
            <Clock size="sm" />
          </div>
          Horários mais movimentados
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-2 flex-1 flex flex-col min-h-0">
        <p className="text-xs text-muted-foreground mb-4 shrink-0">
          Volume de agendamentos por faixa de horário (média da semana).
        </p>

        <div className="flex-1 w-full min-h-0">
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
        </div>
      </CardContent>
    </Card>
  );
}

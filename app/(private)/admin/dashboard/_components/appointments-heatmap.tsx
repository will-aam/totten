// app/(private)/admin/dashboard/_components/appointments-heatmap.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Grid } from "@boxicons/react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Simulação de dados para um mapa de calor (dias da semana x horários)
const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const times = ["08h", "10h", "12h", "14h", "16h", "18h"];

// Gerando dados aleatórios para o heatmap (0 a 10)
const heatmapData = days.map(day => ({
  day,
  hours: times.map(time => ({
    time,
    intensity: Math.floor(Math.random() * 11) // 0 a 10
  }))
}));

const getIntensityColor = (intensity: number) => {
  if (intensity === 0) return "bg-muted/50 dark:bg-muted/20";
  if (intensity <= 3) return "bg-primary/30";
  if (intensity <= 6) return "bg-primary/60";
  if (intensity <= 8) return "bg-primary/80";
  return "bg-primary";
};

export function AppointmentsHeatmap({ data: backendData }: { data?: { day: string, hours: { time: string, intensity: number }[] }[] }) {
  const chartData = backendData || heatmapData;

  return (
    <Card className="border-border/50 shadow-md bg-card flex flex-col w-full h-full rounded-2xl dark:border-white/10 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] transition-all">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
          <div className="bg-purple-500/10 p-1.5 rounded-lg text-purple-600 dark:text-purple-400">
            <Grid size="sm" />
          </div>
          Mapa de Calor
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 pb-4 flex-1 flex flex-col">
        <p className="text-xs text-muted-foreground mb-4">
          Densidade de agendamentos por dia e horário.
        </p>

        <div className="flex-1 flex flex-col overflow-x-auto custom-scrollbar pb-2">
          <div className="min-w-[300px] flex-1 flex flex-col">
            {/* Cabeçalho das horas */}
            <div className="flex ml-8 mb-2">
              {times.map(time => (
                <div key={time} className="flex-1 text-center text-[10px] font-medium text-muted-foreground">
                  {time}
                </div>
              ))}
            </div>

            {/* Grid do Heatmap */}
            <div className="flex flex-col gap-1.5 flex-1">
              <TooltipProvider delayDuration={100}>
                {chartData.map((dayRow) => (
                  <div key={dayRow.day} className="flex items-center gap-2 flex-1">
                    <span className="w-6 text-[10px] font-bold text-muted-foreground text-right shrink-0">
                      {dayRow.day}
                    </span>
                    <div className="flex gap-1.5 flex-1 h-full">
                      {dayRow.hours.map((cell) => (
                        <Tooltip key={`${dayRow.day}-${cell.time}`}>
                          <TooltipTrigger asChild>
                            <div
                              className={`flex-1 rounded-sm cursor-pointer transition-colors hover:ring-2 hover:ring-foreground/20 ${getIntensityColor(cell.intensity)}`}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <p><strong>{dayRow.day} às {cell.time}</strong></p>
                            <p>{cell.intensity} agendamentos em média</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                ))}
              </TooltipProvider>
            </div>
          </div>
        </div>

        {/* Legenda */}
        <div className="flex items-center justify-end gap-1 mt-3">
          <span className="text-[10px] text-muted-foreground mr-1">Menos</span>
          <div className="w-3 h-3 rounded-sm bg-muted/50 dark:bg-muted/20"></div>
          <div className="w-3 h-3 rounded-sm bg-primary/30"></div>
          <div className="w-3 h-3 rounded-sm bg-primary/60"></div>
          <div className="w-3 h-3 rounded-sm bg-primary/80"></div>
          <div className="w-3 h-3 rounded-sm bg-primary"></div>
          <span className="text-[10px] text-muted-foreground ml-1">Mais</span>
        </div>
      </CardContent>
    </Card>
  );
}

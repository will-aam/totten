// components/agenda/weekly-agenda-grid.tsx
"use client";

import { format, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Appointment } from "./daily-agenda-grid";
import { Clock } from "lucide-react";

interface WeeklyAgendaGridProps {
  appointments: Appointment[];
  weekStart: Date;
  onAppointmentClick: (appointment: Appointment) => void;
  startHour?: number;
  endHour?: number;
}

export function WeeklyAgendaGrid({
  appointments,
  weekStart,
  onAppointmentClick,
  startHour = 8,
  endHour = 19,
}: WeeklyAgendaGridProps) {
  // Gera o array de horários
  const hours = Array.from(
    { length: endHour - startHour + 1 },
    (_, i) => startHour + i,
  );

  // Gera os 7 dias da semana
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Calcula a posição do agendamento
  const getAppointmentStyle = (appt: Appointment) => {
    const date = new Date(appt.date_time || new Date());
    const apptHour = date.getHours();
    const apptMinute = date.getMinutes();

    const startH = Math.max(startHour, Math.min(apptHour, endHour));
    const top = (startH - startHour) * 80 + (apptMinute / 60) * 80;
    const height = (appt.duration / 60) * 80;

    return { top: `${top}px`, height: `${height}px` };
  };

  return (
    <div className="flex flex-col bg-card rounded-3xl border border-border/50 overflow-hidden shadow-sm">
      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-200 flex">
          {/* Coluna Fixa de Horários à esquerda */}
          {/* Mantivemos o fundo sólido, mas ajustamos as cores dos textos abaixo */}
          <div className="w-16 shrink-0 border-r border-border/50 bg-muted sticky left-0 z-20">
            {/* Cabeçalho do Relógio */}
            {/* 🔥 Alterado de text-muted-foreground para text-slate-600 para melhor contraste no light mode */}
            <div className="h-14 border-b border-border/50 flex items-center justify-center text-slate-600 dark:text-slate-400">
              <Clock className="w-5 h-5" />
            </div>

            {hours.map((hour) => (
              <div
                key={`hour-${hour}`}
                className="h-20 flex items-start justify-center text-xs font-medium pt-2 border-b border-border/10 relative 
                           text-slate-600 dark:text-slate-400"
              >
                {`${hour.toString().padStart(2, "0")}:00`}
              </div>
            ))}
          </div>

          {/* Colunas dos Dias */}
          <div className="flex flex-1">
            {weekDays.map((day, dayIdx) => {
              const dayAppointments = appointments.filter((appt) =>
                isSameDay(new Date(appt.date_time || new Date()), day),
              );

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "flex-1 min-w-30 relative border-r border-border/50 last:border-r-0",
                    isSameDay(day, new Date()) ? "bg-primary/5" : "",
                  )}
                >
                  {/* Cabeçalho do Dia */}
                  <div className="h-14 border-b border-border/50 flex flex-col items-center justify-center sticky top-0 bg-card z-10">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      {format(day, "EEE", { locale: ptBR }).substring(0, 3)}
                    </span>
                    <span className="text-sm font-black text-foreground">
                      {format(day, "dd/MM")}
                    </span>
                  </div>

                  {/* Grade e Agendamentos */}
                  <div className="relative">
                    {hours.map((hour) => (
                      <div
                        key={`grid-${dayIdx}-${hour}`}
                        className="h-20 border-b border-border/10 w-full"
                      />
                    ))}

                    {dayAppointments.map((appt) => (
                      <div
                        key={appt.id}
                        onClick={() => onAppointmentClick(appt)}
                        className={cn(
                          "absolute left-1 right-1 rounded-xl p-2 cursor-pointer transition-all hover:scale-[1.02] hover:z-30 overflow-hidden shadow-sm border",
                          appt.color ||
                            "bg-blue-100 border-blue-200 text-blue-900",
                        )}
                        style={getAppointmentStyle(appt)}
                      >
                        <div className="text-[10px] font-bold leading-tight line-clamp-1">
                          {appt.time} - {appt.clientName.split(" ")[0]}
                        </div>
                        <div className="text-[9px] opacity-80 line-clamp-1 leading-tight mt-0.5">
                          {appt.service}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

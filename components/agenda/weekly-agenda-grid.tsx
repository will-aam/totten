// components/agenda/weekly-agenda-grid.tsx
"use client";

import React, { useMemo, useEffect, useState } from "react";
import { format, addDays, isSameDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Appointment } from "./daily-agenda-grid";
import { Clock, Package as PackageIcon } from "lucide-react";

interface WeeklyAgendaGridProps {
  appointments: Appointment[];
  weekStart: Date;
  onAppointmentClick: (appointment: Appointment) => void;
  startHour?: number;
  endHour?: number;
}

const HOUR_HEIGHT = 96; // 96px por hora para manter consistência com a visão diária

export function WeeklyAgendaGrid({
  appointments,
  weekStart,
  onAppointmentClick,
  startHour = 8,
  endHour = 19,
}: WeeklyAgendaGridProps) {
  // Estado para a linha de "Tempo Atual"
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000); // Atualiza a cada minuto
    return () => clearInterval(timer);
  }, []);

  const hours = useMemo(
    () =>
      Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i),
    [startHour, endHour],
  );

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  // 🔥 OTIMIZAÇÃO: Agrupa agendamentos por dia uma única vez por render
  const groupedAppointments = useMemo(() => {
    const groups: Record<string, Appointment[]> = {};
    weekDays.forEach((day) => {
      const dateKey = format(day, "yyyy-MM-dd");
      groups[dateKey] = appointments.filter((appt) =>
        isSameDay(new Date(appt.date_time || new Date()), day),
      );
    });
    return groups;
  }, [appointments, weekDays]);

  const getAppointmentStyle = (appt: Appointment) => {
    const date = new Date(appt.date_time || new Date());
    const apptHour = date.getHours();
    const apptMinute = date.getMinutes();

    const startH = Math.max(startHour, Math.min(apptHour, endHour));
    const top =
      (startH - startHour) * HOUR_HEIGHT + (apptMinute / 60) * HOUR_HEIGHT;
    const height = (appt.duration / 60) * HOUR_HEIGHT;

    return {
      top: `${top}px`,
      height: `${height}px`,
      minHeight: "24px", // Garante que sessões curtas sejam clicáveis
    };
  };

  // Cálculo da linha de tempo atual
  const currentTimeTop = useMemo(() => {
    const h = now.getHours();
    const m = now.getMinutes();
    if (h < startHour || h >= endHour) return null;
    return (h - startHour) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT;
  }, [now, startHour, endHour]);

  return (
    <div className="flex flex-col bg-card rounded-3xl border border-border/50 overflow-hidden shadow-sm animate-in fade-in duration-500">
      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-200 flex relative">
          {/* COLUNA DE HORÁRIOS (STICKY) */}
          <div className="w-16 shrink-0 border-r border-border/50 bg-muted/30 sticky left-0 z-30 backdrop-blur-md">
            <div className="h-14 border-b border-border/50 flex items-center justify-center text-muted-foreground bg-muted/50">
              <Clock className="w-4 h-4" />
            </div>

            {hours.map((hour) => (
              <div
                key={`hour-${hour}`}
                className="h-24 flex items-start justify-center text-[10px] font-black pt-2 border-b border-border/5 relative text-muted-foreground/60"
              >
                {`${hour.toString().padStart(2, "0")}:00`}
              </div>
            ))}
          </div>

          {/* COLUNAS DOS DIAS */}
          <div className="flex flex-1 relative">
            {/* 🔥 LINHA DE TEMPO ATUAL (INDICADOR "NOW") */}
            {currentTimeTop !== null && (
              <div
                className="absolute left-0 right-0 z-40 flex items-center pointer-events-none"
                style={{ top: `${currentTimeTop}px` }}
              >
                <div className="h-2 w-2 rounded-full bg-destructive -ml-1" />
                <div className="h-[1.5px] w-full bg-destructive/40 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
              </div>
            )}

            {weekDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayAppointments = groupedAppointments[dateKey] || [];
              const today = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "flex-1 min-w-25 relative border-r border-border/50 last:border-r-0 transition-colors",
                    today ? "bg-primary/2" : "hover:bg-muted/2",
                  )}
                >
                  {/* Cabeçalho do Dia */}
                  <div
                    className={cn(
                      "h-14 border-b border-border/50 flex flex-col items-center justify-center sticky top-0 z-20 transition-colors",
                      today ? "bg-primary/5" : "bg-card",
                    )}
                  >
                    <span
                      className={cn(
                        "text-[9px] uppercase font-black tracking-tighter",
                        today ? "text-primary" : "text-muted-foreground/70",
                      )}
                    >
                      {format(day, "EEEE", { locale: ptBR }).substring(0, 3)}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-black leading-none mt-0.5",
                        today ? "text-primary scale-110" : "text-foreground",
                      )}
                    >
                      {format(day, "dd/MM")}
                    </span>
                  </div>

                  {/* Grade de fundo */}
                  <div className="relative bg-grid-pattern-subtle">
                    {hours.map((hour) => (
                      <div
                        key={`grid-cell-${dateKey}-${hour}`}
                        className="h-24 border-b border-border/5 w-full relative"
                      >
                        {/* Linha de meia hora (sutil) */}
                        <div className="absolute top-1/2 w-full border-t border-dotted border-border/5" />
                      </div>
                    ))}

                    {/* RENDERIZAÇÃO DOS CARDS */}
                    {dayAppointments.map((appt) => {
                      const isCancelled =
                        appt.status === "CANCELADO" ||
                        appt.status === "cancelado";

                      return (
                        <div
                          key={appt.id}
                          onClick={() => onAppointmentClick(appt)}
                          className={cn(
                            "absolute left-0.5 right-0.5 rounded-lg p-1.5 cursor-pointer transition-all hover:scale-[1.03] hover:z-50 shadow-sm border flex flex-col justify-between group overflow-hidden",
                            appt.color,
                            isCancelled && "opacity-30 grayscale border-dashed",
                          )}
                          style={getAppointmentStyle(appt)}
                        >
                          <div className="flex flex-col gap-0.5">
                            <div className="text-[10px] font-black leading-none truncate flex items-center gap-1">
                              {appt.package_id && (
                                <PackageIcon className="h-2.5 w-2.5" />
                              )}
                              {appt.clientName.split(" ")[0]}
                            </div>
                            <div className="text-[8px] font-bold opacity-70 truncate uppercase tracking-tighter">
                              {appt.service}
                            </div>
                          </div>

                          <div className="mt-auto pt-1 border-t border-black/5 flex justify-between items-center">
                            <span className="text-[9px] font-black opacity-80">
                              {appt.time}
                            </span>
                          </div>
                        </div>
                      );
                    })}
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

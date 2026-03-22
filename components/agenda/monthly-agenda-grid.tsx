// components/agenda/monthly-agenda-grid.tsx
"use client";

import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday as isDateToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Appointment } from "./daily-agenda-grid";
import {
  Clock,
  User,
  Package as PackageIcon,
  ChevronRight,
} from "lucide-react";
import { Button } from "../ui/button";

interface MonthlyAgendaGridProps {
  appointments: Appointment[];
  currentDate: Date;
  onAppointmentClick: (appointment: Appointment) => void;
  onDayClick?: (day: Date) => void;
}

export function MonthlyAgendaGrid({
  appointments,
  currentDate,
  onAppointmentClick,
  onDayClick,
}: MonthlyAgendaGridProps) {
  const [activeDate, setActiveDate] = useState<Date>(currentDate || new Date());

  // 🔥 OTIMIZAÇÃO: Agrupa todos os agendamentos do mês por data uma única vez
  const groupedData = useMemo(() => {
    const groups: Record<string, Appointment[]> = {};
    appointments.forEach((appt) => {
      const dateKey = format(
        new Date(appt.date_time || new Date()),
        "yyyy-MM-dd",
      );
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(appt);
    });
    return groups;
  }, [appointments]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDaysHeaders = ["D", "S", "T", "Q", "Q", "S", "S"];

  // Dados para a Timeline Mobile
  const activeDayKey = format(activeDate, "yyyy-MM-dd");
  const activeDayAppointments = [...(groupedData[activeDayKey] || [])].sort(
    (a, b) => a.time.localeCompare(b.time),
  );

  const MAX_APPTS_PER_DAY = 8; // Sua regra de negócio para o anel completo
  const MAX_DESKTOP_APPTS = 5;

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      {/* ========================================== */}
      {/* VISÃO MOBILE (Com o seu Anel de Volume)    */}
      {/* ========================================== */}
      <div className="flex flex-col h-full md:hidden gap-4">
        <div className="bg-card rounded-3xl border border-border/50 shadow-sm p-5 shrink-0">
          <div className="grid grid-cols-7 mb-4">
            {weekDaysHeaders.map((day, i) => (
              <div
                key={`mob-h-${i}`}
                className="text-center text-[10px] font-black uppercase text-muted-foreground/40"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-4 gap-x-2">
            {calendarDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayAppts = groupedData[dateKey] || [];
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isActive = isSameDay(day, activeDate);
              const isToday = isDateToday(day);

              // 🔥 LÓGICA DO SEU ANEL DE VOLUME (SVG)
              const fillPercentage = Math.min(
                (dayAppts.length / MAX_APPTS_PER_DAY) * 100,
                100,
              );
              const radius = 16;
              const circ = 2 * Math.PI * radius;
              const dash = (fillPercentage / 100) * circ;

              return (
                <button
                  key={`mob-day-${day.toISOString()}`}
                  onClick={() => setActiveDate(day)}
                  className="relative aspect-square flex items-center justify-center group"
                >
                  {/* O ANEL SVG VOLTOU! */}
                  {dayAppts.length > 0 && !isActive && (
                    <svg
                      className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-0.5"
                      viewBox="0 0 36 36"
                    >
                      <circle
                        cx="18"
                        cy="18"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="2.5"
                        fill="none"
                        className="text-primary/10"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="2.5"
                        fill="none"
                        className="text-primary transition-all duration-700 ease-out"
                        strokeDasharray={`${dash} ${circ}`}
                        strokeLinecap="round"
                      />
                    </svg>
                  )}

                  <span
                    className={cn(
                      "text-sm font-bold z-10 flex items-center justify-center w-8 h-8 rounded-full transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg scale-110"
                        : isToday
                          ? "text-primary ring-1 ring-primary/30"
                          : !isCurrentMonth
                            ? "text-muted-foreground/30"
                            : "text-foreground",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeline do Dia Selecionado (Otimizada) */}
        <div className="flex-1 bg-card rounded-3xl border border-border/50 shadow-sm p-5 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-black text-foreground uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-4 bg-primary rounded-full" />
              {format(activeDate, "EEEE, dd 'de' MMM", { locale: ptBR })}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDayClick?.(activeDate)}
              className="text-primary font-bold text-[10px] h-7 px-2 uppercase tracking-tighter"
            >
              Ver dia completo <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
            {activeDayAppointments.length === 0 ? (
              <div className="py-10 flex flex-col items-center text-muted-foreground/40">
                <Clock className="w-8 h-8 mb-2 stroke-1" />
                <p className="text-[10px] font-black uppercase tracking-widest text-center">
                  Nenhum atendimento
                  <br />
                  neste dia
                </p>
              </div>
            ) : (
              activeDayAppointments.map((appt) => (
                <div
                  key={appt.id}
                  onClick={() => onAppointmentClick(appt)}
                  className={cn(
                    "flex items-center gap-4 p-3 rounded-2xl border border-border/30 transition-all active:scale-[0.97]",
                    appt.color,
                  )}
                >
                  <div className="flex flex-col items-center justify-center w-11 shrink-0 border-r border-black/5 pr-3">
                    <span className="text-[11px] font-black">{appt.time}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black truncate">
                      {appt.clientName}
                    </p>
                    <p className="text-[9px] font-bold opacity-70 truncate uppercase tracking-tighter">
                      {appt.service}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* VISÃO DESKTOP (Grid Fluida)                */}
      {/* ========================================== */}
      <div className="hidden md:flex flex-col bg-card rounded-3xl border border-border/50 overflow-hidden shadow-sm h-full">
        <div className="grid grid-cols-7 bg-muted/30 border-b border-border/50">
          {weekDaysHeaders.map((day, i) => (
            <div
              key={`desk-h-${i}`}
              className="text-center py-3 text-[10px] font-black uppercase text-muted-foreground/60"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 auto-rows-fr flex-1">
          {calendarDays.map((day, idx) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayAppts = groupedData[dateKey] || [];
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isDateToday(day);

            const visibleAppts = [...dayAppts]
              .sort((a, b) => a.time.localeCompare(b.time))
              .slice(0, MAX_DESKTOP_APPTS);
            const hiddenCount = dayAppts.length - MAX_DESKTOP_APPTS;

            return (
              <div
                key={`desk-day-${day.toISOString()}`}
                onClick={() => onDayClick?.(day)}
                className={cn(
                  "min-h-30 p-2 border-r border-b border-border/40 flex flex-col gap-1.5 relative group cursor-pointer transition-colors",
                  (idx + 1) % 7 === 0 && "border-r-0",
                  !isCurrentMonth && "bg-muted/3 opacity-40 grayscale",
                  isToday && "bg-primary/3",
                  isCurrentMonth && "hover:bg-muted/10",
                )}
              >
                <div className="flex justify-between items-center mb-1">
                  <span
                    className={cn(
                      "text-xs font-black h-6 w-6 flex items-center justify-center rounded-full",
                      isToday
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : isCurrentMonth
                          ? "text-foreground"
                          : "text-muted-foreground",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                </div>

                <div className="flex flex-col gap-1 overflow-hidden">
                  {visibleAppts.map((appt) => (
                    <div
                      key={appt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppointmentClick(appt);
                      }}
                      className={cn(
                        "text-[9px] font-bold leading-none px-2 py-1.5 rounded-lg truncate border shadow-sm transition-transform hover:scale-[1.03]",
                        appt.color ||
                          "bg-blue-100 border-blue-200 text-blue-900",
                      )}
                    >
                      <span className="opacity-70 mr-1 font-black">
                        {appt.time}
                      </span>
                      {appt.clientName.split(" ")[0]}
                    </div>
                  ))}
                  {hiddenCount > 0 && (
                    <div className="text-[9px] font-black text-center text-primary/70 bg-primary/5 py-1 rounded-md mt-0.5 border border-primary/10">
                      + {hiddenCount} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

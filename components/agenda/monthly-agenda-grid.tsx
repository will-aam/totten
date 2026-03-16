// components/agenda/monthly-agenda-grid.tsx
"use client";

import { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Appointment } from "./daily-agenda-grid";
import { Clock, User } from "lucide-react";

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

  useEffect(() => {
    if (currentDate) {
      if (isSameMonth(currentDate, new Date())) {
        setActiveDate(new Date());
      } else {
        setActiveDate(startOfMonth(currentDate));
      }
    }
  }, [currentDate]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Domingo
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const weekDaysHeaders = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const activeDayAppointments = appointments.filter((appt) =>
    isSameDay(new Date(appt.date_time || new Date()), activeDate),
  );
  activeDayAppointments.sort((a, b) => a.time.localeCompare(b.time));

  const MAX_APPTS_PER_DAY = 8;

  // 🔥 Limite de agendamentos no Desktop antes de mostrar o "+X"
  const MAX_DESKTOP_APPTS = 7;

  return (
    <>
      {/* ========================================== */}
      {/* VISÃO MOBILE: Calendário Limpo + Linha do Tempo */}
      {/* ========================================== */}
      <div className="flex flex-col h-full md:hidden">
        {/* Calendário Superior */}
        <div className="bg-card rounded-3xl border border-border/50 shadow-sm p-4 mb-4 shrink-0">
          <div className="grid grid-cols-7 mb-2">
            {weekDaysHeaders.map((day) => (
              <div
                key={`mob-header-${day}`}
                className="text-center text-[10px] font-black uppercase tracking-wider text-muted-foreground"
              >
                {day.charAt(0)}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-2 gap-x-1">
            {calendarDays.map((day) => {
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isActive = isSameDay(day, activeDate);
              const isToday = isSameDay(day, new Date());

              const dayAppts = appointments.filter((appt) =>
                isSameDay(new Date(appt.date_time || new Date()), day),
              );

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
                  className="relative aspect-square flex items-center justify-center rounded-full transition-all"
                >
                  {dayAppts.length > 0 && !isActive && (
                    <svg
                      className="absolute inset-0 w-full h-full p-0.5 -rotate-90 pointer-events-none"
                      viewBox="0 0 36 36"
                    >
                      <circle
                        cx="18"
                        cy="18"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        className="text-primary/10"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        className="text-primary transition-all duration-1000 ease-out"
                        strokeDasharray={`${dash} ${circ}`}
                      />
                    </svg>
                  )}

                  <span
                    className={cn(
                      "text-sm font-bold z-10 flex items-center justify-center w-8 h-8 rounded-full transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg scale-110"
                        : isToday
                          ? "text-primary font-black"
                          : !isCurrentMonth
                            ? "text-muted-foreground/40"
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

        {/* Linha do Tempo Inferior (Timeline) */}
        <div className="flex-1 bg-card rounded-3xl border border-border/50 shadow-sm p-4 overflow-hidden flex flex-col">
          <h3 className="text-sm font-black text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            {format(activeDate, "EEEE, dd 'de' MMM", { locale: ptBR })}
          </h3>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col">
            {activeDayAppointments.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-60">
                <Clock className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm font-medium">Dia livre!</p>
                <p className="text-xs">Nenhum agendamento.</p>
              </div>
            ) : (
              <div className="flex flex-col pb-4">
                {activeDayAppointments.map((appt, idx) => (
                  <div
                    key={appt.id}
                    className="flex gap-4 relative group cursor-pointer"
                    onClick={() => onAppointmentClick(appt)}
                  >
                    {idx !== activeDayAppointments.length - 1 && (
                      <div className="absolute left-9.75op-6 -bottom-6 w-0.5 bg-border/50 group-hover:bg-primary/30 transition-colors" />
                    )}

                    <div className="flex items-start gap-3 w-14 shrink-0 pt-1">
                      <span className="text-xs font-bold text-foreground">
                        {appt.time}
                      </span>
                      <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1 shadow-[0_0_0_3px_var(--bg-card)] shrink-0 z-10" />
                    </div>

                    <div
                      className={cn(
                        "flex-1 mb-4 rounded-2xl p-3 border transition-all active:scale-[0.98]",
                        appt.color ||
                          "bg-blue-100 border-blue-200 text-blue-900",
                      )}
                    >
                      <div className="font-bold text-sm mb-0.5 line-clamp-1 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 opacity-70" />
                        {appt.clientName}
                      </div>
                      <div className="text-xs font-medium opacity-80 line-clamp-1">
                        {appt.service}
                      </div>
                      <div className="mt-2 text-[10px] font-black uppercase tracking-wider opacity-60 bg-black/5 w-fit px-2 py-0.5 rounded-md">
                        {appt.sessionInfo}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* VISÃO DESKTOP: Grade Clássica (Pílulas) */}
      {/* ========================================== */}
      <div className="hidden md:flex flex-col bg-card rounded-3xl border border-border/50 overflow-hidden shadow-sm h-full">
        <div className="grid grid-cols-7 bg-muted/20 border-b border-border/50">
          {weekDaysHeaders.map((day) => (
            <div
              key={`desk-header-${day}`}
              className="text-center py-3 text-xs font-bold uppercase text-muted-foreground border-r border-border/50 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 auto-rows-fr flex-1">
          {calendarDays.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());

            const dayAppointments = appointments.filter((appt) =>
              isSameDay(new Date(appt.date_time || new Date()), day),
            );
            dayAppointments.sort((a, b) => a.time.localeCompare(b.time));

            // 🔥 Regra do +X (Separa os visíveis dos ocultos)
            const visibleAppts = dayAppointments.slice(0, MAX_DESKTOP_APPTS);
            const hiddenCount = dayAppointments.length - MAX_DESKTOP_APPTS;

            return (
              <div
                key={`desk-day-${day.toISOString()}`}
                onClick={() => onDayClick?.(day)}
                className={cn(
                  "min-h-30 p-2 border-r border-b border-border/50 flex flex-col gap-1 relative group cursor-pointer hover:bg-muted/10 transition-colors",
                  (idx + 1) % 7 === 0 && "border-r-0",
                  !isCurrentMonth && "bg-muted/5 opacity-60",
                  isToday && "bg-primary/5",
                )}
              >
                <div className="flex justify-between items-center px-1 mb-1">
                  <span
                    className={cn(
                      "text-sm font-semibold flex items-center justify-center h-7 w-7 rounded-full",
                      isToday
                        ? "bg-primary text-primary-foreground shadow-md"
                        : isCurrentMonth
                          ? "text-foreground"
                          : "text-muted-foreground",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                </div>

                {/* 🔥 Removido o overflow-y-auto, agora ele corta (overflow-hidden) */}
                <div className="flex flex-col gap-1 flex-1 overflow-hidden pr-0.5 pb-1">
                  {visibleAppts.map((appt) => (
                    <div
                      key={appt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppointmentClick(appt);
                      }}
                      className={cn(
                        "text-[10px] leading-tight px-1.5 py-1.5 rounded-md truncate cursor-pointer transition-transform hover:scale-[1.02] border shadow-sm",
                        appt.color ||
                          "bg-blue-100 border-blue-200 text-blue-900",
                      )}
                      title={`${appt.time} - ${appt.clientName} (${appt.service})`}
                    >
                      <span className="font-bold opacity-80 mr-1">
                        {appt.time}
                      </span>
                      <span className="font-semibold">
                        {appt.clientName.split(" ")[0]}
                      </span>
                    </div>
                  ))}

                  {/* 🔥 Botão "+X mais" que redireciona para a visão do dia */}
                  {hiddenCount > 0 && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onDayClick?.(day);
                      }}
                      className="text-[10px] font-bold text-center text-muted-foreground hover:text-primary hover:bg-primary/10 mt-1 py-1 rounded-md cursor-pointer transition-colors"
                    >
                      +{hiddenCount} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

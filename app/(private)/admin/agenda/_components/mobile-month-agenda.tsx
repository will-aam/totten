// app/(private)/admin/agenda/_components/mobile-month-agenda.tsx
"use client";

import React, { useMemo } from "react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Appointment, AppointmentCardContent } from "./appointment-card";
import { cn } from "@/lib/utils";

interface MobileMonthAgendaProps {
  appointments: Appointment[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onAppointmentClick: (appt: Appointment) => void;
}

export function MobileMonthAgenda({
  appointments,
  selectedDate,
  onSelectDate,
  onAppointmentClick,
}: MobileMonthAgendaProps) {
  // Get appointments for the currently selected day
  const dailyAppointments = useMemo(() => {
    return appointments
      .filter((appt) => {
        const d = new Date(appt.date_time || new Date());
        return isSameDay(d, selectedDate);
      })
      .sort((a, b) => {
        const da = new Date(a.date_time || new Date());
        const db = new Date(b.date_time || new Date());
        return da.getTime() - db.getTime();
      });
  }, [appointments, selectedDate]);

  // Create a map of date (YYYY-MM-DD) to appointment count
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, number>();
    appointments.forEach((appt) => {
      const d = new Date(appt.date_time || new Date());
      const dateKey = format(d, "yyyy-MM-dd");
      map.set(dateKey, (map.get(dateKey) || 0) + 1);
    });
    return map;
  }, [appointments]);

  return (
    <div className="flex flex-col h-full w-full bg-background md:hidden absolute inset-0 overflow-y-auto">
      <div className="flex-none flex justify-center p-4 border-b">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date) onSelectDate(date);
          }}
          locale={ptBR}
          className="bg-card rounded-2xl shadow-sm border border-border/50"
          classNames={{
            // Remove o fundo quadrado cinza (bg-accent) do dia atual no <td>
            today: "!bg-transparent text-accent-foreground font-bold",
            day: "relative w-full h-full p-0 text-center flex items-center justify-center focus-within:relative focus-within:z-20",
          }}
          components={{
            DayButton: (props) => {
              const { day, modifiers, ...buttonProps } = props;
              const dateKey = format(day.date, "yyyy-MM-dd");
              const count = appointmentsByDate.get(dateKey) || 0;

              // Determinar o estilo do anel baseado no volume
              let ringClass = "";
              if (count > 0 && count <= 2) ringClass = "border-b-2 border-primary"; // 25%
              else if (count > 2 && count <= 4) ringClass = "border-b-2 border-l-2 border-primary"; // 50%
              else if (count > 4 && count <= 6) ringClass = "border-b-2 border-l-2 border-t-2 border-primary"; // 75%
              else if (count > 6) ringClass = "border-2 border-primary"; // 100%

              // Remove the default background from buttonProps to avoid the gray square
              const { className: _bgClass, ...restProps } = buttonProps as any;

              return (
                <button
                  {...restProps}
                  className={cn(
                    "relative flex items-center justify-center rounded-full transition-all m-1 size-10 text-sm",
                    modifiers.selected
                      ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/40 hover:bg-primary/90"
                      : "hover:bg-muted text-foreground",
                    !modifiers.selected && ringClass,
                    modifiers.outside ? "opacity-40" : "",
                    modifiers.today && !modifiers.selected ? "text-primary font-bold" : ""
                  )}
                >
                  <span className="z-10">{format(day.date, "d")}</span>
                </button>
              );
            },
          }}
        />
      </div>

      <div className="flex-1 p-4 space-y-3">
        <h3 className="font-semibold text-lg text-foreground mb-4">
          {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </h3>

        {dailyAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-center">
            <p>Nenhum agendamento para este dia.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-border/30 ml-3 space-y-6 pb-4 mt-2">
            {dailyAppointments.map((appt) => {
              const timeString = format(new Date(appt.date_time!), "HH:mm");
              return (
                <div
                  key={appt.id}
                  onClick={() => onAppointmentClick(appt)}
                  className="relative pl-6 cursor-pointer group"
                >
                  {/* Ponto / Marcador da Timeline */}
                  <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background transition-transform duration-300 group-hover:scale-150" />
                  
                  {/* Hora do Agendamento */}
                  <div className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground/80">
                    {timeString}
                  </div>
                  
                  {/* Reutilizando o card nativo que já existe! */}
                  <div className="relative border border-border/50 rounded-2xl overflow-hidden shadow-sm bg-card hover:border-primary/40 transition-all group-hover:shadow-md h-24">
                    <AppointmentCardContent
                      appt={appt}
                      height={96} // Altura fixa para a lista
                      isCancelled={appt.status?.toUpperCase() === "CANCELADO"}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

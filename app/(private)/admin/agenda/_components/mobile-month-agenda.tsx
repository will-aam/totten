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
    <div className="flex flex-col h-full w-full bg-background md:hidden">
      <div className="flex-none flex justify-center p-4 border-b">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date) onSelectDate(date);
          }}
          locale={ptBR}
          className="bg-card rounded-2xl shadow-sm border border-border/50"
          components={{
            DayButton: (props) => {
              const { day, modifiers, ...buttonProps } = props;
              const dateKey = format(day.date, "yyyy-MM-dd");
              const count = appointmentsByDate.get(dateKey) || 0;

              // Determinar o estilo do anel baseado no volume
              let ringClass = "";
              if (count > 0 && count <= 3) ringClass = "border-2 border-primary/40";
              else if (count > 3 && count <= 6) ringClass = "border-2 border-primary/70";
              else if (count > 6) ringClass = "border-[3px] border-primary";

              return (
                <button
                  {...buttonProps}
                  className={cn(
                    buttonProps.className,
                    "relative flex items-center justify-center rounded-full transition-all m-1 size-10",
                    modifiers.selected
                      ? "bg-primary text-primary-foreground font-bold hover:bg-primary/90"
                      : "hover:bg-muted text-foreground",
                    !modifiers.selected && ringClass
                  )}
                >
                  <span className="z-10">{format(day.date, "d")}</span>
                </button>
              );
            },
          }}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <h3 className="font-semibold text-lg text-foreground mb-4">
          {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </h3>

        {dailyAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-center">
            <p>Nenhum agendamento para este dia.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {dailyAppointments.map((appt) => (
              <div
                key={appt.id}
                onClick={() => onAppointmentClick(appt)}
                className="cursor-pointer"
              >
                {/* Reutilizando o card nativo que já existe! */}
                <div className="relative border rounded-lg overflow-hidden shadow-sm bg-card hover:border-primary/50 transition-colors h-24">
                  <AppointmentCardContent
                    appt={appt}
                    height={96} // Altura fixa para a lista
                    isCancelled={appt.status?.toUpperCase() === "CANCELADO"}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

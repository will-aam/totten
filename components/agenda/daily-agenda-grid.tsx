"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle, Repeat, Clock, AlertCircle, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// --- CONFIGURAÇÕES DA NOSSA GRADE ---
const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 19;
const HOUR_HEIGHT = 96;

export interface Appointment {
  id: string;
  time: string;
  duration: number;
  clientName: string;
  service: string;
  sessionInfo: string;
  isRecurring: boolean;
  phone: string;
  color: string;
  hasCharge?: boolean;
  status?: string;
  checkInTime?: string | Date | null;
}

interface DailyAgendaGridProps {
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
  startHour?: number;
  endHour?: number;
}

export function DailyAgendaGrid({
  appointments,
  onAppointmentClick,
  startHour = DEFAULT_START_HOUR,
  endHour = DEFAULT_END_HOUR,
}: DailyAgendaGridProps) {
  const HOURS = Array.from(
    { length: endHour - startHour + 1 },
    (_, i) => i + startHour,
  );

  const calculatePosition = (timeStr: string, durationMinutes: number) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const timeInMinutes = hours * 60 + minutes;
    const startOffsetMinutes = startHour * 60;

    const top = ((timeInMinutes - startOffsetMinutes) / 60) * HOUR_HEIGHT;
    const height = (durationMinutes / 60) * HOUR_HEIGHT;

    return { top, height };
  };

  const calculateEndTime = (start: string, duration: number) => {
    const [h, m] = start.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m + duration);
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  };

  const handleConfirmWhatsApp = (e: React.MouseEvent, appt: Appointment) => {
    e.stopPropagation();
    const firstName = appt.clientName.split(" ")[0];
    const isLastSession = appt.sessionInfo?.match(/Sessão (\d+) de \1/i);
    let message = isLastSession
      ? `Olá ${firstName}! 🎉 Hoje às ${appt.time} finalizamos seu pacote! Te espero lá. 💆‍♀️✨`
      : `Olá ${firstName}! Confirmado nossa sessão amanhã às ${appt.time}? 💆‍♀️✨`;

    window.open(
      `https://wa.me/${appt.phone}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
    toast.success("WhatsApp aberto!");
  };

  return (
    <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-y-auto max-h-150 relative w-full scroll-smooth">
        <div className="flex relative min-w-150">
          {/* COLUNA ESQUERDA: Horas */}
          <div className="w-20 shrink-0 border-r border-border/50 bg-muted/10 relative z-20">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="h-24 relative flex justify-center border-b border-border/30 last:border-0"
              >
                <span className="absolute -top-3 bg-card px-1 text-xs font-semibold text-muted-foreground">
                  {hour.toString().padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>

          {/* COLUNA DIREITA: Cards */}
          <div className="flex-1 relative bg-grid-pattern">
            {HOURS.map((hour) => (
              <div
                key={`grid-${hour}`}
                className="h-24 border-b border-border/30 w-full"
              />
            ))}

            <div className="absolute top-0 left-0 right-0 bottom-0 p-2">
              {appointments.map((appt) => {
                const { top, height } = calculatePosition(
                  appt.time,
                  appt.duration,
                );
                // Verifica se o status é cancelado (considerando o Enum do Prisma que enviamos na Action)
                const isCancelled =
                  appt.status === "CANCELADO" || appt.status === "cancelado";

                return (
                  <div
                    key={appt.id}
                    onClick={() => onAppointmentClick(appt)}
                    className={cn(
                      "absolute left-2 right-4 ml-1 md:ml-4 rounded-xl border p-3 flex flex-col shadow-sm transition-all hover:scale-[1.01] hover:shadow-md cursor-pointer group overflow-hidden",
                      appt.color,
                      appt.hasCharge &&
                        !isCancelled &&
                        "border-2 border-destructive shadow-lg ring-1 ring-destructive/20",
                      // Estilo de Cancelado: opacidade baixa, escala de cinza e borda tracejada
                      isCancelled &&
                        "opacity-40 grayscale-[0.8] border-dashed border-muted-foreground/50 shadow-none hover:scale-100",
                    )}
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      zIndex: 10,
                    }}
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className="flex flex-col truncate pr-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "font-bold text-sm md:text-base leading-none truncate",
                              isCancelled && "line-through decoration-2", // Risco no nome
                            )}
                          >
                            {appt.clientName}
                          </span>
                          <div className="flex items-center gap-1">
                            {isCancelled ? (
                              <Ban className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <>
                                {appt.isRecurring && (
                                  <Repeat className="h-3 w-3 opacity-60" />
                                )}
                                {appt.hasCharge && (
                                  <AlertCircle className="h-3.5 w-3.5 text-destructive animate-pulse" />
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-medium opacity-80 mt-1.5 truncate">
                          {appt.service}
                        </span>
                      </div>

                      {!isCancelled && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => handleConfirmWhatsApp(e, appt)}
                          className="h-8 w-8 rounded-full bg-white/40 hover:bg-white/80 text-emerald-700 shrink-0 shadow-sm transition-all"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="mt-auto flex items-center gap-3 text-xs font-medium opacity-70 pt-2 border-t border-black/5">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {appt.time} -{" "}
                        {calculateEndTime(appt.time, appt.duration)}
                      </span>
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/30 text-[10px] uppercase font-bold tracking-wider">
                        {isCancelled ? "Cancelado" : appt.sessionInfo}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

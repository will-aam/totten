"use client";

import React, { useMemo, useEffect, useState } from "react";
import { format, addDays, isSameDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Appointment } from "./daily-agenda-grid";
import {
  Clock,
  Package as PackageIcon,
  AlertTriangle,
  User,
  DotsVerticalRounded,
  MessageCircle,
  Check,
  InfoCircle,
  Lock,
} from "@boxicons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface WeeklyAgendaGridProps {
  appointments: Appointment[];
  weekStart: Date;
  onAppointmentClick: (appointment: Appointment) => void;
  startHour?: number;
  endHour?: number;
  onQuickConfirm?: (appt: Appointment) => void;
}

const HOUR_HEIGHT = 96;

const cleanPhone = (phone: string) => {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
};

export function WeeklyAgendaGrid({
  appointments,
  weekStart,
  onAppointmentClick,
  startHour = 8,
  endHour = 19,
  onQuickConfirm,
}: WeeklyAgendaGridProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
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

  // 🔥 ALTURA VISUAL FIXA DE 25 MINUTOS PARA CANCELADOS
  const getAppointmentStyle = (
    appt: Appointment,
    layout: { width: string; left: string },
  ) => {
    const date = new Date(appt.date_time || new Date());
    const apptHour = date.getHours();
    const apptMinute = date.getMinutes();

    const startH = Math.max(startHour, Math.min(apptHour, endHour));
    const top =
      (startH - startHour) * HOUR_HEIGHT + (apptMinute / 60) * HOUR_HEIGHT;

    const isCancelled = appt.status?.toUpperCase() === "CANCELADO";
    const effectiveDuration = isCancelled ? 25 : appt.duration;
    const height = (effectiveDuration / 60) * HOUR_HEIGHT;

    return {
      top: `${top}px`,
      height: `${height}px`,
      minHeight: "24px",
      width: layout.width,
      left: layout.left,
    };
  };

  const currentTimeTop = useMemo(() => {
    const h = now.getHours();
    const m = now.getMinutes();
    if (h < startHour || h >= endHour) return null;

    const HEADER_OFFSET = 56;
    return (
      HEADER_OFFSET + (h - startHour) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT
    );
  }, [now, startHour, endHour]);

  return (
    <div className="flex flex-col bg-card rounded-3xl border border-border/50 overflow-hidden shadow-sm animate-in fade-in duration-500">
      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-200 flex relative">
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

          <div className="flex flex-1 relative">
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

              const sortedAppts = [...dayAppointments].sort(
                (a, b) =>
                  new Date(a.date_time || new Date()).getTime() -
                  new Date(b.date_time || new Date()).getTime(),
              );

              const columns: {
                appt: Appointment;
                start: number;
                end: number;
              }[][] = [];

              sortedAppts.forEach((appt) => {
                const start = new Date(appt.date_time || new Date()).getTime();
                const isCancelled = appt.status?.toUpperCase() === "CANCELADO";
                const effectiveDuration = isCancelled ? 25 : appt.duration;
                const end = start + effectiveDuration * 60000;

                let placed = false;
                for (let i = 0; i < columns.length; i++) {
                  const lastInCol = columns[i][columns[i].length - 1];
                  if (lastInCol.end <= start) {
                    columns[i].push({ appt, start, end });
                    placed = true;
                    break;
                  }
                }
                if (!placed) {
                  columns.push([{ appt, start, end }]);
                }
              });

              const numColumns = columns.length || 1;
              const positionedAppts: {
                appt: Appointment;
                layout: { width: string; left: string };
              }[] = [];

              columns.forEach((col, colIndex) => {
                col.forEach(({ appt }) => {
                  positionedAppts.push({
                    appt,
                    layout: {
                      width: `calc(${100 / numColumns}% - 4px)`,
                      left: `calc(${(100 / numColumns) * colIndex}% + 2px)`,
                    },
                  });
                });
              });

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "flex-1 min-w-27.5 relative border-r border-border/50 last:border-r-0 transition-colors",
                    today ? "bg-primary/5" : "hover:bg-muted/20",
                  )}
                >
                  <div
                    className={cn(
                      "h-14 border-b border-border/50 flex flex-col items-center justify-center sticky top-0 z-20 transition-colors backdrop-blur-md",
                      today ? "bg-primary/10" : "bg-card/80",
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

                  <div className="relative bg-grid-pattern-subtle">
                    {hours.map((hour) => (
                      <div
                        key={`grid-cell-${dateKey}-${hour}`}
                        className="h-24 border-b border-border/5 w-full relative"
                      >
                        <div className="absolute top-1/2 w-full border-t border-dotted border-border/5" />
                      </div>
                    ))}

                    {positionedAppts.map(({ appt, layout }) => {
                      const isCancelled =
                        appt.status?.toUpperCase() === "CANCELADO";
                      const isRealizado =
                        appt.status?.toUpperCase() === "REALIZADO";
                      const isPackageArchived =
                        appt.package && appt.package.active === false;
                      const paymentMethod =
                        appt.payment_method || appt.paymentMethod;
                      const isPaid =
                        !!paymentMethod && paymentMethod !== "nenhum";

                      const isLocked = isCancelled || isRealizado || isPaid;
                      const profName = (appt as any).professionalName;

                      // 🔥 VISUAL ULTRA COMPACTO SE CANCELADO
                      if (isCancelled) {
                        return (
                          <div
                            key={appt.id}
                            onClick={() => onAppointmentClick(appt)}
                            className={cn(
                              "absolute rounded-lg px-2 py-1 cursor-pointer transition-all hover:scale-[1.03] hover:z-50 shadow-sm border border-dashed flex flex-col justify-center overflow-hidden",
                              appt.color,
                              "opacity-50 grayscale border-dashed",
                            )}
                            style={getAppointmentStyle(appt, layout)}
                          >
                            <div className="flex items-center gap-1 w-full overflow-hidden">
                              <Lock className="h-3 w-3 shrink-0 opacity-60" />
                              <span className="text-[10px] font-black truncate line-through opacity-80">
                                {appt.clientName.split(" ")[0]}
                              </span>
                            </div>
                            <div className="text-[9px] font-bold opacity-70 mt-0.5">
                              {appt.time}
                            </div>
                          </div>
                        );
                      }

                      // VISUAL NORMAL (NÃO CANCELADO)
                      return (
                        <div
                          key={appt.id}
                          onClick={() => onAppointmentClick(appt)}
                          className={cn(
                            "absolute rounded-lg p-1.5 cursor-pointer transition-all hover:scale-[1.03] hover:z-50 shadow-sm border flex flex-col justify-between group overflow-hidden",
                            appt.color,
                            isPackageArchived &&
                              "border border-destructive/80 opacity-80",
                          )}
                          style={getAppointmentStyle(appt, layout)}
                        >
                          <div className="absolute top-0.5 right-0.5 z-50">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-5 w-5 bg-transparent hover:bg-black/5 text-black/50 hover:text-black shadow-none border-none p-0 m-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <DotsVerticalRounded className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-48 z-100 rounded-xl"
                              >
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAppointmentClick(appt);
                                  }}
                                  className="font-medium"
                                >
                                  <InfoCircle className="mr-2 h-4 w-4" />
                                  Detalhes da Sessão
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                {!isLocked &&
                                  appt.status?.toUpperCase() !==
                                    "CONFIRMADO" && (
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (onQuickConfirm)
                                          onQuickConfirm(appt);
                                      }}
                                      className="text-blue-600 focus:text-blue-700 font-medium"
                                    >
                                      <Check className="mr-2 h-4 w-4" /> Marcar
                                      Confirmado
                                    </DropdownMenuItem>
                                  )}

                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const msg = encodeURIComponent(
                                      `Olá ${appt.clientName.split(" ")[0]}! Confirmamos seu horário às ${appt.time}?`,
                                    );
                                    window.open(
                                      `https://wa.me/${cleanPhone(appt.phone)}?text=${msg}`,
                                      "_blank",
                                    );
                                  }}
                                  className="text-emerald-600 focus:text-emerald-700 font-medium"
                                >
                                  <MessageCircle className="mr-2 h-4 w-4" />
                                  Enviar WhatsApp
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="flex flex-col gap-0.5 pr-4">
                            <div
                              className={cn(
                                "text-[10px] font-black leading-none truncate flex items-center gap-1",
                                isPackageArchived && "line-through opacity-70",
                              )}
                            >
                              {!isPackageArchived && appt.package_id && (
                                <PackageIcon className="h-2.5 w-2.5" />
                              )}
                              {isPackageArchived && (
                                <AlertTriangle className="h-2.5 w-2.5 text-destructive" />
                              )}
                              {appt.clientName.split(" ")[0]}
                            </div>

                            <div className="text-[8px] font-bold opacity-70 truncate uppercase tracking-tighter">
                              {appt.service}
                            </div>

                            {profName && (
                              <div className="flex items-center gap-0.5 mt-0.5 bg-background/30 w-fit px-1 py-0.5 rounded-[3px] text-[8px] font-semibold text-foreground/80 backdrop-blur-sm">
                                <User className="h-2 w-2" />
                                <span className="truncate max-w-12.5">
                                  {profName.split(" ")[0]}
                                </span>
                              </div>
                            )}
                          </div>

                          {(appt.duration / 60) * HOUR_HEIGHT > 30 && (
                            <div className="mt-auto pt-1 border-t border-black/5 flex justify-between items-center">
                              <span className="text-[9px] font-black opacity-80">
                                {appt.time}
                              </span>
                            </div>
                          )}
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

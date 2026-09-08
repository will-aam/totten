// components/agenda/weekly-agenda-grid.tsx
"use client";

import React, { useMemo, useEffect, useState } from "react";
import { format, addDays, isSameDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragMoveEvent,
  useDroppable,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  restrictToVerticalAxis,
  restrictToFirstScrollableAncestor,
} from "@dnd-kit/modifiers";
import { Clock, LoaderDots, Plus, Lock } from "@boxicons/react";
import { toast } from "sonner";
import { updateAppointmentDateTime } from "@/app/actions/appointments";

import {
  Appointment,
  DraggableAppointmentCard,
  AppointmentCardContent,
  cleanPhone,
} from "./appointment-card";

function DroppableDayColumn({
  dateKey,
  children,
  className,
}: {
  dateKey: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { setNodeRef } = useDroppable({ id: dateKey });
  return (
    <div ref={setNodeRef} className={className}>
      {children}
    </div>
  );
}

interface WeeklyAgendaGridProps {
  appointments: Appointment[];
  weekStart: Date;
  onAppointmentClick: (appointment: Appointment) => void;
  startHour?: number;
  endHour?: number;
  onEmptySlotClick?: (time: string) => void;
  scheduleBlocks?: any[];
  onQuickConfirm?: (appt: Appointment) => void;
}

const HOUR_HEIGHT = 96;

export function WeeklyAgendaGrid({
  appointments,
  weekStart,
  onAppointmentClick,
  startHour = 8,
  endHour = 20,
  onQuickConfirm,
  onEmptySlotClick,
  scheduleBlocks = [],
}: WeeklyAgendaGridProps) {
  const [now, setNow] = useState(new Date());

  const [isMoving, setIsMoving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragTime, setDragTime] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  );

  const { setNodeRef: setDroppableRef } = useDroppable({ id: "agenda-grid" });

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const hours = useMemo(
    () =>
      Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i),
    [startHour, endHour],
  );

  const weekStartMs = weekStart.getTime();

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => addDays(new Date(weekStartMs), i)),
    [weekStartMs],
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

  const calculatePosition = (appt: Appointment) => {
    const date = new Date(appt.date_time || new Date());
    const apptHour = date.getHours();
    const apptMinute = date.getMinutes();

    const startH = Math.max(startHour, Math.min(apptHour, endHour));
    const top =
      (startH - startHour) * HOUR_HEIGHT + (apptMinute / 60) * HOUR_HEIGHT;

    const isCancelled = appt.status?.toUpperCase() === "CANCELADO";
    const effectiveDuration = isCancelled ? 25 : appt.duration;
    const height = (effectiveDuration / 60) * HOUR_HEIGHT;

    return { top, height };
  };

  const getAppointmentStyle = (
    appt: Appointment,
    layout: { width: string; left: string },
  ) => {
    const { top, height } = calculatePosition(appt);
    return {
      top: `${top}px`,
      height: `${height}px`,
      minHeight: "24px",
      width: layout.width,
      left: layout.left,
    };
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    const appt = event.active.data.current as Appointment;
    setDragTime(appt.time);
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const { active, delta } = event;
    const appt = active.data.current as Appointment;
    const pos = calculatePosition(appt);

    const newTop = pos.top + delta.y;
    const minutesFromStart = (newTop / HOUR_HEIGHT) * 60;
    const totalMinutes = startHour * 60 + minutesFromStart;

    const snappedMinutes = Math.round(totalMinutes / 15) * 15;
    const h = Math.floor(snappedMinutes / 60);
    const m = snappedMinutes % 60;

    setDragTime(
      `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
    );
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, delta, over } = event;
    setActiveId(null);
    setDragTime(null);

    if (!active || (Math.abs(delta.y) < 5 && Math.abs(delta.x) < 5)) return;

    const appt = active.data.current as Appointment;

    if (appt.package && appt.package.active === false) {
      toast.error("Não é possível reagendar. Este pacote foi arquivado.");
      return;
    }

    const pos = calculatePosition(appt);
    const newTop = pos.top + delta.y;
    const minutesFromStart = (newTop / HOUR_HEIGHT) * 60;
    const totalMinutes = startHour * 60 + minutesFromStart;
    const snappedMinutes = Math.round(totalMinutes / 15) * 15;
    const newHours = Math.floor(snappedMinutes / 60);
    const newMins = snappedMinutes % 60;

    if (newHours < startHour || newHours >= endHour) {
      toast.error("Horário fora do limite!");
      return;
    }

    const overId = over?.id as string | undefined;

    const timeString = `${newHours.toString().padStart(2, "0")}:${newMins.toString().padStart(2, "0")}`;
    if (timeString === appt.time && !overId) return;

    setIsMoving(true);
    try {
      let baseDate = appt.date_time ? new Date(appt.date_time) : new Date();
      
      if (overId) {
        const [year, month, day] = overId.split("-").map(Number);
        baseDate.setFullYear(year, month - 1, day);
      }

      baseDate.setHours(newHours, newMins, 0, 0);

      const result = await updateAppointmentDateTime(
        appt.id,
        baseDate.toISOString(),
      );

      if (result.success) {
        toast.success(`Movido para ${timeString}`);
      } else {
        toast.error(result.error || "Erro ao mover.");
      }
    } catch (err) {
      toast.error("Erro de conexão.");
    } finally {
      setIsMoving(false);
    }
  };

  const activeAppt = useMemo(
    () => appointments.find((a) => a.id === activeId),
    [activeId, appointments],
  );

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
    <div className="flex flex-col flex-1 min-h-0 bg-card rounded-2xl overflow-hidden relative select-none transition-all">
      {isMoving && (
        <div className="absolute inset-0 bg-background/40 z-100 flex items-center justify-center backdrop-blur-[2px]">
          <LoaderDots className="h-10 w-10 animate-spin text-primary" />
        </div>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-auto flex-1 custom-scrollbar">
          <div className="min-w-[800px] flex relative" ref={setDroppableRef}>
            <div className="w-16 shrink-0 border-r border-border/50 bg-muted/30 sticky left-0 z-30 backdrop-blur-md">
              <div className="h-14 border-b border-border/50 flex items-center justify-center text-muted-foreground bg-muted/50 sticky top-0 z-40 backdrop-blur-md">
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

                const sortedAppts = [...dayAppointments].sort((a, b) => {
                  const timeA = new Date(a.date_time || new Date()).getTime();
                  const timeB = new Date(b.date_time || new Date()).getTime();

                  if (timeA === timeB) {
                    return String(a.id).localeCompare(String(b.id));
                  }
                  return timeA - timeB;
                });

                //  NOVO ALGORITMO: AGRUPAMENTO INTELIGENTE DE OVERBOOKING NA SEMANA
                const groups: Appointment[][] = [];
                let currentGroup: Appointment[] = [];
                let currentGroupEnd = -1;

                sortedAppts.forEach((appt) => {
                  const start = new Date(
                    appt.date_time || new Date(),
                  ).getTime();
                  const isCancelled =
                    appt.status?.toUpperCase() === "CANCELADO";
                  const effectiveDuration = isCancelled ? 25 : appt.duration;
                  const end = start + effectiveDuration * 60000;

                  if (start < currentGroupEnd) {
                    currentGroup.push(appt);
                    currentGroupEnd = Math.max(currentGroupEnd, end);
                  } else {
                    if (currentGroup.length > 0) groups.push(currentGroup);
                    currentGroup = [appt];
                    currentGroupEnd = end;
                  }
                });
                if (currentGroup.length > 0) groups.push(currentGroup);

                const positionedAppts: {
                  appt: Appointment;
                  layout: { width: string; left: string };
                }[] = [];

                groups.forEach((group) => {
                  const columns: {
                    appt: Appointment;
                    start: number;
                    end: number;
                  }[][] = [];

                  group.forEach((appt) => {
                    const start = new Date(
                      appt.date_time || new Date(),
                    ).getTime();
                    const isCancelled =
                      appt.status?.toUpperCase() === "CANCELADO";
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
                });

                return (
                  <DroppableDayColumn
                    key={dateKey}
                    dateKey={dateKey}
                    className={cn(
                      "flex-1 min-w-[110px] relative border-r border-border/50 last:border-r-0 transition-colors",
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
                        //  Lógica simples para identificar se não é a Cris
                        // Ajuste "cris" para o nome exato que está cadastrado no sistema dela.
                        const isEmployee = appt.professionalName
                          ? !appt.professionalName
                            .toLowerCase()
                            .includes("cris")
                          : false;

                        return (
                          <div
                            key={appt.id}
                            style={getAppointmentStyle(appt, layout)}
                            className="absolute"
                          >
                            <DraggableAppointmentCard
                              appt={appt}
                              top={0}
                              height={parseInt(
                                getAppointmentStyle(appt, layout).height,
                              )}
                              width="100%"
                              left="0px"
                              isEmployee={isEmployee} //  ADICIONE ESTA LINHA AQUI
                              onClick={() => onAppointmentClick(appt)}
                              onQuickConfirm={onQuickConfirm}
                              onWhatsApp={(e) => {
                                const msg = encodeURIComponent(
                                  `Olá ${appt.clientName.split(" ")[0]}! Confirmamos seu horário às ${appt.time}?`,
                                );
                                window.open(
                                  `https://wa.me/${cleanPhone(appt.phone)}?text=${msg}`,
                                  "_blank",
                                );
                              }}
                            />
                          </div>
                        );
                      })}

                      {/* BLOQUEIOS NA SEMANA */}
                      {scheduleBlocks
                        .filter((block) => isSameDay(new Date(block.start_time), day))
                        .map((block) => {
                          const startDate = new Date(block.start_time);
                          const endDate = new Date(block.end_time);
                          const startMins = startDate.getHours() * 60 + startDate.getMinutes();
                          const endMins = endDate.getHours() * 60 + endDate.getMinutes();

                          const top = ((startMins - (startHour * 60)) / 60) * HOUR_HEIGHT;
                          const height = ((endMins - startMins) / 60) * HOUR_HEIGHT;

                          return (
                            <div
                              key={block.id}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute flex flex-col items-center justify-center p-1 text-rose-800/80 z-[5] bg-rose-50/60 border-y border-rose-200/50 overflow-hidden pointer-events-auto cursor-not-allowed"
                              style={{
                                top: `${top}px`,
                                height: `${height}px`,
                                left: "0px",
                                width: "100%",
                                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(225,29,72,0.06) 10px, rgba(225,29,72,0.06) 20px)`
                              }}
                            >
                              <span className="text-[10px] font-black uppercase tracking-widest bg-white/70 px-2 py-0.5 rounded-full backdrop-blur-sm border border-rose-100 max-w-[90%] truncate text-center flex items-center justify-center">
                                <Lock className="h-3 w-3 mr-1 shrink-0" /> {block.title}
                              </span>
                              {block.professionalName && (
                                <span className="text-[8px] font-bold opacity-80 truncate mt-1">
                                  {block.professionalName}
                                </span>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </DroppableDayColumn>
                );
              })}
            </div>
          </div>
        </div>

        <DragOverlay
          dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: { active: { opacity: "0" } },
            }),
          }}
        >
          {activeAppt && (
            <div className="relative w-full h-full pointer-events-none">
              <div className="absolute -top-8 left-2 bg-primary text-primary-foreground text-xs font-black px-3 py-1 rounded-full shadow-xl animate-in zoom-in-50 z-50">
                {dragTime}
              </div>
              <AppointmentCardContent
                appt={activeAppt}
                height={calculatePosition(activeAppt).height}
                isOverlay
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

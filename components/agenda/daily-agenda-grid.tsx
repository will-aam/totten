// components/agenda/daily-agenda-grid.tsx
"use client";

import React, { useState, useMemo } from "react";
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
import { LoaderDots, Plus } from "@boxicons/react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { updateAppointmentDateTime } from "@/app/actions/appointments";

//  IMPORTANDO AS PECINHAS DE LEGO
import {
  Appointment,
  DraggableAppointmentCard,
  AppointmentCardContent,
  cleanPhone,
} from "./appointment-card";

const DEFAULT_START_HOUR = 8;
const HOUR_HEIGHT = 96;

interface DailyAgendaGridProps {
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
  onRefresh: () => void;
  startHour?: number;
  endHour?: number;
  onEmptySlotClick?: (time: string) => void;
  onQuickConfirm?: (appt: Appointment) => void;
}

export function DailyAgendaGrid({
  appointments,
  onAppointmentClick,
  onRefresh,
  startHour = DEFAULT_START_HOUR,
  endHour = 19,
  onEmptySlotClick,
  onQuickConfirm,
}: DailyAgendaGridProps) {
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

  const calculatePosition = (appt: Appointment) => {
    const [hours, minutes] = appt.time.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes;
    const startOffset = startHour * 60;
    const top = ((totalMinutes - startOffset) / 60) * HOUR_HEIGHT;

    const isCancelled = appt.status?.toUpperCase() === "CANCELADO";
    const effectiveDuration = isCancelled ? 25 : appt.duration;
    const height = (effectiveDuration / 60) * HOUR_HEIGHT;

    return { top, height };
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
    const { active, delta } = event;
    setActiveId(null);
    setDragTime(null);

    if (!active || Math.abs(delta.y) < 5) return;

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

    const timeString = `${newHours.toString().padStart(2, "0")}:${newMins.toString().padStart(2, "0")}`;
    if (timeString === appt.time) return;

    setIsMoving(true);
    try {
      let baseDate = appt.date_time ? new Date(appt.date_time) : new Date();
      baseDate.setHours(newHours, newMins, 0, 0);

      const result = await updateAppointmentDateTime(
        appt.id,
        baseDate.toISOString(),
      );

      if (result.success) {
        toast.success(`Movido para ${timeString}`);
        onRefresh();
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

  const positionedAppts = useMemo(() => {
    const timeToMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    };

    const sortedAppts = [...appointments].sort((a, b) => {
      const diff = timeToMinutes(a.time) - timeToMinutes(b.time);
      if (diff === 0) {
        return String(a.id).localeCompare(String(b.id));
      }
      return diff;
    });

    const columns: { appt: Appointment; start: number; end: number }[][] = [];

    sortedAppts.forEach((appt) => {
      const start = timeToMinutes(appt.time);
      const isCancelled = appt.status?.toUpperCase() === "CANCELADO";
      const effectiveDuration = isCancelled ? 25 : appt.duration;
      const end = start + effectiveDuration;

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
    const result: {
      appt: Appointment;
      layout: { width: string; left: string };
    }[] = [];

    columns.forEach((col, colIndex) => {
      col.forEach(({ appt }) => {
        result.push({
          appt,
          layout: {
            width: `calc(${100 / numColumns}% - 12px)`,
            left: `calc(${(100 / numColumns) * colIndex}% + 8px)`,
          },
        });
      });
    });

    return result;
  }, [appointments]);

  const HOURS_ARRAY = Array.from(
    { length: endHour - startHour + 1 },
    (_, i) => i + startHour,
  );

  return (
    <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden flex flex-col relative select-none">
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
        modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
      >
        <div className="overflow-y-auto max-h-175 relative w-full scroll-smooth custom-scrollbar">
          <div className="flex relative min-w-75" ref={setDroppableRef}>
            <div className="w-20 shrink-0 border-r border-border/50 bg-muted/5 relative z-20 pointer-events-none">
              {HOURS_ARRAY.map((hour) => (
                <div key={hour} className="h-24 relative flex justify-center">
                  <span
                    className={cn(
                      "absolute bg-card px-2 text-[10px] font-black text-muted-foreground/60 uppercase tracking-tighter",
                      hour === startHour ? "top-1" : "-top-3",
                    )}
                  >
                    {hour.toString().padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>

            <div className="flex-1 relative">
              <div className="absolute inset-0 flex flex-col z-0">
                {HOURS_ARRAY.map((hour) => (
                  <div
                    key={`grid-${hour}`}
                    className="h-24 w-full relative flex flex-col"
                  >
                    <div
                      onClick={() =>
                        onEmptySlotClick?.(
                          `${hour.toString().padStart(2, "0")}:00`,
                        )
                      }
                      className="flex-1 border-b border-dashed border-border/10 cursor-pointer hover:bg-muted/10 transition-colors group relative"
                    >
                      <span className="absolute left-2 top-1 text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <Plus className="h-3 w-3" /> Agendar{" "}
                        {hour.toString().padStart(2, "0")}:00
                      </span>
                    </div>
                    <div
                      onClick={() =>
                        onEmptySlotClick?.(
                          `${hour.toString().padStart(2, "0")}:30`,
                        )
                      }
                      className="flex-1 border-b border-border/10 cursor-pointer hover:bg-muted/10 transition-colors group relative"
                    >
                      <span className="absolute left-2 top-1 text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <Plus className="h-3 w-3" /> Agendar{" "}
                        {hour.toString().padStart(2, "0")}:30
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="absolute inset-0 z-10 pointer-events-none">
                {positionedAppts.map(({ appt, layout }) => {
                  const { top, height } = calculatePosition(appt);
                  return (
                    <DraggableAppointmentCard
                      key={appt.id}
                      appt={appt}
                      top={top}
                      height={height}
                      left={layout.left}
                      width={layout.width}
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
                  );
                })}
              </div>
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
            <div className="relative w-[calc(100%-40px)] ml-4 pointer-events-none">
              <div className="absolute -top-8 left-2 bg-primary text-primary-foreground text-xs font-black px-3 py-1 rounded-full shadow-xl animate-in zoom-in-50 z-50">
                {dragTime}
              </div>
              <div
                style={{
                  height: `${calculatePosition(activeAppt).height}px`,
                }}
              >
                <AppointmentCardContent
                  appt={activeAppt}
                  height={calculatePosition(activeAppt).height}
                  isOverlay
                />
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

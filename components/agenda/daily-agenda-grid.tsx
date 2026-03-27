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
  useDraggable,
  useDroppable,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  restrictToVerticalAxis,
  restrictToFirstScrollableAncestor,
} from "@dnd-kit/modifiers";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  Clock,
  Loader2,
  Package as PackageIcon,
  Lock,
  AlertTriangle, // 🔥 Adicionado
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { updateAppointmentDateTime } from "@/app/actions/appointments";

const DEFAULT_START_HOUR = 8;
const HOUR_HEIGHT = 96; // 96px por hora (1.6px por minuto)

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
  payment_method?: string | null;
  paymentMethod?: string | null;
  date_time?: Date;
  package_id?: string | null;
  session_number?: number | null;
  package?: {
    total_sessions: number;
    used_sessions: number;
    active?: boolean; // 🔥 Tipagem adicionada aqui!
  } | null;
}

interface DailyAgendaGridProps {
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
  onRefresh: () => void;
  startHour?: number;
  endHour?: number;
}

const cleanPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
};

function AppointmentCardContent({
  appt,
  isOverlay = false,
  isCancelled = false,
  isLocked = false,
}: {
  appt: Appointment;
  isOverlay?: boolean;
  isCancelled?: boolean;
  isLocked?: boolean;
}) {
  // 🔥 Verifica se o pacote associado tá inativo
  const isPackageArchived = appt.package && appt.package.active === false;

  return (
    <div
      className={cn(
        "h-full w-full rounded-xl border p-3 flex flex-col shadow-sm group overflow-hidden transition-all relative",
        appt.color,
        appt.hasCharge &&
          !isCancelled &&
          !isPackageArchived &&
          "border-2 border-destructive",
        isCancelled && "opacity-40 grayscale-[0.8] border-dashed",
        isPackageArchived &&
          !isCancelled &&
          "border-2 border-destructive/80 opacity-80", // Borda de atenção
        isOverlay &&
          "shadow-2xl scale-105 rotate-1 border-primary/50 cursor-grabbing",
      )}
    >
      <div className="flex justify-between items-start w-full">
        <div className="flex flex-col truncate pr-2">
          <div className="flex items-center gap-2">
            {isLocked && !isOverlay && (
              <Lock className="h-3 w-3 text-muted-foreground/50 shrink-0" />
            )}
            <span
              className={cn(
                "font-bold text-sm md:text-base truncate",
                (isCancelled || isPackageArchived) && "line-through", // Risca o nome se o pacote morreu
              )}
            >
              {appt.clientName}
            </span>
          </div>
          <span className="text-[11px] font-semibold opacity-80 truncate uppercase tracking-wider">
            {appt.service}
          </span>
        </div>
        {!isCancelled && !isLocked && !isOverlay && (
          <div className="h-7 w-7 rounded-full bg-white/40 flex items-center justify-center text-emerald-700">
            <MessageCircle className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between text-[10px] font-bold opacity-80 pt-1.5 border-t border-black/5">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> {appt.time}
        </span>

        {/* 🔥 Mudança de tag se o pacote for arquivado */}
        <span
          className={cn(
            "px-1.5 rounded flex items-center gap-1",
            isPackageArchived && !isCancelled
              ? "bg-destructive/10 text-destructive font-black"
              : "bg-white/30",
          )}
        >
          {!isPackageArchived && appt.package_id && (
            <PackageIcon className="h-3 w-3" />
          )}
          {isPackageArchived && !isCancelled && (
            <AlertTriangle className="h-3 w-3" />
          )}

          {isCancelled
            ? "Cancelado"
            : isPackageArchived
              ? "Pacote Inativo"
              : appt.sessionInfo}
        </span>
      </div>
    </div>
  );
}

function DraggableAppointmentCard({
  appt,
  top,
  height,
  onClick,
  onWhatsApp,
}: {
  appt: Appointment;
  top: number;
  height: number;
  onClick: () => void;
  onWhatsApp: (e: React.MouseEvent) => void;
}) {
  const isCancelled = appt.status?.toUpperCase() === "CANCELADO";
  const isRealizado = appt.status?.toUpperCase() === "REALIZADO";
  const paymentMethod = appt.payment_method || appt.paymentMethod;
  const isPaid = !!paymentMethod && paymentMethod !== "nenhum";

  const isLocked = isCancelled || isRealizado || isPaid;

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: appt.id,
    data: appt,
    disabled: isLocked,
  });

  const style: React.CSSProperties = {
    position: "absolute",
    top: `${top}px`,
    height: `${height}px`,
    left: "8px",
    right: "16px",
    zIndex: isDragging ? 0 : 10,
    opacity: isDragging ? 0 : 1,
    touchAction: "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(!isLocked ? listeners : {})}
      {...(!isLocked ? attributes : {})}
      className={cn(
        !isLocked ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
      )}
      onClick={(e) => {
        if (e.defaultPrevented) return;
        onClick();
      }}
    >
      {!isLocked && (
        <div className="absolute top-2 right-2 z-50">
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onWhatsApp(e);
            }}
            className="h-8 w-8 rounded-full bg-white/60 hover:bg-white text-emerald-700 shadow-sm opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>
      )}

      <AppointmentCardContent
        appt={appt}
        isCancelled={isCancelled}
        isLocked={isLocked}
      />
    </div>
  );
}

export function DailyAgendaGrid({
  appointments,
  onAppointmentClick,
  onRefresh,
  startHour = DEFAULT_START_HOUR,
  endHour = 19,
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

  const calculatePosition = (timeStr: string, durationMinutes: number) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes;
    const startOffset = startHour * 60;
    const top = ((totalMinutes - startOffset) / 60) * HOUR_HEIGHT;
    const height = (durationMinutes / 60) * HOUR_HEIGHT;
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
    const pos = calculatePosition(appt.time, appt.duration);

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

    // 🔥 Desabilita drag and drop para pacotes arquivados
    if (appt.package && appt.package.active === false) {
      toast.error("Não é possível reagendar. Este pacote foi arquivado.");
      return;
    }

    const pos = calculatePosition(appt.time, appt.duration);
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

  const HOURS_ARRAY = Array.from(
    { length: endHour - startHour + 1 },
    (_, i) => i + startHour,
  );

  return (
    <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden flex flex-col relative select-none">
      {isMoving && (
        <div className="absolute inset-0 bg-background/40 z-100 flex items-center justify-center backdrop-blur-[2px]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
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
            {/* COLUNA DE HORAS */}
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

            {/* GRADE DA AGENDA */}
            <div className="flex-1 relative">
              {HOURS_ARRAY.map((hour) => (
                <div
                  key={`grid-${hour}`}
                  className="h-24 border-b border-border/10 w-full relative pointer-events-none"
                >
                  <div className="absolute top-1/4 w-full border-t border-dashed border-border/5 opacity-40" />
                  <div className="absolute top-2/4 w-full border-t border-dotted border-border/10 opacity-60" />
                  <div className="absolute top-3/4 w-full border-t border-dashed border-border/5 opacity-40" />
                </div>
              ))}

              <div className="absolute top-0 left-0 right-0 bottom-0">
                {appointments.map((appt) => {
                  const { top, height } = calculatePosition(
                    appt.time,
                    appt.duration,
                  );
                  return (
                    <DraggableAppointmentCard
                      key={appt.id}
                      appt={appt}
                      top={top}
                      height={height}
                      onClick={() => onAppointmentClick(appt)}
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

        {/* INDICADOR VISUAL DURANTE O ARRASTE */}
        <DragOverlay
          dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: { active: { opacity: "0" } },
            }),
          }}
        >
          {activeAppt && (
            <div className="relative w-[calc(100%-40px)] ml-4">
              <div className="absolute -top-8 left-2 bg-primary text-primary-foreground text-xs font-black px-3 py-1 rounded-full shadow-xl animate-in zoom-in-50 z-50 pointer-events-none">
                {dragTime}
              </div>
              <div
                style={{
                  height: `${(activeAppt.duration / 60) * HOUR_HEIGHT}px`,
                }}
              >
                <AppointmentCardContent appt={activeAppt} isOverlay />
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

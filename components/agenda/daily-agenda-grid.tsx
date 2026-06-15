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
  LoaderDots,
  Package as PackageIcon,
  Lock,
  AlertTriangle,
  Check,
  Plus,
  User,
  DotsVerticalRounded,
  InfoCircle,
} from "@boxicons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    active?: boolean;
  } | null;
  professionalName?: string | null;
}

interface DailyAgendaGridProps {
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
  onRefresh: () => void;
  startHour?: number;
  endHour?: number;
  onEmptySlotClick?: (time: string) => void;
  onQuickConfirm?: (appt: Appointment) => void;
}

const cleanPhone = (phone: string) => {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
};

function AppointmentCardContent({
  appt,
  height,
  isOverlay = false,
  isCancelled = false,
  isLocked = false,
}: {
  appt: Appointment;
  height: number;
  isOverlay?: boolean;
  isCancelled?: boolean;
  isLocked?: boolean;
}) {
  const isPackageArchived = appt.package && appt.package.active === false;
  const isCompact = height <= 40;

  // 🔥 VISUAL EXCLUSIVO E RESPONSIVO PARA CANCELADOS
  if (isCancelled) {
    return (
      <div
        className={cn(
          "h-full w-full rounded-xl border border-dashed flex items-center justify-between px-2 py-1 shadow-sm transition-transform overflow-hidden",
          appt.color,
          "opacity-50 grayscale-[0.8]",
          isOverlay && "shadow-2xl scale-105 rotate-1 cursor-grabbing",
        )}
      >
        <div className="flex items-center gap-1.5 truncate pr-2 w-full">
          <Lock className="h-3 w-3 shrink-0 opacity-60" />
          <span className="font-bold text-xs truncate line-through opacity-80">
            {appt.clientName}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0 text-[10px] font-bold opacity-70">
          <Clock className="h-3 w-3 hidden sm:block" />
          <span>{appt.time}</span>
        </div>
      </div>
    );
  }

  // 👇 Abaixo fica o layout normal para agendamentos não-cancelados
  return (
    <div
      className={cn(
        "h-full w-full rounded-xl border flex shadow-sm group overflow-hidden transition-transform relative",
        isCompact ? "flex-row items-center px-2 py-1 gap-2" : "flex-col p-3",
        appt.color,
        appt.hasCharge && !isPackageArchived && "border-2 border-destructive",
        isPackageArchived && "border-2 border-destructive/80 opacity-80",
        isOverlay &&
          "shadow-2xl scale-105 rotate-1 border-primary/50 cursor-grabbing",
      )}
    >
      <div
        className={cn(
          "flex w-full",
          isCompact
            ? "items-center justify-between"
            : "flex-col justify-between items-start h-full",
        )}
      >
        {/* Info Principal */}
        <div
          className={cn(
            "flex truncate pr-6",
            isCompact ? "flex-row items-center gap-2" : "flex-col",
          )}
        >
          <div className="flex items-center gap-1.5">
            {isLocked && !isOverlay && (
              <Lock className="h-3 w-3 text-muted-foreground/50 shrink-0" />
            )}
            <span
              className={cn(
                "font-bold truncate",
                isCompact ? "text-xs" : "text-sm md:text-base",
                isPackageArchived && "line-through",
              )}
            >
              {appt.clientName}
            </span>
          </div>

          <div
            className={cn(
              "flex items-center gap-1",
              !isCompact && "mt-0.5 flex-col items-start",
            )}
          >
            {!isCompact && (
              <span className="text-[11px] font-semibold opacity-80 truncate uppercase tracking-wider leading-none">
                {appt.service}
              </span>
            )}

            {/* Etiqueta Profissional */}
            {appt.professionalName && (
              <div className="flex items-center gap-1 bg-background/40 w-fit px-1 py-0.5 rounded text-[9px] font-semibold text-foreground/80 backdrop-blur-sm border border-border/30">
                <User className="h-3 w-3" />
                <span className="truncate max-w-16">
                  {appt.professionalName.split(" ")[0]}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé / Status */}
        <div
          className={cn(
            "flex items-center text-[10px] font-bold opacity-80",
            isCompact
              ? "gap-2 shrink-0"
              : "mt-auto justify-between w-full pt-1.5 border-t border-black/5",
          )}
        >
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {appt.time}
          </span>

          {(!isCompact || isPackageArchived) && (
            <span
              className={cn(
                "px-1.5 rounded flex items-center gap-1",
                isPackageArchived
                  ? "bg-destructive/10 text-destructive font-black"
                  : "bg-white/30",
              )}
            >
              {!isPackageArchived && appt.package_id && !isCompact && (
                <PackageIcon className="h-3 w-3" />
              )}
              {isPackageArchived && <AlertTriangle className="h-3 w-3" />}
              {isPackageArchived ? "Inativo" : appt.sessionInfo}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function DraggableAppointmentCard({
  appt,
  top,
  height,
  width = "calc(100% - 24px)",
  left = "8px",
  onClick,
  onWhatsApp,
  onQuickConfirm,
}: {
  appt: Appointment;
  top: number;
  height: number;
  width?: string;
  left?: string;
  onClick: () => void;
  onWhatsApp: (e: React.MouseEvent) => void;
  onQuickConfirm?: (appt: Appointment) => void;
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
    left,
    width,
    zIndex: isDragging ? 0 : 10,
    opacity: isDragging ? 0 : 1,
    touchAction: "none",
    pointerEvents: "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(!isLocked ? listeners : {})}
      {...(!isLocked ? attributes : {})}
      className={cn(
        !isLocked ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        "group",
      )}
      onClick={(e) => {
        if (e.defaultPrevented) return;
        onClick();
      }}
    >
      {/* 🔥 MENU DE OPÇÕES: Oculto completamente se o agendamento foi cancelado */}
      {!isCancelled && (
        <div className="absolute top-1 right-1 z-50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 bg-transparent hover:bg-black/5 text-black/50 hover:text-black shadow-none border-none p-0 m-0"
                onClick={(e) => e.stopPropagation()}
              >
                <DotsVerticalRounded className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 z-100 rounded-xl">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                className="font-medium"
              >
                <InfoCircle className="mr-2 h-4 w-4" /> Detalhes da Sessão
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {!isLocked && appt.status?.toUpperCase() !== "CONFIRMADO" && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onQuickConfirm) onQuickConfirm(appt);
                  }}
                  className="text-blue-600 focus:text-blue-700 font-medium"
                >
                  <Check className="mr-2 h-4 w-4" /> Marcar Confirmado
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onWhatsApp(e);
                }}
                className="text-emerald-600 focus:text-emerald-700 font-medium"
              >
                <MessageCircle className="mr-2 h-4 w-4" /> Enviar WhatsApp
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <AppointmentCardContent
        appt={appt}
        height={height}
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

    // 🔥 SORT ESTÁVEL: Desempata pelo ID para os blocos não piscarem em re-renderizações!
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

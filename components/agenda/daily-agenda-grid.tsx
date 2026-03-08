// componentes/agenda/daily-agenda-grid.tsx
// Componente de grade de agenda diária com funcionalidade de arrastar e soltar para reagendamento
"use client";

import React, { useState } from "react";
import {
  DndContext,
  PointerSensor,
  TouchSensor, // 🔥 Adicionado o TouchSensor
  useSensor,
  useSensors,
  DragEndEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import {
  restrictToVerticalAxis,
  restrictToFirstScrollableAncestor,
} from "@dnd-kit/modifiers";
import { Button } from "@/components/ui/button";
import { MessageCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { updateAppointmentDateTime } from "@/app/actions/appointments";

const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 19;
const HOUR_HEIGHT = 96; // 96px por hora

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
  date_time?: Date; // Data original para o cálculo
}

interface DailyAgendaGridProps {
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
  startHour?: number;
  endHour?: number;
}

// --- SUB-COMPONENTE: CARD ARRASTÁVEL ---
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
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: appt.id,
      data: appt,
    });

  const isCancelled =
    appt.status === "CANCELADO" || appt.status === "cancelado";

  const style = {
    top: `${top}px`,
    height: `${height}px`,
    transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 50 : 10,
    opacity: isDragging ? 0.8 : undefined,
    // 🔥 touchAction: none impede que a página role quando o usuário tenta arrastar o card
    touchAction: "none",
  };

  const calculateEndTime = (start: string, duration: number) => {
    const [h, m] = start.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m + duration);
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "absolute left-2 right-4 ml-1 md:ml-4 rounded-xl border p-3 flex flex-col shadow-sm transition-shadow cursor-grab active:cursor-grabbing group overflow-hidden",
        appt.color,
        appt.hasCharge &&
          !isCancelled &&
          "border-2 border-destructive shadow-lg",
        isCancelled &&
          "opacity-40 grayscale-[0.8] border-dashed border-muted-foreground/50",
        isDragging && "shadow-2xl cursor-grabbing",
      )}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        // Evita abrir o modal se estiver apenas clicando no botão de WhatsApp ou se acabou de arrastar
        if (!isDragging) onClick();
      }}
    >
      <div className="flex justify-between items-start w-full">
        <div className="flex flex-col truncate pr-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-bold text-sm md:text-base leading-none truncate",
                isCancelled && "line-through",
              )}
            >
              {appt.clientName}
            </span>
            {!isCancelled && appt.hasCharge && (
              <AlertCircle className="h-3.5 w-3.5 text-destructive animate-pulse" />
            )}
          </div>
          <span className="text-xs font-medium opacity-80 mt-1 truncate">
            {appt.service}
          </span>
        </div>

        {!isCancelled && (
          <Button
            size="icon"
            variant="ghost"
            onPointerDown={(e) => e.stopPropagation()} // Importante: impede o drag ao clicar no botão
            onClick={onWhatsApp}
            className="h-8 w-8 rounded-full bg-white/40 hover:bg-white/80 text-emerald-700 shrink-0 shadow-sm z-50"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="mt-auto flex items-center gap-3 text-[10px] font-bold opacity-70 pt-2 border-t border-black/5">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> {appt.time} -{" "}
          {calculateEndTime(appt.time, appt.duration)}
        </span>
        <span className="bg-white/30 px-1.5 rounded">
          {isCancelled ? "Cancelado" : appt.sessionInfo}
        </span>
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---
export function DailyAgendaGrid({
  appointments,
  onAppointmentClick,
  startHour = DEFAULT_START_HOUR,
  endHour = DEFAULT_END_HOUR,
}: DailyAgendaGridProps) {
  const [isMoving, setIsMoving] = useState(false);

  // 🔥 Sensores otimizados para funcionar tanto no PC quanto no Mobile
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }, // PC: precisa mover 8px para iniciar o drag
    }),
    useSensor(TouchSensor, {
      // Mobile: O usuário precisa segurar o dedo por 250ms E não mover mais que 5px (para não confundir com scroll)
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
  );

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: "agenda-grid-droppable",
  });

  const calculatePosition = (timeStr: string, durationMinutes: number) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const timeInMinutes = hours * 60 + minutes;
    const startOffsetMinutes = startHour * 60;
    const top = ((timeInMinutes - startOffsetMinutes) / 60) * HOUR_HEIGHT;
    const height = (durationMinutes / 60) * HOUR_HEIGHT;
    return { top, height };
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, delta } = event;
    if (!active) return;

    const appt = active.data.current as Appointment;

    // 1. Pegamos a posição atual do card em pixels
    const pos = calculatePosition(appt.time, appt.duration);
    if (isNaN(pos.top)) {
      console.error("Erro: Posição inicial inválida para o agendamento", appt);
      return;
    }

    const newTop = pos.top + delta.y;

    // 2. Converte Pixels de volta para Horário
    const minutesFromStart = (newTop / HOUR_HEIGHT) * 60;
    const totalMinutes = startHour * 60 + minutesFromStart;

    // Snapping: Arredonda para o intervalo de 15 minutos mais próximo
    const snappedMinutes = Math.round(totalMinutes / 15) * 15;

    const newHours = Math.floor(snappedMinutes / 60);
    const newMins = snappedMinutes % 60;

    // 3. Valida se o cálculo resultou em números válidos
    if (isNaN(newHours) || isNaN(newMins)) {
      toast.error("Erro ao calcular novo horário.");
      return;
    }

    // 4. Valida se está dentro do horário de funcionamento
    if (newHours < startHour || newHours >= endHour) {
      toast.error("Horário fora do limite da agenda!");
      return;
    }

    // 5. CRIAÇÃO DA DATA (O PONTO DO ERRO)
    // Usamos a data que já existe no agendamento, ou a data atual como fallback
    let baseDate = appt.date_time ? new Date(appt.date_time) : new Date();

    // Se a data base for inválida, criamos uma nova
    if (isNaN(baseDate.getTime())) {
      baseDate = new Date();
    }

    const newDate = new Date(baseDate);
    newDate.setHours(newHours, newMins, 0, 0);

    // Verificação final antes do toISOString()
    if (isNaN(newDate.getTime())) {
      toast.error("Erro: Data gerada é inválida.");
      return;
    }

    const timeString = `${newHours.toString().padStart(2, "0")}:${newMins.toString().padStart(2, "0")}`;

    if (timeString === appt.time) return; // Não mudou o horário real (snapping no mesmo lugar)

    setIsMoving(true);
    try {
      const result = await updateAppointmentDateTime(
        appt.id,
        newDate.toISOString(),
      );
      if (result.success) {
        toast.success(`Reagendado para às ${timeString}`);
      } else {
        toast.error(result.error || "Falha ao mover.");
      }
    } catch (err) {
      toast.error("Erro de conexão ao mover.");
    } finally {
      setIsMoving(false);
    }
  };
  const HOURS_ARRAY = Array.from(
    { length: endHour - startHour + 1 },
    (_, i) => i + startHour,
  );

  return (
    <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden flex flex-col relative">
      {isMoving && (
        <div className="absolute inset-0 bg-background/40 z-50 flex items-center justify-center backdrop-blur-[1px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      <DndContext
        sensors={sensors}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
      >
        <div className="overflow-y-auto max-h-150 relative w-full scroll-smooth">
          <div className="flex relative min-w-150" ref={setDroppableRef}>
            {/* Linha do Tempo */}
            <div className="w-20 shrink-0 border-r border-border/50 bg-muted/5 relative z-20 pointer-events-none">
              {HOURS_ARRAY.map((hour) => (
                <div
                  key={hour}
                  className="h-24 relative flex justify-center border-b border-border/30 last:border-0"
                >
                  <span className="absolute -top-3 bg-card px-1 text-[10px] font-bold text-muted-foreground/70">
                    {hour.toString().padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Área dos Cards */}
            <div className="flex-1 relative bg-grid-pattern">
              {HOURS_ARRAY.map((hour) => (
                <div
                  key={`grid-${hour}`}
                  className="h-24 border-b border-border/10 w-full"
                />
              ))}

              <div className="absolute top-0 left-0 right-0 bottom-0 p-2">
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
                        e.stopPropagation();
                        window.open(`https://wa.me/${appt.phone}`, "_blank");
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </DndContext>
    </div>
  );
}

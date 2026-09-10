// app/(private)/admin/agenda/_components/full-calendar-agenda.tsx
"use client";

import React, { useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import { toast } from "sonner";
import { updateAppointmentDateTime } from "@/app/actions/appointments";

import { Appointment, AppointmentCardContent, cleanPhone } from "./appointment-card";
import { Lock } from "@boxicons/react";

interface FullCalendarAgendaProps {
   appointments: Appointment[];
   scheduleBlocks?: any[];
   viewMode: "day" | "week" | "month";
   currentDate: Date;
   startHour?: number;
   endHour?: number;
   onAppointmentClick: (appt: Appointment) => void;
   onRefresh: () => void;
   onEmptySlotClick?: (time: string) => void;
   onDayClick?: (day: Date) => void;
   onQuickConfirm?: (appt: Appointment) => void;
}

export function FullCalendarAgenda({
   appointments,
   scheduleBlocks = [],
   viewMode,
   currentDate,
   startHour = 8,
   endHour = 20,
   onAppointmentClick,
   onRefresh,
   onEmptySlotClick,
   onDayClick,
   onQuickConfirm,
}: FullCalendarAgendaProps) {
   const calendarRef = useRef<any>(null);

   useEffect(() => {
      if (calendarRef.current) {
         setTimeout(() => {
            if (calendarRef.current) {
               const api = calendarRef.current.getApi();
               const isMobile = window.innerWidth < 768; // Tailwind md breakpoint
               const viewMap: any = {
                  day: "timeGridDay",
                  week: isMobile ? "timeGridThreeDay" : "timeGridWeek",
                  month: "dayGridMonth",
               };

               const targetView = viewMap[viewMode];
               if (api.view.type !== targetView) {
                  api.changeView(targetView);
               }
               api.gotoDate(currentDate);
            }
         }, 0);
      }
   }, [viewMode, currentDate]);

   // Transform appointments to FullCalendar events
   const events = appointments.map((appt) => {
      const isCancelled = appt.status?.toUpperCase() === "CANCELADO";
      const effectiveDuration = isCancelled ? 25 : appt.duration;

      // We assume appt.date_time is ISO string or valid Date string
      const start = new Date(appt.date_time || new Date());
      const end = new Date(start.getTime() + effectiveDuration * 60000);

      return {
         id: appt.id,
         title: `${appt.clientName} - ${appt.service}`,
         start,
         end,
         extendedProps: { appt },
      };
   });

   // Transform schedule blocks to background events
   const backgroundEvents = scheduleBlocks.map((block) => ({
      id: `block-${block.id}`,
      start: block.start_time,
      end: block.end_time,
      display: "background",
      color: "#fda4af", // rose-300 aprox
      extendedProps: { block },
   }));

   const allEvents = [...events, ...backgroundEvents];

   const handleEventDrop = async (info: any) => {
      const { event, oldEvent, revert } = info;
      const appt = event.extendedProps.appt as Appointment;

      if (appt.package && appt.package.active === false) {
         toast.error("Não é possível reagendar. Este pacote foi arquivado.");
         revert();
         return;
      }

      try {
         const newDate = event.start;
         const hours = String(newDate.getHours()).padStart(2, "0");
         const mins = String(newDate.getMinutes()).padStart(2, "0");
         const newDateIso = newDate.toISOString();

         const result = await updateAppointmentDateTime(appt.id, newDateIso);

         if (result.success) {
            toast.success(`Movido para às ${hours}:${mins} com sucesso!`);
            onRefresh();
         } else {
            toast.error(result.error || "Erro ao mover.");
            revert();
         }
      } catch (err) {
         toast.error("Erro de conexão.");
         revert();
      }
   };

   const handleEventResize = async (info: any) => {
      // A interface atual não permite mudar duração arrastando (se preferir, ative)
      info.revert();
      toast.error("A duração deve ser alterada nos detalhes do agendamento.");
   };

   const renderEventContent = (eventInfo: any) => {
      if (eventInfo.event.display === "background") {
         const block = eventInfo.event.extendedProps.block;
         return (
            <div className="flex flex-col items-center justify-center h-full w-full opacity-80" style={{
               backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(225,29,72,0.15) 10px, rgba(225,29,72,0.15) 20px)`
            }}>
               <span className="text-[10px] font-black uppercase tracking-widest bg-white/80 px-2 py-0.5 rounded-full text-rose-800 border border-rose-200">
                  <Lock className="h-3 w-3 mr-1 inline" /> {block?.title || "BLOQUEIO"}
               </span>
            </div>
         );
      }

      const appt = eventInfo.event.extendedProps.appt as Appointment;
      const isCancelled = appt.status?.toUpperCase() === "CANCELADO";

      // Na visualização de Mês, o evento não deve ser um card grande, e sim uma "etiqueta" super fina 
      // senão ele "descola" da linha e quebra o layout da grade.
      if (viewMode === "month") {
         return (
            <div
               className="w-full bg-primary/10 hover:bg-primary/20 border-l-[3px] border-primary px-1.5 py-0.5 rounded-sm overflow-hidden flex items-center gap-1 transition-colors cursor-pointer"
               onClick={() => onAppointmentClick(appt)}
            >
               <span className="text-[10px] font-bold text-primary whitespace-nowrap overflow-hidden text-ellipsis">
                  {eventInfo.timeText} {appt.clientName}
               </span>
            </div>
         );
      }

      // Renderização padrão para os modos Dia e Semana
      return (
         <div className="h-full w-full relative" onClick={() => onAppointmentClick(appt)}>
            {/* Badge mostrando o horário enquanto arrasta */}
            {eventInfo.isMirror && (
               <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-black px-2.5 py-1 rounded-md z-[9999] shadow-lg flex items-center gap-1 border border-border/20 whitespace-nowrap">
                  <span className="relative flex h-2 w-2 mr-1">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-background opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-2 w-2 bg-background"></span>
                  </span>
                  {eventInfo.timeText}
               </div>
            )}
            <AppointmentCardContent
               appt={appt}
               height={appt.duration > 30 ? 60 : 40}
               isCancelled={isCancelled}
            />
         </div>
      );
   };

   return (
      <div className="bg-card rounded-2xl overflow-hidden flex flex-col flex-1 min-h-0 relative select-none w-full fc-custom-theme">
         <style>{`
        /* Remoção do toolbar nativo */
        .fc-custom-theme .fc-header-toolbar {
           display: none !important;
        }

        /* ==== DESIGN CLEAN E SOFISTICADO ==== */
        /* Bordas da grade principal muito sutis */
        .fc-custom-theme .fc-theme-standard .fc-scrollgrid,
        .fc-custom-theme .fc-theme-standard td, 
        .fc-custom-theme .fc-theme-standard th {
           border: 1px solid hsl(var(--border) / 0.4) !important;
        }
        /* Remover borda dupla no topo/laterais para ficar mais flat */
        .fc-custom-theme .fc-scrollgrid {
           border-radius: var(--radius);
           overflow: hidden;
        }
        
        /* Estilo do cabeçalho de colunas (Dias da Semana) */
        .fc-custom-theme .fc-col-header-cell {
           padding: 12px 0;
           font-size: 11px;
           text-transform: uppercase;
           color: hsl(var(--muted-foreground));
           border-bottom: none !important; /* Sem linha grossa abaixo do cabeçalho */
        }

        /* ==== SLOTS DE TEMPO ==== */
        .fc-custom-theme .fc-timegrid-slot {
           height: 48px; /* 30 min = 48px */
        }
        /* Linha cheia sólida e super leve */
        .fc-custom-theme .fc-timegrid-slot-lane {
           border-bottom: 1px solid hsl(var(--border) / 0.3) !important;
        }
        /* Meia hora sem linha ou linha quase invisível para não poluir */
        .fc-custom-theme .fc-timegrid-slot-minor .fc-timegrid-slot-lane {
           border-bottom: 1px solid hsl(var(--border) / 0.15) !important;
        }
        
        /* Texto dos horários no eixo Y */
        .fc-custom-theme .fc-timegrid-slot-label-cushion {
           font-size: 10px;
           font-weight: 500;
           color: hsl(var(--muted-foreground));
           padding-right: 12px;
        }

        /* ==== EVENTOS (TimeGrid - Dia e Semana) ==== */
        .fc-custom-theme .fc-timegrid-event {
           background: transparent !important;
           border: none !important;
           box-shadow: none !important;
           padding: 2px 6px !important; /* Espaço pro card respirar dentro da coluna */
        }
        .fc-custom-theme .fc-timegrid-event .fc-event-main {
           padding: 0 !important;
           height: 100%;
        }

        /* ==== EVENTOS (DayGrid - Mês) ==== */
        .fc-custom-theme .fc-daygrid-event {
           background: transparent !important;
           border: none !important;
           box-shadow: none !important;
           /* Não usar height: 100% nem padding no daygrid para não bugar as coordenadas do drag mirror */
        }
        .fc-custom-theme .fc-daygrid-event .fc-event-main {
           padding: 0 !important;
        }

        /* ==== INDICADOR DE HORÁRIO ATUAL ==== */
        .fc-custom-theme .fc-timegrid-now-indicator-line {
           border-color: hsl(var(--primary) / 0.8) !important;
           border-width: 1.5px !important;
        }
        .fc-custom-theme .fc-timegrid-now-indicator-arrow {
           border-color: hsl(var(--primary) / 0.8) !important;
           border-width: 4px !important;
           margin-top: -4px !important;
        }

        /* ==== MESES: CENTRALIZAR NÚMEROS DO DIA ==== */
        .fc-custom-theme .fc-daygrid-day-top {
           display: flex;
           justify-content: center;
           padding-top: 8px;
        }
        .fc-custom-theme .fc-daygrid-day-number {
           font-size: 12px;
           font-weight: 500;
           color: hsl(var(--foreground) / 0.8);
           text-decoration: none !important;
        }
        /* ==== REMOVER FUNDO AMARELO (HOJE) NA VISÃO DE DIA ==== */
        /* O FullCalendar pinta a coluna de "hoje" de amarelo. Como no dia só tem 1 coluna, a tela inteira fica amarela. */
        .fc-custom-theme .fc-timeGridDay-view .fc-day-today,
        .fc-custom-theme .fc-timeGridDay-view .fc-col-header-cell.fc-day-today {
           background-color: transparent !important;
        }
        /* ==== LINHA DO TEMPO (NOW INDICATOR) MAIS ELEGANTE E VERMELHA ==== */
        .fc-now-indicator-line {
          border-top-width: 2px !important;
          border-color: #ef4444 !important; /* Vermelho elegante (Tailwind red-500) */
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
          z-index: 10 !important;
        }
        .fc-now-indicator-arrow {
          border-width: 6px !important;
          border-color: transparent transparent transparent #ef4444 !important;
          border-top-color: transparent !important;
          border-bottom-color: transparent !important;
          margin-top: -5px !important;
          z-index: 10 !important;
          filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.5));
        }
      `}</style>

         <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridDay"
            locale={ptBrLocale}
            events={allEvents}
            editable={viewMode !== "month"}
            eventStartEditable={viewMode !== "month"}
            eventDurationEditable={false} // don't resize duration
            slotMinTime={`${startHour.toString().padStart(2, "0")}:00:00`}
            slotMaxTime={`${Math.min(24, endHour + 1).toString().padStart(2, "0")}:00:00`}
            slotDuration="00:30:00"
            views={{
               timeGridThreeDay: {
                  type: 'timeGrid',
                  duration: { days: 3 },
                  buttonText: '3 Dias'
               }
            }}
            allDaySlot={false}
            nowIndicator={true}
            stickyHeaderDates={true}
            fixedWeekCount={false}
            dayMaxEvents={3}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            dayHeaders={viewMode !== "day"} // Esconde o cabeçalho no modo Dia
            dayHeaderContent={(args) => {
               const dayName = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(args.date).replace('.', '');

               if (viewMode === "month") {
                  // No mês, o cabeçalho é SÓ o nome da semana
                  return (
                     <div className="flex items-center justify-center py-2">
                        <span className="text-xs uppercase font-semibold text-muted-foreground">{dayName}.</span>
                     </div>
                  );
               }

               // Na semana, é o nome em cima e o número embaixo
               const dayNumber = args.date.getDate();
               return (
                  <div className="flex flex-col items-center justify-center space-y-0.5 pt-1">
                     <span className="text-[10px] uppercase font-semibold text-muted-foreground">{dayName}.</span>
                     <span className="text-lg font-medium text-foreground opacity-90">{dayNumber}</span>
                  </div>
               );
            }}
            eventContent={renderEventContent}
         />
      </div>
   );
}

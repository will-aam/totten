"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { AgendaFilterForm } from "./agenda-filters";
import { getTeam } from "@/app/actions/team";
import { apiClient } from "@/lib/api-client";
import { Couch } from "@/components/icons/couch";
import { cn } from "@/lib/utils";

interface AgendaSidebarProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
  onCreateClick: () => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  isOpen?: boolean;
  isWaitingRoomOpen?: boolean;
  onToggleWaitingRoom?: () => void;
  waitingCount?: number;
  isWaitingRoomEnabled?: boolean;
}

export function AgendaSidebar({
  filters,
  onFiltersChange,
  onCreateClick,
  selectedDate,
  onSelectDate,
  isOpen = true,
  isWaitingRoomOpen = false,
  onToggleWaitingRoom,
  waitingCount = 0,
  isWaitingRoomEnabled: isWaitingRoomEnabledProp,
}: AgendaSidebarProps) {
  const { data: session } = useSession();
  const isOwner = session?.user?.role === "OWNER";

  const [team, setTeam] = useState<{ id: string; display_name: string | null }[]>([]);
  const { data: servicesResponse } = useSWR<any>("services?active=true", apiClient);
  const services = Array.isArray(servicesResponse) ? servicesResponse : servicesResponse?.data || [];

  const { data: clientsResponse } = useSWR<any>("clients?limit=1000&active=true", apiClient);
  const clients = Array.isArray(clientsResponse) ? clientsResponse : clientsResponse?.data || [];

  const { data: settings } = useSWR<any>("settings", apiClient);

  useEffect(() => {
    async function fetchTeam() {
      if (isOwner) {
        const res = await getTeam();
        if (res.success && res.data) {
          setTeam(res.data);
        }
      }
    }
    fetchTeam();
  }, [isOwner]);

  const [month, setMonth] = useState<Date>(selectedDate);

  const nextMonth = () => {
    const next = addMonths(month, 1);
    setMonth(next);
    onSelectDate(next);
  };
  const prevMonth = () => {
    const prev = subMonths(month, 1);
    setMonth(prev);
    onSelectDate(prev);
  };

  const isWaitingRoomEnabled = isWaitingRoomEnabledProp ?? (settings?.autoCompleteOnCheckin === false);

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 bg-background overflow-y-auto overflow-x-hidden custom-scrollbar h-full relative z-10 p-4 gap-6 transition-[width,padding,opacity] duration-300 ease-in-out ${
        isOpen ? "w-[17rem] xl:w-[18rem] opacity-100" : "w-0 px-0 opacity-0 pointer-events-none"
      }`}
    >
      {/* Botão Sala de Espera no Desktop (acima do calendário) - Apenas se autoCompleteOnCheckin for false */}
      {isWaitingRoomEnabled && (
        <div className="px-2 pt-1">
          <Button
            variant={isWaitingRoomOpen ? "default" : "outline"}
            onClick={onToggleWaitingRoom}
            className={cn(
              "w-full flex items-center justify-between px-3 h-10 rounded-2xl transition-all font-bold text-xs shadow-xs border",
              isWaitingRoomOpen
                ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-600 shadow-purple-600/20"
                : "hover:bg-muted text-muted-foreground hover:text-foreground border-border/60",
              waitingCount !== undefined && waitingCount > 0 && !isWaitingRoomOpen && "border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 bg-purple-50/50 dark:bg-purple-950/20"
            )}
            title={isWaitingRoomOpen ? "Voltar para Grade da Agenda" : "Abrir Sala de Espera"}
          >
            <div className="flex items-center gap-2.5">
              <Couch size={18} className="shrink-0" />
              <span>{isWaitingRoomOpen ? "Voltar para Agenda" : "Sala de Espera"}</span>
            </div>
            {waitingCount !== undefined && waitingCount > 0 && (
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-black",
                  isWaitingRoomOpen ? "bg-white text-purple-700" : "bg-purple-600 text-white"
                )}
              >
                {waitingCount}
              </span>
            )}
          </Button>
        </div>
      )}

      <div className="flex flex-col px-2 min-w-[15rem]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-sm capitalize pl-2">
            {format(month, "MMMM 'de' yyyy", { locale: ptBR })}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
              <ChevronLeft size={16} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>

        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(day) => {
            if (day) onSelectDate(day);
          }}
          month={month}
          onMonthChange={(newMonth) => {
            setMonth(newMonth);
            onSelectDate(newMonth);
          }}
          locale={ptBR}
          className="p-0 border-none pointer-events-auto"
          classNames={{
            months: "w-full",
            month: "w-full space-y-4",
            table: "w-full border-collapse space-y-1",
            head_row: "flex w-full",
            head_cell: "text-muted-foreground w-8 font-normal text-[0.8rem] text-center",
            row: "flex w-full mt-2",
            cell: "text-center text-sm relative p-0 hover:bg-muted focus-within:relative focus-within:z-20 h-8 w-8 rounded-full flex items-center justify-center",
            day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 flex items-center justify-center rounded-full transition-colors",
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground",
            day_outside: "text-muted-foreground opacity-50",
            day_disabled: "text-muted-foreground opacity-50",
            day_hidden: "invisible",
            nav: "hidden",
            month_caption: "hidden"
          }}
        />
      </div>

      <div className="px-2 pb-6">
        <AgendaFilterForm
          filters={filters}
          onFiltersChange={onFiltersChange}
          isOwner={isOwner}
          team={team}
          services={services}
          session={session}
          clients={clients}
          settings={settings}
        />
      </div>
    </aside>
  );
}

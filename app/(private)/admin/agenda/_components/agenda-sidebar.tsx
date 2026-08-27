"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { Plus, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { AgendaFilterForm } from "./agenda-filters";
import { getTeam } from "@/app/actions/team";
import { apiClient } from "@/lib/api-client";

interface AgendaSidebarProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
  onCreateClick: () => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  isOpen?: boolean;
}

export function AgendaSidebar({
  filters,
  onFiltersChange,
  onCreateClick,
  selectedDate,
  onSelectDate,
  isOpen = true,
}: AgendaSidebarProps) {
  const { data: session } = useSession();
  const isOwner = session?.user?.role === "OWNER";
  
  const [team, setTeam] = useState<{ id: string; display_name: string | null }[]>([]);
  const { data: servicesResponse } = useSWR<any>("services?active=true", apiClient);
  const services = Array.isArray(servicesResponse) ? servicesResponse : servicesResponse?.data || [];

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

  const nextMonth = () => setMonth(addMonths(month, 1));
  const prevMonth = () => setMonth(subMonths(month, 1));

  return (
    <aside 
      className={`hidden md:flex flex-col shrink-0 bg-background overflow-y-auto overflow-x-hidden custom-scrollbar h-full relative z-10 p-4 gap-6 transition-[width,padding,opacity] duration-300 ease-in-out ${
        isOpen ? "w-[17rem] xl:w-[18rem] opacity-100" : "w-0 px-0 opacity-0 pointer-events-none"
      }`}
    >
      <div className="px-2 pt-2 whitespace-nowrap">
        <Button 
          onClick={onCreateClick}
          className="rounded-full shadow-[0_1px_3px_1px_rgba(0,0,0,0.15)] hover:shadow-[0_2px_6px_2px_rgba(0,0,0,0.15)] transition-shadow flex items-center gap-2 px-6 py-7 font-medium text-base bg-background border-none text-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <div className="flex items-center gap-3">
            <Plus size={32} className="text-foreground" strokeWidth={2.5} />
            <span className="text-[1.05rem]">Criar</span>
          </div>
        </Button>
      </div>

      <div className="flex flex-col px-2 min-w-[15rem]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-sm capitalize pl-2">
            {format(month, "MMMM 'de' yyyy", { locale: ptBR })}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={prevMonth}>
              <ChevronLeft size={16} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={nextMonth}>
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
          onMonthChange={setMonth}
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
            nav: "hidden", // We use custom nav above
            month_caption: "hidden" // We use custom caption above
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
        />
      </div>
    </aside>
  );
}

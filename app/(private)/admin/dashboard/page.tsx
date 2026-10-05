"use client";

import { useState, useEffect } from "react";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
import { DashboardCards } from "./_components/dashboard-cards";
import { RecentCheckIns } from "./_components/recent-checkins";
import { SchedulingLink } from "./_components/scheduling-link";
import { AverageTicket } from "./_components/average-ticket";
import { ClientRanking } from "./_components/client-ranking";
import { BusiestHours } from "./_components/busiest-hours";
import { AppointmentsHeatmap } from "./_components/appointments-heatmap";
import { DashboardCustomizer, type WidgetConfig } from "./_components/dashboard-customizer";

const WIDGET_COMPONENTS: Record<string, React.ComponentType<any>> = {
  heatmap: AppointmentsHeatmap,
  scheduling: SchedulingLink,
  busiest_hours: BusiestHours,
  ticket: AverageTicket,
  ranking: ClientRanking,
  checkins: RecentCheckIns,
};

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "heatmap", name: "Mapa de Calor", visible: true },
  { id: "scheduling", name: "Link de Agendamento", visible: true },
  { id: "busiest_hours", name: "Horários Movimentados", visible: true },
  { id: "ticket", name: "Ticket Médio", visible: true },
  { id: "ranking", name: "Ranking de Clientes", visible: true },
  { id: "checkins", name: "Check-ins Recentes", visible: true },
];

import useSWR from "swr";
import { apiClient } from "@/lib/api-client";

export default function AdminDashboardPage() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [mounted, setMounted] = useState(false);

  const { data: widgetsData } = useSWR<Record<string, any>>("dashboard/widgets", apiClient);
  const { data: layoutData } = useSWR<{ layout: WidgetConfig[] | null }>("dashboard/layout", apiClient);

  useEffect(() => {
    setMounted(true);
    if (layoutData !== undefined) {
      if (layoutData?.layout && Array.isArray(layoutData.layout)) {
        setWidgets(layoutData.layout);
      } else {
        // Fallback for first time users
        setWidgets(DEFAULT_WIDGETS);
      }
    }
  }, [layoutData]);

  const handleSaveWidgets = async (newWidgets: WidgetConfig[]) => {
    setWidgets(newWidgets);
    try {
      await fetch('/api/dashboard/layout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout: newWidgets })
      });
    } catch (err) {
      console.error("Failed to save layout", err);
    }
  };

  if (!mounted) return null; // Evita hidration mismatch

  return (
    <>
      <AdminHeader 
        title="Dashboard" 
        action={
          <DashboardCustomizer widgets={widgets} onSave={handleSaveWidgets} />
        }
      />

      {/* Container Principal */}
      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-[1600px] mx-auto w-full pb-24 md:pb-6 relative">
        <DashboardCards />

        {/* 
          Grid para os novos componentes e check-ins.
        */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-2">
          {widgets.filter(w => w.visible).map(widget => {
            const Component = WIDGET_COMPONENTS[widget.id];
            if (!Component) return null;

            return (
              <div key={widget.id} className="flex flex-col h-[350px]">
                <Component data={widgetsData?.[widget.id === 'busiest_hours' ? 'busiestHours' : widget.id]} />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

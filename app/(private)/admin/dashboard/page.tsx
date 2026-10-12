"use client";

import { useState, useEffect, Fragment } from "react";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
import { DashboardCards } from "./_components/dashboard-cards";
import { RecentCheckIns } from "./_components/recent-checkins";
import { SchedulingLink } from "./_components/scheduling-link";
import { AverageTicket } from "./_components/average-ticket";
import { ClientRanking } from "./_components/client-ranking";
import { BusiestHours } from "./_components/busiest-hours";
import { AppointmentsVolume } from "./_components/appointments-volume";
import { AppointmentsHeatmap } from "./_components/appointments-heatmap";
import { DashboardCustomizer, type WidgetConfig } from "./_components/dashboard-customizer";

const WIDGET_COMPONENTS: Record<string, React.ComponentType<any>> = {
  appointments_volume: AppointmentsVolume,
  heatmap: AppointmentsHeatmap,
  scheduling: SchedulingLink,
  busiest_hours: BusiestHours,
  ticket: AverageTicket,
  ranking: ClientRanking,
  checkins: RecentCheckIns,
};

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "appointments_volume", name: "Volume de Agendamentos", visible: true },
  { id: "heatmap", name: "Mapa de Calor", visible: true },
  { id: "scheduling", name: "Link de Agendamento", visible: true },
  { id: "busiest_hours", name: "Horários Movimentados", visible: true },
  { id: "ticket", name: "Ticket Médio", visible: true },
  { id: "ranking", name: "Ranking de Clientes", visible: true },
  { id: "checkins", name: "Check-ins Recentes", visible: true },
];

import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

export default function AdminDashboardPage() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [mounted, setMounted] = useState(false);
  const [cols, setCols] = useState(3);

  const { data: widgetsData } = useSWR<Record<string, any>>("dashboard/widgets", apiClient);
  const { data: layoutData } = useSWR<{ layout: WidgetConfig[] | null }>("dashboard/layout", apiClient);

  useEffect(() => {
    setMounted(true);
    if (layoutData !== undefined) {
      if (layoutData?.layout && Array.isArray(layoutData.layout)) {
        const savedIds = new Set(layoutData.layout.map((w: any) => w.id));
        const missingWidgets = DEFAULT_WIDGETS.filter((w) => !savedIds.has(w.id));
        setWidgets([...layoutData.layout, ...missingWidgets]);
      } else {
        // Fallback for first time users
        setWidgets(DEFAULT_WIDGETS);
      }
    }
  }, [layoutData]);

  useEffect(() => {
    const updateCols = () => {
      if (window.innerWidth < 768) setCols(1); // mobile
      else if (window.innerWidth < 1280) setCols(2); // tablet (md to xl)
      else setCols(3); // desktop (xl and up)
    };
    updateCols(); // initial call
    window.addEventListener("resize", updateCols);
    return () => window.removeEventListener("resize", updateCols);
  }, []);

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

  // Chunk visible widgets into rows based on screen size
  const visibleWidgets = widgets.filter(w => w.visible);
  const chunkedWidgets: WidgetConfig[][] = [];
  for (let i = 0; i < visibleWidgets.length; i += cols) {
    chunkedWidgets.push(visibleWidgets.slice(i, i + cols));
  }

  const getWidgetData = (id: string) => {
    if (id === "busiest_hours") return widgetsData?.busiestHours;
    if (id === "appointments_volume") return widgetsData?.appointmentsVolume;
    return widgetsData?.[id];
  };

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
          Grid Responsivo com Paineis Redimensionáveis
        */}
        <div className="flex flex-col gap-12 mt-2 w-full">
          {chunkedWidgets.map((chunk, rowIndex) => (
            cols === 1 ? (
              // MOBILE: Empilhado normalmente, sem redimensionamento horizontal
              <div key={`row-${rowIndex}`} className="flex flex-col gap-12">
                {chunk.map(widget => {
                  const Component = WIDGET_COMPONENTS[widget.id];
                  if (!Component) return null;
                  return (
                    <div key={widget.id} className="flex flex-col h-[350px] w-full">
                      <Component data={getWidgetData(widget.id)} />
                    </div>
                  );
                })}
              </div>
            ) : (
              // DESKTOP/TABLET: Resizable Panels
              <ResizablePanelGroup 
                direction="horizontal" 
                key={`row-${rowIndex}`}
                className="w-full flex min-h-[350px] overflow-visible"
              >
                {chunk.map((widget, index) => {
                  const Component = WIDGET_COMPONENTS[widget.id];
                  if (!Component) return null;
                  
                  return (
                    <Fragment key={widget.id}>
                      <ResizablePanel 
                        defaultSize={100 / cols} 
                        minSize={20} // Limite mínimo para não quebrar os gráficos
                        className="flex flex-col relative h-[350px] px-3 first:pl-0 last:pr-0 overflow-visible"
                      >
                        <Component data={getWidgetData(widget.id)} />
                      </ResizablePanel>
                      
                      {index < chunk.length - 1 && (
                        <ResizableHandle 
                          withHandle={false}
                          className="w-px !bg-transparent bg-gradient-to-b from-transparent via-border/50 to-transparent transition-colors hover:via-primary/50 cursor-col-resize after:w-6" 
                        />
                      )}
                    </Fragment>
                  );
                })}
              </ResizablePanelGroup>
            )
          ))}
        </div>
      </div>
    </>
  );
}

"use client";

import { useState, useEffect, Fragment } from "react";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
import { DashboardCards } from "./_components/dashboard-cards";
import { DailyKickoffBanner } from "./_components/daily-kickoff-banner";
import { PushNotificationModal } from "./_components/push-notification-modal";
import { RecentCheckIns } from "./_components/recent-checkins";
import { SchedulingLink } from "./_components/scheduling-link";
import { AverageTicket } from "./_components/average-ticket";
import { ClientRanking } from "./_components/client-ranking";
import { BusiestHours } from "./_components/busiest-hours";
import { AppointmentsVolume } from "./_components/appointments-volume";
import { AppointmentsHeatmap } from "./_components/appointments-heatmap";
import { DashboardCustomizer, type WidgetConfig } from "./_components/dashboard-customizer";
import { Skeleton } from "@/components/ui/skeleton";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

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

export default function AdminDashboardPage() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [mounted, setMounted] = useState(false);
  const [cols, setCols] = useState(3);

  // Consultas com deduplicação inteligente e foco na economia de requisições
  const { data: widgetsData } = useSWR<Record<string, any>>(
    "dashboard/widgets",
    apiClient,
    {
      revalidateOnFocus: true,
      dedupingInterval: 15000,
    },
  );
  const { data: layoutData } = useSWR<{ layout: WidgetConfig[] | null }>(
    "dashboard/layout",
    apiClient,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    },
  );

  useEffect(() => {
    setMounted(true);
    if (layoutData !== undefined) {
      if (layoutData?.layout && Array.isArray(layoutData.layout)) {
        const savedIds = new Set(layoutData.layout.map((w: any) => w.id));
        const missingWidgets = DEFAULT_WIDGETS.filter((w) => !savedIds.has(w.id));
        setWidgets([...layoutData.layout, ...missingWidgets]);
      } else {
        // Fallback para primeiro acesso
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

  // SSR Skeleton Fallback Progressivo (evita tela branca e layout flash)
  if (!mounted) {
    return (
      <>
        <AdminHeader title="Dashboard" />
        <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 md:pb-6 relative animate-in fade-in duration-500 min-h-[calc(100vh-100px)]">
          <div className="flex overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scroll-smooth md:grid md:grid-cols-4 md:overflow-visible md:pb-0 md:px-0 md:mx-0 gap-4 [&::-webkit-scrollbar]:hidden">
            <Skeleton className="h-32 min-w-[85vw] md:min-w-0 snap-center rounded-2xl shrink-0" />
            <Skeleton className="h-32 min-w-[85vw] md:min-w-0 snap-center rounded-2xl shrink-0" />
            <Skeleton className="h-32 min-w-[85vw] md:min-w-0 snap-center rounded-2xl shrink-0" />
            <Skeleton className="h-32 min-w-[85vw] md:min-w-0 snap-center rounded-2xl shrink-0" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-2 w-full">
            <Skeleton className="h-[350px] w-full rounded-2xl" />
            <Skeleton className="h-[350px] w-full rounded-2xl" />
            <Skeleton className="h-[350px] w-full rounded-2xl" />
          </div>
        </div>
      </>
    );
  }

  // Separar em linhas respeitando widgets que exigem linha inteira (ex: checkins)
  const visibleWidgets = widgets.filter(w => w.visible);
  const rows: { isFullWidth: boolean; widgets: WidgetConfig[] }[] = [];
  let currentRow: WidgetConfig[] = [];

  for (const widget of visibleWidgets) {
    if (widget.id === "checkins") {
      if (currentRow.length > 0) {
        rows.push({ isFullWidth: false, widgets: currentRow });
        currentRow = [];
      }
      rows.push({ isFullWidth: true, widgets: [widget] });
    } else {
      currentRow.push(widget);
      if (currentRow.length === cols) {
        rows.push({ isFullWidth: false, widgets: currentRow });
        currentRow = [];
      }
    }
  }

  if (currentRow.length > 0) {
    rows.push({ isFullWidth: false, widgets: currentRow });
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
      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 md:pb-6 relative animate-in fade-in duration-500 min-h-[calc(100vh-100px)]">
        <PushNotificationModal />
        <DailyKickoffBanner />
        <DashboardCards />

        {/* 
          Grid Responsivo com Paineis Redimensionáveis e suporte a Linha Inteira Dinâmica
        */}
        <div className="flex flex-col gap-12 mt-2 w-full">
          {rows.map((row, rowIndex) => {
            if (row.isFullWidth) {
              const widget = row.widgets[0];
              const Component = WIDGET_COMPONENTS[widget.id];
              if (!Component) return null;

              return (
                <div key={`full-${widget.id}-${rowIndex}`} className="w-full flex flex-col min-h-[350px]">
                  <Component data={getWidgetData(widget.id)} />
                </div>
              );
            }

            return cols === 1 ? (
              // MOBILE: Empilhado normalmente, sem redimensionamento horizontal
              <div key={`row-${rowIndex}`} className="flex flex-col gap-12">
                {row.widgets.map(widget => {
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
                {row.widgets.map((widget, index) => {
                  const Component = WIDGET_COMPONENTS[widget.id];
                  if (!Component) return null;
                  
                  return (
                    <Fragment key={widget.id}>
                      <ResizablePanel 
                        defaultSize={100 / row.widgets.length} 
                        minSize={20} // Limite mínimo para não quebrar os gráficos
                        className="flex flex-col relative h-[350px] px-3 first:pl-0 last:pr-0 overflow-visible"
                      >
                        <Component data={getWidgetData(widget.id)} />
                      </ResizablePanel>
                      
                      {index < row.widgets.length - 1 && (
                        <ResizableHandle 
                          withHandle={false}
                          className="w-px !bg-transparent bg-gradient-to-b from-transparent via-border/50 to-transparent transition-colors hover:via-primary/50 cursor-col-resize after:w-6" 
                        />
                      )}
                    </Fragment>
                  );
                })}
              </ResizablePanelGroup>
            );
          })}
        </div>
      </div>
    </>
  );
}

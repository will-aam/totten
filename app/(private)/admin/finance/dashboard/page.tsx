// app/(private)/admin/finance/dashboard/page.tsx
"use client";

import { useState, useEffect, Fragment } from "react";
import useSWR from "swr";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { apiClient } from "@/lib/api-client";

// Importações dos Componentes Financeiros
import { FinanceKpiCards } from "../_components/finance-kpi-cards";
import { FinanceHeroChart } from "../_components/finance-hero-chart";
import { FinanceComparisonChart } from "../_components/finance-comparison-chart";
import { FinanceTopServices } from "../_components/finance-top-services";
import { FinanceAverageTicket } from "../_components/finance-average-ticket";
import { FinancePaymentMethodsChart } from "../_components/finance-payment-methods-chart";
import { FinanceRecentTransactionsWidget } from "../_components/finance-recent-transactions-widget";
import { FinanceSpeedDial } from "../_components/finance-speed-dial";
import {
  FinanceCustomizer,
  DEFAULT_FINANCE_WIDGETS,
  type FinanceWidgetConfig,
} from "../_components/finance-customizer";

const FINANCE_WIDGET_COMPONENTS: Record<string, React.ComponentType<any>> = {
  hero_chart: FinanceHeroChart,
  comparison_chart: FinanceComparisonChart,
  top_services: FinanceTopServices,
  ticket: FinanceAverageTicket,
  monthly_revenue: FinanceAverageTicket, // Fallback transparente para layouts legados
  payment_methods: FinancePaymentMethodsChart,
  recent_transactions: FinanceRecentTransactionsWidget,
};

import {
  FinanceVisibilityProvider,
  useFinanceVisibility,
} from "../_components/finance-visibility-context";
import { Eye, EyeOff } from "lucide-react";

function FinanceHideValuesButton() {
  const { hideValues, toggleHideValues } = useFinanceVisibility();
  return (
    <button
      type="button"
      onClick={toggleHideValues}
      className="p-1 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-muted/50 transition-colors"
      title={hideValues ? "Mostrar valores" : "Ocultar valores"}
      aria-label={hideValues ? "Mostrar valores" : "Ocultar valores"}
    >
      {hideValues ? (
        <EyeOff className="h-4 w-4 text-primary" />
      ) : (
        <Eye className="h-4 w-4" />
      )}
    </button>
  );
}

export default function FinanceDashboardPage() {
  return (
    <FinanceVisibilityProvider>
      <FinanceDashboardContent />
    </FinanceVisibilityProvider>
  );
}

function FinanceDashboardContent() {
  const [widgets, setWidgets] = useState<FinanceWidgetConfig[]>([]);
  const [mounted, setMounted] = useState(false);
  const [cols, setCols] = useState(1);

  const { data: layoutData } = useSWR<{ layout: FinanceWidgetConfig[] | null }>(
    "dashboard/finance-layout",
    apiClient,
  );

  useEffect(() => {
    setMounted(true);
    if (layoutData !== undefined) {
      if (layoutData?.layout && Array.isArray(layoutData.layout)) {
        // Migra ocorrência antiga de monthly_revenue para ticket (fixo)
        const mappedLayout = layoutData.layout.map((w: any) => {
          if (w.id === "monthly_revenue") {
            return { id: "ticket", name: "Ticket Médio", visible: true };
          }
          if (w.id === "ticket") {
            return { ...w, visible: true };
          }
          return w;
        });

        // Remove eventuais duplicatas de id
        const seenIds = new Set<string>();
        const uniqueLayout = mappedLayout.filter((w: any) => {
          if (seenIds.has(w.id)) return false;
          seenIds.add(w.id);
          return true;
        });

        const savedIds = new Set(uniqueLayout.map((w: any) => w.id));
        const missingWidgets = DEFAULT_FINANCE_WIDGETS.filter(
          (w) => !savedIds.has(w.id),
        );
        const finalWidgets = [...uniqueLayout, ...missingWidgets].map((w) =>
          w.id === "ticket" ? { ...w, visible: true } : w,
        );
        setWidgets(finalWidgets);
      } else {
        // Fallback inicial
        setWidgets(DEFAULT_FINANCE_WIDGETS);
      }
    }
  }, [layoutData]);

  useEffect(() => {
    const updateCols = () => {
      if (window.innerWidth < 1024) setCols(1); // mobile & tablet
      else setCols(2); // desktop (2 colunas para gráficos financeiros espaçosos)
    };
    updateCols();
    window.addEventListener("resize", updateCols);
    return () => window.removeEventListener("resize", updateCols);
  }, []);

  const handleSaveWidgets = async (newWidgets: FinanceWidgetConfig[]) => {
    setWidgets(newWidgets);
    try {
      await fetch("/api/dashboard/finance-layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layout: newWidgets }),
      });
    } catch (err) {
      console.error("Failed to save finance layout", err);
    }
  };

  if (!mounted) return null;

  // Filtrar widgets visíveis
  const visibleWidgets = widgets.filter((w) => w.visible);

  // Separar hero_chart caso esteja visível para renderizá-lo em largura total no topo ou dentro do fluxo
  // Para manter máxima flexibilidade de ordenação e grid estilo dashboard principal:
  const chunkedWidgets: FinanceWidgetConfig[][] = [];
  for (let i = 0; i < visibleWidgets.length; i += cols) {
    chunkedWidgets.push(visibleWidgets.slice(i, i + cols));
  }

  return (
    <>
      <AdminHeader
        title="Financeiro"
        titleAddon={<FinanceHideValuesButton />}
        action={
          <FinanceCustomizer
            widgets={widgets}
            onSave={handleSaveWidgets}
          />
        }
      />

      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 md:pb-6 relative animate-in fade-in duration-300">
        {/* KPIs no padrão idêntico ao dashboard principal */}
        <FinanceKpiCards />

        {/* Grid de Gráficos Customizável com Resizable Panels no Desktop */}
        {/* Grid de Gráficos Customizável com Resizable Panels no Desktop */}
        <div className="flex flex-col gap-12 mt-2 w-full">
          {chunkedWidgets.map((chunk, rowIndex) =>
            cols === 1 ? (
              // MOBILE / TABLET: Empilhado normalmente
              <div key={`row-${rowIndex}`} className="flex flex-col gap-12 w-full">
                {chunk.map((widget) => {
                  const Component = FINANCE_WIDGET_COMPONENTS[widget.id];
                  if (!Component) return null;
                  const isFullHero = widget.id === "hero_chart";
                  return (
                    <div
                      key={widget.id}
                      className={`flex flex-col w-full ${
                        isFullHero ? "min-h-[360px] sm:h-[350px]" : "min-h-[350px] h-auto sm:h-[350px]"
                      }`}
                    >
                      <Component />
                    </div>
                  );
                })}
              </div>
            ) : (
              // DESKTOP: Resizable Panels
              <ResizablePanelGroup
                direction="horizontal"
                key={`row-${rowIndex}`}
                className="w-full flex min-h-[350px] overflow-visible"
              >
                {chunk.map((widget, index) => {
                  const Component = FINANCE_WIDGET_COMPONENTS[widget.id];
                  if (!Component) return null;
                  const isSingle = chunk.length === 1;

                  return (
                    <Fragment key={widget.id}>
                      <ResizablePanel
                        defaultSize={isSingle ? 100 : 50}
                        minSize={25}
                        className="flex flex-col relative h-[350px] px-3 first:pl-0 last:pr-0 overflow-visible"
                      >
                        <Component />
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
            ),
          )}
        </div>
      </div>

      <FinanceSpeedDial />
    </>
  );
}

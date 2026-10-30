// app/(private)/admin/finance/_components/finance-hero-chart.tsx
"use client";

import { useState, useRef } from "react";
import useSWR from "swr";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Loader2,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getFinanceChartData,
  type TimeframeOption,
  type FinanceChartData,
} from "@/app/actions/finance-chart";
import { cn } from "@/lib/utils";

const TIMEFRAMES: { key: TimeframeOption; label: string }[] = [
  { key: "4h", label: "4 Horas" },
  { key: "1d", label: "1 Dia" },
  { key: "1w", label: "1 Sem" },
  { key: "1m", label: "1 Mês" },
  { key: "1y", label: "1 Ano" },
];

import { useFinanceVisibility } from "./finance-visibility-context";

export function FinanceHeroChart() {
  const { hideValues, viewMode } = useFinanceVisibility();
  const [timeframe, setTimeframe] = useState<TimeframeOption>("1m");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useSWR<FinanceChartData>(
    ["finance-hero-chart", timeframe, viewMode],
    ([, tf, vm]: [string, TimeframeOption, any]) => getFinanceChartData(tf, vm),
    {
      keepPreviousData: true,
    },
  );

  const points = data?.points || [];
  const comparisonLabel = data?.comparisonLabel || "Período anterior";

  const formatCurrency = (val: number) => {
    if (hideValues) return "••••••";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  const handleScrollMobile = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const delta = direction === "left" ? -240 : 240;
    scrollContainerRef.current.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div className="w-full h-full flex flex-col justify-between transition-all">
      <div className="w-full flex flex-col gap-3 flex-1 justify-between">
        {/* Topo no padrão exato dos dashboards do sistema */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Painel Consolidado de Receita
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Acompanhamento de receita realizada comparada ao {comparisonLabel.toLowerCase()}.
            </p>
          </div>

          {/* Valor Principal + Comparativo */}
          <div className="flex flex-col items-start sm:items-end self-start sm:self-auto shrink-0">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {isLoading && !data ? (
                <span className="inline-flex items-center gap-1.5 text-muted-foreground text-xl font-bold">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
                </span>
              ) : (
                formatCurrency(data?.totalRevenue || 0)
              )}
            </span>

            {data && !hideValues && (
              <div
                className={cn(
                  "flex items-center font-bold text-xs mt-0.5 whitespace-nowrap",
                  data.isPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400",
                )}
              >
                {data.isPositive ? (
                  <TrendingUp className="h-3.5 w-3.5 mr-1 inline shrink-0" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 mr-1 inline shrink-0" />
                )}
                <span>
                  {data.isPositive ? "+" : ""}
                  {formatCurrency(data.absoluteChange)}
                </span>
                <span className="ml-1 opacity-80 text-[11px]">
                  ({data.isPositive ? "+" : ""}
                  {data.percentChange.toFixed(1)}%)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 
          Container do Gráfico com Rolagem Suave no Mobile
        */}
        <div className="relative w-full">
          {/* Controles de navegação para mobile */}
          <div className="flex md:hidden items-center justify-between text-[11px] text-muted-foreground pb-1 px-1">
            <span className="flex items-center gap-1">
              Deslize para ver os meses →
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleScrollMobile("left")}
                className="p-1 rounded-full bg-muted/70 hover:bg-muted text-foreground"
                aria-label="Rolar para esquerda"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => handleScrollMobile("right")}
                className="p-1 rounded-full bg-muted/70 hover:bg-muted text-foreground"
                aria-label="Rolar para direita"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div
            ref={scrollContainerRef}
            className="w-full overflow-x-auto pb-1 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="min-w-[620px] md:min-w-full h-44 sm:h-52 md:h-56 w-full relative">
              <ResponsiveContainer width="100%" height="100%" minHeight={160}>
                <ComposedChart
                  data={points}
                  margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  {/* Eixo X com labels limpos e espaçados */}
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#71717a", fontSize: 11, fontWeight: 500 }}
                    dy={6}
                    interval={0}
                  />

                  <YAxis domain={["auto", "auto"]} hide={true} />

                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-border/80 bg-popover/95 p-2.5 shadow-lg backdrop-blur-md text-xs animate-in fade-in zoom-in-95">
                            <div className="flex items-center gap-1.5 text-muted-foreground font-medium mb-1.5">
                              <Calendar className="h-3 w-3" />
                              <span>{item.fullDate || item.date}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 mb-1">
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                Período atual:
                              </span>
                              <span className="font-bold text-foreground">
                                {formatCurrency(item.revenue)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-muted-foreground flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 border border-muted-foreground/60" />
                                {comparisonLabel}:
                              </span>
                              <span className="font-medium text-muted-foreground">
                                {formatCurrency(item.previousRevenue || 0)}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  {/* Linha e gradiente principal do período atual */}
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Período Atual"
                    stroke="#10b981"
                    strokeWidth={2.25}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    activeDot={{
                      r: 5,
                      fill: "#ffffff",
                      stroke: "#10b981",
                      strokeWidth: 2.5,
                    }}
                  />

                  {/* Linha tracejada do período anterior (Mês anterior / Ano anterior) */}
                  <Line
                    type="monotone"
                    dataKey="previousRevenue"
                    name={comparisonLabel}
                    stroke="#94a3b8"
                    strokeWidth={1.75}
                    strokeDasharray="4 4"
                    dot={{
                      r: 3.5,
                      fill: "#ffffff",
                      stroke: "#94a3b8",
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 5,
                      fill: "#ffffff",
                      stroke: "#64748b",
                      strokeWidth: 2.5,
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Linha divisora sutil */}
        <div className="w-full h-px border-t border-dashed border-border/50" />

        {/* Controles de Timeframe e Legenda */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-1 sm:gap-1.5 w-full justify-between sm:justify-start">
            {TIMEFRAMES.map((tf) => {
              const active = timeframe === tf.key;
              return (
                <button
                  key={tf.key}
                  type="button"
                  onClick={() => setTimeframe(tf.key)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0",
                    active
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                  )}
                >
                  {tf.label}
                </button>
              );
            })}
          </div>

          {/* Legenda visual sutil */}
          <div className="hidden sm:flex items-center gap-4 text-[11px] text-muted-foreground font-medium shrink-0 pl-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
              <span className="text-foreground font-semibold">Atual</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                <span className="w-2.5 h-0.5 border-t border-dashed border-slate-400" />
                <span className="h-2 w-2 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-400" />
                <span className="w-2.5 h-0.5 border-t border-dashed border-slate-400" />
              </div>
              <span className="text-foreground/90 font-medium">{comparisonLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

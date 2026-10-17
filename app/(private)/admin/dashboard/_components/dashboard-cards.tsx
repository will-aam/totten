// app/(private)/admin/dashboard/_components/dashboard-cards.tsx
"use client";

import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarAlt, CalendarCheck, Group, UserX } from "@boxicons/react";
import type { BoxIconProps } from "@boxicons/react";
import { cn } from "@/lib/utils";

// Preparando a interface para a API que vamos ajustar no backend
interface KpiData {
  appointmentsToday: number;
  appointmentsVsYesterday: number; // Ex: +18 ou -5
  checkInsToday: number;
  checkInsPercentage: number; // Ex: 65
  activeClients: number;
  noShowsToday: number;
  pendingRequestsCount?: number;
  totalPixDepositsToday?: number;
}

function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  className,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ForwardRefExoticComponent<
    BoxIconProps & React.RefAttributes<SVGSVGElement>
  >;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border border-border/50 shadow-md bg-card flex flex-col justify-between min-w-[85vw] md:min-w-0 snap-center shrink-0 rounded-2xl dark:border-white/10 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] transition-all",
        className,
      )}
    >
      {/*
        Ícones decorativos ao fundo: a "assinatura" visual do card.
        Usam a cor do texto (foreground) em opacidade bem baixa, então
        se adaptam sozinhos ao tema claro/escuro — nenhuma cor nova entra
        no sistema. `pack="filled"` porque em opacidade tão baixa um ícone
        outline praticamente some; o preenchido mantém a textura visível.
        Ajuste width/height/opacity aqui se quiser mais ou menos densidade.
      */}

      <Icon
        aria-hidden="true"
        pack="filled"
        width={70}
        height={70}
        rotate={-10}
        className="pointer-events-none absolute -right-1 top-1/2 -translate-y-1/2 text-foreground/10"
      />
      <Icon
        aria-hidden="true"
        pack="filled"
        width={34}
        height={34}
        rotate={20}
        className="pointer-events-none absolute right-9 -bottom-3 text-foreground/10"
      />

      <CardHeader className="relative z-10 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-3xl font-bold text-foreground tracking-tight">
          {value}
        </div>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

export function DashboardCards() {
  // Vamos buscar da mesma rota, mas depois ajustaremos o backend dela
  const { data, isLoading } = useSWR<KpiData>("dashboard/kpis", apiClient, {
    refreshInterval: 15000,
  });

  if (isLoading) {
    return (
      <div className="flex overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scroll-smooth md:grid md:grid-cols-4 md:overflow-visible md:pb-0 md:px-0 md:mx-0 gap-4 [&::-webkit-scrollbar]:hidden">
        <Skeleton className="h-32 min-w-[85vw] md:min-w-0 snap-center rounded-2xl shrink-0" />
        <Skeleton className="h-32 min-w-[85vw] md:min-w-0 snap-center rounded-2xl shrink-0" />
        <Skeleton className="h-32 min-w-[85vw] md:min-w-0 snap-center rounded-2xl shrink-0" />
        <Skeleton className="h-32 min-w-[85vw] md:min-w-0 snap-center rounded-2xl shrink-0" />
      </div>
    );
  }

  // Prevenção de nulos caso a API demore a atualizar
  const kpis = data || {
    appointmentsToday: 0,
    appointmentsVsYesterday: 0,
    checkInsToday: 0,
    checkInsPercentage: 0,
    activeClients: 0,
    noShowsToday: 0,
  };

  const vsYesterdayText =
    kpis.appointmentsVsYesterday >= 0
      ? `+${kpis.appointmentsVsYesterday}% em relação a ontem`
      : `${kpis.appointmentsVsYesterday}% em relação a ontem`;

  return (
    <div className="space-y-4">
      {/* Alerta de Solicitações Pendentes (se houver) */}
      {Number(kpis.pendingRequestsCount || 0) > 0 && (
        <div className="p-4 rounded-2xl border bg-amber-500/10 border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
              {kpis.pendingRequestsCount}
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">
                {kpis.pendingRequestsCount === 1 ? "1 nova solicitação de agendamento aguardando aprovação" : `${kpis.pendingRequestsCount} novas solicitações aguardando aprovação`}
              </p>
              {Number(kpis.totalPixDepositsToday || 0) > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Total de sinais Pix recebidos hoje: <strong className="text-green-500">R$ {kpis.totalPixDepositsToday?.toFixed(2)}</strong>
                </p>
              )}
            </div>
          </div>
          <a
            href="/admin/auto/requests"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors shrink-0 shadow-sm"
          >
            Ver Solicitações
          </a>
        </div>
      )}

      <div className="flex overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scroll-smooth md:grid md:grid-cols-4 md:overflow-visible md:pb-0 md:px-0 md:mx-0 gap-4 [&::-webkit-scrollbar]:hidden">
        {/* CARD 1: Agendamentos Hoje */}
        <KpiCard
          title="Agendamentos de Hoje"
          value={kpis.appointmentsToday}
          description={vsYesterdayText}
          icon={CalendarAlt}
        />

        {/* CARD 2: Check-ins Realizados */}
        <KpiCard
          title="Check-ins Realizados"
          value={kpis.checkInsToday}
          description={`${kpis.checkInsPercentage}% dos agendamentos`}
          icon={CalendarCheck}
        />

        {/* CARD 3: Clientes Ativos */}
        <KpiCard
          title="Clientes Ativos"
          value={kpis.activeClients}
          description="Com pacotes em andamento"
          icon={Group}
        />

        {/* CARD 4: Faltas */}
        <KpiCard
          title="Faltas Hoje"
          value={kpis.noShowsToday}
          description="Clientes que não compareceram"
          icon={UserX}
        />
      </div>
    </div>
  );
}

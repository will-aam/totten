// app/admin/dashboard/page.tsx
// Resumo Diário do Admin - Dashboard com KPIs e Lista de Check-ins Recentes
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import Link from "next/link";
import { AdminHeader } from "@/components/admin-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarCheck,
  Users,
  AlertTriangle,
  Clock,
  ArrowUp,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { PendingCheckInsCard } from "@/components/admin/pending-checkins-card";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type CheckIn = {
  id: string;
  client_id: string;
  client_name: string;
  date_time: string;
};

// 2. Componente de KPI
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
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "border-border shadow-sm flex flex-col justify-between",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 bg-primary/10 rounded-full">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
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

// 3. Componente de Item de Lista
function CheckInListItem({ checkIn }: { checkIn: CheckIn }) {
  const date = new Date(checkIn.date_time);
  const formattedDate = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
  const formattedTime = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const initial = checkIn.client_name
    ? checkIn.client_name.charAt(0).toUpperCase()
    : "?";

  return (
    <div className="flex items-center justify-between py-3 md:py-4 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors px-2 -mx-2 rounded-lg group">
      <Link
        href={checkIn.client_id ? `/admin/clients/${checkIn.client_id}` : "#"}
        className="flex items-center gap-3 md:gap-4 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold shadow-sm border border-primary/20 transition-transform group-hover:scale-105">
          {initial}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground leading-none mb-1.5 group-hover:text-primary group-hover:underline transition-colors">
            {checkIn.client_name}
          </span>
          <span className="text-xs text-muted-foreground leading-none">
            {formattedDate}
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground bg-muted px-2 py-1 rounded-md">
          {formattedTime}
        </span>
      </div>
    </div>
  );
}

// 4. Página Principal
export default function AdminDashboardPage() {
  // Chamada isolada para os totais (recarrega a cada 15s, retornará um payload muito leve)
  const { data: kpiData, isLoading: isLoadingKpis } = useSWR(
    "/api/dashboard/kpis",
    fetcher,
    {
      refreshInterval: 15000,
    },
  );

  // Função para montar a URL da página do SWR Infinite
  const getCheckInsKey = (pageIndex: number, previousPageData: any) => {
    // Se a página anterior informou que não tem mais dados, paramos de fazer fetch
    if (previousPageData && !previousPageData.hasMore) return null;
    return `/api/dashboard/checkins?page=${pageIndex + 1}&limit=8`;
  };

  // SWR Infinite para lidar com a paginação da lista
  const {
    data: checkinsPages,
    isLoading: isLoadingFirstCheckins,
    size,
    setSize,
  } = useSWRInfinite(getCheckInsKey, fetcher);

  // Unifica todas as páginas retornadas num único array
  const checkIns = checkinsPages
    ? checkinsPages.flatMap((page) => page.data)
    : [];

  // Status auxiliares de carregamento
  const isLoadingMore =
    isLoadingFirstCheckins ||
    (size > 0 &&
      checkinsPages &&
      typeof checkinsPages[size - 1] === "undefined");

  const isEmpty = checkinsPages?.[0]?.data?.length === 0;
  // Entende que chegou ao fim se o último array trouxer menos de 8 itens ou se o 'hasMore' do backend for false
  const isReachingEnd =
    isEmpty ||
    (checkinsPages &&
      checkinsPages[checkinsPages.length - 1]?.data?.length < 8);

  const [showScrollTop, setShowScrollTop] = useState(false);

  // Referência para a "âncora invisível" no final da lista
  const observerTarget = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && !isReachingEnd && !isLoadingMore) {
        setSize(size + 1); // Puxa a próxima página
      }
    },
    [isReachingEnd, isLoadingMore, setSize, size],
  );

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    // Dispara a visualização instantes antes de o elemento aparecer 100% (threshold: 0.1)
    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });
    observer.observe(element);

    return () => observer.unobserve(element);
  }, [handleObserver, checkIns]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      <AdminHeader title="Resumo Diário" />
      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 md:pb-6 relative">
        {" "}
        <div className="flex overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scroll-smooth md:grid md:grid-cols-3 md:overflow-visible md:pb-0 md:px-0 md:mx-0 gap-4 [&::-webkit-scrollbar]:hidden">
          {isLoadingKpis ? (
            <>
              <Skeleton className="h-32 min-w-[85vw] md:min-w-0 snap-center rounded-xl shrink-0" />
              <Skeleton className="h-32 min-w-[85vw] md:min-w-0 snap-center rounded-xl shrink-0" />
              <Skeleton className="h-32 min-w-[85vw] md:min-w-0 snap-center rounded-xl shrink-0" />
            </>
          ) : (
            <>
              <KpiCard
                title="Check-ins Hoje"
                value={kpiData?.todayCheckInsCount ?? 0}
                description="Sessões realizadas hoje"
                icon={CalendarCheck}
                className="min-w-[85vw] md:min-w-0 snap-center shrink-0"
              />
              <KpiCard
                title="Clientes Ativos"
                value={kpiData?.activeClientsCount ?? 0}
                description="Com pacotes em andamento"
                icon={Users}
                className="min-w-[85vw] md:min-w-0 snap-center shrink-0"
              />
              <KpiCard
                title="Pacotes Finalizando"
                value={kpiData?.packagesEndingSoonCount ?? 0}
                description="Restam 2 ou menos sessões"
                icon={AlertTriangle}
                className="min-w-[85vw] md:min-w-0 snap-center shrink-0"
              />
            </>
          )}
        </div>
        <PendingCheckInsCard />
        {/* LISTA DE CHECK-INS RECENTES */}
        <Card className="border-0 shadow-none bg-transparent md:border md:shadow-sm md:bg-card mt-2 md:mt-0">
          <CardHeader className="px-0 pt-0 md:pt-6 md:px-6">
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Clock className="h-5 w-5 text-primary" />
              Check-ins de Hoje
            </CardTitle>
            <CardDescription>
              Os últimos registros de presença contabilizados hoje
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0 md:pb-6 md:px-6">
            {isLoadingFirstCheckins ? (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="flex flex-col gap-2 w-full">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isEmpty ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/30 rounded-lg border border-dashed border-border">
                <CalendarCheck className="h-10 w-10 text-muted-foreground/40" />
                <p className="mt-4 text-sm font-medium text-muted-foreground">
                  Nenhum check-in registrado hoje.
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {checkIns.map((checkIn: CheckIn) => (
                  <CheckInListItem key={checkIn.id} checkIn={checkIn} />
                ))}

                {/* Loader da paginação e alvo do Intersection Observer */}
                <div
                  ref={observerTarget}
                  className="h-10 w-full flex items-center justify-center mt-4"
                >
                  {isLoadingMore && (
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-20 md:bottom-8 right-4 md:right-8 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 z-50",
          showScrollTop
            ? "translate-y-0 opacity-100"
            : "translate-y-10 opacity-0 pointer-events-none",
        )}
        aria-label="Voltar ao topo"
      >
        <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </>
  );
}

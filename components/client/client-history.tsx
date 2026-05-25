// components/client/client-history.tsx
"use client";

import { useRef, useCallback, useEffect } from "react";
import useSWRInfinite from "swr/infinite";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarCheck,
  LoaderDots,
  User,
  Package,
  Feather,
} from "@boxicons/react";
import { cn } from "@/lib/utils";

export type CheckInType = {
  id: string;
  date_time: string;
  professional_name?: string | null;
  // 🔥 NOVO: Tipagens da API atualizada
  type?: "PACOTE" | "AVULSO";
  package_name?: string | null;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function ClientHistory({ clientId }: { clientId: string }) {
  // Monta a URL da paginação (de 5 em 5)
  const getHistoryKey = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && !previousPageData.hasMore) return null;
    return `/api/admin/clients/${clientId}/history?page=${pageIndex + 1}&limit=5`;
  };

  const {
    data: historyPages,
    isLoading: isLoadingFirst,
    size,
    setSize,
  } = useSWRInfinite(getHistoryKey, fetcher);

  const checkIns = historyPages
    ? historyPages.flatMap((page) => page.data)
    : [];

  const isLoadingMore =
    isLoadingFirst ||
    (size > 0 && historyPages && typeof historyPages[size - 1] === "undefined");
  const isEmpty = historyPages?.[0]?.data?.length === 0;

  const isReachingEnd =
    isEmpty ||
    (historyPages && historyPages[historyPages.length - 1]?.data?.length < 5);

  const observerTarget = useRef<HTMLDivElement>(null);

  // Gatilho invisível de rolagem
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && !isReachingEnd && !isLoadingMore) {
        setSize(size + 1);
      }
    },
    [isReachingEnd, isLoadingMore, setSize, size],
  );

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });
    observer.observe(element);

    return () => observer.unobserve(element);
  }, [handleObserver, checkIns]);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long", // Usa o mês por extenso (ex: "15 de maio") para ficar mais bonito na timeline
      year: "numeric",
    }).format(new Date(dateString));
  };

  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  return (
    <Card className="md:col-span-1 border-0 shadow-none bg-transparent md:border md:shadow-sm md:bg-card mt-2">
      <CardHeader className="px-0 pt-4 md:pt-6 md:px-6 pb-4 md:pb-6 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2 text-foreground">
          <CalendarCheck className="h-5 w-5 text-primary" strokeWidth={1.5} />
          Jornada da Cliente
        </CardTitle>
      </CardHeader>

      <CardContent className="px-0 pb-0 md:pb-6 md:px-6 flex flex-col">
        {isLoadingFirst ? (
          <div className="flex flex-col gap-5 py-2">
            <div className="h-16 w-full bg-muted/30 animate-pulse rounded-xl" />
            <div className="h-16 w-full bg-muted/30 animate-pulse rounded-xl" />
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-10 text-center bg-muted/10 rounded-2xl border border-dashed border-border">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <CalendarCheck
                className="h-6 w-6 text-muted-foreground/50"
                strokeWidth={1.5}
              />
            </div>
            <p className="text-sm text-muted-foreground font-semibold">
              Nenhum check-in registrado
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              O histórico de visitas aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="flex flex-col pl-2">
            {checkIns.map((ci: CheckInType, index: number) => {
              const isLast = index === checkIns.length - 1;
              const isPackage = ci.type === "PACOTE";

              return (
                <div key={ci.id} className="relative flex gap-4 pb-6">
                  {/* 🔥 DESIGN DE LINHA DO TEMPO: A linha conectora */}
                  {!isLast && (
                    <div className="absolute left-4.25 top-9 -bottom-1 w-px bg-border/60" />
                  )}

                  {/* O Ícone/Ponto na linha do tempo */}
                  <div
                    className={cn(
                      "relative z-10 flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full border-2 bg-background shadow-sm transition-colors",
                      isPackage
                        ? "border-primary/30 text-primary"
                        : "border-muted-foreground/30 text-muted-foreground",
                    )}
                  >
                    {isPackage ? (
                      <Package className="h-4 w-4" strokeWidth={1.5} />
                    ) : (
                      <Feather className="h-4 w-4" strokeWidth={1.5} />
                    )}
                  </div>

                  {/* O Conteúdo do Check-in */}
                  <div className="flex flex-col flex-1 pt-1.5 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-sm font-bold text-foreground leading-none">
                        {formatDate(ci.date_time)}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md shrink-0">
                        {formatTime(ci.date_time)}
                      </span>
                    </div>

                    {/* 🔥 ETIQUETAS: Pacote vs Avulso */}
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {isPackage ? (
                        <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded max-w-full truncate">
                          PACOTE: {ci.package_name || "Desconhecido"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-muted/60 text-muted-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                          Serviço Avulso
                        </span>
                      )}

                      {/* Profissional que confirmou o check-in */}
                      {ci.professional_name && (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-500 font-medium">
                          <User className="h-3 w-3" /> {ci.professional_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Gatilho para carregar mais itens infinitamente */}
            <div
              ref={observerTarget}
              className="h-10 w-full flex items-center justify-center mt-2"
            >
              {isLoadingMore && (
                <LoaderDots className="h-6 w-6 text-muted-foreground/50 animate-spin" />
              )}
              {!isLoadingMore && !isReachingEnd && (
                <span className="text-xs font-medium text-muted-foreground/60">
                  Role para ver mais
                </span>
              )}
              {isReachingEnd && !isEmpty && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mt-4">
                  Fim do histórico
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

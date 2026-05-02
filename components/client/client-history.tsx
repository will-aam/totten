// components/client/client-history.tsx
"use client";

import { useRef, useCallback, useEffect } from "react";
import useSWRInfinite from "swr/infinite";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck, LoaderDots } from "@boxicons/react";

export type CheckInType = {
  id: string;
  date_time: string;
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
      month: "short",
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
    /* Mobile: Transparente. Desktop: Card padrão */
    <Card className="md:col-span-1 border-0 shadow-none bg-transparent md:border md:shadow-sm md:bg-card">
      <CardHeader className="px-0 pt-0 md:pt-6 md:px-6 pb-3 md:pb-6 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2 text-foreground">
          <CalendarCheck className="h-5 w-5 text-primary" strokeWidth={1.5} />
          Histórico de Check-ins
        </CardTitle>
      </CardHeader>

      <CardContent className="px-0 pb-0 md:pb-6 md:px-6 flex flex-col gap-2">
        {isLoadingFirst ? (
          <div className="flex flex-col gap-3 py-2">
            <div className="h-10 w-full bg-muted/30 animate-pulse rounded-lg" />
            <div className="h-10 w-full bg-muted/30 animate-pulse rounded-lg" />
          </div>
        ) : isEmpty ? (
          /* Estado Vazio: Limpo e integrado */
          <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 rounded-xl border border-dashed border-border">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
              <CalendarCheck
                className="h-5 w-5 text-muted-foreground/50"
                strokeWidth={1.5}
              />
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Nenhum check-in
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              As presenças desta cliente aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {checkIns.map((ci: CheckInType) => (
              <div
                key={ci.id}
                className="flex items-center justify-between py-3 border-b border-border/40 last:border-0 select-none transition-all duration-100 ease-out active:bg-muted/30 -mx-2 px-2 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
                    <CalendarCheck className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground leading-none mb-1.5 capitalize">
                      {formatDate(ci.date_time)}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-medium leading-none">
                      Check-in realizado
                    </span>
                  </div>
                </div>
                <span className="text-xs font-medium text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-md">
                  {formatTime(ci.date_time)}
                </span>
              </div>
            ))}
            <div
              ref={observerTarget}
              className="h-10 w-full flex items-center justify-center mt-2"
            >
              {isLoadingMore && (
                <LoaderDots className="h-5 w-5 text-primary animate-spin" />
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

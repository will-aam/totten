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
  ShoppingBag,
  Archive,
  UserPlus,
  MessageCircle,
  UserX,
} from "@boxicons/react";
import { cn } from "@/lib/utils";

export type TimelineEvent = {
  id: string;
  type:
    | "CLIENT_CREATED"
    | "PACKAGE_PURCHASED"
    | "PACKAGE_ARCHIVED"
    | "CHECK_IN"
    | "CLIENT_NOTE"
    | "NO_SHOW";
  date: string;
  title: string;
  meta: any;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function ClientHistory({ clientId }: { clientId: string }) {
  const getHistoryKey = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && !previousPageData.hasMore) return null;
    return `/api/admin/clients/${clientId}/history?page=${pageIndex + 1}&limit=10`;
  };

  const {
    data: historyPages,
    isLoading: isLoadingFirst,
    size,
    setSize,
  } = useSWRInfinite(getHistoryKey, fetcher);

  const events = historyPages ? historyPages.flatMap((page) => page.data) : [];

  const isLoadingMore =
    isLoadingFirst ||
    (size > 0 && historyPages && typeof historyPages[size - 1] === "undefined");
  const isEmpty = historyPages?.[0]?.data?.length === 0;

  const isReachingEnd =
    isEmpty ||
    (historyPages && historyPages[historyPages.length - 1]?.data?.length < 10);

  const observerTarget = useRef<HTMLDivElement>(null);

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
  }, [handleObserver, events]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "--";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(dateString));
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "--:--";
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const renderEventContent = (event: TimelineEvent) => {
    switch (event.type) {
      case "CLIENT_CREATED":
        return (
          <p className="text-xs text-muted-foreground mt-1">
            Ficha de cliente criada com sucesso na clínica.
          </p>
        );

      case "PACKAGE_PURCHASED":
        return (
          <div className="flex flex-col gap-1 mt-1">
            <span className="inline-flex w-fit items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
              <ShoppingBag className="h-3 w-3" /> Novo Pacote
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pacote{" "}
              <strong className="text-foreground">
                {event.meta.packageName}
              </strong>{" "}
              ativado. Direito a {event.meta.totalSessions} sessões. Valor:{" "}
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(event.meta.price || 0)}
            </p>
          </div>
        );

      case "PACKAGE_ARCHIVED":
        return (
          <div className="flex flex-col gap-1 mt-1">
            <span className="inline-flex w-fit items-center gap-1 bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
              <Archive className="h-3 w-3" /> Pacote Encerrado
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">
              O pacote{" "}
              <strong className="text-foreground">
                {event.meta.packageName}
              </strong>{" "}
              foi arquivado. Usadas {event.meta.usedSessions} de{" "}
              {event.meta.totalSessions} sessões.
            </p>
          </div>
        );

      case "CHECK_IN":
        return (
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {event.meta.isPackage ? (
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded max-w-full truncate">
                PACOTE: {event.meta.packageName}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-muted/60 text-muted-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                Serviço Avulso
              </span>
            )}

            {event.meta.professionalName && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-500 font-medium">
                <User className="h-3 w-3" /> {event.meta.professionalName}
              </span>
            )}
          </div>
        );

      case "NO_SHOW":
        return (
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-destructive/10 text-destructive text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded max-w-full truncate">
                FALTA:{" "}
                {event.meta.isPackage
                  ? event.meta.packageName
                  : "Serviço Avulso"}
              </span>
              {event.meta.professionalName && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                  <User className="h-3 w-3" /> {event.meta.professionalName}
                </span>
              )}
            </div>
            <p className="text-xs text-destructive/80 font-medium">
              A cliente não compareceu. Sessão descontada pelo sistema.
            </p>
          </div>
        );

      case "CLIENT_NOTE":
        return (
          <div className="flex flex-col mt-1.5">
            <p className="text-xs text-muted-foreground italic border-l-2 border-muted-foreground/30 pl-2 py-0.5 whitespace-pre-wrap">
              "{event.meta.text}"
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  const getEventIcon = (type: string, isPackageCheckin?: boolean) => {
    switch (type) {
      case "CLIENT_CREATED":
        return {
          icon: UserPlus,
          color: "border-emerald-500/30 text-emerald-600",
        };
      case "PACKAGE_PURCHASED":
        return { icon: ShoppingBag, color: "border-blue-500/30 text-blue-600" };
      case "PACKAGE_ARCHIVED":
        return { icon: Archive, color: "border-red-500/30 text-red-600" };
      case "CHECK_IN":
        return isPackageCheckin
          ? { icon: Package, color: "border-primary/30 text-primary" }
          : {
              icon: Feather,
              color: "border-muted-foreground/30 text-muted-foreground",
            };
      case "NO_SHOW":
        return {
          icon: UserX,
          color: "border-destructive/30 text-destructive bg-destructive/5",
        };
      case "CLIENT_NOTE":
        return {
          icon: MessageCircle,
          color: "border-amber-500/30 text-amber-600 bg-amber-500/5",
        };
      default:
        return {
          icon: CalendarCheck,
          color: "border-muted-foreground/30 text-muted-foreground",
        };
    }
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
              Nenhuma movimentação
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              O histórico completo aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="flex flex-col pl-2">
            {events.map((event: TimelineEvent, index: number) => {
              const isLast = index === events.length - 1;
              const { icon: Icon, color } = getEventIcon(
                event.type,
                event.meta?.isPackage,
              );

              return (
                <div key={event.id} className="relative flex gap-4 pb-6">
                  {!isLast && (
                    <div className="absolute left-4.25 top-9 -bottom-1 w-px bg-border/60" />
                  )}

                  <div
                    className={cn(
                      "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 bg-background shadow-sm",
                      color,
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.5} />
                  </div>

                  <div className="flex flex-col flex-1 pt-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-bold text-foreground leading-none mt-1">
                        {event.title}
                      </span>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-xs font-semibold text-foreground">
                          {formatDate(event.date)}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          {formatTime(event.date)}
                        </span>
                      </div>
                    </div>

                    {renderEventContent(event)}
                  </div>
                </div>
              );
            })}

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

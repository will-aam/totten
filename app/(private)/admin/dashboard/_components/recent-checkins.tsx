// app/(private)/admin/dashboard/_components/recent-checkins.tsx
"use client";

import useSWRInfinite from "swr/infinite";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarCheck, ChevronRight, RefreshCw, User } from "@boxicons/react";

type CheckIn = {
  id: string;
  client_id: string;
  client_name: string;
  date_time: string;
  professional_name?: string | null;
};

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
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors px-2 -mx-2 rounded-lg group">
      <Link
        href={checkIn.client_id ? `/admin/clients/${checkIn.client_id}` : "#"}
        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 font-bold shadow-sm border border-emerald-500/20 transition-transform group-hover:scale-105">
          {initial}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground leading-none mb-1.5 group-hover:text-primary group-hover:underline transition-colors truncate max-w-37.5 sm:max-w-50">
            {checkIn.client_name}
          </span>

          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground leading-none font-medium uppercase tracking-wider">
            <span>{formattedDate}</span>
            {checkIn.professional_name && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                  <User size="xs" /> {checkIn.professional_name.split(" ")[0]}
                </span>
              </>
            )}
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-foreground bg-muted px-2 py-1 rounded-md">
          {formattedTime}
        </span>
      </div>
    </div>
  );
}

export function RecentCheckIns() {
  const getCheckInsKey = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && !previousPageData.hasMore) return null;
    return `dashboard/checkins?page=${pageIndex + 1}&limit=5`;
  };

  const {
    data: checkinsPages,
    isLoading: isLoadingFirstCheckins,
    size,
    setSize,
  } = useSWRInfinite<any>(getCheckInsKey, apiClient);

  const checkIns = checkinsPages
    ? checkinsPages.flatMap((page) => page.data)
    : [];

  const isLoadingMore =
    isLoadingFirstCheckins ||
    (size > 0 &&
      checkinsPages &&
      typeof checkinsPages[size - 1] === "undefined");

  const isEmpty = checkinsPages?.[0]?.data?.length === 0;
  const isReachingEnd =
    isEmpty ||
    (checkinsPages &&
      checkinsPages[checkinsPages.length - 1]?.data?.length < 5);

  return (
    <Card className="border-border/50 shadow-md bg-card flex flex-col w-full h-full rounded-2xl dark:border-white/10 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] transition-all">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-bold text-foreground">
            Check-ins Recentes
          </CardTitle>
        </div>
      </CardHeader>

      {/* flex-1 + min-h-0: ocupa exatamente o espaço restante do card, com scroll interno */}
      <CardContent className="p-0 flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">
          {isLoadingFirstCheckins ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                  <div className="flex flex-col gap-2 w-full">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-2 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
              <p className="text-xs font-medium">
                Nenhum check-in registrado hoje.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {checkIns.map((checkIn: CheckIn) => (
                <CheckInListItem key={checkIn.id} checkIn={checkIn} />
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-2 flex justify-center rounded-b-xl min-h-[40px]">
        {isLoadingMore && size > 0 ? (
          <div className="flex items-center justify-center py-1">
            <RefreshCw size="sm" className="text-muted-foreground animate-spin" />
          </div>
        ) : size < 3 && !isReachingEnd ? (
          <button
            onClick={() => setSize(size + 1)}
            className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors flex items-center py-1 cursor-pointer"
          >
            Exibir mais <ChevronRight size="xs" className="ml-0.5" />
          </button>
        ) : !isEmpty ? (
          <Link
            href="/admin/history"
            className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors flex items-center py-1"
          >
            Ver Histórico Completo <ChevronRight size="xs" className="ml-0.5" />
          </Link>
        ) : null}
      </CardFooter>
    </Card>
  );
}

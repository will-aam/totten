"use client";

import useSWR from "swr";
import Link from "next/link";
import { AlertCircle, User, CalendarPlus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type PendingCheckIn = {
  id: string;
  clientId: string | null;
  clientName: string;
  dateTime: string;
};

interface PendingCheckInsCardProps {
  organizationId: string;
}

function PendingCheckInItem({ checkIn }: { checkIn: PendingCheckIn }) {
  const date = new Date(checkIn.dateTime);
  const formattedDate = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
  const formattedTime = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const initial = checkIn.clientName.charAt(0).toUpperCase();

  return (
    <div className="flex items-center justify-between py-3 md:py-4 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors px-2 -mx-2 rounded-lg group">
      <div className="flex items-center gap-3 md:gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold shadow-sm border border-amber-200">
          {initial}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground leading-none mb-1.5">
            {checkIn.clientName}
          </span>
          <span className="text-xs text-muted-foreground leading-none">
            Check-in avulso · {formattedDate} às {formattedTime}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {checkIn.clientId && (
          <Button variant="ghost" size="sm" asChild className="h-8 px-2">
            <Link href={`/admin/clients/${checkIn.clientId}`}>
              <User className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Perfil</span>
            </Link>
          </Button>
        )}
        <Button variant="outline" size="sm" asChild className="h-8 px-2">
          <Link href="/admin/agenda">
            <CalendarPlus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Associar</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function PendingCheckInsCard({ organizationId }: PendingCheckInsCardProps) {
  const { data, isLoading } = useSWR(
    `/api/admin/checkins/pending?organizationId=${organizationId}`,
    fetcher,
    { refreshInterval: 30000 },
  );

  const pendingCheckIns: PendingCheckIn[] = data?.pendingCheckIns ?? [];

  if (!isLoading && pendingCheckIns.length === 0) {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
          <AlertCircle className="h-5 w-5" />
          Check-ins sem serviço vinculado
          {!isLoading && pendingCheckIns.length > 0 && (
            <span className="ml-auto text-xs font-semibold bg-amber-200 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 px-2 py-0.5 rounded-full">
              {pendingCheckIns.length}
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Clientes que fizeram check-in pelo Totem sem agendamento vinculado
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex flex-col gap-2 w-full">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-44" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col">
            {pendingCheckIns.map((checkIn) => (
              <PendingCheckInItem key={checkIn.id} checkIn={checkIn} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

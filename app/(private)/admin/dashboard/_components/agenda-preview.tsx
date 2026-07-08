// app/(private)/admin/dashboard/_components/agenda-preview.tsx
"use client";

import useSWR from "swr";
import Link from "next/link";
import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ChevronRight } from "@boxicons/react";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function AgendaPreview() {
  const now = new Date();
  const from = startOfDay(now).toISOString();
  const to = endOfDay(now).toISOString();

  const { data, isLoading } = useSWR(
    `/api/admin/agenda?from=${from}&to=${to}`,
    fetcher,
    { refreshInterval: 30000 },
  );

  const appointments = data?.appointments || [];

  const groupedAppointments = appointments.reduce((acc: any, appt: any) => {
    if (!acc[appt.time]) acc[appt.time] = [];
    acc[appt.time].push(appt);
    return acc;
  }, {});

  const sortedTimes = Object.keys(groupedAppointments).sort();

  return (
    <Card className="shadow-sm flex flex-col w-full h-full md:max-w-sm">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-1.5 text-base font-bold text-foreground">
            Agenda Hoje
          </CardTitle>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {format(now, "dd MMM", { locale: ptBR })}
          </span>
        </div>
      </CardHeader>

      {/* flex-1 + min-h-0: ocupa exatamente o espaço restante do card, com scroll interno */}
      <CardContent className="p-0 flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-10 h-4 shrink-0" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : sortedTimes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center opacity-60">
              <Calendar size="sm" className="mb-2" />
              <p className="text-xs font-medium">Nenhum agendamento hoje.</p>
            </div>
          ) : (
            <div className="space-y-0">
              {sortedTimes.map((time, index) => {
                const appts = groupedAppointments[time];
                const isLast = index === sortedTimes.length - 1;

                return (
                  <div key={time} className="flex gap-3 relative">
                    {/* Horário menor e mais discreto */}
                    <div className="w-10 shrink-0 text-right pt-0.5">
                      <span className="text-xs font-bold text-muted-foreground">
                        {time}
                      </span>
                    </div>

                    <div
                      className={cn(
                        "flex-1 pl-4 pb-4 relative",
                        !isLast && "border-l border-muted", // Linha mais fina
                      )}
                    >
                      <div className="absolute w-2 h-2 bg-primary/30 rounded-full -left-[4.5px] top-1.5 ring-2 ring-background" />

                      <div className="flex flex-col gap-2">
                        {appts.map((appt: any) => (
                          <div
                            key={appt.id}
                            className={cn(
                              "p-2 rounded-lg border flex flex-col gap-0.5 shadow-sm transition-all",
                              appt.color,
                            )}
                          >
                            <div className="flex items-center justify-between">
                              {/* Serviço em cima (pequeno) */}
                              <span className="text-[9px] font-bold uppercase tracking-wider opacity-75 truncate pr-2">
                                {appt.service}
                              </span>

                              {/* Status do agendamento */}
                              <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-background/50 tracking-widest shrink-0">
                                {appt.status}
                              </span>
                            </div>

                            {/* Nome do Cliente em baixo (destaque) */}
                            <span className="font-bold text-sm truncate leading-tight">
                              {appt.clientName}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-1 flex justify-center bg-muted/5 rounded-b-xl">
        <Link
          href="/admin/agenda"
          className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors flex items-center py-1"
        >
          Ver Completa <ChevronRight size="xs" className="ml-0.5" />
        </Link>
      </CardFooter>
    </Card>
  );
}

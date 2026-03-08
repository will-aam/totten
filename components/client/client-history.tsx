"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarCheck } from "lucide-react";
// Importa a tipagem correta exportada pelo page.tsx
import type { CheckInType } from "@/app/admin/clients/[id]/page";

function MobileCheckInItem({ checkIn }: { checkIn: CheckInType }) {
  const date = new Date(checkIn.date_time);
  const formattedDate = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex items-center justify-between py-3 px-2 -mx-2 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm border border-primary/20">
          <CalendarCheck className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground leading-none mb-1.5 capitalize">
            {formattedDate}
          </span>
          <span className="text-xs text-muted-foreground leading-none">
            Check-in realizado
          </span>
        </div>
      </div>
      <span className="text-sm font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
        {formattedTime}
      </span>
    </div>
  );
}

export function ClientHistory({ checkIns }: { checkIns: CheckInType[] }) {
  return (
    <Card className="border-0 shadow-none bg-transparent md:border md:shadow-sm md:bg-card mt-2 md:mt-0">
      <CardHeader className="px-0 pt-0 md:pt-6 md:px-6 pb-3 md:pb-6">
        <CardTitle className="text-lg flex items-center gap-2 text-foreground">
          <CalendarCheck className="h-5 w-5 text-primary" /> Histórico de
          Check-ins
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0 md:pb-6 md:px-6">
        {checkIns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/30 rounded-xl border border-dashed border-border">
            <CalendarCheck className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">
              Nenhum check-in registrado.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:hidden">
              {checkIns.map((ci) => (
                <MobileCheckInItem key={ci.id} checkIn={ci} />
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto rounded-md border border-border">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="text-muted-foreground font-semibold">
                      Data do Check-in
                    </TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-right">
                      Horário
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checkIns.map((ci) => (
                    <TableRow
                      key={ci.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="text-foreground font-medium capitalize">
                        {new Date(ci.date_time).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm font-mono text-right">
                        {new Date(ci.date_time).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// components/recurring/recurring-item.tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Clock,
  CalendarRange,
  AlertTriangle,
  Trash2,
  MessageCircle,
  Package as PackageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Tipagem exportada para reaproveitamento
export interface RecurringSeries {
  recurrenceId: string;
  client: { id: string; name: string; phone_whatsapp: string };
  serviceName: string;
  package: {
    id: string;
    name: string;
    total_sessions: number;
    used_sessions: number;
  } | null;
  startDate: string;
  endDate: string;
  pattern: string;
  totalSessions: number;
  completedSessions: number;
  remainingInSeries: number;
  packageBalance: number | null;
  nextSession: string | null;
  warnings: string[];
  status: "ATIVA" | "FINALIZADA";
}

interface RecurringItemProps {
  series: RecurringSeries;
  onWhatsApp: (phone: string, name: string, warnings: string[]) => void;
  onDelete: (id: string) => void;
}

export function RecurringItem({
  series,
  onWhatsApp,
  onDelete,
}: RecurringItemProps) {
  const hasWarning = series.warnings.length > 0;
  const isFinished = series.status === "FINALIZADA";
  const progress = (series.completedSessions / series.totalSessions) * 100;
  const initial = series.client.name.charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        "flex flex-col lg:flex-row gap-4 lg:gap-6 p-4 md:p-5 bg-card rounded-3xl border transition-all",
        hasWarning
          ? "border-destructive/30 bg-destructive/5"
          : "border-border/50 hover:border-primary/40",
        isFinished && "opacity-60 grayscale-[0.2]",
      )}
    >
      {/* 1. INFO DO CLIENTE (Esquerda) */}
      <div className="flex items-center gap-3 lg:w-[25%] shrink-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold border-2 bg-primary/10 text-primary border-primary/20">
          {initial}
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="font-bold text-foreground truncate text-base leading-tight">
            {series.client.name}
          </span>
          <span className="text-xs font-semibold text-muted-foreground truncate mt-0.5">
            {series.serviceName}
          </span>
        </div>
      </div>

      {/* 2. DADOS DO AGENDAMENTO E PROGRESSO (Meio) */}
      <div className="flex flex-col gap-2 lg:w-[35%] justify-center border-t border-b lg:border-none border-border/40 py-3 lg:py-0">
        <div className="flex items-center gap-4">
          <Badge
            variant={isFinished ? "secondary" : "default"}
            className={cn(
              "shrink-0 font-bold uppercase text-[9px]",
              !isFinished &&
                "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
            )}
          >
            {isFinished ? "Finalizada" : "Ativa"}
          </Badge>
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <Clock className="h-3.5 w-3.5 text-primary" />
            {series.pattern}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 mt-1">
          <div className="flex justify-between items-end text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <span>
              {series.completedSessions} / {series.totalSessions} Sessões
            </span>
            <span className="flex items-center gap-1">
              <CalendarRange className="h-3 w-3" />
              Até {new Date(series.endDate).toLocaleDateString("pt-BR")}
            </span>
          </div>
          <Progress value={progress} className="h-1.5 rounded-full" />
        </div>
      </div>

      {/* 3. PACOTE E ALERTAS (Meio-Direita) */}
      <div className="flex flex-col justify-center gap-2 lg:w-[20%]">
        {series.package ? (
          <div className="flex items-center justify-between lg:justify-start gap-2 text-[11px] font-bold text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-lg border border-border/40">
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              <PackageIcon className="h-3 w-3" /> Vinculado
            </span>
            <span className="text-foreground">
              Saldo: {series.packageBalance}
            </span>
          </div>
        ) : (
          <span className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-wider px-3 py-1.5 hidden lg:block">
            Sem pacote
          </span>
        )}

        {hasWarning && (
          <div className="flex items-start gap-1.5 text-destructive text-[10px] font-bold leading-tight">
            <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
            <span>{series.warnings[0]}</span>
          </div>
        )}
      </div>

      {/* 4. AÇÕES (Direita) */}
      <div className="flex items-center justify-end gap-2 lg:w-[20%] shrink-0 pt-2 lg:pt-0">
        <Button
          variant="outline"
          className={cn(
            "flex-1 lg:flex-none rounded-xl h-10 font-bold transition-all text-xs",
            hasWarning
              ? "bg-destructive/10 text-destructive border-transparent hover:bg-destructive hover:text-white"
              : "bg-background hover:bg-[#25D366]/10 hover:text-[#128C7E] border-border/60 hover:border-[#25D366]/40",
          )}
          onClick={() =>
            onWhatsApp(
              series.client.phone_whatsapp,
              series.client.name,
              series.warnings,
            )
          }
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          {hasWarning ? "Cobrar" : "WhatsApp"}
        </Button>

        {!isFinished && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                title="Liberar Cadeiras (Excluir Série)"
                className="rounded-xl h-10 w-10 text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-4xl border-none shadow-2xl bg-background sm:max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-black text-foreground">
                  Liberar Cadeiras?
                </AlertDialogTitle>
                <AlertDialogDescription className="font-medium text-muted-foreground">
                  Isto irá{" "}
                  <b className="text-destructive font-bold">
                    apagar da agenda todas as sessões futuras
                  </b>{" "}
                  da cliente {series.client.name} que ainda não foram
                  realizadas.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2 mt-4">
                <AlertDialogCancel className="rounded-2xl h-11 font-bold border-border/50">
                  Voltar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(series.recurrenceId)}
                  className="bg-destructive hover:bg-destructive/90 text-white rounded-2xl h-11 font-bold"
                >
                  Liberar horários
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}

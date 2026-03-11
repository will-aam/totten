// components/packages/package-details-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // 🔥 Importado para navegação
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  CheckCircle2,
  Clock,
  History,
  Plus,
  RotateCcw,
  Stethoscope,
  Loader2,
  CalendarPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getPackageHistory } from "@/app/actions/packages";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PackageDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageData: any | null;
}

export function PackageDetailsModal({
  open,
  onOpenChange,
  packageData,
}: PackageDetailsModalProps) {
  const router = useRouter(); // 🔥 Hook de navegação
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadHistory() {
      if (!open || !packageData?.id) return;
      setHistory([]); // Limpa antes de carregar o novo
      setLoading(true);
      const result = await getPackageHistory(packageData.id);
      if (result.success) {
        setHistory(result.history || []);
      }
      setLoading(false);
    }
    loadHistory();
  }, [open, packageData?.id]);

  if (!packageData) return null;

  const progress = Math.round(
    (packageData.usedSessions / packageData.totalSessions) * 100,
  );

  // 🔥 Lógica de Agendamento: Leva para a agenda
  const handleSchedule = () => {
    onOpenChange(false);
    // Redireciona para a agenda. Futuramente podemos passar o ID via URL para abrir o modal automático
    router.push("/admin/agenda");
  };

  // 🔥 Lógica de Renovação: Leva para a tela de clientes
  const handleRenew = () => {
    onOpenChange(false);
    router.push("/admin/clients");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0 border-none shadow-2xl bg-background rounded-l-[2.5rem]">
        {/* HEADER */}
        <SheetHeader className="p-8 pb-6 border-b border-border/40">
          <div className="flex items-center gap-2 text-primary mb-3">
            <History className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              Extrato Detalhado
            </span>
          </div>
          <SheetTitle className="text-2xl font-black text-foreground leading-tight">
            {packageData.clientName}
          </SheetTitle>
          <SheetDescription className="text-sm font-bold text-muted-foreground uppercase tracking-tight">
            {packageData.packageName}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10 scrollbar-hide">
          {/* CONSUMO */}
          <div className="bg-muted/30 border border-border/50 p-6 rounded-4xl shadow-inner">
            <div className="flex justify-between items-end mb-4 px-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Progresso
              </span>
              <span className="text-2xl font-black text-foreground">
                {packageData.usedSessions}{" "}
                <span className="text-sm text-muted-foreground font-normal">
                  / {packageData.totalSessions}
                </span>
              </span>
            </div>
            <Progress
              value={progress}
              className="h-2.5 bg-muted rounded-full overflow-hidden"
            />
          </div>

          {/* TIMELINE */}
          <div className="space-y-8 px-2">
            <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2 text-muted-foreground ml-1">
              <Calendar className="h-4 w-4" /> Cronograma de Sessões
            </h3>

            {loading ? (
              <div className="flex flex-col items-center py-10 gap-3 text-muted-foreground/30">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Sincronizando Histórico...
                </span>
              </div>
            ) : history.length > 0 ? (
              <div className="relative space-y-10 before:absolute before:inset-0 before:left-4.75 before:h-[95%] before:w-0.5 before:bg-border/60">
                {history.map((item, index) => (
                  <div
                    key={item.id}
                    className="relative flex items-start group"
                  >
                    <div
                      className={cn(
                        "absolute left-0 w-10 h-10 rounded-2xl border-4 border-background flex items-center justify-center z-10 transition-all shadow-sm",
                        item.status === "REALIZADO"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {item.status === "REALIZADO" ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <span className="text-[11px] font-black">
                          {item.session || index + 1}
                        </span>
                      )}
                    </div>

                    <div className="ml-14 flex flex-col gap-1 w-full pr-2">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm uppercase tracking-tight text-foreground">
                          Sessão {item.session || index + 1}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-black uppercase px-2 py-0.5 rounded-md border-none",
                            item.status === "REALIZADO"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">
                        {item.date
                          ? format(
                              new Date(item.date),
                              "dd/MM/yyyy 'às' HH:mm",
                              { locale: ptBR },
                            )
                          : "Data não definida"}
                      </p>
                      {item.obs && (
                        <div className="mt-3 p-4 bg-muted/40 rounded-2xl text-[11px] font-medium text-muted-foreground border-l-4 border-primary/20 italic">
                          "{item.obs}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center border-2 border-dashed border-muted rounded-4xl">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  Nenhuma sessão registrada
                </p>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-8 bg-background border-t border-border/40 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="rounded-2xl h-14 font-black text-xs uppercase tracking-tighter border-2 active:scale-95 transition-all"
              onClick={handleRenew}
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Renovar
            </Button>
            <Button
              className="rounded-2xl h-14 font-black text-xs uppercase tracking-tighter"
              onClick={handleSchedule}
            >
              <CalendarPlus className="mr-2 h-4 w-4" /> Agendar
            </Button>
          </div>
          {/* <Button
            variant="ghost"
            className="w-full h-12 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:bg-muted active:scale-95 transition-all"
          >
            <Stethoscope className="mr-2 h-4 w-4" /> Ver Anamnese
          </Button> */}
        </div>
      </SheetContent>
    </Sheet>
  );
}

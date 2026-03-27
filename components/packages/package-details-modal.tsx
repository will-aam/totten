// components/packages/package-details-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Calendar,
  CheckCircle2,
  History,
  RotateCcw,
  Loader2,
  CalendarPlus,
  Archive,
  AlertTriangle, // 🔥 Novo ícone para o aviso
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getPackageHistory, archivePackage } from "@/app/actions/packages";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";

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
  const router = useRouter();
  const { toast } = useToast();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  useEffect(() => {
    async function loadHistory() {
      if (!open || !packageData?.id) return;
      setHistory([]);
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

  const handleSchedule = () => {
    onOpenChange(false);
    router.push("/admin/agenda");
  };

  const handleRenew = () => {
    onOpenChange(false);
    router.push("/admin/clients");
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    const result = await archivePackage(packageData.id);
    setIsArchiving(false);

    if (result.success) {
      toast({
        title: "Pacote Encerrado!",
        description:
          "O pacote foi arquivado. Você já pode criar um novo pacote limpo para esta cliente.",
      });
      // 🔥 Agora, em vez de fechar o modal, vamos apenas forçar o objeto a se atualizar visualmente
      // Se a tabela por trás recarregar, o state passará a active: false.
      onOpenChange(false);
    } else {
      toast({
        title: "Erro",
        description: result.error || "Não foi possível encerrar o pacote.",
        variant: "destructive",
      });
    }
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
          <SheetTitle className="text-2xl font-black text-foreground leading-tight flex items-center gap-2">
            {packageData.clientName}
            {/* 🔥 NOVO: Badge visual no título se estiver arquivado */}
            {!packageData.active && (
              <Badge
                variant="destructive"
                className="uppercase text-[9px] font-black px-2 py-0.5"
              >
                Arquivado
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription className="text-sm font-bold text-muted-foreground uppercase tracking-tight">
            {packageData.packageName}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 scrollbar-hide">
          {/* 🔥 NOVO: Banner chamativo de Arquivado */}
          {!packageData.active && (
            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h4 className="font-black text-sm text-destructive uppercase tracking-tight">
                  Pacote Inativo / Arquivado
                </h4>
                <p className="text-xs text-destructive/80 font-medium mt-1">
                  Este pacote foi encerrado antes da conclusão. As sessões que
                  constam como pendentes abaixo foram invalidadas.
                </p>
              </div>
            </div>
          )}

          {/* CONSUMO */}
          <div
            className={cn(
              "bg-muted/30 border border-border/50 p-6 rounded-4xl shadow-inner",
              !packageData.active && "opacity-60 grayscale",
            )}
          >
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
              className={cn(
                "h-2.5 bg-muted rounded-full overflow-hidden",
                !packageData.active && "[&>div]:bg-muted-foreground",
              )}
            />
          </div>

          {/* TIMELINE */}
          <div
            className={cn(
              "space-y-8 px-2",
              !packageData.active && "opacity-70",
            )}
          >
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
                          ? packageData.active
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted-foreground text-background"
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
                        <span
                          className={cn(
                            "font-black text-sm uppercase tracking-tight text-foreground",
                            !packageData.active &&
                              item.status !== "REALIZADO" &&
                              "line-through text-muted-foreground",
                          )}
                        >
                          Sessão {item.session || index + 1}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-black uppercase px-2 py-0.5 rounded-md border-none",
                            item.status === "REALIZADO"
                              ? packageData.active
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-muted text-muted-foreground"
                              : !packageData.active
                                ? "bg-destructive/10 text-destructive"
                                : "bg-muted text-muted-foreground",
                          )}
                        >
                          {!packageData.active && item.status !== "REALIZADO"
                            ? "INVALIDADA"
                            : item.status}
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
          <div
            className={cn(
              "grid gap-4",
              packageData.active ? "grid-cols-2" : "grid-cols-1",
            )}
          >
            <Button
              variant={packageData.active ? "outline" : "default"}
              className={cn(
                "rounded-2xl h-14 font-black text-xs uppercase tracking-tighter transition-all",
                packageData.active && "border-2 active:scale-95",
              )}
              onClick={handleRenew}
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Criar Novo Pacote
            </Button>

            {/* 🔥 Só exibe o botão de Agendar se o pacote estiver ATIVO */}
            {packageData.active && (
              <Button
                className="rounded-2xl h-14 font-black text-xs uppercase tracking-tighter"
                onClick={handleSchedule}
              >
                <CalendarPlus className="mr-2 h-4 w-4" /> Agendar Sessão
              </Button>
            )}
          </div>

          {packageData.active && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  disabled={isArchiving}
                  className="w-full h-12 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-destructive hover:bg-destructive/10 hover:text-destructive active:scale-95 transition-all"
                >
                  {isArchiving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Archive className="mr-2 h-4 w-4" />
                  )}
                  Encerrar Pacote Manualmente
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-4xl border-border/50">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-black text-xl">
                    Encerrar pacote antecipadamente?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-sm font-medium">
                    Tem certeza que deseja encerrar este pacote? <br />
                    <br />
                    Ele será arquivado para que você possa criar um NOVO PACOTE
                    com a contagem zerada para esta cliente. O histórico
                    financeiro será mantido.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4 gap-2">
                  <AlertDialogCancel className="rounded-2xl font-black uppercase text-xs tracking-tighter h-12">
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleArchive}
                    className="rounded-2xl font-black uppercase text-xs tracking-tighter h-12 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Sim, Encerrar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

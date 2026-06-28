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
  CheckCircle,
  History,
  RotateCcw,
  LoaderDots,
  CalendarPlus,
  Archive,
  AlertTriangle,
  RefreshCwAlt,
  Trash,
} from "@boxicons/react";
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

  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);

  //  NOVO: Estados para o Dialog de Exclusão customizado
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [apptToDelete, setApptToDelete] = useState<string | null>(null);

  const loadHistory = async () => {
    if (!packageData?.id) return;
    setLoading(true);
    const result = await getPackageHistory(packageData.id);
    if (result.success) {
      setHistory(result.history || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      loadHistory();
    } else {
      setHistory([]);
    }
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
        description: "O pacote foi arquivado.",
      });
      onOpenChange(false);
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao encerrar.",
        variant: "destructive",
      });
    }
  };

  //  Função que prepara a exclusão
  const prepareDeleteItem = (apptId: string) => {
    setApptToDelete(apptId);
    setIsDeleteConfirmOpen(true);
  };

  //  Função que executa a exclusão após confirmação
  const executeDelete = async () => {
    if (!apptToDelete) return;

    setIsDeletingId(apptToDelete);
    setIsDeleteConfirmOpen(false);

    try {
      const res = await fetch("/api/admin/packages/fix-appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: apptToDelete }),
      });

      if (res.ok) {
        toast({ title: "Registro apagado!" });
        await loadHistory();
        onOpenChange(false); // Força recarregar a tela principal
      } else {
        toast({ title: "Erro ao apagar registro.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro de conexão.", variant: "destructive" });
    } finally {
      setIsDeletingId(null);
      setApptToDelete(null);
    }
  };

  const handleSyncBalance = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/admin/packages/sync-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: packageData.id }),
      });
      if (res.ok) {
        toast({ title: "Saldo Sincronizado com sucesso!" });
        setIsSyncDialogOpen(false);
        onOpenChange(false);
      } else {
        toast({ title: "Erro ao sincronizar.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro de conexão.", variant: "destructive" });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0 border-none shadow-2xl bg-background rounded-l-[2.5rem]">
        <SheetHeader className="p-8 pb-6 border-b border-border/40">
          <div className="flex items-center gap-2 text-primary mb-3">
            <History className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              Extrato Detalhado
            </span>
          </div>
          <SheetTitle className="text-2xl font-black text-foreground leading-tight flex items-center gap-2">
            {packageData.clientName}
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
          {!packageData.active && (
            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h4 className="font-black text-sm text-destructive uppercase tracking-tight">
                  Pacote Inativo
                </h4>
                <p className="text-xs text-destructive/80 font-medium mt-1">
                  Este pacote foi encerrado.
                </p>
              </div>
            </div>
          )}

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

          <div
            className={cn(
              "space-y-6 px-2",
              !packageData.active && "opacity-70",
            )}
          >
            <div className="flex items-center justify-between ml-1">
              <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" /> Cronograma
              </h3>

              {packageData.active && (
                <AlertDialog
                  open={isSyncDialogOpen}
                  onOpenChange={setIsSyncDialogOpen}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] px-2 rounded-lg font-bold border-primary/20 text-primary hover:bg-primary/10"
                    >
                      <RefreshCwAlt className="h-3 w-3 mr-1" /> Sincronizar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-4xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Sincronizar saldo de sessões?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Isso irá recontar todas as suas sessões realizadas e
                        atualizar o saldo do pacote.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleSyncBalance}
                        disabled={isSyncing}
                      >
                        {isSyncing ? "Sincronizando..." : "Confirmar"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center py-10 gap-3 text-muted-foreground/30">
                <LoaderDots className="h-8 w-8 animate-spin" />
              </div>
            ) : history.length > 0 ? (
              <div className="relative space-y-10 before:absolute before:inset-0 before:left-4.75 before:h-[95%] before:w-0.5 before:bg-border/60 pt-2">
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
                        <CheckCircle className="h-5 w-5" />
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

                        <div className="flex items-center gap-1.5">
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

                          {packageData.active && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => prepareDeleteItem(item.id)}
                              disabled={isDeletingId === item.id}
                              className="h-5 w-5 rounded bg-destructive/10 text-destructive hover:bg-destructive hover:text-white"
                            >
                              {isDeletingId === item.id ? (
                                <LoaderDots className="animate-spin h-3 w-3" />
                              ) : (
                                <Trash className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
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

        {/*  DIALOG DE CONFIRMAÇÃO DE DELEÇÃO */}
        <AlertDialog
          open={isDeleteConfirmOpen}
          onOpenChange={setIsDeleteConfirmOpen}
        >
          <AlertDialogContent className="rounded-4xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Deseja remover este registro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação irá remover o agendamento da agenda e o registro do
                histórico. Se a sessão foi marcada como REALIZADA, o saldo do
                pacote será corrigido automaticamente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={executeDelete}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                Apagar Registro
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
            {packageData.active && (
              <Button
                className="rounded-2xl h-14 font-black text-xs uppercase tracking-tighter"
                onClick={handleSchedule}
              >
                <CalendarPlus className="mr-2 h-4 w-4" /> Agendar Sessão
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

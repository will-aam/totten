// components/agenda/appointment-details-modal.tsx
"use client";

import React, { useState, useEffect, useRef, memo, useMemo } from "react";
import { useReactToPrint } from "react-to-print";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarAlt,
  User,
  Trash,
  Save,
  LoaderDots,
  Printer,
  Repeat,
  AlertTriangle, // 🔥 Adicionado ícone de alerta
} from "@boxicons/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  updateAppointment,
  deleteAppointment,
} from "@/app/actions/appointments";
import { ThermalReceipt } from "./thermal-receipt";
import { getPaymentMethods } from "@/app/actions/payment-methods";
import { OrganizationPaymentMethod } from "@/types/finance";

interface AppointmentDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: any | null;
  onRefresh?: () => void;
}

export const AppointmentDetailsModal = memo(
  ({
    open,
    onOpenChange,
    appointment,
    onRefresh,
  }: AppointmentDetailsModalProps) => {
    const [status, setStatus] = useState("a_confirmar");
    const [payment, setPayment] = useState("nenhum");
    const [obs, setObs] = useState("");
    const [hasCharge, setHasCharge] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState<any>(null);
    const [paymentMethods, setPaymentMethods] = useState<
      OrganizationPaymentMethod[]
    >([]);
    const [showSaveOptions, setShowSaveOptions] = useState(false);

    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
      contentRef: componentRef,
      documentTitle: `Recibo_${appointment?.clientName || "Cliente"}`,
    });

    useEffect(() => {
      async function loadData() {
        try {
          const res = await fetch("/api/settings/public");
          if (res.ok) setSettings(await res.json());
          const methodsData = await getPaymentMethods();
          setPaymentMethods(methodsData as OrganizationPaymentMethod[]);
        } catch (e) {
          console.error(e);
        }
      }
      if (open) loadData();
    }, [open]);

    useEffect(() => {
      if (appointment) {
        const dbStatus = appointment.status?.toLowerCase();
        setStatus(
          dbStatus === "pendente" ? "a_confirmar" : dbStatus || "a_confirmar",
        );
        setPayment(
          appointment.paymentMethod || appointment.payment_method || "nenhum",
        );
        setObs(appointment.observations || "");
        setHasCharge(appointment.hasCharge ?? appointment.has_charge ?? false);
        setShowSaveOptions(false);
      }
    }, [appointment]);

    const endTime = useMemo(() => {
      if (!appointment?.time) return "";
      const [h, m] = appointment.time.split(":").map(Number);
      const date = new Date();
      date.setHours(h, m + (appointment.duration || 0));
      return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    }, [appointment?.time, appointment?.duration]);

    if (!appointment) return null;
    const isRecurrent = !!appointment.recurrence_id;

    // 🔥 NOVO: Verifica se o pacote do agendamento foi arquivado (com base na prop que a API envia)
    // Se sua API de agenda ainda não envia o "package.active", vamos considerar appointment.isPackageArchived (se você mapear no backend)
    // Para garantir de forma burra: vamos checar a prop `appointment.package?.active === false`
    const isPackageArchived =
      appointment.package && appointment.package.active === false;

    const handleSave = async (
      targetStatus?: string,
      updateAllSeries = false,
    ) => {
      // 🔥 NOVO: Defesa no botão de salvar
      const finalStatus = targetStatus || status;
      if (isPackageArchived && finalStatus !== "cancelado") {
        toast.error(
          "Este pacote foi arquivado. Você só pode excluir ou cancelar esta sessão.",
        );
        return;
      }

      setIsSaving(true);
      try {
        const result = await updateAppointment(
          appointment.id,
          {
            status: finalStatus,
            paymentMethod: payment === "nenhum" ? null : payment,
            observations: obs,
            hasCharge: finalStatus === "cancelado" ? false : hasCharge,
          },
          updateAllSeries,
          appointment.recurrence_id,
        );

        if (result.success) {
          toast.success(
            updateAllSeries ? "Série atualizada!" : "Dados salvos!",
          );
          onRefresh?.();
          onOpenChange(false);
        } else {
          toast.error(result.error || "Erro ao salvar.");
        }
      } catch (error) {
        toast.error("Erro na conexão.");
      } finally {
        setIsSaving(false);
      }
    };

    const handleDelete = async (deleteAll = false) => {
      try {
        await deleteAppointment(
          appointment.id,
          deleteAll,
          appointment.recurrence_id,
        );
        toast.success(deleteAll ? "Série excluída!" : "Agendamento excluído!");
        onRefresh?.();
        onOpenChange(false);
      } catch (error) {
        toast.error("Erro ao excluir.");
      }
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            "w-[95vw] sm:max-w-125 p-4 sm:p-6 rounded-3xl flex flex-col max-h-[90dvh] bg-background border border-border/20 transition-all duration-300",
            hasCharge && status !== "cancelado" && !isPackageArchived
              ? "ring-2 ring-destructive border-destructive/50"
              : "",
            isPackageArchived &&
              "ring-2 ring-destructive/80 border-destructive/50", // Borda vermelha se o pacote tiver morto
          )}
        >
          <ThermalReceipt
            ref={componentRef}
            appointment={{ ...appointment, observations: obs }}
            settings={settings}
          />

          <DialogHeader className="flex flex-row justify-between items-start">
            <div className="flex flex-col gap-1 w-full">
              <DialogTitle className="text-xl font-black flex items-center gap-2">
                <User className="h-5 w-5 text-primary shrink-0" />
                <span className="truncate">{appointment.clientName}</span>
              </DialogTitle>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm font-medium">
                  {appointment.service}
                </span>
                {isRecurrent && (
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary border-none flex gap-1 items-center rounded-full px-2"
                  >
                    <Repeat className="h-3 w-3" /> Série
                  </Badge>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-5 overflow-y-auto py-2 pr-1">
            {/* 🔥 NOVO: Alerta de Pacote Arquivado */}
            {isPackageArchived &&
              status !== "cancelado" &&
              status !== "realizado" && (
                <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in zoom-in-95">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-destructive uppercase tracking-tight">
                      Atenção: Pacote Encerrado
                    </span>
                    <span className="text-xs font-medium text-destructive/80 mt-1">
                      O pacote atrelado a este agendamento foi arquivado antes
                      da hora. Esta sessão tornou-se inválida e você não pode
                      mais dar baixa nela. Por favor, exclua ou cancele.
                    </span>
                  </div>
                </div>
              )}

            <div
              className={cn(
                "bg-muted/30 p-4 rounded-2xl flex flex-col gap-3 border border-border/40",
                isPackageArchived && "opacity-70 grayscale",
              )}
            >
              <div className="flex justify-between items-center text-sm font-bold uppercase tracking-tighter text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CalendarAlt className="h-4 w-4" /> Atendimento
                </div>
                <Badge
                  variant={
                    status === "cancelado" || isPackageArchived
                      ? "destructive"
                      : "outline"
                  }
                  className="rounded-lg border-none bg-background"
                >
                  {status === "cancelado"
                    ? "Cancelado"
                    : isPackageArchived
                      ? "Pacote Inativo"
                      : appointment.sessionInfo || "Avulso"}
                </Badge>
              </div>
              <div className="text-2xl font-black text-primary flex items-baseline gap-1">
                {appointment.time}
                <span className="text-xs font-bold text-muted-foreground uppercase">
                  até
                </span>
                {endTime}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">
                  Status
                </Label>
                <Select
                  value={status}
                  onValueChange={setStatus}
                  // 🔥 NOVO: Desabilita se o pacote tiver sido arquivado
                >
                  <SelectTrigger className="rounded-2xl h-12 bg-muted/20 border-none font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border/50 bg-background">
                    <SelectItem
                      value="a_confirmar"
                      disabled={isPackageArchived}
                    >
                      A Confirmar
                    </SelectItem>
                    <SelectItem value="confirmado" disabled={isPackageArchived}>
                      Confirmado
                    </SelectItem>
                    <SelectItem value="realizado" disabled={isPackageArchived}>
                      Realizado
                    </SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">
                  Pagamento
                </Label>
                <Select
                  value={payment}
                  onValueChange={setPayment}
                  disabled={isPackageArchived}
                >
                  <SelectTrigger className="rounded-2xl h-12 bg-muted/20 border-none font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border/50 bg-background">
                    <SelectItem value="nenhum">Aguardando...</SelectItem>
                    {paymentMethods
                      .filter((pm) => pm.isActive)
                      .map((pm) => (
                        <SelectItem key={pm.id} value={pm.type}>
                          {pm.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary">
                Observações do Recibo
              </Label>
              <Textarea
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                placeholder="Digite detalhes que aparecerão no recibo..."
                className="bg-muted/20 border-none resize-none h-24 rounded-2xl p-4"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant={hasCharge ? "destructive" : "outline"}
                className={cn(
                  "rounded-2xl h-12 font-bold transition-all",
                  !hasCharge && "bg-muted/20 border-none",
                )}
                onClick={() => setHasCharge(!hasCharge)}
                disabled={status === "realizado" || isPackageArchived} // 🔥 Desabilita cobrança pra pacote morto
              >
                {hasCharge ? "Cobrança Ativa" : "Tudo Pago"}
              </Button>

              <Button
                variant="secondary"
                className="bg-primary/10 text-primary font-black rounded-2xl h-12"
                onClick={() => {
                  handlePrint();
                  toast.success("Gerando recibo...");
                }}
              >
                <Printer className="mr-2 h-5 w-5" /> Recibo
              </Button>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-border/40 mt-auto">
            {status !== "realizado" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/5 font-bold w-full sm:w-auto rounded-2xl h-12"
                  >
                    <Trash className="mr-2 h-5 w-5" /> Excluir Sessão
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-3xl border border-border/50 p-6 bg-background">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold">
                      Excluir Agendamento?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {isRecurrent
                        ? "Este agendamento faz parte de uma série. Como deseja proceder?"
                        : "Isso apagará este agendamento permanentemente."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
                    <AlertDialogCancel className="rounded-2xl border-none bg-muted">
                      Voltar
                    </AlertDialogCancel>
                    {isRecurrent && (
                      <AlertDialogAction
                        onClick={() => handleDelete(true)}
                        className="bg-destructive/10 text-destructive rounded-2xl border-none font-bold"
                      >
                        Excluir Toda a Série
                      </AlertDialogAction>
                    )}
                    <AlertDialogAction
                      onClick={() => handleDelete(false)}
                      className="rounded-xl bg-destructive text-white hover:bg-destructive/90"
                    >
                      Sim, excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <div className="flex-1" />

            {/* 🔥 NOVO: Esconde o botão de Salvar se o pacote foi arquivado e o status não é de cancelamento */}
            {!showSaveOptions ? (
              <Button
                onClick={() =>
                  isRecurrent ? setShowSaveOptions(true) : handleSave()
                }
                disabled={
                  isSaving || (isPackageArchived && status !== "cancelado")
                }
                className="rounded-2xl bg-primary text-primary-foreground h-12 px-8 font-bold w-full sm:w-auto"
              >
                {isSaving ? (
                  <LoaderDots className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" /> Salvar
                  </>
                )}
              </Button>
            ) : (
              <div className="flex gap-2 w-full sm:w-auto animate-in slide-in-from-right-2">
                <Button
                  onClick={() => handleSave(status, true)}
                  disabled={
                    isSaving || (isPackageArchived && status !== "cancelado")
                  }
                  className="rounded-2xl h-12 bg-amber-600 text-white font-bold text-xs uppercase"
                >
                  Toda a Série
                </Button>
                <Button
                  onClick={() => handleSave(status, false)}
                  disabled={
                    isSaving || (isPackageArchived && status !== "cancelado")
                  }
                  className="rounded-2xl h-12 bg-primary text-white font-bold text-xs uppercase"
                >
                  Só Este
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);

AppointmentDetailsModal.displayName = "AppointmentDetailsModal";

// components/agenda/schedule-settings-modal.tsx (Now a Sidebar/Sheet)
"use client";

import React, { useState, useEffect, memo } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,

} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { LoaderDots } from "@boxicons/react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export type ScheduleSettings = {
  autoConfirmAppointments?: boolean;
  allowOverLimitAppointments?: boolean;
  defaultScheduleView?: string;
  openingTime?: string;
  closingTime?: string;
  autoNoShowMode?: "off" | "auto_deduct" | "auto_no_deduct";
};

interface ScheduleSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSettings: ScheduleSettings;
  onSave: (settings: ScheduleSettings) => Promise<void>;
}

const HOUR_SLOTS = Array.from(
  { length: 24 },
  (_, i) => `${String(i).padStart(2, "0")}:00`,
);

export const ScheduleSettingsModal = memo(
  ({
    open,
    onOpenChange,
    initialSettings,
    onSave,
  }: ScheduleSettingsModalProps) => {
    const [autoConfirmAppointments, setAutoConfirmAppointments] = useState(initialSettings.autoConfirmAppointments ?? false);
    const [allowOverLimitAppointments, setAllowOverLimitAppointments] = useState(initialSettings.allowOverLimitAppointments ?? false);
    const [defaultScheduleView, setDefaultScheduleView] = useState(initialSettings.defaultScheduleView || "day");
    const [autoNoShowMode, setAutoNoShowMode] = useState<"off" | "auto_deduct" | "auto_no_deduct">(initialSettings.autoNoShowMode || "off");
    const [openingTime, setOpeningTime] = useState(initialSettings.openingTime || "08:00");
    const [closingTime, setClosingTime] = useState(initialSettings.closingTime || "18:00");

    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    // Sincroniza quando o modal abre (caso o initialSettings mude no banco)
    useEffect(() => {
      if (open) {
        setAutoConfirmAppointments(initialSettings.autoConfirmAppointments ?? false);
        setAllowOverLimitAppointments(initialSettings.allowOverLimitAppointments ?? false);
        setDefaultScheduleView(initialSettings.defaultScheduleView || "day");
        setAutoNoShowMode(initialSettings.autoNoShowMode || "off");
        setOpeningTime(initialSettings.openingTime || "08:00");
        setClosingTime(initialSettings.closingTime || "18:00");
      }
    }, [open, initialSettings]);

    const handleConfirm = async () => {
      setIsSaving(true);
      try {
        await onSave({
          autoConfirmAppointments,
          allowOverLimitAppointments,
          defaultScheduleView,
          autoNoShowMode,
          openingTime,
          closingTime
        });
        onOpenChange(false);
      } catch (error) {
        toast.error("Erro ao salvar configurações.");
      } finally {
        setIsSaving(false);
      }
    };
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:w-[450px] sm:max-w-md p-0 flex flex-col border-none shadow-2xl overflow-hidden bg-background">
          <SheetHeader className="p-6 border-b text-left">
            <SheetTitle className="text-xl font-black flex items-center gap-2">
              Configurações da Agenda
            </SheetTitle>
            <SheetDescription className="font-medium text-sm">
              Personalize o funcionamento do agendamento.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">

            {/* Confirmar Automático */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 text-sm">
                <Label className="font-bold text-foreground">Confirmar agendamentos automaticamente</Label>
                <p className="text-muted-foreground leading-relaxed text-xs">
                  Ao ativar, todo agendamento feito pelo seu link será confirmado automaticamente. Se desativado, ficará pendente até você confirmar.
                </p>
              </div>
              <Switch
                checked={autoConfirmAppointments}
                onCheckedChange={setAutoConfirmAppointments}
              />
            </div>



            {/* Permitir Ultrapassar */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 text-sm">
                <Label className="font-bold text-foreground">Permitir ultrapassar o horário limite</Label>
                <p className="text-muted-foreground leading-relaxed text-xs">
                  Se um serviço de 35 min começaria às 17:30 e você atende até 18:00, a grade ainda oferece esse horário.
                </p>
              </div>
              <Switch
                checked={allowOverLimitAppointments}
                onCheckedChange={setAllowOverLimitAppointments}
              />
            </div>

            {/* Falta Automática */}
            <div className="p-4 rounded-xl border bg-muted/20 space-y-6">
              <div className="space-y-1 text-sm">
                <Label className="font-bold text-foreground">Ação Automática para Atrasos</Label>
                <p className="text-muted-foreground leading-relaxed text-xs">
                  Escolha o que o sistema deve fazer quando o agendamento passar do horário sem check-in.
                  Se deixar ambas desativadas, o agendamento continuará pendente (cor laranja).
                </p>
              </div>
              
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 text-sm">
                    <Label className="font-bold text-foreground">Descontar sessão do pacote</Label>
                    <p className="text-muted-foreground leading-relaxed text-xs">
                      Registra a falta e desconta a sessão do pacote do cliente automaticamente.
                    </p>
                  </div>
                  <Switch
                    checked={autoNoShowMode === "auto_deduct"}
                    onCheckedChange={(checked) => {
                      setAutoNoShowMode(checked ? "auto_deduct" : "off");
                    }}
                  />
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 text-sm">
                    <Label className="font-bold text-foreground">Abonar falta (Não descontar)</Label>
                    <p className="text-muted-foreground leading-relaxed text-xs">
                      Registra a falta, mas não desconta a sessão do pacote do cliente.
                    </p>
                  </div>
                  <Switch
                    checked={autoNoShowMode === "auto_no_deduct"}
                    onCheckedChange={(checked) => {
                      setAutoNoShowMode(checked ? "auto_no_deduct" : "off");
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Visualização Padrão */}
            <div className="space-y-3">
              <div className="space-y-1 text-sm">
                <Label className="font-bold text-foreground">Visualização padrão ao abrir a agenda</Label>
              </div>
              <Select value={defaultScheduleView} onValueChange={setDefaultScheduleView}>
                <SelectTrigger className="bg-muted/40 border-none h-11 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className=" rounded-2xl">
                  <SelectItem value="day" className="rounded-lg">Dia</SelectItem>
                  <SelectItem value="week" className="rounded-lg">Semana</SelectItem>
                  <SelectItem value="month" className="rounded-lg">Mês</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Início e Fim da Grade */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="font-bold text-foreground">Início da grade</Label>
                <Select value={openingTime} onValueChange={setOpeningTime}>
                  <SelectTrigger className="bg-muted/40 border-none h-11 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="h-64 rounded-2xl">
                    {HOUR_SLOTS.map((hour) => (
                      <SelectItem key={hour} value={hour} className="rounded-lg">
                        {hour}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="font-bold text-foreground">Fim da grade</Label>
                <Select value={closingTime} onValueChange={setClosingTime}>
                  <SelectTrigger className="bg-muted/40 border-none h-11 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="h-64 rounded-2xl">
                    {HOUR_SLOTS.map((hour) => (
                      <SelectItem key={hour} value={hour} className="rounded-lg">
                        {hour}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Atalho para Grade de Horários */}
            <div className="pt-4 border-t border-border">
              <Button
                variant="outline"
                className="w-full h-12 flex justify-between items-center bg-muted/20 border-border hover:bg-muted/50 rounded-xl"
                onClick={() => {
                  onOpenChange(false);
                  router.push("/admin/self-service");
                }}
              >
                <span className="font-bold text-foreground">Configurar Grade de Horários</span>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </Button>
              <p className="text-muted-foreground text-xs mt-2 text-center">
                Defina seus dias de folga, horário de almoço e exceções.
              </p>
            </div>

          </div>

          <div className="p-4 border-t bg-background flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12 font-bold text-muted-foreground border-transparent hover:border-border"
            >
              Voltar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isSaving}
              className="flex-1 h-12 bg-primary font-black text-primary-foreground"
            >
              {isSaving ? <LoaderDots className="animate-spin h-5 w-5" /> : "Salvar"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  },
);

ScheduleSettingsModal.displayName = "ScheduleSettingsModal";

// components/agenda/schedule-settings-modal.tsx (Now a Sidebar/Sheet)
"use client";

import React, { useState, useEffect, memo } from "react";
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

    const [isSaving, setIsSaving] = useState(false);

    // Sincroniza quando o modal abre (caso o initialSettings mude no banco)
    useEffect(() => {
      if (open) {
        setAutoConfirmAppointments(initialSettings.autoConfirmAppointments ?? false);
        setAllowOverLimitAppointments(initialSettings.allowOverLimitAppointments ?? false);
        setDefaultScheduleView(initialSettings.defaultScheduleView || "day");
      }
    }, [open, initialSettings]);

    const handleConfirm = async () => {
      setIsSaving(true);
      try {
        await onSave({
          autoConfirmAppointments,
          allowOverLimitAppointments,
          defaultScheduleView
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

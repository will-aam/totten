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
import { Clock, LoaderDots, AlertTriangle, ChevronLeft } from "@boxicons/react";
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
import { clearTodayAgenda } from "@/app/actions/appointments";

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
  onClearToday?: (deletedCount: number) => void;
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
    onClearToday,
  }: ScheduleSettingsModalProps) => {
    const [autoConfirmAppointments, setAutoConfirmAppointments] = useState(initialSettings.autoConfirmAppointments ?? false);
    const [allowOverLimitAppointments, setAllowOverLimitAppointments] = useState(initialSettings.allowOverLimitAppointments ?? false);
    const [defaultScheduleView, setDefaultScheduleView] = useState(initialSettings.defaultScheduleView || "day");

    const [isSaving, setIsSaving] = useState(false);
    const [clearPassword, setClearPassword] = useState("");
    const [isClearing, setIsClearing] = useState(false);
    const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);

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

    const handleClearToday = async () => {
      if (!clearPassword) {
        toast.error("Digite sua senha.");
        return;
      }

      setIsClearing(true);
      try {
        const result = await clearTodayAgenda(clearPassword);
        if (result.error) {
          toast.error(result.error);
          return;
        }

        toast.success(`Agenda limpa! ${result.deleted ?? 0} removidos.`);
        setClearPassword("");
        setIsClearDialogOpen(false);
        onClearToday?.(result.deleted ?? 0);
      } catch (error) {
        toast.error("Erro ao conectar com o servidor.");
      } finally {
        setIsClearing(false);
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
                <SelectTrigger className="rounded-xl bg-muted/40 border-none h-11 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="day" className="rounded-lg">Dia</SelectItem>
                  <SelectItem value="week" className="rounded-lg">Semana</SelectItem>
                  <SelectItem value="month" className="rounded-lg">Mês</SelectItem>
                </SelectContent>
              </Select>
            </div>



            {/* ÁREA DE PERIGO (LIMPEZA) */}
            <div className="rounded-2xl border-2 border-destructive/10 bg-destructive/5 p-4 mt-8">
              <div className="flex flex-col gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-black text-destructive flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    Limpar hoje
                  </p>
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                    Remove todos os agendamentos desta data. Esta ação é irreversível.
                  </p>
                </div>

                <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="w-full rounded-xl h-11 font-bold">
                      Limpar agendamentos
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-3xl border-none">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-black text-xl">Confirmar Limpeza</AlertDialogTitle>
                      <AlertDialogDescription className="font-medium">
                        Esta ação é irreversível. Digite sua senha de admin para prosseguir.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="my-2">
                      <Input
                        type="password"
                        value={clearPassword}
                        onChange={(e) => setClearPassword(e.target.value)}
                        placeholder="Sua senha de acesso"
                        className="rounded-2xl h-12 bg-muted/40 border-none"
                      />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-2xl h-12 font-bold">Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearToday} disabled={isClearing} className="rounded-2xl h-12 bg-destructive text-white font-black">
                        {isClearing ? <LoaderDots className="animate-spin" /> : "Sim, apagar tudo"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>

          <div className="p-4 border-t bg-background flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-xl h-12 font-bold text-muted-foreground border-transparent hover:border-border"
            >
              Voltar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isSaving}
              className="flex-1 rounded-xl h-12 bg-primary font-black text-primary-foreground"
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

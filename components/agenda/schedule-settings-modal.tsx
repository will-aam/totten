// components/agenda/schedule-settings-modal.tsx
"use client";

import React, { useState, useEffect, memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Clock, LoaderDots, AlertTriangle } from "@boxicons/react";
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
import { cn } from "@/lib/utils";

type ScheduleSettings = {
  openingTime: string;
  closingTime: string;
};

interface ScheduleSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSettings: ScheduleSettings;
  onSave: (settings: ScheduleSettings) => Promise<void>; // 🔥 Mudou para Promise
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
    const [openingTime, setOpeningTime] = useState(initialSettings.openingTime);
    const [closingTime, setClosingTime] = useState(initialSettings.closingTime);
    const [isSaving, setIsSaving] = useState(false);

    const [clearPassword, setClearPassword] = useState("");
    const [isClearing, setIsClearing] = useState(false);
    const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);

    // Sincroniza quando o modal abre (caso o initialSettings mude no banco)
    useEffect(() => {
      if (open) {
        setOpeningTime(initialSettings.openingTime);
        setClosingTime(initialSettings.closingTime);
      }
    }, [open, initialSettings]);

    const handleConfirm = async () => {
      if (closingTime <= openingTime) {
        toast.error("O fechamento deve ser após a abertura.");
        return;
      }

      setIsSaving(true);
      try {
        await onSave({ openingTime, closingTime });
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
        const res = await fetch("/api/admin/agenda/clear-today", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: clearPassword }),
        });

        if (!res.ok) throw new Error("Senha incorreta ou erro no servidor.");

        const data = await res.json();
        toast.success(`Agenda limpa! ${data.deleted ?? 0} removidos.`);
        setClearPassword("");
        setIsClearDialogOpen(false);
        onClearToday?.(data.deleted ?? 0);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setIsClearing(false);
      }
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Configurar Expediente
            </DialogTitle>
            <DialogDescription className="font-medium">
              Ajuste os limites de horário da sua agenda diária.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">
                  Início
                </Label>
                <Select value={openingTime} onValueChange={setOpeningTime}>
                  <SelectTrigger className="rounded-2xl bg-muted/40 border-none h-12 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {HOUR_SLOTS.map((slot) => (
                      <SelectItem
                        key={slot}
                        value={slot}
                        className="rounded-lg"
                      >
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">
                  Término
                </Label>
                <Select value={closingTime} onValueChange={setClosingTime}>
                  <SelectTrigger className="rounded-2xl bg-muted/40 border-none h-12 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {HOUR_SLOTS.map((slot) => (
                      <SelectItem
                        key={slot}
                        value={slot}
                        className="rounded-lg"
                      >
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ÁREA DE PERIGO (LIMPEZA) */}
            <div className="rounded-2xl border-2 border-destructive/10 bg-destructive/2 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-black text-destructive flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Limpar hoje
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase leading-tight">
                    Remove todos os agendamentos desta data.
                  </p>
                </div>

                <AlertDialog
                  open={isClearDialogOpen}
                  onOpenChange={setIsClearDialogOpen}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="rounded-xl h-9 px-4 font-bold"
                    >
                      Limpar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-3xl border-none">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-black text-xl">
                        Confirmar Limpeza
                      </AlertDialogTitle>
                      <AlertDialogDescription className="font-medium">
                        Esta ação é irreversível. Digite sua senha de admin para
                        prosseguir.
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
                      <AlertDialogCancel className="rounded-2xl h-12 font-bold">
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleClearToday}
                        disabled={isClearing}
                        className="rounded-2xl h-12 bg-destructive text-white font-black"
                      >
                        {isClearing ? (
                          <LoaderDots className="animate-spin" />
                        ) : (
                          "Sim, apagar tudo"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-2xl h-12 font-bold text-muted-foreground"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isSaving}
              className="rounded-2xl h-12 px-8 bg-primary font-black"
            >
              {isSaving ? (
                <LoaderDots className="animate-spin" />
              ) : (
                "Salvar Configurações"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);

ScheduleSettingsModal.displayName = "ScheduleSettingsModal";

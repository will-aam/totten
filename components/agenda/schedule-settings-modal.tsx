"use client";

import { useState, useEffect } from "react";
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
import { Clock } from "lucide-react";

type ScheduleSettings = {
  openingTime: string; // "08:00"
  closingTime: string; // "19:00"
};

interface ScheduleSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSettings: ScheduleSettings;
  onSave: (settings: ScheduleSettings) => void;
}

// Gera slots de hora cheia: 00:00, 01:00, ..., 23:00
const HOUR_SLOTS = Array.from(
  { length: 24 },
  (_, i) => `${String(i).padStart(2, "0")}:00`,
);

export function ScheduleSettingsModal({
  open,
  onOpenChange,
  initialSettings,
  onSave,
}: ScheduleSettingsModalProps) {
  const [openingTime, setOpeningTime] = useState(initialSettings.openingTime);
  const [closingTime, setClosingTime] = useState(initialSettings.closingTime);

  // Sempre que o modal abrir, sincroniza com o valor vindo do pai
  useEffect(() => {
    if (open) {
      setOpeningTime(initialSettings.openingTime);
      setClosingTime(initialSettings.closingTime);
    }
  }, [open, initialSettings.openingTime, initialSettings.closingTime]);

  const handleConfirm = () => {
    // Garantia simples: não deixar fechamento antes da abertura
    if (closingTime <= openingTime) {
      // você pode trocar por um toast se quiser
      alert("O horário de fechamento deve ser depois do horário de abertura.");
      return;
    }

    onSave({ openingTime, closingTime });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar Horário da Agenda</DialogTitle>
          <DialogDescription>
            Defina o horário de funcionamento diário. A agenda e os horários
            disponíveis para novos agendamentos seguirão essa faixa.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Horário de abertura */}
          <div className="flex flex-col gap-2">
            <Label>Início do expediente</Label>
            <Select value={openingTime} onValueChange={setOpeningTime}>
              <SelectTrigger className="bg-background">
                <Clock className="mr-2 h-4 w-4 opacity-50 shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {HOUR_SLOTS.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Horário de fechamento */}
          <div className="flex flex-col gap-2">
            <Label>Fim do expediente</Label>
            <Select value={closingTime} onValueChange={setClosingTime}>
              <SelectTrigger className="bg-background">
                <Clock className="mr-2 h-4 w-4 opacity-50 shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {HOUR_SLOTS.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter
          className="
            flex flex-col-reverse gap-2
            sm:flex-row sm:justify-end sm:gap-3
          "
        >
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="w-full sm:w-auto">
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

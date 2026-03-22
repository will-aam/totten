// components/agenda/new-appointment-modal.tsx
"use client";

import React, { useEffect, useState, useMemo, memo } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Repeat,
  Calendar as CalendarIcon,
  Clock,
  Minus,
  Plus,
  Package as PackageIcon,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createAppointment } from "@/app/actions/appointments";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface NewAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
  openingTime?: string;
  closingTime?: string;
  initialDate?: Date;
}

type ActivePackage = {
  id: string;
  name: string;
  total_sessions: number;
  used_sessions: number;
  service_id: string;
};

function generateTimeSlots(openingTime: string, closingTime: string) {
  const [openH, openM] = openingTime.split(":").map(Number);
  const [closeH, closeM] = closingTime.split(":").map(Number);
  const slots: string[] = [];
  const current = new Date();
  current.setHours(openH, openM, 0, 0);
  const end = new Date();
  end.setHours(closeH, closeM, 0, 0);

  while (current <= end) {
    slots.push(format(current, "HH:mm"));
    current.setMinutes(current.getMinutes() + 30);
  }
  return slots;
}

export const NewAppointmentModal = memo(
  ({
    open,
    onOpenChange,
    onCreated,
    openingTime = "08:00",
    closingTime = "19:00",
    initialDate,
  }: NewAppointmentModalProps) => {
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [time, setTime] = useState<string | undefined>(undefined);
    const [selectedClientId, setSelectedClientId] = useState<
      string | undefined
    >(undefined);
    const [selectedServiceId, setSelectedServiceId] = useState<
      string | undefined
    >(undefined);
    const [isRecurring, setIsRecurring] = useState(false);
    const [repeatCount, setRepeatCount] = useState(2);
    const [saving, setSaving] = useState(false);

    // 🔥 ESTADOS ORIGINAIS RESTAURADOS PARA O PACOTE
    const [activePackage, setActivePackage] = useState<ActivePackage | null>(
      null,
    );
    const [usePackage, setUsePackage] = useState(false);

    const TIME_SLOTS = useMemo(
      () => generateTimeSlots(openingTime, closingTime),
      [openingTime, closingTime],
    );

    // Lista de Clientes Ativos
    const { data: clientsResponse, isLoading: loadingClients } = useSWR(
      open ? "/api/clients?active=true&limit=1000" : null,
      fetcher,
    );
    const clients = clientsResponse?.data || [];

    // Lista de Serviços Ativos
    const { data: servicesResponse, isLoading: loadingServices } = useSWR(
      open ? "/api/services?active=true" : null,
      fetcher,
    );
    const services = Array.isArray(servicesResponse)
      ? servicesResponse
      : servicesResponse?.data || [];

    // 🔥 1. O EXATO USEEFFECT ORIGINAL RESTAURADO PARA BUSCAR O PACOTE
    useEffect(() => {
      async function loadClientPackage() {
        if (!selectedClientId) {
          setActivePackage(null);
          setUsePackage(false);
          return;
        }
        try {
          const res = await fetch(`/api/clients/${selectedClientId}`);
          if (!res.ok) return;
          const data = await res.json();

          // Garantia blindada: Pega o pacote onde quer que sua API o tenha colocado
          const pkg =
            data.activePackage ||
            data.client?.activePackage ||
            data.data?.activePackage ||
            null;
          setActivePackage(pkg);
        } catch (error) {
          console.error("Erro ao buscar pacote:", error);
        }
      }

      // Só chama se o modal estiver aberto para evitar fetch desnecessário
      if (open) {
        loadClientPackage();
      }
    }, [selectedClientId, open]);

    // Limpeza ao fechar
    useEffect(() => {
      if (!open) {
        setSelectedClientId(undefined);
        setSelectedServiceId(undefined);
        setUsePackage(false);
        setIsRecurring(false);
        setRepeatCount(2);
        setTime(undefined);
        setActivePackage(null);
      } else {
        setDate(initialDate || new Date());
      }
    }, [open, initialDate]);

    const saldoDisponivel = activePackage
      ? activePackage.total_sessions - activePackage.used_sessions
      : 0;

    // 🔥 2. AUTO-PREENCHIMENTO INTELIGENTE (Pacote -> Recorrência)
    useEffect(() => {
      if (usePackage && activePackage) {
        setSelectedServiceId(activePackage.service_id);

        if (saldoDisponivel > 1 && !isRecurring) {
          setIsRecurring(true);
          setRepeatCount(saldoDisponivel);
        } else if (isRecurring && repeatCount > saldoDisponivel) {
          setRepeatCount(saldoDisponivel > 1 ? saldoDisponivel : 2);
          if (saldoDisponivel < 2) setIsRecurring(false);
        }
      }
    }, [usePackage, activePackage, isRecurring, repeatCount, saldoDisponivel]);

    const handleSave = async () => {
      if (!selectedClientId || !selectedServiceId || !date || !time) {
        toast.error("Preencha todos os campos obrigatórios.");
        return;
      }

      const [hourStr, minuteStr] = time.split(":");
      const fullDateTime = new Date(date);
      fullDateTime.setHours(Number(hourStr), Number(minuteStr), 0, 0);

      setSaving(true);
      try {
        const result = await createAppointment({
          clientId: selectedClientId,
          serviceId: selectedServiceId,
          dateTime: fullDateTime,
          packageId: usePackage && activePackage ? activePackage.id : undefined,
          repeatCount: isRecurring ? repeatCount : 1,
        });

        if (!result.success) {
          toast.error(result.error || "Erro ao salvar agendamento.");
          return;
        }

        toast.success(
          isRecurring
            ? `Sucesso! ${repeatCount} agendamentos criados.`
            : "Agendamento criado!",
        );
        onOpenChange(false);
        onCreated?.();
      } catch (error) {
        toast.error("Erro inesperado ao salvar.");
      } finally {
        setSaving(false);
      }
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[95vh] overflow-y-auto rounded-4xl border-none shadow-2xl bg-background">
          <DialogHeader className="space-y-1 mt-2">
            <DialogTitle className="text-center text-xl font-black">
              Novo Agendamento
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            {/* CLIENTE */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Cliente
              </Label>
              <Select
                value={selectedClientId}
                onValueChange={setSelectedClientId}
              >
                <SelectTrigger className="bg-muted/40 border-none rounded-2xl h-12 transition-all">
                  <SelectValue
                    placeholder={
                      loadingClients
                        ? "Carregando..."
                        : "Selecione a cliente..."
                    }
                  />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border border-border/50 bg-background shadow-xl">
                  {clients.map((c: any) => (
                    <SelectItem
                      key={c.id}
                      value={c.id}
                      className="rounded-xl py-2 font-medium"
                    >
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 🔥 PACOTE DA CLIENTE (Aparece dinamicamente se a cliente tiver pacote com saldo) */}
            {activePackage && (
              <div
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300",
                  usePackage
                    ? "bg-primary/5 border-primary shadow-inner"
                    : "bg-muted/20 border-transparent opacity-80",
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-2.5 rounded-xl transition-colors",
                      usePackage
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground shadow-sm",
                    )}
                  >
                    <PackageIcon className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black leading-none">
                      {activePackage.name}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
                      Saldo: {saldoDisponivel} sessões
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Label className="text-[10px] font-black uppercase opacity-60 cursor-pointer">
                    Utilizar
                  </Label>
                  <Switch
                    checked={usePackage}
                    onCheckedChange={setUsePackage}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              </div>
            )}

            {/* SERVIÇO */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Serviço
              </Label>
              <Select
                disabled={loadingServices || usePackage}
                value={selectedServiceId}
                onValueChange={setSelectedServiceId}
              >
                <SelectTrigger
                  className={cn(
                    "rounded-2xl bg-muted/40 border-none h-12 transition-all",
                    usePackage &&
                      "bg-primary/5 text-primary font-black opacity-100",
                  )}
                >
                  <SelectValue placeholder="O que será feito?" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border border-border/50 bg-background shadow-xl">
                  {services.map((s: any) => (
                    <SelectItem
                      key={s.id}
                      value={s.id}
                      className="rounded-xl py-2 font-medium"
                    >
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* DATA/HORA */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Data
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full rounded-2xl bg-muted/40 border-none justify-start h-12 font-bold"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                      {date ? format(date, "dd/MM/yy") : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 border-none shadow-2xl rounded-3xl"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Horário
                </Label>
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger className="rounded-2xl bg-muted/40 border-none h-12 font-bold">
                    <Clock className="mr-2 h-4 w-4 text-primary" />
                    <SelectValue placeholder="--" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border border-border/50 bg-background max-h-48">
                    {TIME_SLOTS.map((slot) => (
                      <SelectItem
                        key={slot}
                        value={slot}
                        className="rounded-lg font-bold"
                      >
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* RECORRÊNCIA */}
            <div
              className={cn(
                "border-2 rounded-3xl p-4 transition-all duration-500",
                isRecurring
                  ? "border-primary/20 bg-primary/3"
                  : "border-muted/30 bg-muted/5 opacity-80",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-xl transition-colors",
                      isRecurring
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Repeat className="h-4 w-4" />
                  </div>
                  <Label className="font-black text-sm cursor-pointer">
                    Agendamento Recorrente
                  </Label>
                </div>
                <Switch
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                  disabled={usePackage && saldoDisponivel < 2}
                />
              </div>

              {isRecurring && (
                <div className="mt-4 pt-4 border-t border-dashed border-primary/20 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between bg-white dark:bg-black/20 p-3 rounded-2xl border border-primary/10">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-black text-primary uppercase">
                        Sessões Programadas
                      </span>
                      <span className="text-[9px] text-muted-foreground font-bold">
                        Total de {repeatCount} horários.
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg bg-muted/50 hover:bg-muted"
                        onClick={() =>
                          setRepeatCount(Math.max(2, repeatCount - 1))
                        }
                        disabled={repeatCount <= 2}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-5 text-center font-black">
                        {repeatCount}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg bg-muted/50 hover:bg-muted"
                        onClick={() => setRepeatCount(repeatCount + 1)}
                        disabled={usePackage && repeatCount >= saldoDisponivel}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-2 pb-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="rounded-2xl h-12 font-bold text-muted-foreground w-full sm:w-1/3"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-2xl h-12 font-black bg-primary text-primary-foreground shadow-lg shadow-primary/20 w-full sm:w-2/3 active:scale-[0.98] transition-all"
            >
              {saving ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : isRecurring ? (
                `Agendar ${repeatCount} Sessões`
              ) : (
                "Confirmar Agendamento"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);

NewAppointmentModal.displayName = "NewAppointmentModal";

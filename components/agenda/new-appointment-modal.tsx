"use client";

import { useEffect, useState } from "react";
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
  CalendarClock,
  Repeat,
  Calendar as CalendarIcon,
  Clock,
  Minus,
  Plus,
  Package as PackageIcon,
} from "lucide-react"; // Sparkles removido daqui
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createAppointment } from "@/app/actions/appointments";

interface NewAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
  openingTime?: string;
  closingTime?: string;
  initialDate?: Date;
}

type ClientOption = { id: string; name: string };
type ServiceOption = { id: string; name: string };
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
    const h = String(current.getHours()).padStart(2, "0");
    const m = String(current.getMinutes()).padStart(2, "0");
    slots.push(`${h}:${m}`);
    current.setMinutes(current.getMinutes() + 30);
  }
  return slots;
}

export function NewAppointmentModal({
  open,
  onOpenChange,
  onCreated,
  openingTime = "08:00",
  closingTime = "19:00",
  initialDate,
}: NewAppointmentModalProps) {
  const [date, setDate] = useState<Date | undefined>(initialDate || new Date());
  const [time, setTime] = useState<string | undefined>(undefined);

  const [isRecurring, setIsRecurring] = useState(false);
  const [repeatCount, setRepeatCount] = useState(2);

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(
    undefined,
  );
  const [selectedServiceId, setSelectedServiceId] = useState<
    string | undefined
  >(undefined);

  const [activePackage, setActivePackage] = useState<ActivePackage | null>(
    null,
  );
  const [usePackage, setUsePackage] = useState(false);

  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);

  const TIME_SLOTS = generateTimeSlots(openingTime, closingTime);

  const incrementRepeat = () => setRepeatCount((prev) => prev + 1);
  const decrementRepeat = () =>
    setRepeatCount((prev) => (prev > 2 ? prev - 1 : 2));

  useEffect(() => {
    async function loadOptions() {
      if (!open) return;
      setLoadingOptions(true);
      try {
        const [clientsRes, servicesRes] = await Promise.all([
          fetch("/api/admin/clients"),
          fetch("/api/services?active=true"),
        ]);
        if (clientsRes.ok) {
          const data = await clientsRes.json();
          setClients(
            (data.clients ?? []).map((c: any) => ({ id: c.id, name: c.name })),
          );
        }
        if (servicesRes.ok) {
          const data = await servicesRes.json();
          setServices(data.map((s: any) => ({ id: s.id, name: s.name })));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingOptions(false);
      }
    }
    loadOptions();
  }, [open]);

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
        setActivePackage(data.activePackage || null);
      } catch (error) {
        console.error(error);
      }
    }
    loadClientPackage();
  }, [selectedClientId]);

  useEffect(() => {
    if (usePackage && activePackage) {
      setSelectedServiceId(activePackage.service_id);
      const saldo = activePackage.total_sessions - activePackage.used_sessions;
      if (isRecurring && repeatCount > saldo) {
        setRepeatCount(saldo > 1 ? saldo : 2);
        if (saldo < 2) setIsRecurring(false);
      }
    }
  }, [usePackage, activePackage, isRecurring, repeatCount]);

  useEffect(() => {
    if (!open) {
      setSelectedClientId(undefined);
      setSelectedServiceId(undefined);
      setUsePackage(false);
      setIsRecurring(false);
      setRepeatCount(2);
      setTime(undefined);
    } else {
      setDate(initialDate || new Date());
    }
  }, [open, initialDate]);

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
          ? `Sucesso! Foram criados ${repeatCount} agendamentos.`
          : "Agendamento criado com sucesso!",
      );
      onOpenChange(false);
      onCreated?.();
    } catch (error) {
      toast.error("Erro inesperado ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const saldoDisponivel = activePackage
    ? activePackage.total_sessions - activePackage.used_sessions
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[95vh] overflow-y-auto rounded-3xl border border-border/50 bg-background">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-center text-xl font-bold">
            Novo Agendamento
          </DialogTitle>
          <DialogDescription className="text-center">
            Configure os detalhes do serviço e horários.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          {/* CLIENTE */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
              Cliente
            </Label>
            <Select
              value={selectedClientId}
              onValueChange={setSelectedClientId}
            >
              <SelectTrigger className="bg-muted/30 border-none rounded-2xl h-12 focus:ring-2 focus:ring-primary/20 transition-all">
                <SelectValue
                  placeholder={
                    loadingOptions ? "Carregando..." : "Selecione a cliente..."
                  }
                />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-border/50 bg-background">
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="rounded-lg">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* PACOTE */}
          {activePackage && (
            <div
              className={cn(
                "flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300",
                usePackage
                  ? "bg-primary/5 border-primary"
                  : "bg-muted/20 border-transparent",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2 rounded-xl transition-colors",
                    usePackage
                      ? "bg-primary text-white"
                      : "bg-background text-muted-foreground",
                  )}
                >
                  <PackageIcon className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold leading-tight">
                    {activePackage.name}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Saldo: {saldoDisponivel} sessões
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-[10px] font-black uppercase tracking-tighter opacity-70">
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
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
              Serviço
            </Label>
            <Select
              disabled={loadingOptions || usePackage}
              value={selectedServiceId}
              onValueChange={setSelectedServiceId}
            >
              <SelectTrigger
                className={cn(
                  "rounded-2xl bg-muted/30 border-none h-12 transition-all",
                  usePackage && "bg-primary/5 text-primary font-semibold",
                )}
              >
                <SelectValue placeholder="Selecione o serviço..." />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-border/50 bg-background">
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="rounded-lg">
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* DATA/HORA */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                Data Inicial
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full rounded-2xl bg-muted/30 border-none justify-start text-left font-normal h-12"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                    {date ? format(date, "dd/MM/yy") : <span>Selecione</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 border border-border/50 bg-background rounded-3xl"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    locale={ptBR}
                    initialFocus
                    className="rounded-3xl"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                Horário
              </Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger className="rounded-2xl bg-muted/30 border-none h-12">
                  <Clock className="mr-2 h-4 w-4 text-primary" />
                  <SelectValue placeholder="Hora" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border border-border/50 bg-background max-h-48">
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot} className="rounded-lg">
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
                ? "border-primary/30 bg-primary/2"
                : "border-muted/30 bg-muted/5",
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2 rounded-full",
                    isRecurring
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Repeat className="h-4 w-4" />
                </div>
                <Label className="font-bold text-sm cursor-pointer">
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
              <div className="mt-4 pt-4 border-t border-dashed border-primary/20 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-primary">
                      Repetir semanalmente por:
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      Ocupará as próximas {repeatCount} semanas.
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-background border border-border/50 rounded-2xl p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-xl hover:bg-primary/10 hover:text-primary active:scale-95 transition-transform"
                      onClick={decrementRepeat}
                      disabled={repeatCount <= 2}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-6 text-center font-black text-sm">
                      {repeatCount}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-xl hover:bg-primary/10 hover:text-primary active:scale-95 transition-transform"
                      onClick={incrementRepeat}
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

        <DialogFooter className="sm:justify-between gap-3 flex flex-col sm:flex-row">
          {/* Botão Cancelar padronizado: h-12, rounded-2xl, font-bold, porém com variant "outline" e cor neutra */}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="w-full sm:w-auto rounded-2xl h-12 font-bold border border-border/50 bg-muted/30 hover:bg-muted transition-all"
          >
            Cancelar
          </Button>

          {/* Botão Principal padronizado: h-12, font-bold, sem ícones */}
          <Button
            onClick={handleSave}
            className="w-full sm:w-auto bg-primary text-primary-foreground rounded-2xl h-12 px-10 font-bold active:scale-[0.98] transition-all"
            disabled={saving}
          >
            {saving
              ? "Processando..."
              : isRecurring
                ? `Agendar ${repeatCount} Sessões`
                : "Confirmar Agendamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

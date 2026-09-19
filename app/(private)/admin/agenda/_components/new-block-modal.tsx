"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ResponsiveModal } from "./responsive-modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Clock, LoaderDots, User } from "@boxicons/react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { getTeam } from "@/app/actions/team";
import { createScheduleBlock } from "@/app/actions/schedule-blocks";

interface NewBlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
  openingTime?: string;
  closingTime?: string;
  initialDate?: Date;
}

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

export function NewBlockModal({
  open,
  onOpenChange,
  onCreated,
  openingTime = "08:00",
  closingTime = "19:00",
  initialDate,
}: NewBlockModalProps) {
  const { data: session } = useSession();
  const isOwner = session?.user?.role === "OWNER";

  const [title, setTitle] = useState("Pausa");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState<string>("12:00");
  const [endTime, setEndTime] = useState<string>("13:00");
  const [professionalId, setProfessionalId] = useState<string | undefined>(undefined);
  const [team, setTeam] = useState<{ id: string; display_name: string | null }[]>([]);
  const [saving, setSaving] = useState(false);

  const TIME_SLOTS = React.useMemo(() => generateTimeSlots(openingTime, closingTime), [openingTime, closingTime]);

  useEffect(() => {
    async function fetchTeam() {
      if (open && isOwner) {
        const res = await getTeam();
        if (res.success && res.data) {
          setTeam(res.data);
        }
      }
    }
    fetchTeam();
  }, [open, isOwner]);

  useEffect(() => {
    if (open) {
      setDate(initialDate || new Date());
      if (session?.user?.id && !professionalId) {
        setProfessionalId(session.user.id);
      }
    } else {
      setTitle("Pausa");
    }
  }, [open, initialDate, session?.user?.id]);

  const handleSave = async () => {
    const finalProfId = professionalId || session?.user?.id;
    if (!date || !startTime || !endTime || !finalProfId) {
      toast.error("Preencha todos os campos.");
      return;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const [startH, startM] = startTime.split(":");
    const startIso = `${year}-${month}-${day}T${startH}:${startM}:00.000-03:00`;

    const [endH, endM] = endTime.split(":");
    const endIso = `${year}-${month}-${day}T${endH}:${endM}:00.000-03:00`;

    if (new Date(endIso) <= new Date(startIso)) {
      toast.error("O horário de término deve ser após o início.");
      return;
    }

    setSaving(true);
    try {
      const result = await createScheduleBlock({
        title,
        start_time: startIso,
        end_time: endIso,
        professional_id: finalProfId,
      });

      if (!result.success) throw new Error(result.error);

      toast.success("Bloqueio de horário criado!");
      onOpenChange(false);
      onCreated?.();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar bloqueio.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title="Bloquear Horário">
      <div className="grid gap-5 py-4">
        {isOwner && (
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
              Profissional
            </Label>
            <Select value={professionalId} onValueChange={setProfessionalId}>
              <SelectTrigger className="bg-muted/40 border-none h-12 transition-all">
                <User className="mr-2 h-4 w-4 text-primary" />
                <SelectValue placeholder="Selecione o profissional" />
              </SelectTrigger>
              <SelectContent className="border border-border/50 bg-background shadow-xl rounded-2xl">
                <SelectItem value={session?.user?.id || ""} className="rounded-full py-2 font-medium">
                  Admin
                </SelectItem>
                {team.filter((m) => m.id !== session?.user?.id).map((member) => (
                  <SelectItem key={member.id} value={member.id} className="rounded-full py-2 font-medium">
                    {member.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
            Motivo / Título
          </Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Almoço, Reunião"
            className="bg-muted/40 border-none h-12 font-bold px-4"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
            Data
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full bg-muted/40 border-none justify-start h-12 transition-all font-medium">
                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                {date ? format(date, "dd/MM/yy") : "Selecione"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-3xl" align="start">
              <Calendar mode="single" selected={date} onSelect={setDate} locale={ptBR} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
              Início
            </Label>
            <Select value={startTime} onValueChange={setStartTime}>
              <SelectTrigger className="bg-muted/40 border-none h-12 transition-all font-medium">
                <Clock className="mr-2 h-4 w-4 text-primary" />
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent className="border border-border/50 bg-background max-h-48 shadow-xl rounded-2xl">
                {TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot} value={slot} className="rounded-lg font-medium py-2">{slot}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
              Fim
            </Label>
            <Select value={endTime} onValueChange={setEndTime}>
              <SelectTrigger className="bg-muted/40 border-none h-12 transition-all font-medium">
                <Clock className="mr-2 h-4 w-4 text-primary" />
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent className="border border-border/50 bg-background max-h-48 shadow-xl rounded-2xl">
                {TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot} value={slot} className="rounded-lg font-medium py-2">{slot}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-2 mt-4">
        <Button
          variant="secondary"
          onClick={() => onOpenChange(false)}
          disabled={saving}
          className="h-12 font-bold w-full sm:w-1/2"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="h-12 font-black bg-primary text-primary-foreground w-full sm:w-1/2 active:scale-[0.98] transition-all"
        >
          {saving ? <LoaderDots className="mr-2 h-5 w-5 animate-spin" /> : "Bloquear"}
        </Button>
      </div>
    </ResponsiveModal>
  );
}

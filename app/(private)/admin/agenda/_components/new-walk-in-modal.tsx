"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoaderDots, User } from "@boxicons/react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { getTeam } from "@/app/actions/team";
import { createManualCheckIn } from "@/app/actions/waiting-room";
import { apiClient } from "@/lib/api-client";

interface NewWalkInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function NewWalkInModal({ open, onOpenChange, onCreated }: NewWalkInModalProps) {
  const { data: session } = useSession();
  const isOwner = session?.user?.role === "OWNER";

  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(undefined);
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(undefined);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | undefined>(undefined);
  const [team, setTeam] = useState<{ id: string; display_name: string | null }[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: clientsResponse, isLoading: loadingClients } = useSWR<any>(
    open ? "clients?active=true&limit=1000" : null,
    apiClient
  );
  const clients = clientsResponse?.data || [];

  const { data: servicesResponse, isLoading: loadingServices } = useSWR<any>(
    open ? "services?active=true" : null,
    apiClient
  );
  const services = Array.isArray(servicesResponse) ? servicesResponse : servicesResponse?.data || [];

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
    if (!open) {
      setSelectedClientId(undefined);
      setSelectedServiceId(undefined);
      setSelectedProfessionalId(undefined);
    } else if (session?.user?.id && !selectedProfessionalId) {
      setSelectedProfessionalId(session.user.id);
    }
  }, [open, session?.user?.id, selectedProfessionalId]);

  const handleSave = async () => {
    const finalProfId = selectedProfessionalId || session?.user?.id;
    if (!selectedClientId || !selectedServiceId || !finalProfId) {
      toast.error("Preencha cliente, serviço e profissional.");
      return;
    }

    setSaving(true);
    try {
      const result = await createManualCheckIn({
        clientId: selectedClientId,
        serviceId: selectedServiceId,
        professionalId: finalProfId,
      });

      if (!result.success) throw new Error(result.error);

      toast.success("Encaixe realizado! Paciente na Sala de Espera.");
      onOpenChange(false);
      onCreated?.();
    } catch (err: any) {
      toast.error(err.message || "Erro ao realizar encaixe.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[95vh] overflow-y-auto rounded-4xl border-none shadow-2xl bg-background">
        <DialogHeader className="space-y-1 mt-2">
          <DialogTitle className="text-center text-xl font-black text-primary">Check-in Rápido (Encaixe)</DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
              Paciente Presente
            </Label>
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger className="bg-muted/40 border-none rounded-2xl h-12 transition-all">
                <SelectValue placeholder={loadingClients ? "Carregando..." : "Selecione a paciente..."} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-border/50 bg-background shadow-xl">
                {clients.map((c: any) => (
                  <SelectItem key={c.id} value={c.id} className="rounded-xl py-2 font-medium">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
              Serviço Desejado
            </Label>
            <Select disabled={loadingServices} value={selectedServiceId} onValueChange={setSelectedServiceId}>
              <SelectTrigger className="rounded-2xl bg-muted/40 border-none h-12 transition-all">
                <SelectValue placeholder="O que será feito agora?" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-border/50 bg-background shadow-xl">
                {services.map((s: any) => (
                  <SelectItem key={s.id} value={s.id} className="rounded-xl py-2 font-medium">
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isOwner && (
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Profissional Designado
              </Label>
              <Select value={selectedProfessionalId} onValueChange={setSelectedProfessionalId}>
                <SelectTrigger className="bg-muted/40 border-none rounded-2xl h-12 transition-all">
                  <User className="mr-2 h-4 w-4 text-primary" />
                  <SelectValue placeholder="Quem fará o encaixe?" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border border-border/50 bg-background shadow-xl">
                  <SelectItem value={session?.user?.id || ""} className="rounded-xl py-2 font-medium">
                    Admin
                  </SelectItem>
                  {team.filter((m) => m.id !== session?.user?.id).map((member) => (
                    <SelectItem key={member.id} value={member.id} className="rounded-xl py-2 font-medium">
                      {member.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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
            className="rounded-2xl h-12 font-black bg-primary text-primary-foreground w-full sm:w-2/3 active:scale-[0.98] transition-all"
          >
            {saving ? <LoaderDots className="mr-2 h-5 w-5 animate-spin" /> : "Fazer Check-in"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

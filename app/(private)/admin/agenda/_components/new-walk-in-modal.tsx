"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { ResponsiveModal } from "./responsive-modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoaderDots, User, Calendar as CalendarIcon } from "@boxicons/react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { getTeam } from "@/app/actions/team";
import { createManualCheckIn } from "@/app/actions/waiting-room";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

import { Switch } from "@/components/ui/switch";
import { getPaymentMethods } from "@/app/actions/payment-methods";
import { OrganizationPaymentMethod } from "@/types/finance";

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

  // Pacote do cliente
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);
  const [usePackage, setUsePackage] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | undefined>(undefined);

  // Pagamento
  const [isPaid, setIsPaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string | undefined>(undefined);
  const [paymentMethods, setPaymentMethods] = useState<OrganizationPaymentMethod[]>([]);

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
    async function loadPaymentMethods() {
      if (open) {
        try {
          const methods = await getPaymentMethods();
          setPaymentMethods((methods as OrganizationPaymentMethod[]) || []);
        } catch (e) {
          console.error("Erro ao carregar formas de pagamento:", e);
        }
      }
    }
    loadPaymentMethods();
  }, [open]);

  useEffect(() => {
    async function loadClientPackages() {
      if (!selectedClientId) {
        setAvailablePackages([]);
        setUsePackage(false);
        setSelectedPackageId(undefined);
        return;
      }

      try {
        const data = await apiClient<any>(`clients/${selectedClientId}`);
        const pkgs = data.activePackages || data.client?.activePackages || data.data?.activePackages || [];
        const validPkgs = pkgs.filter((p: any) => p.active !== false && p.used_sessions < p.total_sessions);
        setAvailablePackages(validPkgs);

        if (validPkgs.length > 0) {
          setUsePackage(true);
          setSelectedPackageId(validPkgs[0].id);
        } else {
          setUsePackage(false);
          setSelectedPackageId(undefined);
        }
      } catch (err) {
        console.error("Erro ao carregar pacotes do cliente:", err);
      }
    }

    if (open) loadClientPackages();
  }, [selectedClientId, open]);

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
      setUsePackage(false);
      setSelectedPackageId(undefined);
      setIsPaid(false);
      setPaymentMethod(undefined);
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

    if (!usePackage && isPaid && !paymentMethod) {
      toast.error("Selecione a forma de pagamento.");
      return;
    }

    setSaving(true);
    try {
      const result = await createManualCheckIn({
        clientId: selectedClientId,
        serviceId: selectedServiceId,
        professionalId: finalProfId,
        packageId: usePackage ? selectedPackageId : undefined,
        isPaid: !usePackage ? isPaid : false,
        paymentMethod: !usePackage && isPaid ? paymentMethod : null,
      });

      if (!result.success) throw new Error(result.error);

      toast.success("Check-in realizado com sucesso! Estoque e financeiro sincronizados.");
      onOpenChange(false);
      onCreated?.();
    } catch (err: any) {
      toast.error(err.message || "Erro ao realizar check-in.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title="Check-in Rápido">
      <div className="grid gap-5 py-4">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
            Cliente Presente
          </Label>
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="bg-muted/40 border-none h-12 transition-all">
              <SelectValue placeholder={loadingClients ? "Carregando..." : "Selecione a Cliente..."} />
            </SelectTrigger>
            <SelectContent className="border border-border/50 bg-background shadow-xl rounded-2xl">
              {clients.map((c: any) => (
                <SelectItem key={c.id} value={c.id} className="rounded-full py-2 font-medium">
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
            <SelectTrigger className="bg-muted/40 border-none h-12 transition-all">
              <SelectValue placeholder="O que será feito agora?" />
            </SelectTrigger>
            <SelectContent className="border border-border/50 bg-background shadow-xl rounded-2xl">
              {services.map((s: any) => (
                <SelectItem key={s.id} value={s.id} className="rounded-full py-2 font-medium">
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
              <SelectTrigger className="bg-muted/40 border-none h-12 transition-all">
                <User className="mr-2 h-4 w-4 text-primary" />
                <SelectValue placeholder="Quem fará o encaixe?" />
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

        {/* VINCULAÇÃO A PACOTE OU PAGAMENTO AVULSO */}
        {availablePackages.length > 0 ? (
          <div className="border-2 border-primary/20 bg-primary/5 rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-wider text-primary">
                  Usar Pacote do Cliente
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Desconta automaticamente 1 sessão do saldo
                </span>
              </div>
              <Switch checked={usePackage} onCheckedChange={setUsePackage} />
            </div>

            {usePackage && availablePackages.length > 1 && (
              <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
                <SelectTrigger className="bg-background border-border/50 h-11 rounded-2xl font-semibold">
                  <SelectValue placeholder="Selecione o pacote..." />
                </SelectTrigger>
                <SelectContent className="border border-border/50 bg-background shadow-xl rounded-2xl">
                  {availablePackages.map((p: any) => (
                    <SelectItem key={p.id} value={p.id} className="rounded-xl font-medium py-2">
                      {p.name} ({p.total_sessions - p.used_sessions} restantes)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ) : (
          /* Se for avulso, oferece opção de pagamento imediato */
          <div className={cn(
            "border-2 rounded-3xl p-4 transition-all duration-300 select-none",
            isPaid ? "border-emerald-500/30 bg-emerald-500/5 shadow-sm" : "border-muted/30 bg-muted/5 opacity-90"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-black text-foreground">
                  Cliente já pagou agora?
                </span>
                <span className="text-xs text-muted-foreground">
                  Gera o financeiro como pago no caixa imediatamente
                </span>
              </div>
              <Switch checked={isPaid} onCheckedChange={setIsPaid} />
            </div>

            {isPaid && (
              <div className="mt-4 pt-3 border-t border-dashed border-emerald-500/20 space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                  Forma de Pagamento
                </Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="bg-background border-border/50 h-11 rounded-2xl font-semibold">
                    <SelectValue placeholder="Selecione o método pago..." />
                  </SelectTrigger>
                  <SelectContent className="border border-border/50 bg-background shadow-xl rounded-2xl">
                    {paymentMethods
                      .filter((pm) => pm.isActive)
                      .map((pm) => (
                        <SelectItem key={pm.id} value={pm.type} className="rounded-xl font-medium py-2">
                          {pm.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-full text-primary shrink-0">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-black uppercase text-primary tracking-widest">Encaixe Imediato</p>
            <p className="text-[11px] text-muted-foreground">O estoque e histórico de check-ins serão atualizados automaticamente.</p>
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
          {saving ? <LoaderDots className="mr-2 h-5 w-5 animate-spin" /> : "Fazer Check-in"}
        </Button>
      </div>
    </ResponsiveModal>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import useSWR from "swr";
import { ResponsiveModal } from "../agenda/_components/responsive-modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoaderDots } from "@boxicons/react";
import { toast } from "sonner";
import { getPaymentMethods } from "@/app/actions/payment-methods";
import { OrganizationPaymentMethod } from "@/types/finance";
import { createPackageAction } from "@/app/actions/packages";
import { apiClient } from "@/lib/api-client";

interface PackageTemplate {
  id: string;
  name: string;
  total_sessions: number;
  price: number;
  service_id: string;
  active: boolean;
}

interface NewPackageSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string;
  onCreated?: () => void;
}

export function NewPackageSaleModal({
  open,
  onOpenChange,
  clientId,
  onCreated,
}: NewPackageSaleModalProps) {
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(clientId);
  const [templates, setTemplates] = useState<PackageTemplate[]>([]);
  const [templateId, setTemplateId] = useState<string>("");
  const [loadingData, setLoadingData] = useState(false);
  const [loading, setLoading] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState<OrganizationPaymentMethod[]>([]);
  const [payUpfront, setPayUpfront] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>("");

  const [generateInstallments, setGenerateInstallments] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState<number>(2);

  // Busca clientes somente se clientId não foi passado por prop
  const { data: clientsResponse, isLoading: loadingClients } = useSWR<any>(
    open && !clientId ? "clients?active=true&limit=1000" : null,
    apiClient
  );
  const clients = clientsResponse?.data || [];

  useEffect(() => {
    if (clientId) {
      setSelectedClientId(clientId);
    }
  }, [clientId]);

  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        const [templatesData, methodsData] = await Promise.all([
          apiClient<PackageTemplate[]>("package-templates", {
            params: { active: "true" },
          }),
          getPaymentMethods(),
        ]);

        setTemplates(templatesData);
        if (templatesData.length > 0) setTemplateId(templatesData[0].id);

        setPaymentMethods(methodsData as OrganizationPaymentMethod[]);
      } catch (e) {
        console.error("Erro ao carregar dados do pacote:", e);
      } finally {
        setLoadingData(false);
      }
    };
    if (open) {
      loadData();
    } else {
      // Reset state on close
      setPayUpfront(false);
      setGenerateInstallments(false);
      setInstallmentsCount(2);
      setSelectedMethod("");
      if (!clientId) {
        setSelectedClientId(undefined);
      }
    }
  }, [open, clientId]);

  const handleAddPackage = async () => {
    if (!selectedClientId) return toast.error("Selecione um cliente.");
    if (!templateId) return toast.error("Selecione um pacote do catálogo.");
    if (payUpfront && !selectedMethod) return toast.error("Selecione a forma de pagamento.");
    if (
      !payUpfront &&
      generateInstallments &&
      (installmentsCount < 2 || installmentsCount > 24)
    ) {
      return toast.error("O número de parcelas deve ser entre 2 e 24.");
    }

    const selectedTemplate = templates.find((t) => t.id === templateId);
    if (!selectedTemplate) return;

    setLoading(true);
    try {
      const result = await createPackageAction({
        client_id: selectedClientId,
        service_id: selectedTemplate.service_id,
        total_sessions: Number(selectedTemplate.total_sessions),
        price: Number(selectedTemplate.price),
        pay_upfront: payUpfront,
        payment_method: payUpfront ? selectedMethod : null,
        generate_installments: !payUpfront ? generateInstallments : false,
        installments_count: installmentsCount,
        package_template_id: selectedTemplate.id,
      });

      if (result && result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Pacote vendido com sucesso!");
      onCreated?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("[handleAddPackage] Erro:", error);
      toast.error("Ocorreu um erro ao processar a venda.");
    } finally {
      setLoading(false);
    }
  };

  const currentTemplate = templates.find((t) => t.id === templateId);

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title="Vender Novo Pacote">
      <div className="flex flex-col gap-4 py-4 px-1">

        {/* Selector de cliente se não fornecido via prop */}
        {!clientId && (
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
              Cliente
            </Label>
            <Select value={selectedClientId} onValueChange={setSelectedClientId} disabled={loadingClients || loading}>
              <SelectTrigger className="bg-muted/40 border-none h-12 transition-all">
                <SelectValue placeholder={loadingClients ? "Carregando..." : "Selecione o cliente..."} />
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
        )}

        <div className="flex flex-col gap-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
            Pacote Disponível
          </Label>
          <Select
            value={templateId}
            onValueChange={(val) => {
              setTemplateId(val);
              const tpl = templates.find((t) => t.id === val);
              if (tpl) setInstallmentsCount(tpl.total_sessions);
            }}
            disabled={templates.length === 0 || loadingData || loading}
          >
            <SelectTrigger className="bg-muted/40 border-none h-12 transition-all">
              <SelectValue
                placeholder={
                  loadingData
                    ? "Carregando pacotes..."
                    : templates.length === 0
                      ? "Nenhum pacote ativo"
                      : "Selecione um Pacote"
                }
              />
            </SelectTrigger>
            <SelectContent className="border border-border/50 bg-background shadow-xl rounded-2xl">
              {templates.map((tpl) => (
                <SelectItem key={tpl.id} value={tpl.id} className="rounded-full py-2 font-medium">
                  {tpl.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {currentTemplate && (
          <div className="bg-muted/30 p-4 rounded-full border border-border space-y-2 mt-2">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              Resumo do Pacote
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sessões:</span>
              <span className="font-bold text-foreground">
                {currentTemplate.total_sessions}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Preço Total:</span>
              <span className="font-bold text-primary">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(currentTemplate.price)}
              </span>
            </div>
          </div>
        )}

        <div className="my-1 border-t border-border/50" />

        <div className="flex flex-col gap-4">
          <div className="flex flex-row items-center justify-between rounded-full border border-border/50 p-3 bg-muted/20">
            <div className="space-y-0.5 pr-4">
              <Label className="text-sm font-bold">Pagar Pacote à Vista?</Label>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Registra o valor total no caixa agora.
              </p>
            </div>
            <Switch
              checked={payUpfront}
              onCheckedChange={(val) => {
                setPayUpfront(val);
                if (val) setGenerateInstallments(false);
              }}
              disabled={loading}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          {payUpfront && (
            <div className="flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Forma de Pagamento
              </Label>
              <Select value={selectedMethod} onValueChange={setSelectedMethod} disabled={loading}>
                <SelectTrigger className="bg-muted/40 border-none h-12 transition-all">
                  <SelectValue placeholder="Como o cliente está pagando?" />
                </SelectTrigger>
                <SelectContent className="border border-border/50 bg-background shadow-xl rounded-2xl">
                  {paymentMethods
                    .filter((pm) => pm.isActive)
                    .map((pm) => (
                      <SelectItem key={pm.id} value={pm.type} className="rounded-full py-2 font-medium">
                        {pm.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!payUpfront && (
            <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex flex-row items-center justify-between rounded-full border border-border/50 p-3 bg-amber-500/10 dark:bg-amber-500/5">
                <div className="space-y-0.5 pr-4">
                  <Label className="text-sm font-bold text-amber-700 dark:text-amber-500">
                    Gerar Contas a Receber?
                  </Label>
                  <p className="text-[11px] text-amber-600/80 dark:text-amber-500/80 leading-tight">
                    Cria parcelas mensais pendentes.
                  </p>
                </div>
                <Switch
                  checked={generateInstallments}
                  onCheckedChange={setGenerateInstallments}
                  disabled={loading}
                />
              </div>

              {generateInstallments && (
                <div className="flex flex-col gap-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Quantidade de Parcelas
                  </Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={2}
                    max={48}
                    step={1}
                    value={installmentsCount}
                    onChange={(e) => {
                      let value = e.target.value;
                      if (value === "") {
                        setInstallmentsCount(0);
                        return;
                      }
                      let num = parseInt(value, 10);
                      if (isNaN(num)) return;
                      if (num < 2) num = 2;
                      if (num > 48) num = 48;
                      setInstallmentsCount(num);
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                        e.preventDefault();
                      }
                    }}
                    disabled={loading}
                    className="h-12 w-32 bg-muted/40 border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  {currentTemplate && installmentsCount >= 2 && (
                    <p className="text-xs text-muted-foreground mt-1 font-medium">
                      Serão geradas {installmentsCount} parcelas de{" "}
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(currentTemplate.price / installmentsCount)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-2 mt-4">
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="h-12 font-bold w-full sm:w-1/2"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAddPackage}
            disabled={loading || templates.length === 0 || !templateId || (!clientId && !selectedClientId)}
            className="h-12 font-black bg-primary text-primary-foreground w-full sm:w-1/2 active:scale-[0.98] transition-all"
          >
            {loading ? (
              <>
                <LoaderDots className="h-5 w-5 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              "Confirmar Venda"
            )}
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
}

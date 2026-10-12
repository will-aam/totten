// app/(private)/admin/finance/settings/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Cog,
  Landmark,
  PlusCircle,
  CreditCard,
  QrScan,
  Coin,
  Slider,
  CheckCircle,
  LoaderDots,
  Dollar,
} from "@boxicons/react";
import { cn } from "@/lib/utils";
import { OrganizationPaymentMethod } from "@/types/finance";
import { PaymentMethodModal } from "../_components/payment-method-modal";
import { getPaymentMethods } from "@/app/actions/payment-methods";
import {
  getFinancialSettingsAction,
  updateFinancialSettingsAction,
} from "@/app/actions/settings";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function PaymentMethodListItem({
  method,
  onClick,
}: {
  method: OrganizationPaymentMethod;
  onClick: () => void;
}) {
  const getIcon = () => {
    switch (method.type) {
      case "PIX":
        return <QrScan size="sm" />;
      case "CARTAO_CREDITO":
      case "CARTAO_DEBITO":
        return <CreditCard size="sm" />;
      case "DINHEIRO":
        return <Coin size="sm" />;
      default:
        return <Landmark size="sm" />;
    }
  };

  const getTaxString = () => {
    const p = Number(method.feePercentage);
    const f = Number(method.feeFixed);

    if (p === 0 && f === 0) return "Sem taxa";
    const parts = [];
    if (p > 0) parts.push(`${p}%`);
    if (f > 0) parts.push(currencyFormatter.format(f));
    return parts.join(" + ");
  };

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-4 md:p-5 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-all duration-300 rounded-2xl group cursor-pointer"
    >
      <div className="flex items-center gap-4 md:gap-5 flex-1 min-w-0 pr-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-bold shadow-sm border transition-transform duration-300 group-hover:scale-110",
            method.isActive
              ? "bg-primary/10 text-primary border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-[0_4px_15px_rgb(var(--primary)/0.2)]"
              : "bg-muted/50 text-muted-foreground border-border/50",
          )}
        >
          {getIcon()}
        </div>

        <div className="flex flex-col min-w-0 gap-0.5">
          <span
            className={cn(
              "text-base font-black leading-tight truncate transition-colors",
              method.isActive
                ? "text-foreground group-hover:text-primary"
                : "text-muted-foreground",
            )}
          >
            {method.name}
          </span>
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest leading-none flex items-center gap-1.5 truncate mt-0.5">
            {method.daysToReceive === 0
              ? "Recebimento na hora"
              : `Recebimento em ${method.daysToReceive} dia(s)`}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <span
          className={cn(
            "text-base font-black tracking-tight",
            method.isActive ? "text-foreground" : "text-muted-foreground/60",
          )}
        >
          {getTaxString()}
        </span>
        {method.isActive ? (
          <Badge
            variant="secondary"
            className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 border-none text-[10px] px-2 py-0.5 h-5 font-bold uppercase tracking-wider"
          >
            Ativo
          </Badge>
        ) : (
          <Badge
            variant="secondary"
            className="bg-muted/50 text-muted-foreground border-none text-[10px] px-2 py-0.5 h-5 font-bold uppercase tracking-wider"
          >
            Inativo
          </Badge>
        )}
      </div>
    </div>
  );
}

export default function FinancialSettingsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] =
    useState<OrganizationPaymentMethod | null>(null);

  const [methods, setMethods] = useState<OrganizationPaymentMethod[]>([]);
  const [isLoadingMethods, setIsLoadingMethods] = useState(true);

  // Estados das configurações financeiras
  const [autoSettle, setAutoSettle] = useState(true);
  const [defaultMethodId, setDefaultMethodId] = useState<string>("");
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoadingMethods(true);
    setIsLoadingSettings(true);
    try {
      const [methodsData, settingsRes] = await Promise.all([
        getPaymentMethods(),
        getFinancialSettingsAction(),
      ]);

      setMethods(methodsData as OrganizationPaymentMethod[]);

      if (settingsRes.success && settingsRes.data) {
        setAutoSettle(settingsRes.data.autoSettleOnCheckin);
        setDefaultMethodId(settingsRes.data.defaultPaymentMethodId);
      }
    } catch (error) {
      console.error("Erro ao carregar configurações financeiras:", error);
      toast.error("Erro ao carregar dados.");
    } finally {
      setIsLoadingMethods(false);
      setIsLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleAutoSettle = async (checked: boolean) => {
    setAutoSettle(checked);
    setIsSavingSettings(true);
    try {
      const res = await updateFinancialSettingsAction({
        autoSettleOnCheckin: checked,
        defaultPaymentMethodId: defaultMethodId,
      });
      if (res.success) {
        toast.success(
          checked
            ? "Liquidação imediata ativada! Atendimentos no check-in cairão direto no caixa."
            : "Modo conferência manual ativado! Atendimentos irão para Contas a Receber.",
        );
      } else {
        toast.error("Erro ao atualizar configuração.");
        setAutoSettle(!checked);
      }
    } catch {
      toast.error("Erro de conexão.");
      setAutoSettle(!checked);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleChangeDefaultMethod = async (val: string) => {
    setDefaultMethodId(val);
    setIsSavingSettings(true);
    try {
      const res = await updateFinancialSettingsAction({
        autoSettleOnCheckin: autoSettle,
        defaultPaymentMethodId: val,
      });
      if (res.success) {
        toast.success("Meio de pagamento padrão atualizado com sucesso!");
      } else {
        toast.error("Erro ao atualizar meio padrão.");
      }
    } catch {
      toast.error("Erro de conexão.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleNewPaymentMethod = () => {
    setSelectedMethod(null);
    setIsModalOpen(true);
  };

  const handleEditPaymentMethod = (method: OrganizationPaymentMethod) => {
    setSelectedMethod(method);
    setIsModalOpen(true);
  };

  return (
    <>
      <AdminHeader title="Configurações Financeiras" />

      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-36 md:pb-6 relative animate-in fade-in duration-700 min-h-[calc(100vh-100px)]">
        {/* CABEÇALHO DA PÁGINA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-background/50 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-border/40 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 -mt-8 -ml-8 w-40 h-40 bg-primary/10 blur-3xl rounded-full -z-10 pointer-events-none" />

          <div className="flex flex-col gap-1.5 relative z-10">
            <h1 className="text-3xl font-black tracking-tight bg-linear-to-br from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-3">

              Configurações Financeiras
            </h1>
            <p className="text-muted-foreground text-sm font-medium mt-1 sm:ml-12">
              Defina as regras de recebimento no check-in, cobranças e gerencie as formas de pagamento aceitas.
            </p>
          </div>
        </div>

        {/* 1. SEÇÃO DE REGRAS E AUTOMAÇÃO DO CHECK-IN */}
        <Card className="relative overflow-hidden rounded-4xl border-border/40 shadow-sm bg-background/50 backdrop-blur-md">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -z-10 pointer-events-none" />
          <CardHeader className="px-6 pt-6 pb-4 border-b border-border/30 relative z-10">
            <CardTitle className="flex items-center gap-3 text-xl font-black text-foreground">
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <Dollar size="sm" />
              </div>
              Regras de Recebimento no Atendimento
            </CardTitle>
            <CardDescription className="font-medium text-xs uppercase tracking-widest text-muted-foreground ml-12">
              Escolha como os atendimentos do Totem e da Agenda devem se comportar no seu financeiro.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 relative z-10 flex flex-col gap-6">
            {isLoadingSettings ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full rounded-2xl bg-muted/50" />
                <Skeleton className="h-12 w-64 rounded-2xl bg-muted/50" />
              </div>
            ) : (
              <>
                {/* Opção A vs B: Liquidação Imediata */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-muted/20 border border-border/40">
                  <div className="flex flex-col gap-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-foreground">
                        Liquidação Imediata no Check-in
                      </span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px] px-2 py-0.5 font-bold uppercase",
                          autoSettle
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {autoSettle ? "Ativado" : "Manual"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                      Quando ativado, os agendamentos avulsos realizados entram imediatamente no caixa como <strong>PAGO</strong>, eliminando a necessidade de dar baixa manual no Contas a Receber. Caso desative, cada atendimento ficará pendente até conferência.
                    </p>
                  </div>

                  <Switch
                    checked={autoSettle}
                    onCheckedChange={handleToggleAutoSettle}
                    disabled={isSavingSettings}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>

                {/* Meio de Pagamento Padrão */}
                {autoSettle && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-muted/10 border border-border/30">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-black text-foreground">
                        Forma de Pagamento Padrão para Baixa Automática
                      </span>
                      <p className="text-xs text-muted-foreground font-medium">
                        Forma de pagamento atribuída aos atendimentos avulsos concluídos pelo totem.
                      </p>
                    </div>

                    <div className="w-full sm:w-auto sm:min-w-[320px] md:min-w-[360px] shrink-0">
                      <Select
                        value={
                          defaultMethodId ||
                          methods.find(
                            (m) =>
                              m.name.toLowerCase() === "à vista" ||
                              m.name.toLowerCase() === "a vista",
                          )?.id ||
                          ""
                        }
                        onValueChange={handleChangeDefaultMethod}
                        disabled={isSavingSettings || methods.length === 0}
                      >
                        <SelectTrigger className="h-12 w-full font-bold bg-muted/20 border-border/40 hover:bg-muted/30 focus-visible:ring-primary/30 transition-all shadow-inner rounded-2xl px-4 text-foreground whitespace-nowrap">
                          <SelectValue placeholder="Selecione um meio..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-border/50 shadow-xl bg-background/95 backdrop-blur-md min-w-[var(--radix-select-trigger-width)] p-1.5">
                          {methods
                            .filter((m) => m.isActive)
                            .map((method) => (
                              <SelectItem
                                key={method.id}
                                value={method.id}
                                className="rounded-xl py-2.5 px-3 font-bold whitespace-nowrap cursor-pointer transition-colors"
                              >
                                {method.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* 2. SEÇÃO DE MEIOS DE PAGAMENTO (Taxas, Prazos e Bandeiras) */}
        <Card className="relative overflow-hidden rounded-4xl border-border/40 shadow-sm bg-background/50 backdrop-blur-md">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -z-10 pointer-events-none" />
          <CardHeader className="px-6 pt-6 pb-4 border-b border-border/30 relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-3 text-xl font-black text-foreground">
                <div className="p-2 bg-primary/10 rounded-full text-primary">
                  <Landmark size="sm" />
                </div>
                Meios de Pagamento
              </CardTitle>

            </div>

            <Button
              className="h-11 px-5 font-black shadow-[0_8px_25px_rgb(var(--primary)/0.3)] hover:shadow-[0_10px_30px_rgb(var(--primary)/0.4)] active:scale-95 transition-all w-full sm:w-auto"
              onClick={handleNewPaymentMethod}
            >
              <PlusCircle size="sm" className="mr-2" />
              Adicionar Meio
            </Button>
          </CardHeader>

          <CardContent className="p-2 sm:p-4 relative z-10">
            <div className="flex flex-col">
              {isLoadingMethods ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 border-b border-border/30"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Skeleton className="h-12 w-12 rounded-2xl bg-muted/50" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32 bg-muted/50" />
                        <Skeleton className="h-3 w-24 bg-muted/50" />
                      </div>
                    </div>
                    <div className="space-y-2 flex flex-col items-end">
                      <Skeleton className="h-5 w-20 bg-muted/50" />
                      <Skeleton className="h-4 w-12 bg-muted/50" />
                    </div>
                  </div>
                ))
              ) : methods.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-muted/10 rounded-2xl border border-dashed border-border/60 mx-2 mt-2">
                  <div className="p-4 bg-muted/30 rounded-full mb-4">
                    <Landmark className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                    Nenhum meio de pagamento configurado.
                  </p>
                </div>
              ) : (
                methods.map((method) => (
                  <PaymentMethodListItem
                    key={method.id}
                    method={method}
                    onClick={() => handleEditPaymentMethod(method)}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Adição/Edição de Meio de Pagamento */}
      {isModalOpen && (
        <PaymentMethodModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            loadData();
          }}
          method={selectedMethod}
        />
      )}
    </>
  );
}

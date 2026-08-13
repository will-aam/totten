"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pin, LoaderLines, Search, Whatsapp, Clock } from "@boxicons/react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getSelfServiceSettingsAction } from "@/app/actions/settings";

function RulesSummaryPreview({ data, onChange }: any) {
  const [rulesData, setRulesData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRules() {
      const response = await getSelfServiceSettingsAction();
      if (response.success) {
        setRulesData(response.data);
      }
      setIsLoading(false);
    }
    fetchRules();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderLines className="h-4 w-4 animate-spin" /> Carregando horários...
      </div>
    );
  }

  const rules = rulesData;
  if (!rules || !rules.schedule || rules.schedule.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Nenhum horário configurado em Regras e Horários.
      </div>
    );
  }

  const referenceValues = rules.schedule.find((s: any) => s.isOpen);
  const openDays = rules.schedule.filter((s: any) => s.isOpen).map((s: any) => s.dayOfWeek);

  if (openDays.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Fechado todos os dias configurado em Regras e Horários.
      </div>
    );
  }

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const summaryDays = openDays.map((d: number) => dayNames[d]).join(", ");
  const hasBreak = !!referenceValues?.breakStart;

  const summaryString = referenceValues
    ? `Das ${referenceValues.openTime || "--:--"} às ${referenceValues.closeTime || "--:--"}${hasBreak && referenceValues.breakStart ? `, intervalo de ${referenceValues.breakStart} às ${referenceValues.breakEnd}` : ""}, funcionando de ${summaryDays}.`
    : "Fechado todos os dias.";

  // Update data.businessHours in background if different, so the frontend gets the correct text
  if (data.businessHours !== summaryString && summaryString) {
    // Timeout to avoid React state update during render warning
    setTimeout(() => {
      onChange({ ...data, businessHours: summaryString });
    }, 0);
  }

  return (
    <div className="bg-background border rounded-lg p-3 text-sm flex flex-col gap-2">
      <p className="font-semibold text-foreground/80">Resumo configurado:</p>
      <p className="text-muted-foreground leading-snug">
        {summaryString}
      </p>
      <div className="mt-2">
        <Link href="/admin/self-service" className="text-primary hover:underline text-xs font-medium">
          Editar em Regras e Horários
        </Link>
      </div>
    </div>
  );
}

export function ProContact({ data, onChange, globalContact }: any) {
  const [cep, setCep] = useState("");
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  const handleSearchCep = async () => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setIsSearchingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const result = await response.json();

      if (!result.erro) {
        const fullAddress = `${result.logradouro}, Número, ${result.bairro}, ${result.localidade} - ${result.uf}, ${result.cep}`;
        onChange({ ...data, address: fullAddress });
      }
    } catch (error) {
      console.error("Erro ao buscar CEP", error);
    } finally {
      setIsSearchingCep(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <Pin className="h-5 w-5 text-primary" />
          Localização e Contato
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Informe onde você atende e como os clientes podem te achar.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* CEP */}
        <div className="flex flex-col gap-3 p-4 border border-border/50 rounded-xl bg-muted/10">
          <Label className="text-sm font-medium">Buscar Endereço (CEP)</Label>
          <div className="flex gap-2">
            <Input
              value={cep}
              onChange={(e) => setCep(e.target.value)}
              placeholder="00000-000"
              className="bg-background max-w-[200px]"
              maxLength={9}
            />
            <Button
              variant="secondary"
              onClick={handleSearchCep}
              disabled={isSearchingCep || cep.replace(/\D/g, "").length !== 8}
            >
              {isSearchingCep ? <LoaderLines className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Buscar</span>
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">O endereço será preenchido abaixo. Você pode editá-lo se necessário.</p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="address" className="text-foreground font-medium">
            Endereço Completo
          </Label>
          <Textarea
            id="address"
            value={data.address || ""}
            onChange={(e) => onChange({ ...data, address: e.target.value })}
            className="bg-background border-border/50 focus-visible:ring-1 min-h-[80px]"
            placeholder="Rua, Número, Bairro, Cidade - Estado, CEP"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="mapUrl" className="text-foreground font-medium">
            Link do Google Maps
          </Label>
          <Input
            id="mapUrl"
            value={data.mapUrl || ""}
            onChange={(e) => onChange({ ...data, mapUrl: e.target.value })}
            className="bg-background border-border/50 h-11 focus-visible:ring-1"
            placeholder="Ex: https://goo.gl/maps/..."
          />
          <p className="text-[11px] text-muted-foreground">
            Cole o link direto do Google Maps para que seus clientes encontrem sua localização.
          </p>
        </div>

        <div className="w-full h-px bg-border/50" />

        {/* HORÁRIO */}
        <div className="flex flex-col gap-4 p-5 border border-border/50 rounded-xl bg-muted/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <Label className="text-foreground font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Horário de Funcionamento
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Exibir no site?</span>
              <Switch
                checked={data.showBusinessHours !== false}
                onCheckedChange={(c) => onChange({ ...data, showBusinessHours: c })}
              />
            </div>
          </div>

          <RulesSummaryPreview data={data} onChange={onChange} />
        </div>

        <div className="w-full h-px bg-border/50" />

        <h4 className="font-medium text-sm flex items-center gap-2">
          Outras Formas de Contato
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="whatsapp" className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Whatsapp className="h-3.5 w-3.5 text-emerald-500" /> WhatsApp (com DDD)
            </Label>
            <Input
              id="whatsapp"
              value={globalContact?.whatsapp || ""}
              onChange={(e) => onChange({ ...data, whatsapp: e.target.value })}
              disabled
              className="bg-background border-border/50 h-11 focus-visible:ring-1"
              placeholder="(11) 99999-9999"
            />
            <p className="text-[11px] text-muted-foreground">Editado em Configurações &gt; Dados da Empresa. Usado para o botão WhatsApp e para receber mensagens do formulário.</p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone" className="text-xs text-muted-foreground">Telefone Fixo</Label>
            <Input
              id="phone"
              value={globalContact?.phone || ""}
              onChange={(e) => onChange({ ...data, phone: e.target.value })}
              disabled
              className="bg-background border-border/50 h-11 focus-visible:ring-1"
              placeholder="(00) 0000-0000"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Editado em Configurações &gt; Dados da Empresa.</p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-xs text-muted-foreground">E-mail Profissional</Label>
            <Input
              id="email"
              value={data.email || ""}
              onChange={(e) => onChange({ ...data, email: e.target.value })}
              className="bg-background border-border/50 h-11 focus-visible:ring-1"
              placeholder="contato@seusite.com"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

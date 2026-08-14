"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function BookingSiteView({ profile }: { profile?: any }) {
  const [isSaving, setIsSaving] = useState(false);

  const [general, setGeneral] = useState({
    enabled: true,
    termsText: "Ao confirmar, declaro que li e aceito a Política de Cancelamento.",
    pixKey: "",
    paymentInstructions:
      "INSTRUÇÕES:\n\n⚠️ Recado importante ⚠️\n\nPara finalizar seu agendamento:\n\n1️⃣ Clique em confirmar pagamento\n\n2️⃣ Envie o comprovante no WhatsApp\n\nAssim seu horário ficará reservado.",
  });

  const [features, setFeatures] = useState({
    showPackages: true,
    showMostBooked: true,
    showTeam: true,
    showTeamLikes: true,
  });

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 800);
  }, []);

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">

      {/* Header com único botão salvar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <p className="text-sm text-muted-foreground">
          Personalize a página onde seus clientes agendam horários sozinhos.
        </p>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-full h-10 shadow-sm w-full md:w-36 shrink-0"
        >
          {isSaving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      {/* Grid: 1 coluna no mobile, 2 colunas no desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">

        {/* ─── COLUNA ESQUERDA: Configurações Gerais ─── */}
        <section className="flex flex-col gap-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Configurações Gerais</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Ative ou desative a função de autoagendamento e configure os detalhes de pagamento.
            </p>
          </div>

          {/* Toggle principal */}
          <div className="flex items-center justify-between p-4 border rounded-xl bg-card shadow-sm">
            <div className="flex flex-col">
              <Label className="text-base font-semibold">Habilitar Autoagendamento</Label>
              <span className="text-xs text-muted-foreground mt-1 max-w-[260px]">
                Se desativado, a página servirá apenas como um Portfólio e Histórico para o cliente.
              </span>
            </div>
            <Switch
              checked={general.enabled}
              onCheckedChange={(val) => setGeneral({ ...general, enabled: val })}
            />
          </div>

          {/* Termos de aceite */}
          <div className="flex flex-col gap-3 pt-4 border-t">
            <div className="flex flex-col gap-3 p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800/40 border-l-4 border-l-red-500">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Label className="text-foreground font-semibold">Termos de Aceite</Label>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-full">Obrigatório</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Texto que aparece acima do botão final de confirmar agendamento.
                </p>
              </div>
              <Textarea
                value={general.termsText}
                onChange={(e) => setGeneral({ ...general, termsText: e.target.value })}
                className="resize-none h-20 bg-white dark:bg-black/20"
                placeholder="Ex: Ao confirmar, declaro que li e aceito..."
              />
            </div>
          </div>

          {/* Pagamento Antecipado */}
          <div className="flex flex-col gap-4 pt-4 border-t">
            <div>
              <h4 className="text-base font-semibold text-foreground">Pagamento Antecipado (50%)</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Configure os dados para receber a metade do valor via PIX.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-medium">Chave PIX</Label>
              <Input
                value={general.pixKey}
                onChange={(e) => setGeneral({ ...general, pixKey: e.target.value })}
                placeholder="Ex: (00) 00000-0000, email@exemplo.com ou CPF"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-medium">Instruções / Recado Importante</Label>
              <Textarea
                value={general.paymentInstructions}
                onChange={(e) => setGeneral({ ...general, paymentInstructions: e.target.value })}
                className="resize-none h-48"
              />
            </div>
          </div>
        </section>

        {/* ─── COLUNA DIREITA: Elementos da Página ─── */}
        <section className="flex flex-col gap-6 lg:border-l lg:pl-10 border-border/50">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Elementos da Página</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Ligue ou desligue as seções na sua página de agendamento.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between p-4 border rounded-xl bg-card shadow-sm">
              <div className="flex flex-col">
                <Label className="font-semibold">Mostrar &quot;Pacotes&quot;</Label>
                <span className="text-xs text-muted-foreground mt-0.5">Exibe combos promocionais.</span>
              </div>
              <Switch
                checked={features.showPackages}
                onCheckedChange={(val) => setFeatures((f) => ({ ...f, showPackages: val }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-xl bg-card shadow-sm">
              <div className="flex flex-col">
                <Label className="font-semibold">Mostrar &quot;Mais Agendados&quot;</Label>
                <span className="text-xs text-muted-foreground mt-0.5">Destaca os serviços populares.</span>
              </div>
              <Switch
                checked={features.showMostBooked}
                onCheckedChange={(val) => setFeatures((f) => ({ ...f, showMostBooked: val }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-xl bg-card shadow-sm">
              <div className="flex flex-col">
                <Label className="font-semibold">Mostrar &quot;Nossa Equipe&quot;</Label>
                <span className="text-xs text-muted-foreground mt-0.5">Exibe fotos dos profissionais.</span>
              </div>
              <Switch
                checked={features.showTeam}
                onCheckedChange={(val) => setFeatures((f) => ({ ...f, showTeam: val }))}
              />
            </div>

            {features.showTeam && (
              <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/40 ml-5">
                <div className="flex flex-col">
                  <Label className="font-semibold">Mostrar Curtidas na Equipe</Label>
                  <span className="text-xs text-muted-foreground mt-0.5">Gera prova social para os profissionais.</span>
                </div>
                <Switch
                  checked={features.showTeamLikes}
                  onCheckedChange={(val) => setFeatures((f) => ({ ...f, showTeamLikes: val }))}
                />
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}

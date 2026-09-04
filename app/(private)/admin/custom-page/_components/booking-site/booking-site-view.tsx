"use client";

import { toast } from "sonner";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookingAppearanceSettings } from "@/app/(private)/admin/self-service/_components/booking-appearance-settings";
import { getSelfServiceSettingsAction, updateSelfServiceSettingsAction } from "@/app/actions/settings";
import { detectAndFormatPixKey } from "@/lib/pix";

export function BookingSiteView({ profile }: { profile?: any }) {
  const [isSaving, setIsSaving] = useState(false);

  const [bookingTheme, setBookingTheme] = useState("light");
  const [bookingPrimaryColor, setBookingPrimaryColor] = useState("#0f172a");

  useEffect(() => {
    getSelfServiceSettingsAction().then(res => {
      if (res.success && res.data) {
        setBookingTheme(res.data.bookingTheme || "light");
        setBookingPrimaryColor(res.data.bookingPrimaryColor || "#0f172a");

        setGeneral({
          requirePrepayment: res.data.requirePrepayment ?? true,
          termsText: res.data.termsOfUse || "Política de Cancelamento\n\n• Cancelamentos ou remarcações devem ser feitos com no mínimo 24 horas de antecedência.\n• Em caso de atraso, o atendimento poderá ser reduzido ou cancelado, respeitando o tempo da agenda.\n• Em situações excepcionais, cada caso será avaliado com carinho.",
          pixKey: res.data.pixKey || "",
          paymentInstructions: res.data.paymentInstructions || "Agendamento confirmado com sucesso!\n\nRecebi seu pagamento e seu horário está oficialmente reservado.\n\nPeço, por gentileza, que chegue no horário agendado. Para manter a organização da agenda e não prejudicar os atendimentos seguintes, não tolero atrasos.\n\nEm caso de atraso, o atendimento poderá ser reduzido, remarcado ou cancelado, conforme a disponibilidade do dia.\n\nAgradeço pela compreensão e estou ansiosa para atender você!",
        });

        setFeatures({
          showPackages: res.data.showPackages ?? true,
          showMostBooked: res.data.showMostBooked ?? true,
          showTeam: res.data.showTeam ?? true,
          showTeamLikes: res.data.showTeamLikes ?? true,
        });
      }
    });
  }, []);

  const [general, setGeneral] = useState({
    requirePrepayment: true,
    termsText: "Política de Cancelamento\n\n• Cancelamentos ou remarcações devem ser feitos com no mínimo 24 horas de antecedência.\n• Em caso de atraso, o atendimento poderá ser reduzido ou cancelado, respeitando o tempo da agenda.\n• Em situações excepcionais, cada caso será avaliado com carinho.",
    pixKey: "",
    paymentInstructions:
      "Agendamento confirmado com sucesso!\n\nRecebi seu pagamento e seu horário está oficialmente reservado.\n\nPeço, por gentileza, que chegue no horário agendado. Para manter a organização da agenda e não prejudicar os atendimentos seguintes, não tolero atrasos.\n\nEm caso de atraso, o atendimento poderá ser reduzido, remarcado ou cancelado, conforme a disponibilidade do dia.\n\nAgradeço pela compreensão e estou ansiosa para atender você!",
  });

  const [features, setFeatures] = useState({
    showPackages: true,
    showMostBooked: true,
    showTeam: true,
    showTeamLikes: true,
  });

  const handleSave = useCallback(async () => {
    if (general.requirePrepayment && !general.pixKey.trim()) {
      toast.error("A Chave Pix é obrigatória quando o Pagamento Antecipado (Sinal) está ativado.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await updateSelfServiceSettingsAction({
        bookingTheme,
        bookingPrimaryColor,
        requirePrepayment: general.requirePrepayment,
        termsOfUse: general.termsText,
        pixKey: general.pixKey,
        paymentInstructions: general.paymentInstructions,
        showPackages: features.showPackages,
        showMostBooked: features.showMostBooked,
        showTeam: features.showTeam,
        showTeamLikes: features.showTeamLikes,
      });

      if (response.success) {
        toast.success("Configurações da agenda salvas com sucesso!");
      } else {
        toast.error("Erro ao salvar", {
          description: response.error,
        });
      }
    } catch (e) {
      toast.error("Ocorreu um erro ao salvar as configurações.");
    } finally {
      setIsSaving(false);
    }
  }, [general, bookingTheme, bookingPrimaryColor]);

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
              Configure a política de cancelamento e os detalhes de pagamento antecipado do seu agendamento.
            </p>
          </div>

          {/* Política de Cancelamento */}
          <div className="flex flex-col gap-3 pt-0">
            <div className="flex flex-col gap-3 p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800/40 border-l-4 border-l-red-500">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Label className="text-foreground font-semibold">Política de Cancelamento</Label>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-full">Obrigatório</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Texto que aparece acima do botão final de confirmar agendamento.
                </p>
              </div>
              <Textarea
                value={general.termsText}
                onChange={(e) => setGeneral({ ...general, termsText: e.target.value })}
                className="resize-none h-48 bg-white dark:bg-black/20"
                placeholder={`Política de Cancelamento\n\n• Cancelamentos ou remarcações devem ser feitos com no mínimo 24 horas de antecedência.\n• A taxa de sinal não é reembolsável em casos de cancelamento fora do prazo ou não comparecimento.\n• Em caso de atraso, o atendimento poderá ser reduzido ou cancelado, respeitando o tempo da agenda.\n• O não comparecimento sem aviso implica na perda do sinal.\n• Em situações excepcionais, cada caso será avaliado com carinho.`}
              />
            </div>
          </div>

          {/* Pagamento Antecipado */}
          <div className="flex flex-col gap-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-semibold text-foreground">Exigir Pagamento Antecipado (Sinal)</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Requer 50% do valor via PIX para confirmar o agendamento.
                </p>
              </div>
              <Switch
                checked={general.requirePrepayment}
                onCheckedChange={(val) => setGeneral({ ...general, requirePrepayment: val })}
              />
            </div>

            <div className={`space-y-4 transition-opacity duration-300 ${!general.requirePrepayment ? "opacity-40 pointer-events-none" : ""}`}>
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Chave PIX</Label>
                <Input
                  value={general.pixKey}
                  onChange={(e) => setGeneral({ ...general, pixKey: e.target.value })}
                  onBlur={(e) => setGeneral({ ...general, pixKey: detectAndFormatPixKey(e.target.value) })}
                  placeholder="Ex: (00) 00000-0000, email@exemplo.com ou CPF"
                  disabled={!general.requirePrepayment}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium">Mensagem de Confirmação (Informação Importante)</Label>
                <Textarea
                  value={general.paymentInstructions}
                  onChange={(e) => setGeneral({ ...general, paymentInstructions: e.target.value })}
                  className="resize-none h-48"
                  placeholder={`Agendamento confirmado com sucesso!...`}
                  disabled={!general.requirePrepayment}
                />
              </div>
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

          <div className="mt-8 border-t border-border/50 pt-8">
            <BookingAppearanceSettings
              bookingTheme={bookingTheme}
              setBookingTheme={setBookingTheme}
              bookingPrimaryColor={bookingPrimaryColor}
              setBookingPrimaryColor={setBookingPrimaryColor}
            />
          </div>
        </section>

      </div>
    </div>
  );
}


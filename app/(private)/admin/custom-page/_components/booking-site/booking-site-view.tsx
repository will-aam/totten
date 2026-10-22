"use client";

import { toast } from "sonner";
import { DEFAULT_TERMS_OF_USE } from "@/lib/constants";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookingAppearanceSettings } from "@/app/(private)/admin/self-service/_components/booking-appearance-settings";
import { getSelfServiceSettingsAction, updateSelfServiceSettingsAction } from "@/app/actions/settings";
import { detectAndFormatPixKey } from "@/lib/pix";
import { Zap, KeyRound, CheckCircle2, ExternalLink, ShieldCheck, AlertCircle, AlertTriangle, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/components/ui/use-mobile";

const StepBadge = ({ step, tag, required }: { step: number; tag?: string; required?: boolean }) => (
  <div className="flex items-center gap-2 mb-2">
    <span className="flex items-center justify-center w-6 h-6 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-sm">
      {step}
    </span>
    {tag ? (
      <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-2xl">{tag}</span>
    ) : required ? (
      <span className="text-[10px] uppercase font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-2xl">Obrigatório</span>
    ) : (
      <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-2xl">Configuração</span>
    )}
  </div>
);

export function BookingSiteView({ profile }: { profile?: any }) {
  const isMobile = useIsMobile();
  const [isSaving, setIsSaving] = useState(false);

  const [bookingTheme, setBookingTheme] = useState("light");
  const [bookingPrimaryColor, setBookingPrimaryColor] = useState("#0f172a");

  // Modo de Pagamento: "MANUAL" (Chave Pix própria) ou "MERCADO_PAGO" (Automático)
  const [pixMode, setPixMode] = useState<"MANUAL" | "MERCADO_PAGO">("MANUAL");
  const [mercadoPagoConnected, setMercadoPagoConnected] = useState(false);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [disconnectConfirmationText, setDisconnectConfirmationText] = useState("");
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isRatesInfoModalOpen, setIsRatesInfoModalOpen] = useState(false);

  useEffect(() => {
    // Feedback de retorno do OAuth do Mercado Pago
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const mpStatus = urlParams.get("mp_status");
      const mpMsg = urlParams.get("mp_msg");

      if (mpStatus === "success") {
        toast.success("Conta do Mercado Pago conectada com sucesso!");
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (mpStatus === "error") {
        toast.error("Erro na conexão do Mercado Pago", {
          description: mpMsg || "Não foi possível autorizar a conta.",
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    getSelfServiceSettingsAction().then(res => {
      if (res.success && res.data) {
        setBookingTheme(res.data.bookingTheme || "light");
        setBookingPrimaryColor(res.data.bookingPrimaryColor || "#0f172a");

        setPixMode((res.data.pixPaymentType as "MANUAL" | "MERCADO_PAGO") || "MANUAL");
        setMercadoPagoConnected(!!res.data.mercadoPagoConnected);

        setGeneral({
          requirePrepayment: res.data.requirePrepayment ?? true,
          termsText: res.data.termsOfUse || DEFAULT_TERMS_OF_USE,
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
    termsText: DEFAULT_TERMS_OF_USE,
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
    if (general.requirePrepayment && pixMode === "MANUAL" && !general.pixKey.trim()) {
      toast.error("A Chave Pix é obrigatória no modo de pagamento manual.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await updateSelfServiceSettingsAction({
        bookingTheme,
        bookingPrimaryColor,
        requirePrepayment: general.requirePrepayment,
        pixPaymentType: pixMode,
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
  }, [general, bookingTheme, bookingPrimaryColor, pixMode, features]);

  return (
    <div className="w-full flex flex-col gap-8 animate-in fade-in duration-300 relative pb-16">

      {/* Header com único botão salvar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            Autoagendamento Online
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Siga as etapas abaixo para configurar a aparência, seções e regras de pagamento da sua agenda online.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 md:flex-none h-10 shadow-sm w-full md:w-32 shrink-0"
          >
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      {/* Barra de Atalhos Rápidos (Guia do Usuário) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 -mx-1 px-1 custom-scrollbar">
        <button
          type="button"
          onClick={() => document.getElementById("step-booking-1")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/60 bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground transition-all shrink-0 cursor-pointer shadow-xs hover:border-border"
        >
          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center">1</span>
          <span>Aparência & Tema</span>
        </button>

        <button
          type="button"
          onClick={() => document.getElementById("step-booking-2")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/60 bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground transition-all shrink-0 cursor-pointer shadow-xs hover:border-border"
        >
          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center">2</span>
          <span>Elementos da Página</span>
        </button>

        <button
          type="button"
          onClick={() => document.getElementById("step-booking-3")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/60 bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground transition-all shrink-0 cursor-pointer shadow-xs hover:border-border"
        >
          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center">3</span>
          <span>Termos & Política</span>
        </button>

        <button
          type="button"
          onClick={() => document.getElementById("step-booking-4")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#009EE3]/30 bg-[#009EE3]/10 hover:bg-[#009EE3]/20 text-xs font-bold text-[#009EE3] transition-all shrink-0 cursor-pointer shadow-xs"
        >
          <span className="w-5 h-5 rounded-full bg-[#009EE3] text-white text-[11px] font-bold flex items-center justify-center">4</span>
          <span>Pagamento & Sinal (PIX)</span>
        </button>
      </div>

      {/* Layout Sequencial em Blocos Separados (Igual Configurações Globais) */}
      <div className="flex flex-col gap-10 mt-2">

        {/* STEP 1: Aparência e Tema Visual */}
        <div id="step-booking-1" className="flex flex-col gap-2 scroll-m-20 p-5 md:p-6 border border-border/50 rounded-2xl bg-card shadow-sm">
          <StepBadge step={1} tag="Aparência" />
          <div className="mb-2">
            <h4 className="text-base font-semibold text-foreground">Tema e Identidade Visual</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Escolha a paleta de cores e o fundo da sua página de agendamento online.
            </p>
          </div>
          <BookingAppearanceSettings
            bookingTheme={bookingTheme}
            setBookingTheme={setBookingTheme}
            bookingPrimaryColor={bookingPrimaryColor}
            setBookingPrimaryColor={setBookingPrimaryColor}
          />
        </div>

        {/* STEP 2: Elementos e Seções Visuais da Página */}
        <div id="step-booking-2" className="flex flex-col gap-4 scroll-m-20 p-5 md:p-6 border border-border/50 rounded-2xl bg-card shadow-sm">
          <div>
            <StepBadge step={2} tag="Seções da Página" />
            <h4 className="text-base font-semibold text-foreground">Elementos e Seções da Página</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ative ou desative os blocos de conteúdo opcionais na sua página de agendamento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            <div
              onClick={() => setFeatures((f) => ({ ...f, showPackages: !f.showPackages }))}
              className="flex items-center justify-between gap-4 p-4 border border-border/60 rounded-2xl bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer"
            >
              <div className="flex-1 min-w-0 pr-2">
                <Label className="font-semibold text-sm leading-snug cursor-pointer">Mostrar &quot;Pacotes&quot;</Label>
                <p className="text-xs text-muted-foreground mt-1 leading-normal">Exibe combos promocionais para agendamento direto.</p>
              </div>
              <Switch
                className="shrink-0"
                checked={features.showPackages}
                onCheckedChange={(val) => setFeatures((f) => ({ ...f, showPackages: val }))}
              />
            </div>

            <div
              onClick={() => setFeatures((f) => ({ ...f, showMostBooked: !f.showMostBooked }))}
              className="flex items-center justify-between gap-4 p-4 border border-border/60 rounded-2xl bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer"
            >
              <div className="flex-1 min-w-0 pr-2">
                <Label className="font-semibold text-sm leading-snug cursor-pointer">Mostrar &quot;Mais Agendados&quot;</Label>
                <p className="text-xs text-muted-foreground mt-1 leading-normal">Destaca os serviços mais populares no topo.</p>
              </div>
              <Switch
                className="shrink-0"
                checked={features.showMostBooked}
                onCheckedChange={(val) => setFeatures((f) => ({ ...f, showMostBooked: val }))}
              />
            </div>

            <div
              onClick={() => setFeatures((f) => ({ ...f, showTeam: !f.showTeam }))}
              className="flex items-center justify-between gap-4 p-4 border border-border/60 rounded-2xl bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer"
            >
              <div className="flex-1 min-w-0 pr-2">
                <Label className="font-semibold text-sm leading-snug cursor-pointer">Mostrar &quot;Nossa Equipe&quot;</Label>
                <p className="text-xs text-muted-foreground mt-1 leading-normal">Exibe fotos e nomes dos profissionais da clínica.</p>
              </div>
              <Switch
                className="shrink-0"
                checked={features.showTeam}
                onCheckedChange={(val) => setFeatures((f) => ({ ...f, showTeam: val }))}
              />
            </div>

            {features.showTeam && (
              <div
                onClick={() => setFeatures((f) => ({ ...f, showTeamLikes: !f.showTeamLikes }))}
                className="flex items-center justify-between gap-4 p-4 border border-border/60 rounded-2xl bg-muted/20 hover:bg-muted/30 transition-colors animate-in fade-in duration-200 cursor-pointer"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <Label className="font-semibold text-sm leading-snug cursor-pointer">Mostrar Curtidas na Equipe</Label>
                  <p className="text-xs text-muted-foreground mt-1 leading-normal">Gera prova social e validação para os profissionais.</p>
                </div>
                <Switch
                  className="shrink-0"
                  checked={features.showTeamLikes}
                  onCheckedChange={(val) => setFeatures((f) => ({ ...f, showTeamLikes: val }))}
                />
              </div>
            )}
          </div>
        </div>

        {/* STEP 3: Termos e Política do Agendamento */}
        <div id="step-booking-3" className="flex flex-col gap-4 scroll-m-20 p-5 md:p-6 border border-border/50 rounded-2xl bg-card shadow-sm">
          <div>
            <StepBadge step={3} tag="Termos de Uso" />
            <h4 className="text-base font-semibold text-foreground">Termos e Política do Agendamento Online</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure as regras de cancelamento, tolerância de atraso e avisos que o cliente deve concordar antes de concluir a reserva.
            </p>
          </div>

          <div className="flex flex-col gap-3 p-4 rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800/40 border-l-4 border-l-red-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Exibido na etapa de revisão da reserva, antes da confirmação do horário e pagamento do sinal.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGeneral({ ...general, termsText: DEFAULT_TERMS_OF_USE })}
                className="h-7 text-[10px] font-bold bg-muted/50 hover:bg-muted self-start md:self-auto"
              >
                Restaurar Padrão
              </Button>
            </div>
            <Textarea
              value={general.termsText}
              onChange={(e) => setGeneral({ ...general, termsText: e.target.value })}
              className="resize-none h-44 bg-white dark:bg-black/20 text-xs leading-relaxed"
              placeholder={DEFAULT_TERMS_OF_USE}
            />
          </div>
        </div>

        {/* STEP 4: Pagamento Antecipado (Sinal PIX) */}
        <div id="step-booking-4" className="flex flex-col gap-6 scroll-m-20 p-5 md:p-6 border border-border/50 rounded-2xl bg-card shadow-sm">
          <div>
            <StepBadge step={4} tag="Financeiro & PIX" />
            <h4 className="text-base font-semibold text-foreground">Pagamento Antecipado (Sinal PIX)</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure a exigência de sinal para garantir e confirmar a reserva na agenda.
            </p>
          </div>

          {/* Card Ativar Exigir Pagamento de Sinal - Alinhamento Perfeito no Mobile */}
          <div
            onClick={() => setGeneral((g) => ({ ...g, requirePrepayment: !g.requirePrepayment }))}
            className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-blue-200/80 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800/40 transition-colors cursor-pointer"
          >
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-bold text-sm text-foreground">Exigir Sinal de 50%</span>
                <Badge variant="outline" className="text-[10px] font-bold text-blue-600 border-blue-300 bg-blue-100/70 dark:text-blue-300 dark:border-blue-700 dark:bg-blue-900/50">
                  PIX Antecipado
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Requer metade do valor do serviço via PIX para garantir e confirmar a reserva na agenda.
              </p>
            </div>
            <Switch
              className="shrink-0"
              checked={general.requirePrepayment}
              onCheckedChange={(val) => setGeneral({ ...general, requirePrepayment: val })}
            />
          </div>

          {!general.requirePrepayment ? (
            <div className="p-4 rounded-2xl border border-dashed border-border/70 bg-muted/20 text-center animate-in fade-in duration-200">
              <p className="text-xs text-muted-foreground font-medium">
                O pagamento de sinal está <strong>desativado</strong>. Os clientes poderão agendar seus horários online sem necessidade de pagamento prévio.
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Seletor Granular: Manual vs Mercado Pago */}
              <div className="space-y-3">
                <Label className="text-foreground font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Escolha como deseja receber o PIX:
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Opção 1: Mercado Pago (Automático) */}
                  <div
                    onClick={async () => {
                      setPixMode("MERCADO_PAGO");
                      try {
                        const { updateSelfServiceSettingsAction } = await import("@/app/actions/settings");
                        await updateSelfServiceSettingsAction({
                          pixPaymentType: "MERCADO_PAGO",
                        });
                        toast.success("Modo Mercado Pago selecionado!");
                      } catch (e) {
                        console.error("Erro ao salvar modo PIX:", e);
                      }
                    }}
                    className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col justify-between relative overflow-hidden ${pixMode === "MERCADO_PAGO"
                      ? "border-[#009EE3] bg-[#009EE3]/5 shadow-sm"
                      : "border-border/60 hover:border-border bg-card/60"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#009EE3]/15 flex items-center justify-center text-[#009EE3] font-black text-xs shrink-0">
                          <img
                            src="/mercado-pago-seeklogo.png"
                            alt=""
                            className="w-5 h-5 object-contain"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-foreground">Mercado Pago</span>
                            <Badge className="bg-[#009EE3] hover:bg-[#009EE3] text-[9px] px-1.5 py-0 h-4 font-bold text-white">
                              Recomendado
                            </Badge>
                          </div>
                          <span className="text-[11px] text-muted-foreground">Automático via QR Code</span>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${pixMode === "MERCADO_PAGO" ? "border-[#009EE3] bg-[#009EE3]" : "border-muted-foreground/30"}`}>
                        {pixMode === "MERCADO_PAGO" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-1">
                      O cliente escaneia o QR Code dinâmico e o sistema <strong>confirma a agenda sozinho na hora</strong>.
                    </p>
                  </div>

                  {/* Opção 2: Manual (Chave Própria) */}
                  <div
                    onClick={async () => {
                      setPixMode("MANUAL");
                      try {
                        const { updateSelfServiceSettingsAction } = await import("@/app/actions/settings");
                        await updateSelfServiceSettingsAction({
                          pixPaymentType: "MANUAL",
                        });
                        toast.success("Modo Manual (Chave Própria) selecionado!");
                      } catch (e) {
                        console.error("Erro ao salvar modo PIX:", e);
                      }
                    }}
                    className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col justify-between relative overflow-hidden ${pixMode === "MANUAL"
                      ? "border-slate-800 dark:border-slate-200 bg-slate-50 dark:bg-slate-900/40 shadow-sm"
                      : "border-border/60 hover:border-border bg-card/60"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-sm text-foreground">Chave Própria (Manual)</span>
                          <p className="text-[11px] text-muted-foreground">Comprovante via WhatsApp</p>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${pixMode === "MANUAL" ? "border-slate-900 bg-slate-900 dark:border-white dark:bg-white" : "border-muted-foreground/30"}`}>
                        {pixMode === "MANUAL" && <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-900" />}
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-1">
                      Você informa sua chave PIX e o cliente anexa o comprovante no WhatsApp para você aprovar.
                    </p>
                  </div>
                </div>
              </div>

              {/* Conteúdo do Modo Escolhido */}
              {pixMode === "MERCADO_PAGO" ? (
                <div className="rounded-2xl border border-[#009EE3]/30 bg-[#009EE3]/5 p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-[#009EE3] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h5 className="font-bold text-sm text-foreground">Conexão Oficial com Mercado Pago</h5>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Funciona tanto para autônomos com <strong>CPF comum</strong> quanto empresas com <strong>CNPJ</strong>.
                        O dinheiro do sinal cai diretamente na sua conta Mercado Pago sem intermediários.
                      </p>
                    <div className="pt-2.5 pb-1 mt-2 border-t border-[#009EE3]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <p className="text-[11px] text-muted-foreground leading-relaxed flex-1 min-w-0 pr-1">
                        <span className="font-bold text-foreground">Taxas do Mercado Pago:</span> Taxa padrão de 0,99% por transação com liberação imediata.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsRatesInfoModalOpen(true)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#009EE3] hover:underline self-start sm:self-auto shrink-0 cursor-pointer py-0.5"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>Consultar taxas</span>
                      </button>
                    </div>
                    </div>
                  </div>

                  {mercadoPagoConnected ? (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Conta Mercado Pago Conectada</p>
                          <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400">Pronta para gerar cobranças automáticas</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDisconnectConfirmationText("");
                          setIsDisconnectModalOpen(true);
                        }}
                        className="text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 cursor-pointer"
                      >
                        Desconectar
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-1">
                      <Button
                        type="button"
                        asChild
                        className="w-full h-11 rounded-xl bg-[#009EE3] hover:bg-[#0089c7] text-white font-bold gap-2 shadow-sm transition-all cursor-pointer"
                      >
                        <a href="/api/mercadopago/authorize">
                          <img
                            src="/mercado-pago-seeklogo.png"
                            alt=""
                            className="h-5 w-auto object-contain"
                          />
                          Conectar com Mercado Pago
                        </a>
                      </Button>
                      <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                        <span>Você será redirecionado para autorizar com segurança</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 pt-2 border-t border-[#009EE3]/20">
                    <Label className="text-foreground font-medium text-xs">Instruções pós-agendamento (Opcional)</Label>
                    <Textarea
                      value={general.paymentInstructions}
                      onChange={(e) => setGeneral({ ...general, paymentInstructions: e.target.value })}
                      className="resize-none h-28 text-xs bg-white dark:bg-black/20"
                      placeholder="Instruções de comparecimento que o cliente vê assim que o PIX for pago..."
                    />
                  </div>
                </div>
              ) : (
                /* Bloco do Modo Manual */
                <div className="space-y-4 rounded-2xl border border-border/80 bg-muted/20 p-5">
                  <div className="flex items-start gap-2.5 text-xs text-muted-foreground bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>No modo manual, seu cliente copia sua chave e você precisa conferir o comprovante no WhatsApp para aprovar a agenda.</span>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground font-medium text-xs">Sua Chave PIX</Label>
                    <Input
                      value={general.pixKey}
                      onChange={(e) => setGeneral({ ...general, pixKey: e.target.value })}
                      onBlur={(e) => setGeneral({ ...general, pixKey: detectAndFormatPixKey(e.target.value) })}
                      placeholder="Ex: (00) 00000-0000, email@exemplo.com ou CPF"
                      className="bg-white dark:bg-black/20"
                      disabled={!general.requirePrepayment}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground font-medium text-xs">Mensagem de Confirmação e Envio de Comprovante</Label>
                    <Textarea
                      value={general.paymentInstructions}
                      onChange={(e) => setGeneral({ ...general, paymentInstructions: e.target.value })}
                      className="resize-none h-36 text-xs bg-white dark:bg-black/20"
                      placeholder="Instruções para o cliente com envio do comprovante..."
                      disabled={!general.requirePrepayment}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>


      {/* Modal de Confirmação de Segurança para Desconectar */}
      <Dialog open={isDisconnectModalOpen} onOpenChange={setIsDisconnectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg">Desconectar Mercado Pago?</DialogTitle>
            <DialogDescription className="text-sm space-y-2">
              <span>
                Ao desconectar, o sistema deixará de gerar cobranças Pix automáticas com sinal de 50% e voltará para o modo de cobrança manual com chave Pix.
              </span>
              <div className="p-3 bg-muted/50 rounded-xl text-xs text-foreground/80 mt-2">
                Para confirmar esta ação por segurança, digite <strong className="font-bold text-red-600 dark:text-red-400">desconectar</strong> abaixo:
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Input
              value={disconnectConfirmationText}
              onChange={(e) => setDisconnectConfirmationText(e.target.value)}
              placeholder="desconectar"
              autoFocus
              className="font-mono text-center"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDisconnectModalOpen(false)}
              disabled={isDisconnecting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={disconnectConfirmationText.trim().toLowerCase() !== "desconectar" || isDisconnecting}
              onClick={async () => {
                setIsDisconnecting(true);
                try {
                  const { disconnectMercadoPagoAction } = await import("@/app/actions/settings");
                  const res = await disconnectMercadoPagoAction();
                  if (res.success) {
                    setMercadoPagoConnected(false);
                    setPixMode("MANUAL");
                    setIsDisconnectModalOpen(false);
                    toast.success("Conta do Mercado Pago desconectada.");
                  } else {
                    toast.error("Erro ao desconectar conta.");
                  }
                } catch (err) {
                  console.error(err);
                  toast.error("Erro inesperado ao desconectar.");
                } finally {
                  setIsDisconnecting(false);
                }
              }}
            >
              {isDisconnecting ? "Desconectando..." : "Confirmar e Desconectar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Informativo: Taxas do Mercado Pago (Drawer no Mobile que sobe de baixo pra cima, Dialog no Desktop) */}
      {isMobile ? (
        <Drawer open={isRatesInfoModalOpen} onOpenChange={setIsRatesInfoModalOpen}>
          <DrawerContent className="bg-background max-h-[85vh] rounded-t-3xl">
            <DrawerHeader className="text-left px-5 pt-3 pb-2">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-8 h-8 rounded-full bg-[#009EE3]/15 text-[#009EE3] flex items-center justify-center font-bold shrink-0">
                  <Info className="w-4 h-4" />
                </div>
                <DrawerTitle className="text-base font-bold text-foreground">
                  Como funcionam as taxas do Pix Automático?
                </DrawerTitle>
              </div>
              <DrawerDescription className="text-xs text-muted-foreground">
                Entenda como o Mercado Pago processa seus recebimentos e como conferir os valores na sua conta.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-5 pb-8 overflow-y-auto custom-scrollbar">
              <div className="space-y-4 text-xs leading-relaxed text-foreground/90 py-1">
                {/* Box Exemplo Prático */}
                <div className="p-3.5 bg-muted/60 rounded-xl border border-border/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-xs">Tarifa padrão por Pix recebido:</span>
                    <span className="font-extrabold text-[#009EE3] text-sm">0,99%</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    O valor é liberado <strong>na hora</strong> na sua conta Mercado Pago. Não há mensalidade nem custo de cancelamento.
                  </p>
                  <div className="p-2.5 rounded-lg bg-background/80 border border-border/40 text-[11px]">
                    <span className="font-semibold text-foreground">Exemplo prático:</span> Se o cliente pagar <strong>R$ 50,00</strong> de sinal, a tarifa é de apenas <strong>R$ 0,50</strong> (você recebe <strong>R$ 49,50</strong> líquidos na hora).
                  </div>
                </div>

                {/* Benefícios para o dia a dia */}
                <div className="space-y-2">
                  <p className="font-bold text-foreground text-xs">
                    Por que usar o Pix Automático vale a pena?
                  </p>
                  <div className="grid grid-cols-1 gap-2 text-[11px]">
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">
                        <strong className="text-foreground">Confirmação Imediata:</strong> Seu cliente paga pelo QR Code e o sistema confirma o horário na sua agenda na mesma hora, sem você precisar conferir comprovantes no WhatsApp.
                      </span>
                    </div>
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">
                        <strong className="text-foreground">Proteção contra Golpes:</strong> Fim dos comprovantes falsos ou clientes fantasmas que reservam horários e não aparecem.
                      </span>
                    </div>
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">
                        <strong className="text-foreground">Financeiro Automático:</strong> O sinal recebido e a taxa operacional já são lançados sozinhos no seu financeiro do sistema.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Como conferir no seu app */}
                <div className="space-y-2 pt-1 border-t border-border/50">
                  <p className="font-bold text-foreground text-xs">
                    Como conferir sua taxa no Mercado Pago:
                  </p>
                  <div className="space-y-1.5 pl-0.5 text-muted-foreground text-[11px]">
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <span>
                        Acesse o app no celular ou o site{" "}
                        <a
                          href="https://www.mercadopago.com.br"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#009EE3] hover:underline font-semibold inline-flex items-center gap-0.5"
                        >
                          mercadopago.com.br <ExternalLink className="w-3 h-3 inline" />
                        </a>.
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <span>No menu, clique em <strong>Seu negócio</strong> (ou <strong>Configurações</strong>).</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <span>Vá em <strong>Tarifas e Prazos</strong> e consulte a opção <strong>Pix / Vendas Online</strong>.</span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-blue-50/80 dark:bg-blue-950/30 rounded-xl border border-blue-200/60 dark:border-blue-900/40 text-blue-900 dark:text-blue-200 text-[11px] leading-relaxed">
                  <em>Essa taxa é descontada diretamente pelo Mercado Pago apenas quando uma venda é realizada. O sistema não cobra nenhuma taxa extra nem mensalidade sobre seus atendimentos.</em>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isRatesInfoModalOpen} onOpenChange={setIsRatesInfoModalOpen}>
          <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-8 h-8 rounded-full bg-[#009EE3]/15 text-[#009EE3] flex items-center justify-center font-bold">
                  <Info className="w-4 h-4" />
                </div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Como funcionam as taxas do Pix Automático?
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Entenda como o Mercado Pago processa seus recebimentos e como conferir os valores na sua conta.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs leading-relaxed text-foreground/90 py-1">
              {/* Box Exemplo Prático */}
              <div className="p-3.5 bg-muted/60 rounded-xl border border-border/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground text-xs">Tarifa padrão por Pix recebido:</span>
                  <span className="font-extrabold text-[#009EE3] text-sm">0,99%</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  O valor é liberado <strong>na hora</strong> na sua conta Mercado Pago. Não há mensalidade nem custo de cancelamento.
                </p>
                <div className="p-2.5 rounded-lg bg-background/80 border border-border/40 text-[11px]">
                  <span className="font-semibold text-foreground">Exemplo prático:</span> Se o cliente pagar <strong>R$ 50,00</strong> de sinal, a tarifa é de apenas <strong>R$ 0,50</strong> (você recebe <strong>R$ 49,50</strong> líquidos na hora).
                </div>
              </div>

              {/* Benefícios para o dia a dia */}
              <div className="space-y-2">
                <p className="font-bold text-foreground text-xs">
                  Por que usar o Pix Automático vale a pena?
                </p>
                <div className="grid grid-cols-1 gap-2 text-[11px]">
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">Confirmação Imediata:</strong> Seu cliente paga pelo QR Code e o sistema confirma o horário na sua agenda na mesma hora, sem você precisar conferir comprovantes no WhatsApp.
                    </span>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">Proteção contra Golpes:</strong> Fim dos comprovantes falsos ou clientes fantasmas que reservam horários e não aparecem.
                    </span>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">Financeiro Automático:</strong> O sinal recebido e a taxa operacional já são lançados sozinhos no seu financeiro do sistema.
                    </span>
                  </div>
                </div>
              </div>

              {/* Como conferir no seu app */}
              <div className="space-y-2 pt-1 border-t border-border/50">
                <p className="font-bold text-foreground text-xs">
                  Como conferir sua taxa no Mercado Pago:
                </p>
                <div className="space-y-1.5 pl-0.5 text-muted-foreground text-[11px]">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <span>
                      Acesse o app no celular ou o site{" "}
                      <a
                        href="https://www.mercadopago.com.br"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#009EE3] hover:underline font-semibold inline-flex items-center gap-0.5"
                      >
                        mercadopago.com.br <ExternalLink className="w-3 h-3 inline" />
                      </a>.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <span>No menu, clique em <strong>Seu negócio</strong> (ou <strong>Configurações</strong>).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <span>Vá em <strong>Tarifas e Prazos</strong> e consulte a opção <strong>Pix / Vendas Online</strong>.</span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-blue-50/80 dark:bg-blue-950/30 rounded-xl border border-blue-200/60 dark:border-blue-900/40 text-blue-900 dark:text-blue-200 text-[11px] leading-relaxed">
                <em>Essa taxa é descontada diretamente pelo Mercado Pago apenas quando uma venda é realizada. O sistema não cobra nenhuma taxa extra nem mensalidade sobre seus atendimentos.</em>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


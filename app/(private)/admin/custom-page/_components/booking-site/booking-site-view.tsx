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
import { Zap, KeyRound, CheckCircle2, ExternalLink, ShieldCheck, AlertCircle, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function BookingSiteView({ profile }: { profile?: any }) {
  const [isSaving, setIsSaving] = useState(false);

  const [bookingTheme, setBookingTheme] = useState("light");
  const [bookingPrimaryColor, setBookingPrimaryColor] = useState("#0f172a");

  // Modo de Pagamento: "MANUAL" (Chave Pix própria) ou "MERCADO_PAGO" (Automático)
  const [pixMode, setPixMode] = useState<"MANUAL" | "MERCADO_PAGO">("MANUAL");
  const [mercadoPagoConnected, setMercadoPagoConnected] = useState(false);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [disconnectConfirmationText, setDisconnectConfirmationText] = useState("");
  const [isDisconnecting, setIsDisconnecting] = useState(false);

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
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">

      {/* Header com único botão salvar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <p className="text-sm text-muted-foreground">
          Personalize a página onde seus clientes agendam horários sozinhos.
        </p>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="h-10 shadow-sm w-full md:w-36 shrink-0"
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
            <div className="flex flex-col gap-3 p-4 rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800/40 border-l-4 border-l-red-500">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Label className="text-foreground font-semibold">Termos e Política do Agendamento Online</Label>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-2xl">Agendamento</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    Exibido na etapa de revisão da reserva, antes da confirmação do horário e pagamento do sinal.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setGeneral({ ...general, termsText: DEFAULT_TERMS_OF_USE })}
                    className="h-7 text-[10px] font-bold bg-muted/50 hover:bg-muted"
                  >
                    Restaurar Padrão
                  </Button>
                </div>
              </div>
              <Textarea
                value={general.termsText}
                onChange={(e) => setGeneral({ ...general, termsText: e.target.value })}
                className="resize-none h-48 bg-white dark:bg-black/20"
                placeholder={DEFAULT_TERMS_OF_USE}
              />
            </div>
          </div>

          {/* Pagamento Antecipado */}
          <div className="flex flex-col gap-5 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-semibold text-foreground">Exigir Pagamento Antecipado (Sinal)</h4>
                  <Badge variant="outline" className="text-[11px] font-semibold text-blue-600 border-blue-200 bg-blue-50/50 dark:text-blue-300 dark:border-blue-400/50 dark:bg-blue-950/40">
                    50% do Serviço
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Requer 50% do valor do atendimento via PIX para garantir e confirmar a reserva na agenda.
                </p>
              </div>
              <Switch
                checked={general.requirePrepayment}
                onCheckedChange={(val) => setGeneral({ ...general, requirePrepayment: val })}
              />
            </div>

            <div className={`space-y-5 transition-opacity duration-300 ${!general.requirePrepayment ? "opacity-40 pointer-events-none" : ""}`}>

              {/* Seletor Granular: Manual vs Mercado Pago */}
              <div className="space-y-2">
                <Label className="text-foreground font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Escolha como deseja receber o PIX:
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">

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
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#009EE3]/15 flex items-center justify-center text-[#009EE3] font-black text-xs">
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
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
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

              {/* CONTEÚDO CONDICIONAL CONFORME A ESCOLHA */}
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
                        className="text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
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
            <div className="flex items-center justify-between p-4 border rounded-2xl bg-card shadow-sm">
              <div className="flex flex-col">
                <Label className="font-semibold">Mostrar &quot;Pacotes&quot;</Label>
                <span className="text-xs text-muted-foreground mt-0.5">Exibe combos promocionais.</span>
              </div>
              <Switch
                checked={features.showPackages}
                onCheckedChange={(val) => setFeatures((f) => ({ ...f, showPackages: val }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-2xl bg-card shadow-sm">
              <div className="flex flex-col">
                <Label className="font-semibold">Mostrar &quot;Mais Agendados&quot;</Label>
                <span className="text-xs text-muted-foreground mt-0.5">Destaca os serviços populares.</span>
              </div>
              <Switch
                checked={features.showMostBooked}
                onCheckedChange={(val) => setFeatures((f) => ({ ...f, showMostBooked: val }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-2xl bg-card shadow-sm">
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
              <div className="flex items-center justify-between p-4 border rounded-2xl bg-muted/40 ml-5">
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
    </div>
  );
}


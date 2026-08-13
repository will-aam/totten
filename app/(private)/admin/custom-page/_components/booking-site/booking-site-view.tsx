"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Check, X, Image as ImageIcon } from "@boxicons/react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function BookingSiteView({ profile }: { profile?: any }) {
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(Date.now());

  // Estados MOCK (já que não vamos tocar no banco de dados agora)
  const [general, setGeneral] = useState({
    enabled: true,
    termsText: "Ao confirmar, declaro que li e aceito a Política de Cancelamento.",
  });

  const [features, setFeatures] = useState({
    showPackages: true,
    showMostBooked: true,
    showTeam: true,
    showTeamLikes: true,
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simula salvamento sem tocar no backend/Prisma
    setTimeout(() => {
      setIsSaving(false);
      setRefreshKey(Date.now());
    }, 800);
  };

  const STEPS = [
    {
      id: "general",
      title: "Configurações Gerais",
      component: (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Geral</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Ative ou desative a função de autoagendamento.
            </p>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-xl bg-card shadow-sm">
            <div className="flex flex-col">
              <Label className="text-base font-semibold">Habilitar Autoagendamento</Label>
              <span className="text-xs text-muted-foreground mt-1 max-w-[250px]">
                Se desativado, a página servirá apenas como um Portfólio e Histórico para o cliente.
              </span>
            </div>
            <Switch
              checked={general.enabled}
              onCheckedChange={(val) => setGeneral({ ...general, enabled: val })}
            />
          </div>
          
          <div className="flex flex-col gap-3 pt-4 border-t">
            <Label className="text-foreground font-medium">Termos de Aceite (Obrigatório)</Label>
            <p className="text-xs text-muted-foreground">
              Texto que aparece acima do botão final de confirmar agendamento.
            </p>
            <Textarea
              value={general.termsText}
              onChange={(e) => setGeneral({ ...general, termsText: e.target.value })}
              className="resize-none h-20"
              placeholder="Ex: Ao confirmar, declaro que li e aceito..."
            />
          </div>
        </div>
      )
    },
    {
      id: "features",
      title: "Elementos da Página",
      component: (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Exibição de Módulos</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Ligue ou desligue as seções na sua página de agendamento.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
              <div className="flex flex-col">
                <Label>Mostrar "Pacotes"</Label>
                <span className="text-[10px] text-muted-foreground">Exibe combos promocionais.</span>
              </div>
              <Switch checked={features.showPackages} onCheckedChange={(val) => setFeatures({...features, showPackages: val})} />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
              <div className="flex flex-col">
                <Label>Mostrar "Mais Agendados"</Label>
                <span className="text-[10px] text-muted-foreground">Destaca os serviços populares.</span>
              </div>
              <Switch checked={features.showMostBooked} onCheckedChange={(val) => setFeatures({...features, showMostBooked: val})} />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
              <div className="flex flex-col">
                <Label>Mostrar "Nossa Equipe"</Label>
                <span className="text-[10px] text-muted-foreground">Exibe fotos dos profissionais.</span>
              </div>
              <Switch checked={features.showTeam} onCheckedChange={(val) => setFeatures({...features, showTeam: val})} />
            </div>

            {features.showTeam && (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30 ml-4">
                <div className="flex flex-col">
                  <Label>Mostrar Curtidas na Equipe</Label>
                  <span className="text-[10px] text-muted-foreground">Gera prova social para os profissionais.</span>
                </div>
                <Switch checked={features.showTeamLikes} onCheckedChange={(val) => setFeatures({...features, showTeamLikes: val})} />
              </div>
            )}

          </div>
        </div>
      )
    }
  ];

  // Preview Mockup do Celular (Visualização do Cliente Final)
  const BookingMockup = ({ isFullScreen = false }: { isFullScreen?: boolean }) => {
    return (
      <iframe
        src={`/${profile?.slug || 'serenita'}/agendar?preview=true&r=${refreshKey}`}
        className={cn(
          "w-full h-full bg-white border-none",
          isFullScreen ? "" : "rounded-[2.5rem]"
        )}
      />
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* LADO ESQUERDO: Formulários */}
      <div className="flex-1 flex flex-col gap-6 w-full max-w-full overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/50 pb-6">
          <div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Personalize a página onde seus clientes agendam horários sozinhos.
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              onClick={() => setShowMobilePreview(true)}
              className="flex-1 lg:hidden md:flex-none rounded-full h-10 w-full md:w-32"
            >
              Ver Preview
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 md:flex-none rounded-full h-10 shadow-sm w-full md:w-32"
            >
              {isSaving ? "Salvando..." : "Salvar Tela"}
            </Button>
          </div>
        </div>

        {/* Menu de Etapas */}
        {activeStepId === null ? (
          <div className="flex flex-col gap-3">
            {STEPS.map((step) => (
              <div
                key={step.id}
                onClick={() => setActiveStepId(step.id)}
                className="flex items-center justify-between p-4 bg-card border border-border/50 rounded-xl cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-colors shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 bg-emerald-500/10 text-emerald-500">
                    <Check className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground text-sm">{step.title}</span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full">
            <Button
              variant="ghost"
              onClick={() => setActiveStepId(null)}
              className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5 mr-1" /> Voltar para o menu
            </Button>
            {STEPS.find(s => s.id === activeStepId)?.component}
          </div>
        )}
      </div>

      {/* LADO DIREITO: Celular Preview */}
      <div className="hidden lg:flex w-85 shrink-0 flex-col items-center">
        <div className="sticky top-24">
          <div className="w-[320px] h-[650px] bg-black rounded-[3rem] border-8 border-black shadow-2xl relative overflow-hidden ring-1 ring-border/20 mx-auto">
            <div className="absolute top-0 inset-x-0 h-6 bg-black z-20 rounded-b-2xl w-40 mx-auto" />
            <BookingMockup />
          </div>
        </div>
      </div>

      {/* MODAL PREVIEW MOBILE */}
      <Dialog open={showMobilePreview} onOpenChange={setShowMobilePreview}>
        <DialogContent className="w-screen h-dvh max-w-none bg-black border-0 p-0 m-0 flex flex-col rounded-none z-[100] overflow-hidden">
          <DialogTitle className="sr-only">Preview</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMobilePreview(false)}
            className="absolute top-4 right-4 z-[999] rounded-full bg-black/40 text-white hover:bg-black/60"
          >
            <X className="h-6 w-6" />
          </Button>
          <div className="w-full h-full overflow-hidden">
            <BookingMockup isFullScreen={true} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

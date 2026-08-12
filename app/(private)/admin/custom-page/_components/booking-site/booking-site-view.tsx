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

  // Estados MOCK (já que não vamos tocar no banco de dados agora)
  const [general, setGeneral] = useState({
    enabled: true,
    termsText: "Ao confirmar, declaro que li e aceito a Política de Cancelamento.",
  });
  
  const [hero, setHero] = useState({
    bannerUrl: "",
    title: "Agende seu horário",
    subtitle: "Selecione o serviço desejado e venha cuidar de você.",
  });

  const [features, setFeatures] = useState({
    showPackages: true,
    showMostBooked: true,
    showTeam: true,
    showTeamLikes: true,
    showReviews: true,
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simula salvamento sem tocar no backend/Prisma
    setTimeout(() => setIsSaving(false), 800);
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
      id: "hero",
      title: "Capa e Destaques",
      component: (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Apresentação Inicial</h3>
            <p className="text-sm text-muted-foreground mt-1">
              O que o cliente vê assim que abre a página.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Label className="font-medium">Título Principal</Label>
            <Input
              value={hero.title}
              onChange={(e) => setHero({ ...hero, title: e.target.value })}
              placeholder="Ex: Agende seu horário"
            />
          </div>
          
          <div className="flex flex-col gap-3">
            <Label className="font-medium">Subtítulo (Opcional)</Label>
            <Input
              value={hero.subtitle}
              onChange={(e) => setHero({ ...hero, subtitle: e.target.value })}
              placeholder="Ex: Selecione o serviço desejado..."
            />
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Label className="font-medium">Banner de Capa (URL)</Label>
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-xl p-6 bg-muted/20 hover:bg-muted/50 transition-colors cursor-pointer group mb-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <ImageIcon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground text-center">Fazer Upload de Capa</p>
            </div>
            <Input
              value={hero.bannerUrl}
              onChange={(e) => setHero({ ...hero, bannerUrl: e.target.value })}
              placeholder="Ou cole o link da imagem..."
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

            <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
              <div className="flex flex-col">
                <Label>Mostrar "Avaliações"</Label>
                <span className="text-[10px] text-muted-foreground">Exibe comentários de clientes.</span>
              </div>
              <Switch checked={features.showReviews} onCheckedChange={(val) => setFeatures({...features, showReviews: val})} />
            </div>
          </div>
        </div>
      )
    }
  ];

  // Preview Mockup do Celular (Visualização do Cliente Final)
  const BookingMockup = ({ isFullScreen = false }: { isFullScreen?: boolean }) => {
    return (
      <div className={cn(
        "w-full h-full flex flex-col bg-slate-50 relative overflow-hidden",
        isFullScreen ? "" : "rounded-[2.5rem]"
      )}>
        {/* Mock Header */}
        <div className="h-14 w-full bg-white border-b flex items-center justify-between px-4 shrink-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-200 rounded-full overflow-hidden">
               {profile?.image && <img src={profile.image} className="w-full h-full object-cover" alt="" />}
            </div>
            <span className="font-semibold text-sm">{profile?.name || "Meu Salão"}</span>
          </div>
          {/* Botão de Histórico (Área do Cliente) - Sempre visível */}
          <button className="text-[10px] font-bold bg-slate-100 px-3 py-1.5 rounded-full flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-slate-300" /> Histórico
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-20 no-scrollbar">
          
          {/* Hero Section */}
          <div className="w-full relative h-40 bg-slate-200 shrink-0">
             {hero.bannerUrl && <img src={hero.bannerUrl} className="w-full h-full object-cover" alt="" />}
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
             <div className="absolute bottom-4 left-4 right-4 text-white">
                <h2 className="font-bold text-lg leading-tight">{hero.title}</h2>
                <p className="text-[10px] opacity-90 mt-1 line-clamp-2">{hero.subtitle}</p>
             </div>
          </div>

          {general.enabled ? (
            <div className="p-4 flex flex-col gap-6">
              
              {/* Fake Pacotes */}
              {features.showPackages && (
                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-500 mb-3">Combos & Pacotes</h3>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                     <div className="w-40 shrink-0 bg-white border rounded-xl p-3 shadow-sm">
                        <h4 className="font-bold text-xs">Pacote Mensal</h4>
                        <p className="text-[9px] text-slate-500 mt-1">4 cortes + barba</p>
                        <p className="font-bold text-sm text-emerald-600 mt-2">R$ 150</p>
                     </div>
                     <div className="w-40 shrink-0 bg-white border rounded-xl p-3 shadow-sm">
                        <h4 className="font-bold text-xs">Spa Day</h4>
                        <p className="text-[9px] text-slate-500 mt-1">Massagem + Limpeza</p>
                        <p className="font-bold text-sm text-emerald-600 mt-2">R$ 220</p>
                     </div>
                  </div>
                </div>
              )}

              {/* Fake Mais Agendados */}
              {features.showMostBooked && (
                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-500 mb-3">Mais Agendados</h3>
                  <div className="flex flex-col gap-2">
                     <div className="bg-white border rounded-lg p-3 flex justify-between items-center shadow-sm">
                        <div>
                          <p className="font-bold text-xs">Corte Completo</p>
                          <p className="text-[10px] text-slate-500">45 min</p>
                        </div>
                        <button className="bg-slate-900 text-white text-[10px] px-3 py-1.5 rounded-full font-bold">R$ 45</button>
                     </div>
                  </div>
                </div>
              )}

              {/* Fake Categorias de Serviços */}
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-500 mb-3">Todos os Serviços</h3>
                <div className="flex flex-col gap-3">
                   <div className="bg-white border rounded-lg p-3">
                      <p className="font-bold text-xs mb-2">Cabelo</p>
                      <div className="flex justify-between items-center py-2 border-t border-slate-50">
                        <p className="text-[11px]">Hidratação</p>
                        <button className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">R$ 80</button>
                      </div>
                   </div>
                </div>
              </div>

              {/* Fake Equipe */}
              {features.showTeam && (
                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-500 mb-3">Nossa Equipe</h3>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                     <div className="flex flex-col items-center gap-1 shrink-0 w-16">
                        <div className="w-12 h-12 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-bold">Ana</span>
                        {features.showTeamLikes && <span className="text-[8px] text-slate-500">❤️ 120</span>}
                     </div>
                     <div className="flex flex-col items-center gap-1 shrink-0 w-16">
                        <div className="w-12 h-12 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-bold">Carlos</span>
                        {features.showTeamLikes && <span className="text-[8px] text-slate-500">❤️ 98</span>}
                     </div>
                  </div>
                </div>
              )}

              {/* Fake Reviews */}
              {features.showReviews && (
                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-500 mb-3">Avaliações</h3>
                  <div className="bg-white border rounded-lg p-3 shadow-sm">
                     <div className="flex text-yellow-400 text-[10px] mb-1">★★★★★</div>
                     <p className="text-[10px] italic">"Atendimento maravilhoso, lugar incrível!"</p>
                     <p className="text-[9px] text-slate-400 mt-1">- Cliente Satisfeita</p>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="p-8 flex flex-col items-center justify-center text-center h-64">
              <div className="w-12 h-12 rounded-full bg-slate-200 mb-4 flex items-center justify-center">
                 <span className="text-xl">📅</span>
              </div>
              <h3 className="font-bold text-sm">O autoagendamento está pausado.</h3>
              <p className="text-xs text-slate-500 mt-2">Mas você ainda pode acessar seu histórico pela Área do Cliente no topo.</p>
            </div>
          )}
        </div>
      </div>
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

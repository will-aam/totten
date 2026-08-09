"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Save, ChevronRight, ChevronLeft, Pin, Star, Briefcase, Youtube, Mobile, X, Copy, Check, Globe } from "@boxicons/react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// Importando as seções recém-criadas
import { ProPresentation } from "./pro-presentation";
import { ProServices } from "./pro-services";
import { ProMedia } from "./pro-media";
import { ProSocialProof } from "./pro-social-proof";
import { ProContact } from "./pro-contact";
import { ProTheme } from "./pro-theme";
import { updateCustomPageAction } from "@/app/actions/custom-page";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
};

export function ProfessionalSiteView({ profile, initialData }: { profile?: any; initialData?: any }) {
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Estados dos formulários do Site Profissional
  const [presentation, setPresentation] = useState({ headline: "", subheadline: "", bio: "", heroImage: "", heroLayout: "fade-cover" });
  const [services, setServices] = useState({ ctaText: "", ctaLink: "", servicesList: [] as any[] });
  const [media, setMedia] = useState({});
  const [socialProof, setSocialProof] = useState({ testimonials: [] as any[] });
  const [contact, setContact] = useState({ address: "", mapUrl: "", phone: "", email: "" });
  const [theme, setTheme] = useState({ id: "light", css: "bg-slate-50", textColor: "#0f172a", primaryColor: "#0f172a", headerStyle: "center" });
  // Preencher dados iniciais recebidos do servidor ou localStorage
  useEffect(() => {
    let loaded = false;
    if (initialData && Object.keys(initialData).length > 0) {
      if (initialData.presentation) setPresentation(initialData.presentation);
      if (initialData.services) setServices(initialData.services);
      if (initialData.media) setMedia(initialData.media);
      if (initialData.socialProof) setSocialProof(initialData.socialProof);
      if (initialData.contact) setContact(initialData.contact);
      if (initialData.theme) setTheme(initialData.theme);
      loaded = true;
    }

    if (!loaded) {
      const saved = localStorage.getItem('totten_pro_site_draft');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.presentation) setPresentation(parsed.presentation);
          if (parsed.services) setServices(parsed.services);
          if (parsed.media) setMedia(parsed.media);
          if (parsed.socialProof) setSocialProof(parsed.socialProof);
          if (parsed.contact) setContact(parsed.contact);
          if (parsed.theme) setTheme(parsed.theme);
        } catch (e) { }
      }
    }
  }, [initialData]);

  // Salvar rascunho
  useEffect(() => {
    const draft = { presentation, services, media, socialProof, contact, theme };
    localStorage.setItem('totten_pro_site_draft', JSON.stringify(draft));
  }, [presentation, services, media, socialProof, contact, theme]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const proSiteData = {
        presentation,
        services,
        media,
        socialProof,
        contact,
        theme
      };

      const response = await updateCustomPageAction({
        professionalSiteConfig: proSiteData
      });

      if (response.success) {
        toast.success("Site Profissional salvo com sucesso!");
      } else {
        toast.error(response.error || "Erro ao salvar Site Profissional.");
      }
    } catch (error) {
      toast.error("Erro inesperado ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const STEPS = [
    { id: "presentation", title: "Apresentação", component: <ProPresentation data={presentation} onChange={setPresentation} /> },
    { id: "services", title: "Serviços", component: <ProServices data={services} onChange={setServices} /> },
    { id: "media", title: "Galeria e Mídia", component: <ProMedia data={media} onChange={setMedia} /> },
    { id: "social-proof", title: "Depoimentos", component: <ProSocialProof data={socialProof} onChange={setSocialProof} /> },
    { id: "contact", title: "Contato", component: <ProContact data={contact} onChange={setContact} /> },
    { id: "theme", title: "Aparência", component: <ProTheme data={theme} onChange={setTheme} /> },
  ];

  const isStepDone = (stepId: string) => {
    switch (stepId) {
      case "presentation": return !!(presentation.headline || presentation.bio);
      case "services": return services.servicesList && services.servicesList.length > 0;
      case "media": return !!((media as any).videoUrl || ((media as any).images && (media as any).images.length > 0));
      case "social-proof": return socialProof.testimonials && socialProof.testimonials.length > 0;
      case "contact": return !!(contact.phone || contact.address);
      case "theme": return true;
      default: return false;
    }
  };

  // Mobile Preview específico do Site Profissional
  const ProSiteMockup = ({ isFullScreen = false }: { isFullScreen?: boolean }) => {
    const isAvatarLayout = presentation.heroLayout === "avatar-cover";

    const content = (
      <div className={cn("w-full h-full flex flex-col pb-8 relative z-10 transition-colors duration-500 overflow-y-auto no-scrollbar", theme.css, isFullScreen ? "pt-12" : "")} style={{ color: theme.textColor }}>

        {/* HERO / HEADER SECTION */}
        <div className="relative w-full">
          {presentation.heroImage ? (
            <div className={cn("w-full relative shrink-0", isAvatarLayout ? "h-40" : "h-56")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={presentation.heroImage}
                alt="Hero"
                className="w-full h-full object-cover"
                style={!isAvatarLayout ? {
                  WebkitMaskImage: "linear-gradient(to top, transparent 0%, black 75%)",
                  maskImage: "linear-gradient(to top, transparent 0%, black 75%)"
                } : {}}
              />
            </div>
          ) : (
            <div className={cn("w-full bg-muted/20 border-b border-border/10 shrink-0", isAvatarLayout ? "h-32" : "h-32")} />
          )}

          <div className={cn(
            "px-6 relative z-10 flex flex-col pb-6",
            isAvatarLayout
              ? (presentation.heroImage ? "-mt-12" : "-mt-10")
              : (presentation.heroImage ? "-mt-14" : "-mt-12"),
            theme.headerStyle === "center" ? "text-center items-center" : "text-left items-start"
          )}>
            {/* AVATAR DO LINK NA BIO INTEGRADO */}
            {isAvatarLayout && (
              profile?.image ? (
                <div className="w-24 h-24 rounded-full border-4 shadow-sm overflow-hidden mb-3 shrink-0" style={{ borderColor: theme.css.includes('slate-900') ? '#0f172a' : '#ffffff', backgroundColor: theme.css.includes('slate-900') ? '#0f172a' : '#ffffff' }}>
                  <img src={profile.image} alt="Avatar" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full border-4 shadow-sm bg-muted/50 mb-3 shrink-0" style={{ borderColor: theme.css.includes('slate-900') ? '#0f172a' : '#ffffff' }} />
              )
            )}

            <h1 className="font-bold text-2xl leading-tight drop-shadow-sm mt-1">
              {presentation.headline || "Seu Título Principal Aqui"}
            </h1>
            <p className="text-sm opacity-80 mt-2 font-medium drop-shadow-sm">
              {presentation.subheadline || "Subtítulo de apoio ou missão do seu negócio."}
            </p>

            {services.ctaText && (
              <div
                className="mt-6 px-6 py-3 rounded-full text-sm font-bold shadow-sm w-fit text-white backdrop-blur-sm"
                style={{ backgroundColor: theme.primaryColor }}
              >
                {services.ctaText}
              </div>
            )}
          </div>
        </div>

        {/* BIO SECTION */}
        {presentation.bio && (
          <div className="px-6 py-6 bg-foreground/5">
            <h2 className="font-bold text-lg mb-2">Sobre mim</h2>
            <p className="text-sm opacity-80 whitespace-pre-wrap leading-relaxed">{presentation.bio}</p>
          </div>
        )}

        {/* SERVICES SECTION */}
        {(services.servicesList && services.servicesList.length > 0) && (
          <div className="px-6 py-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5" /> Serviços
            </h2>
            <div className="flex flex-col gap-3">
              {services.servicesList.map((srv: any, i: number) => (
                <div key={i} className="p-4 rounded-xl flex flex-col gap-2 relative shadow-sm border" style={{ borderColor: 'rgba(150,150,150,0.15)', backgroundColor: 'rgba(150,150,150,0.03)' }}>
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-bold text-[15px] leading-snug">{srv.title || "Serviço"}</h3>
                    <span className="font-bold text-sm shrink-0 px-2.5 py-0.5 rounded-md" style={{ color: theme.primaryColor, backgroundColor: 'rgba(150,150,150,0.1)' }}>
                      {srv.price}
                    </span>
                  </div>
                  <p className="text-[13px] opacity-75 leading-relaxed">{srv.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TESTIMONIALS SECTION */}
        {(socialProof.testimonials && socialProof.testimonials.length > 0) && (
          <div className="px-6 py-6 bg-foreground/5">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Star className="h-5 w-5" /> Depoimentos
            </h2>
            <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x pb-4 -mx-6 px-6">
              {socialProof.testimonials.map((testi: any, i: number) => (
                <div key={i} className="w-64 shrink-0 p-4 rounded-xl bg-background shadow-sm snap-center">
                  <div className="flex text-amber-400 mb-2">
                    <Star className="h-3 w-3" type="solid" /><Star className="h-3 w-3" type="solid" /><Star className="h-3 w-3" type="solid" /><Star className="h-3 w-3" type="solid" /><Star className="h-3 w-3" type="solid" />
                  </div>
                  <p className="text-xs opacity-80 italic mb-3">"{testi.text}"</p>
                  <p className="text-xs font-bold">{testi.name || "Cliente"}</p>
                  <p className="text-[10px] opacity-60">{testi.role}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIDEO SECTION */}
        {(media as any).videoUrl && (
          <div className="px-6 py-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Youtube className="h-5 w-5" /> Vídeo
            </h2>
            <div className="w-full aspect-video rounded-xl overflow-hidden shadow-sm border border-border/10 bg-black/10">
              <iframe
                width="100%"
                height="100%"
                src={getYouTubeEmbedUrl((media as any).videoUrl) || ""}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* CONTACT SECTION */}
        {(contact.address || contact.phone) && (
          <div className="px-6 py-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Pin className="h-5 w-5" /> Onde Estamos
            </h2>
            {contact.address && <p className="text-sm opacity-80 mb-4">{contact.address}</p>}
            {contact.mapUrl && (
              <div className="w-full h-16 bg-muted/20 rounded-xl overflow-hidden mb-4 border border-border/10 flex items-center justify-center">
                <a href={contact.mapUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-bold opacity-80 hover:opacity-100 transition-opacity">
                  <Globe className="h-5 w-5" /> Abrir Mapa
                </a>
              </div>
            )}
          </div>
        )}

        {/* FOOTER SECTION */}
        {(contact.phone || contact.email) && (
          <div className="px-6 py-6 mt-auto flex flex-row items-center justify-center gap-4 text-xs opacity-70">
            {contact.phone && <span className="font-medium">{contact.phone}</span>}
            {contact.phone && contact.email && <span className="w-1 h-1 rounded-full bg-current opacity-50" />}
            {contact.email && <span className="font-medium">{contact.email}</span>}
          </div>
        )}

      </div>
    );

    if (isFullScreen) {
      return <div className="w-full h-full relative bg-background">{content}</div>;
    }

    return (
      <div className="w-[320px] h-[650px] bg-black rounded-[3rem] border-8 border-black shadow-2xl relative overflow-hidden ring-1 ring-border/20 mx-auto">
        <div className="absolute top-0 inset-x-0 h-6 bg-black z-20 rounded-b-2xl w-40 mx-auto" />
        {content}
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* COLUNA ESQUERDA: Formulários do Site */}
      <div className="flex-1 flex flex-col gap-6 w-full max-w-full overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/50 pb-6">
          <div>

            <p className="text-sm text-muted-foreground mt-0.5">
              Configure sua página profissional completa com serviços, biografia e depoimentos.
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
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>


        {/* Menu de Etapas ou Etapa Ativa */}
        {activeStepId === null ? (
          <div className="flex flex-col gap-3 animate-in fade-in duration-300">
            {STEPS.map((step) => {
              const done = isStepDone(step.id);
              return (
                <div
                  key={step.id}
                  onClick={() => setActiveStepId(step.id)}
                  className="flex items-center justify-between p-4 bg-card border border-border/50 rounded-xl cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                      done ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
                    )}>
                      {done ? <Check className="h-5 w-5" /> : <div className="h-3 w-3 rounded-full bg-current opacity-20" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground text-sm">{step.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {done ? "Configurado" : "Não configurado"}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="w-full animate-in fade-in slide-in-from-right-4 duration-300">
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

      {/* COLUNA DIREITA: Preview do Celular */}
      <div className="hidden lg:flex w-85 shrink-0 flex-col items-center">
        <div className="sticky top-24">
          <ProSiteMockup />
        </div>
      </div>



      {/* MODAL DE PREVIEW MOBILE FULLSCREEN */}
      <Dialog open={showMobilePreview} onOpenChange={setShowMobilePreview}>
        <DialogContent className="w-screen h-dvh max-w-none bg-black border-0 p-0 m-0 flex flex-col rounded-none z-[100] overflow-hidden">
          <DialogTitle className="sr-only">Preview do Celular</DialogTitle>

          {/* BOTÃO FECHAR FLUTUANTE POR CIMA */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMobilePreview(false)}
            className="absolute top-4 right-4 z-[999] rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md"
          >
            <X className="h-6 w-6" />
          </Button>

          <div className="w-full h-full overflow-hidden">
            <ProSiteMockup isFullScreen={true} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

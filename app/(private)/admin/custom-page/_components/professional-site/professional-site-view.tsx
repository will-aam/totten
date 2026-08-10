"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Save, ChevronRight, ChevronLeft, Pin, Star, Briefcase, Youtube, Mobile, X, Copy, Check, Globe, Layout } from "@boxicons/react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Importando as seções recém-criadas
import { ProPresentation } from "./pro-presentation";
import { ProHistory } from "./pro-history";
import { ProServices } from "./pro-services";
import { ProMedia } from "./pro-media";
import { ProContact } from "./pro-contact";
import { ProTheme } from "./pro-theme";
import { updateCustomPageAction } from "@/app/actions/custom-page";
import { toast } from "sonner";
import { Clock, Phone as PhoneIcon, MapPin } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

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
  const [presentation, setPresentation] = useState<any>({ headline: "", subheadline: "", bio: "", heroImage: "", heroLayout: "fade-cover", ctaPrimaryText: "", ctaSecondaryText: "", aboutTitle: "" });
  const [history, setHistory] = useState<any>({ showHistory: true, historyTitle: "", historyText: "", historyImage: "", historyStat1Label: "Anos de experiência", historyStat1Value: "", historyStat2Label: "Clientes atendidos", historyStat2Value: "", historyStat3Label: "", historyStat3Value: "" });
  const [services, setServices] = useState<any>({ ctaText: "", ctaLink: "", servicesList: [] as any[], featuredPackageName: "" });
  const [media, setMedia] = useState<any>({});
  const [contact, setContact] = useState<any>({ address: "", mapUrl: "", phone: "", whatsapp: "", email: "", businessHours: "" });
  const [theme, setTheme] = useState<any>({ id: "light", css: "bg-slate-50", textColor: "#0f172a", primaryColor: "#0f172a", headerStyle: "center" });
  // Preencher dados iniciais recebidos do servidor ou localStorage
  useEffect(() => {
    let loaded = false;
    if (initialData && Object.keys(initialData).length > 0) {
      if (initialData.presentation) setPresentation(initialData.presentation);
      if (initialData.history) setHistory(initialData.history);
      if (initialData.services) setServices(initialData.services);
      if (initialData.media) setMedia(initialData.media);
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
          if (parsed.history) setHistory(parsed.history);
          if (parsed.services) setServices(parsed.services);
          if (parsed.media) setMedia(parsed.media);
          if (parsed.contact) setContact(parsed.contact);
          if (parsed.theme) setTheme(parsed.theme);
        } catch (e) { }
      }
    }
  }, [initialData]);

  // Salvar rascunho
  useEffect(() => {
    const draft = { presentation, history, services, media, contact, theme };
    localStorage.setItem('totten_pro_site_draft', JSON.stringify(draft));
  }, [presentation, history, services, media, contact, theme]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const proSiteData = {
        presentation,
        history,
        services,
        media,
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
    { id: "history", title: "Sobre", component: <ProHistory data={history} onChange={setHistory} /> },
    { id: "services", title: "Serviços", component: <ProServices data={services} onChange={setServices} /> },
    { id: "media", title: "Galeria e Mídia", component: <ProMedia data={media} onChange={setMedia} /> },
    { id: "contact", title: "Contato", component: <ProContact data={contact} onChange={setContact} /> },
    { id: "theme", title: "Aparência", component: <ProTheme data={theme} onChange={setTheme} /> },
  ];

  const isStepDone = (stepId: string) => {
    switch (stepId) {
      case "presentation": return !!(presentation.headline || presentation.bio);
      case "history": return !!(history.historyTitle || history.historyText);
      case "services": return services.servicesList && services.servicesList.length > 0;
      case "media": return !!((media as any).videoUrl || ((media as any).images && (media as any).images.length > 0));
      case "contact": return !!(contact.phone || contact.address);
      case "theme": return true;
      default: return false;
    }
  };

  // Mobile Preview específico do Site Profissional
  const ProSiteMockup = ({ isFullScreen = false }: { isFullScreen?: boolean }) => {
    const isAvatarLayout = presentation.heroLayout === "avatar-cover";
    const isBlogLayout = presentation.heroLayout === "classic-blog";

    const isDarkMock = theme.css?.includes("900") || theme.css?.includes("black") || theme.css?.includes("slate-950");
    const displayImage = isBlogLayout ? ((presentation as any).proHeroImage || presentation.heroImage) : presentation.heroImage;

    const { data: dbCategories = [] } = useSWR("/api/categories?active=true", fetcher);
    const { data: dbServices = [] } = useSWR("/api/services", fetcher);
    const { data: dbPackages = [] } = useSWR("/api/package-templates", fetcher);

    const content = (
      <div className={cn("w-full h-full flex flex-col pb-8 relative z-10 transition-colors duration-500 overflow-y-auto no-scrollbar light", theme.css, isFullScreen ? "pt-12" : "")} style={{ color: theme.textColor }}>

        {/* HERO / HEADER SECTION */}
        <div className="relative w-full">
          {displayImage ? (
            <div className={cn(
              "w-full relative shrink-0",
              isAvatarLayout ? "h-40" :
                isBlogLayout ? "h-32" : "h-56"
            )}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayImage}
                alt="Hero"
                className={cn("w-full h-full object-cover", isBlogLayout ? "rounded-xl" : "")}
                style={!isAvatarLayout && !isBlogLayout ? {
                  WebkitMaskImage: "linear-gradient(to top, transparent 0%, black 75%)",
                  maskImage: "linear-gradient(to top, transparent 0%, black 75%)"
                } : {}}
              />
              {/* Floating Box na imagem */}
              {isBlogLayout && (presentation.floatingBoxTitle || presentation.floatingBoxSubtitle) && (
                <div className={cn(
                  "absolute bottom-2 left-2 right-2 bg-white/90 dark:bg-black/80 backdrop-blur-md rounded-lg p-2.5 shadow-sm border border-black/5 dark:border-white/10 transition-transform",
                  presentation.floatingBoxLink && "cursor-pointer hover:scale-105"
                )}>
                  {presentation.floatingBoxTitle && <div className="text-[11px] font-bold text-black dark:text-white leading-tight">{presentation.floatingBoxTitle}</div>}
                  {presentation.floatingBoxSubtitle && <div className="text-[9px] font-medium text-black/60 dark:text-white/60 leading-tight mt-0.5">{presentation.floatingBoxSubtitle}</div>}
                </div>
              )}
            </div>
          ) : (
            <div className={cn("w-full bg-muted/20 border-b border-border/10 shrink-0", (isAvatarLayout || isBlogLayout) ? "h-32" : "h-32")} />
          )}

          <div className={cn(
            "px-6 relative z-10 flex flex-col pb-6",
            isAvatarLayout
              ? (displayImage ? "-mt-12" : "-mt-10")
              : isBlogLayout
                ? "mt-4" // Push down instead of overlap
                : (displayImage ? "-mt-14" : "-mt-12"),
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

            {/* Badge Personalizável (Categoria / Destaque) */}
            {presentation.badgeText && (
              <div className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 border w-fit",
                isDarkMock ? "bg-white/10 border-white/20 text-white/80" : "bg-black/5 border-black/10 text-black/80"
              )}>
                {presentation.badgeText}
              </div>
            )}

            <h1 className="font-bold text-2xl leading-tight drop-shadow-sm mt-1">
              {presentation.headline || "Seu Título Principal Aqui"}
            </h1>
            <p className="text-sm opacity-80 mt-2 font-medium drop-shadow-sm">
              {presentation.subheadline || "Subtítulo de apoio ou missão do seu negócio."}
            </p>

            <div className="flex flex-col gap-2 mt-5 w-full">
              {presentation.ctaPrimaryText && (
                <div
                  className="px-4 py-2.5 rounded-full text-xs font-bold text-white text-center w-full"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  {presentation.ctaPrimaryText}
                </div>
              )}
              {presentation.ctaSecondaryText && (
                <div className={cn(
                  "px-4 py-2.5 rounded-full text-xs font-bold border text-center w-full",
                  isDarkMock ? "border-white/20 text-white" : "border-black/15"
                )}>
                  {presentation.ctaSecondaryText}
                </div>
              )}
            </div>

            {/* Highlights */}
            {(presentation.highlight1 || presentation.highlight2 || presentation.highlight3) && (
              <div className="flex flex-col gap-1.5 mt-4">
                {[presentation.highlight1, presentation.highlight2, presentation.highlight3]
                  .filter(Boolean)
                  .map((highlight, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[10px] opacity-70">
                      <div className="w-3 h-3 rounded-full flex items-center justify-center border border-current">
                        <Check className="w-2 h-2" />
                      </div>
                      {highlight}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* BIO SECTION */}
        {presentation.bio && (
          <div className="px-6 py-6 bg-foreground/5">
            <h2 className="font-bold text-lg mb-2">{presentation.aboutTitle || "Sobre nós"}</h2>
            <p className="text-sm opacity-80 whitespace-pre-wrap leading-relaxed">{presentation.bio}</p>
          </div>
        )}

        {/* HISTORY SECTION */}
        {history.showHistory !== false && (history.historyTitle || history.historyText) && (
          <div className="px-6 py-10 bg-foreground/5">
            {history.historyImage && (
              <div className="w-full h-48 rounded-xl overflow-hidden mb-6 shadow-sm">
                <img src={history.historyImage} alt="Nossa História" className="w-full h-full object-cover" />
              </div>
            )}

            {history.historyOverline !== "" && (
              <span className="block text-[10px] uppercase tracking-widest font-bold mb-3" style={{ color: theme.primaryColor }}>
                {history.historyOverline ?? "NOSSA HISTÓRIA"}
              </span>
            )}
            {history.historyTitle && <h2 className="font-serif font-medium text-2xl mb-4 leading-tight">{history.historyTitle}</h2>}
            {history.historyText && <p className="text-sm opacity-80 whitespace-pre-wrap leading-relaxed">{history.historyText}</p>}

            <div className="grid grid-cols-2 gap-4 mt-8">
              {history.historyStat1Value && (
                <div className="flex flex-col gap-0.5 text-left">
                  <span className="font-serif font-medium text-2xl" style={{ color: theme.primaryColor }}>{history.historyStat1Value}</span>
                  <span className="text-[10px] font-medium opacity-70">{history.historyStat1Label}</span>
                </div>
              )}
              {history.historyStat2Value && (
                <div className="flex flex-col gap-0.5 text-left">
                  <span className="font-serif font-medium text-2xl" style={{ color: theme.primaryColor }}>{history.historyStat2Value}</span>
                  <span className="text-[10px] font-medium opacity-70">{history.historyStat2Label}</span>
                </div>
              )}
              {history.historyStat3Value && (
                <div className="flex flex-col gap-0.5 text-left col-span-2">
                  <span className="font-serif font-medium text-2xl" style={{ color: theme.primaryColor }}>{history.historyStat3Value}</span>
                  <span className="text-[10px] font-medium opacity-70">{history.historyStat3Label}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SERVICES SECTION */}
        {services.showServices !== false && (
          <div className="px-6 py-10 bg-foreground/5">
            <div className="flex flex-col items-center text-center mb-8">
              <span className="block text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: theme.primaryColor }}>
                {services.servicesOverline || "NOSSOS SERVIÇOS"}
              </span>
              <h2 className="font-serif font-medium text-2xl mb-3 leading-tight">
                {services.servicesTitle || "Terapias para cada momento"}
              </h2>
              <p className="text-xs opacity-80 max-w-2xl">
                {services.servicesSubtitle || "Escolha a experiência que melhor se adapta ao que você precisa hoje."}
              </p>
            </div>

            {/* Categorias */}
            {dbCategories.length > 0 && dbServices.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 mb-6 pb-4 border-b border-border/20">
                <span className="text-[10px] font-semibold opacity-50 mr-1 flex items-center">Filtre por:</span>
                {dbCategories.filter((cat: any) => dbServices.some((srv: any) => srv.category_id === cat.id)).map((cat: any) => (
                  <div key={cat.id} className="px-3 py-1 rounded-full text-[10px] font-medium border shadow-sm bg-background" style={{ borderColor: theme.primaryColor + '30' }}>
                    {cat.name}
                  </div>
                ))}
              </div>
            )}

            {/* Serviços */}
            <div>
              {services.servicesDisplay === "pills" ? (
                <div className="flex flex-wrap justify-center gap-2">
                  {dbServices.map((srv: any) => (
                    <div key={srv.id} className="px-3 py-2 rounded-full flex items-center gap-2 border shadow-sm bg-background">
                      <span className="font-bold text-[10px]">{srv.name}</span>
                      <span className="text-[9px] opacity-50 px-2 border-l border-border">{srv.duration}m</span>
                      <span className="font-bold whitespace-nowrap text-[10px]" style={{ color: theme.primaryColor }}>R$ {Number(srv.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full">
                  <Carousel opts={{ align: "start", loop: false }} className="w-full">
                    <CarouselContent className="-ml-3">
                      {dbServices.map((srv: any) => (
                        <CarouselItem key={srv.id} className="pl-3 basis-[85%]">
                          <div className="h-full rounded-2xl flex flex-col overflow-hidden relative shadow-sm border bg-white group/card">
                            <div className="w-full aspect-[4/3] shrink-0 relative bg-muted border-b overflow-hidden">
                              {srv.image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={srv.image_url} alt={srv.name} className="absolute inset-0 w-full h-full object-cover" />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Briefcase className="w-8 h-8 text-muted-foreground/20" />
                                </div>
                              )}
                            </div>
                            <div className="p-4 flex flex-col flex-1">
                              <div className="flex-1">
                                <h4 className="font-bold text-[13px] mb-2 text-slate-900">{srv.name}</h4>
                                <p className="text-[11px] text-slate-600 mb-3 line-clamp-2">{srv.description}</p>
                              </div>
                              <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-slate-100">
                                <div className="flex items-center gap-1.5 font-bold text-[11px] text-slate-800">
                                  <span style={{ color: theme.primaryColor }}>R$ {Number(srv.price).toFixed(2)}</span>
                                  <span className="text-slate-400 font-normal">/</span>
                                  <span className="text-slate-500 font-normal">{srv.duration} min</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PACKAGES SECTION MOCK */}
        {dbPackages.length > 0 && services.showPackages !== false && (
          <div className="px-6 py-10 bg-background">
            <div className="flex flex-col items-center text-center mb-8">
              <h2 className="font-serif font-medium text-2xl mb-3 flex items-center gap-2">
                <Star className="h-5 w-5" style={{ color: theme.primaryColor }} /> Pacotes
              </h2>
              <p className="text-xs opacity-80 max-w-2xl">
                {services.packagesSubtitle || "Planos flexíveis para quem quer incluir o autocuidado na rotina."}
              </p>
            </div>

            <div>
              {services.packagesDisplay === "pills" ? (
                <div className="flex flex-wrap justify-center gap-2">
                  {dbPackages.map((pkg: any) => (
                    <div key={pkg.id} className="px-3 py-2 rounded-full flex items-center gap-2 border shadow-sm bg-background">
                      <span className="font-bold text-[10px] whitespace-nowrap">{pkg.name}</span>
                      <span className="text-[9px] opacity-50 px-2 border-l border-border whitespace-nowrap">{pkg.total_sessions} sessões</span>
                      <span className="font-bold whitespace-nowrap text-[10px]" style={{ color: theme.primaryColor }}>R$ {Number(pkg.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full">
                  <Carousel opts={{ align: "start", loop: false }} className="w-full">
                    <CarouselContent className="-ml-3">
                      {dbPackages.map((pkg: any) => {
                        const isFeatured = services.featuredPackageName && pkg.name.toLowerCase().trim() === services.featuredPackageName.toLowerCase().trim();
                        return (
                          <CarouselItem key={pkg.id} className="pl-3 basis-[85%]">
                            <div className={cn("h-full rounded-2xl flex flex-col relative shadow-sm border bg-white group/card p-4", isFeatured ? "border-2 scale-[1.03]" : "")} style={isFeatured ? { borderColor: theme.primaryColor, boxShadow: `0 0 0 2px ${theme.primaryColor}40`, backgroundColor: theme.primaryColor + "08" } : {}}>

                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="font-serif font-bold text-[13px] text-slate-900">{pkg.name}</h4>
                                {isFeatured && (
                                  <div className="shrink-0">
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 flex items-center gap-1">
                                      <Star className="h-2 w-2" type="solid" /> Mais Popular
                                    </span>
                                  </div>
                                )}
                              </div>

                              <p className="text-[11px] text-slate-500 mb-4 flex-1">
                                {pkg.description || `${pkg.total_sessions} sessões inclusas. Ideal para quem quer manter a rotina de autocuidado com desconto.`}
                              </p>

                              <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                                <span className="font-bold text-[14px] text-slate-900">
                                  R$ {Number(pkg.price).toFixed(2)}
                                </span>
                                <span
                                  className="text-[11px] font-bold flex items-center gap-1"
                                  style={{ color: theme.primaryColor }}
                                >
                                  Reservar
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </span>
                              </div>
                            </div>
                          </CarouselItem>
                        );
                      })}
                    </CarouselContent>
                  </Carousel>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONTACT INFO */}
        {(contact.address || contact.phone || contact.whatsapp || (contact.businessHours && contact.showBusinessHours !== false)) && (
          <div className="px-6 py-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <PhoneIcon className="h-4 w-4" /> Contato
            </h2>
            {(contact.businessHours && contact.showBusinessHours !== false) && (
              <p className="text-xs opacity-60 mb-2 flex items-start gap-2">
                <Clock className="w-4 h-4 mt-0.5 shrink-0" style={{ color: theme.primaryColor }} /> 
                <span>{contact.businessHours}</span>
              </p>
            )}
            {(contact.whatsapp || contact.phone) && (
              <p className="text-sm opacity-80 mb-2 flex items-start gap-2">
                <PhoneIcon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: theme.primaryColor }} /> 
                <span>{contact.whatsapp || contact.phone}</span>
              </p>
            )}
            {contact.address && (
              <p className="text-sm opacity-80 flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: theme.primaryColor }} /> 
                <span>{contact.address}</span>
              </p>
            )}
          </div>
        )}

        {/* FALE CONOSCO / RESERVE SUA SESSÃO (MINI FORM) */}
        <div className="px-6 py-4 mb-6">
          <div className={cn("rounded-2xl p-5 border shadow-sm", theme.theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-black/10")}>
            <h3 className="font-bold text-base mb-1">Reserve sua sessão</h3>
            <p className="text-[10px] opacity-60 mb-4 leading-relaxed">
              Preencha o formulário e entraremos em contato pelo WhatsApp.
            </p>
            <div className="flex flex-col gap-2">
              <input disabled type="text" placeholder="Seu nome completo" className="w-full h-8 rounded-lg border px-3 text-[10px] opacity-50" />
              <input disabled type="tel" placeholder="(11) 99999-9999" className="w-full h-8 rounded-lg border px-3 text-[10px] opacity-50" />
              <textarea disabled placeholder="Dúvidas..." className="w-full h-16 rounded-lg border p-3 text-[10px] resize-none opacity-50" />
              <button disabled className="mt-1 w-full h-9 rounded-lg text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm opacity-80" style={{ backgroundColor: theme.primaryColor }}>
                Enviar pelo WhatsApp
              </button>
            </div>
          </div>
        </div>

        {/* FOOTER SECTION */}
        <footer className="w-full bg-black text-white pt-8 pb-6 px-6 mt-auto">
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="font-bold text-lg mb-2">{presentation.headline || profile?.name || "Minha Clínica"}</h3>
              <p className="text-xs opacity-60 leading-relaxed">
                {presentation.subheadline || "Transformando vidas e oferecendo o melhor atendimento para você se sentir especial todos os dias."}
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-sm mb-3">Links Rápidos</h4>
              <div className="flex flex-col gap-2 text-xs opacity-70">
                <span>Sobre</span>
                <span>Serviços</span>
                {dbPackages.length > 0 && <span>Pacotes</span>}
                <span>Nossa Equipe</span>
                <span>Termos de Uso</span>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 flex flex-col gap-2 text-[10px] opacity-40">
              <p>© {new Date().getFullYear()} {presentation.headline || profile?.name || "Minha Clínica"}. Todos os direitos reservados.</p>
              <p>Desenvolvido com Totten</p>
            </div>
          </div>
        </footer>

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

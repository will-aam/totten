"use client";

import React, { useState, useEffect } from "react";
import { cn, sanitizeUrl } from "@/lib/utils";
import {
  Star, Briefcase, Youtube, Pin, Globe, Menu, X, Envelope, User, Phone,
  CheckCircle, Whatsapp, Instagram, Facebook, Twitter, Tiktok, Clock,
  ArrowRight, Package
} from "@boxicons/react";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselDots,
} from "@/components/ui/carousel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
};

const SOCIAL_ICONS: Record<string, any> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  tiktok: Tiktok,
  whatsapp: Whatsapp,
};

export function SiteClientView({ org, proSiteData, theme, presentation, contact, socialProof, servicesConfig, socialLinks = [], profileConfig = {}, globalBio }: any) {
  const history = proSiteData?.history || {};
  const sliderImages: string[] = presentation.proHeroImages?.length > 0
    ? presentation.proHeroImages
    : (presentation.proHeroImage ? [presentation.proHeroImage] : (presentation.heroImage ? [presentation.heroImage] : []));
  const displayImage = sliderImages.length > 0 ? sliderImages[0] : undefined;
  const isSlider = sliderImages.length > 1;

  const hasSecondaryCta = presentation.ctaSecondaryText !== false;
  const ctaSecondaryType = hasSecondaryCta ? (presentation.ctaSecondaryType || "services") : null;

  const secondaryCtaInfo = {
    services: { label: "Conhecer Serviços", href: "#servicos" },
    packages: { label: "Planos e Pacotes", href: "#pacotes" },
    team: { label: "Nossa Equipe", href: "#profissionais" },
    contact: { label: "Fale Conosco", href: "#contato" },
  }[(ctaSecondaryType as "services" | "packages" | "team" | "contact") || "services"] || { label: "Conhecer Serviços", href: "#servicos" };

  const finalGlobalBio = globalBio || org.link_bio?.bio || "";
  const hasBio = !!presentation.bio;
  const hasHistory = history.showHistory !== false && !!(history.historyTitle || (history.useGlobalBio !== false ? finalGlobalBio : history.historyText));
  const sobreHref = hasHistory ? "#historia" : "#";

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCarouselApi, setMobileCarouselApi] = useState<any>(null);
  const [mobileCurrentSlide, setMobileCurrentSlide] = useState(0);
  const [desktopCarouselApi, setDesktopCarouselApi] = useState<any>(null);
  const [desktopCurrentSlide, setDesktopCurrentSlide] = useState(0);
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null);

  const handleSelectProfessional = (prof: any) => {
    if (selectedProfessional?.id === prof.id) {
      setSelectedProfessional(null);
    } else {
      setSelectedProfessional(prof);
      setTimeout(() => {
        const servicosElement = document.getElementById("servicos");
        const pacotesElement = document.getElementById("pacotes");
        if (servicosElement) servicosElement.scrollIntoView({ behavior: "smooth", block: "start" });
        else if (pacotesElement) pacotesElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  useEffect(() => {
    if (!mobileCarouselApi) return;
    const onSelect = () => setMobileCurrentSlide(mobileCarouselApi.selectedScrollSnap());
    mobileCarouselApi.on("select", onSelect);
    const interval = setInterval(() => {
      if (mobileCarouselApi.canScrollNext()) mobileCarouselApi.scrollNext();
      else mobileCarouselApi.scrollTo(0);
    }, 5000);
    return () => { clearInterval(interval); mobileCarouselApi.off("select", onSelect); };
  }, [mobileCarouselApi]);

  useEffect(() => {
    if (!desktopCarouselApi) return;
    const onSelect = () => setDesktopCurrentSlide(desktopCarouselApi.selectedScrollSnap());
    desktopCarouselApi.on("select", onSelect);
    const interval = setInterval(() => {
      if (desktopCarouselApi.canScrollNext()) desktopCarouselApi.scrollNext();
      else desktopCarouselApi.scrollTo(0);
    }, 5000);
    return () => { clearInterval(interval); desktopCarouselApi.off("select", onSelect); };
  }, [desktopCarouselApi]);

  const [termsOpen, setTermsOpen] = useState(false);
  const [formSent, setFormSent] = useState(false);
  const [formData, setFormData] = useState({ name: "", whatsapp: "", email: "", service: "", message: "" });
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSent, setNewsletterSent] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // WhatsApp do contato (preferência: global settings, fallback: campo whatsapp, fallback: phone)
  const whatsappRaw = org.settings?.phone_whatsapp || contact.whatsapp || contact.phone || "";
  const whatsappNumber = whatsappRaw.replace(/\D/g, "");
  const whatsappUrl = whatsappNumber ? `https://wa.me/55${whatsappNumber}` : "#";

  // Link para agendar
  const bookingUrl = `/${org.slug}`;

  // Dados do banco
  const professionals = org.admins || [];
  
  const getFilteredServices = () => {
    const allServices = org.services || [];
    if (!selectedProfessional) return allServices;
    if (selectedProfessional.role === "OWNER" && (!selectedProfessional.services || selectedProfessional.services.length === 0)) return allServices;
    return allServices.filter((srv: any) => selectedProfessional.services?.some((ps: any) => ps.id === srv.id));
  };

  const getFilteredPackages = () => {
    const allPackages = org.package_templates || [];
    if (!selectedProfessional) return allPackages;
    if (selectedProfessional.role === "OWNER" && (!selectedProfessional.package_templates || selectedProfessional.package_templates.length === 0)) return allPackages;
    return allPackages.filter((pkg: any) => selectedProfessional.package_templates?.some((pp: any) => pp.id === pkg.id));
  };

  const dbServices = getFilteredServices();
  const dbPackages = getFilteredPackages();
  const dbCategories = org.categories || [];

  // Tema
  const isDark = theme.css?.includes("900") || theme.css?.includes("black") || theme.css?.includes("slate-950");
  const altBg = isDark ? "bg-white/5" : "bg-black/5";
  const borderColor = isDark ? "border-white/10" : "border-black/10";
  const cardBg = isDark ? "bg-white/5" : "bg-white";
  const inputBg = isDark ? "bg-white/10 text-white placeholder:text-white/50 border-white/10" : "bg-white text-black placeholder:text-black/40 border-black/10";

  // Submissão do formulário → WhatsApp
  const handleContactSubmit = (e: any) => {
    e.preventDefault();
    if (!whatsappNumber) {
      setFormSent(true);
      setTimeout(() => setFormSent(false), 3000);
      return;
    }
    const msg = [
      `Olá! Me chamo *${formData.name}*.`,
      formData.service ? `Tenho interesse em: *${formData.service}*` : "",
      formData.message ? `Mensagem: ${formData.message}` : "",
      formData.whatsapp ? `Meu WhatsApp: ${formData.whatsapp}` : "",
      formData.email ? `E-mail: ${formData.email}` : "",
    ].filter(Boolean).join("\n");
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/55${whatsappNumber}?text=${encoded}`, "_blank");
    setFormSent(true);
    setTimeout(() => setFormSent(false), 4000);
  };

  const handleNewsletter = (e: any) => {
    e.preventDefault();
    setNewsletterSent(true);
  };

  const featuredPackageName = servicesConfig?.featuredPackageName?.toLowerCase().trim();

  // Ordem com preferencial em destaque no início
  const sortedPackages = [...dbPackages].sort((a, b) => {
    const aFeatured = featuredPackageName && a.name.toLowerCase().trim() === featuredPackageName;
    const bFeatured = featuredPackageName && b.name.toLowerCase().trim() === featuredPackageName;
    if (aFeatured && !bFeatured) return -1;
    if (!aFeatured && bFeatured) return 1;
    return 0;
  });

  const sortedServices = [...dbServices].sort((a, b) => {
    const aFeatured = featuredPackageName && a.name.toLowerCase().trim() === featuredPackageName;
    const bFeatured = featuredPackageName && b.name.toLowerCase().trim() === featuredPackageName;
    if (aFeatured && !bFeatured) return -1;
    if (!aFeatured && bFeatured) return 1;
    return 0;
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Noto+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Oxanium:wght@400;500;600;700&family=Philosopher:ital,wght@0,400;0,700;1,400&family=Roboto:ital,wght@0,400;0,500;0,700;1,400&family=Sora:wght@400;500;600;700&display=swap');
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .animate-fade-up { animation: fadeInUp 0.5s ease forwards; }
      `}</style>

      <div
        className={cn("min-h-screen w-full flex flex-col relative z-10 transition-colors duration-500 font-sans light", theme.css)}
        style={{ color: theme.textColor, fontFamily: theme.fontFamily || "Inter, sans-serif" }}
      >
        {/* ─────────────── NAVBAR ─────────────── */}
        <header className={cn(
          "fixed top-0 inset-x-0 h-16 md:h-20 z-50 backdrop-blur-md border-b flex items-center px-6 md:px-10 justify-between transition-all",
          isDark ? "bg-black/60 border-white/10" : "bg-white/80 border-black/10"
        )}>
          <div className="font-bold text-lg md:text-xl tracking-tight">{org.name}</div>

          <nav className="hidden md:flex items-center gap-7 font-medium text-sm">
            <a href={sobreHref} className="hover:opacity-70 transition-opacity">Sobre</a>
            {ctaSecondaryType !== "services" && <a href="#servicos" className="hover:opacity-70 transition-opacity">Serviços</a>}
            {dbPackages.length > 0 && ctaSecondaryType !== "packages" && <a href="#pacotes" className="hover:opacity-70 transition-opacity">Pacotes</a>}
            {professionals.length > 0 && ctaSecondaryType !== "team" && <a href="#profissionais" className="hover:opacity-70 transition-opacity">Equipe</a>}
            {ctaSecondaryType !== "contact" && <a href="#contato" className="hover:opacity-70 transition-opacity">Contato</a>}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {whatsappNumber && presentation?.showWhatsappHeaderButton !== false && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-5 py-2 rounded-full text-sm font-bold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                title="WhatsApp"
              >
                <Whatsapp className="h-5 w-5" /> Agendar via WhatsApp
              </a>
            )}

          </div>

          {/* Mobile Toggle */}
          <button className="md:hidden p-2 -mr-2" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="h-7 w-7" />
          </button>
        </header>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={cn(
            "fixed inset-0 z-[100] flex flex-col items-center justify-center gap-7 text-xl font-medium",
            isDark ? "bg-slate-900 text-white" : "bg-white text-black"
          )}>
            <button className="absolute top-5 right-5 p-2" onClick={() => setMobileMenuOpen(false)}>
              <X className="h-8 w-8" />
            </button>
            <a href={sobreHref} onClick={() => setMobileMenuOpen(false)}>Sobre</a>
            {ctaSecondaryType !== "services" && <a href="#servicos" onClick={() => setMobileMenuOpen(false)}>Serviços</a>}
            {dbPackages.length > 0 && ctaSecondaryType !== "packages" && <a href="#pacotes" onClick={() => setMobileMenuOpen(false)}>Pacotes</a>}
            {professionals.length > 0 && ctaSecondaryType !== "team" && <a href="#profissionais" onClick={() => setMobileMenuOpen(false)}>Equipe</a>}
            {ctaSecondaryType !== "contact" && <a href="#contato" onClick={() => setMobileMenuOpen(false)}>Contato</a>}
            {whatsappNumber && presentation?.showWhatsappHeaderButton !== false && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-full text-base font-bold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors mt-4"
                title="WhatsApp"
              >
                <Whatsapp className="h-6 w-6" /> Agendar via WhatsApp
              </a>
            )}

          </div>
        )}

        {/* ─────────────── MAIN ─────────────── */}
        <main className="w-full min-h-screen relative pt-16 md:pt-20">

          {/* ── HERO ── */}
          <div className="px-6 sm:px-10 relative z-10 flex flex-col lg:flex-row gap-10 lg:gap-16 max-w-7xl mx-auto w-full pb-14 mt-8 md:mt-16 items-center">

            {/* Mobile Image (rendered on top for mobile, hidden on lg) */}
            {(displayImage || isSlider) && (
              <div className="w-[calc(100%+3rem)] sm:w-[calc(100%+5rem)] -mx-6 sm:-mx-10 -mt-8 relative lg:hidden mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
                <div className="w-full h-[350px] sm:h-[400px] relative rounded-none rounded-b-[2.5rem] overflow-hidden shadow-xl">
                  {isSlider ? (
                    <Carousel setApi={setMobileCarouselApi} className="w-full h-full" opts={{ loop: true }}>
                      <CarouselContent className="h-full ml-0">
                        {sliderImages.map((img, idx) => (
                          <CarouselItem key={idx} className="h-full pl-0">
                            <img src={img} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                    </Carousel>
                  ) : (
                    <img src={displayImage} alt="Hero" className="w-full h-full object-cover" />
                  )}

                  {/* Dots Navigation for Slider */}
                  {isSlider && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-20">
                      {sliderImages.map((_, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "h-1.5 rounded-full transition-all duration-300",
                            mobileCurrentSlide === idx ? "w-4 bg-white" : "w-1.5 bg-white/50"
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className={cn(
              "flex flex-col w-full lg:w-1/2",
              theme.headerStyle === "center" ? "text-center items-center lg:text-left lg:items-start" : "text-left items-start"
            )}>
              {/* Badge Personalizável */}
              {presentation.badgeText && (
                <div className={cn(
                  "inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border w-fit animate-fade-up",
                  isDark ? "bg-white/10 border-white/20 text-white/80" : "bg-black/5 border-black/10 text-black/80"
                )}>
                  {presentation.badgeText}
                </div>
              )}

              <h1 className="font-bold text-4xl sm:text-5xl md:text-6xl lg:text-[4rem] leading-[1.1] drop-shadow-sm mt-1 animate-fade-up" style={{ animationDelay: '0.1s' }}>
                {presentation.headline || org.name}
              </h1>
              <p className="text-base sm:text-lg opacity-80 mt-6 font-medium drop-shadow-sm max-w-xl leading-relaxed animate-fade-up" style={{ animationDelay: '0.2s' }}>
                {presentation.subheadline || "Subtítulo de apoio ou missão do seu negócio."}
              </p>

              {/* CTAs */}
              <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-10 animate-fade-up", theme.headerStyle === "center" ? "mx-auto max-w-lg lg:mx-0 lg:max-w-md" : "max-w-md")} style={{ animationDelay: '0.3s' }}>
                {presentation.ctaPrimaryText !== false && (
                  <a href={bookingUrl} className="w-full px-8 py-4 rounded-full text-base font-bold shadow-lg text-white hover:scale-105 transition-transform flex items-center justify-center text-center gap-2" style={{ backgroundColor: theme.primaryColor }}>
                    Agendar Sessão
                  </a>
                )}
                {dbServices.length > 0 && servicesConfig.showServices !== false && presentation.ctaSecondaryText !== false && (
                  <a href="#servicos" className={cn("w-full px-8 py-4 rounded-full text-base font-bold border hover:scale-105 transition-transform flex items-center justify-center text-center gap-2", isDark ? "border-white/20 text-white hover:bg-white/10" : "border-black/15 text-current hover:bg-black/5")}>
                    Conhecer Serviços
                  </a>
                )}
              </div>

              {/* Highlights */}
              {(presentation.highlight1 || presentation.highlight2 || presentation.highlight3) && (
                <div className="flex flex-wrap gap-x-6 gap-y-3 mt-10 animate-fade-up" style={{ animationDelay: '0.4s' }}>
                  {[presentation.highlight1, presentation.highlight2, presentation.highlight3].filter(Boolean).map((highlight, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm opacity-80 font-medium">
                      <div className="w-5 h-5 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      {highlight}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Image (rendered on right for lg, hidden on mobile) */}
            {(displayImage || isSlider) && (
              <div className="hidden lg:block w-full lg:w-1/2 relative animate-fade-up" style={{ animationDelay: '0.3s' }}>
                <div className="w-full aspect-[4/3] relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-black/5 dark:border-white/10 group">
                  {isSlider ? (
                    <Carousel setApi={setDesktopCarouselApi} className="w-full h-full" opts={{ loop: true }}>
                      <CarouselContent className="h-full ml-0">
                        {sliderImages.map((img, idx) => (
                          <CarouselItem key={idx} className="h-full pl-0">
                            <img src={img} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-700" />
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                    </Carousel>
                  ) : (
                    <img src={displayImage} alt="Hero" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  )}

                  {/* Dots Navigation for Slider */}
                  {isSlider && (
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 z-20">
                      {sliderImages.map((_, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "h-1.5 rounded-full transition-all duration-300",
                            desktopCurrentSlide === idx ? "w-4 bg-white" : "w-1.5 bg-white/50"
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── SOBRE ── */}
          {presentation.bio && (
            <div id="sobre" className={cn("px-6 sm:px-10 py-14 md:py-20 scroll-mt-20", altBg)}>
              <div className="max-w-5xl mx-auto w-full">
                <h2 className="font-bold text-2xl md:text-3xl mb-6">
                  {presentation.aboutTitle || "Sobre nós"}
                </h2>
                <p className="text-base md:text-lg opacity-80 whitespace-pre-wrap leading-relaxed max-w-3xl">
                  {presentation.bio}
                </p>
              </div>
            </div>
          )}

          {/* ── NOSSA HISTÓRIA ── */}
          {history.showHistory !== false && (history.historyTitle || (history.useGlobalBio !== false ? globalBio : history.historyText)) && (
            <div id="historia" className={cn("px-6 sm:px-10 py-14 md:py-20 scroll-mt-20", altBg)}>
              <div className="max-w-6xl mx-auto w-full">
                <div className="flex flex-col md:flex-row gap-12 items-center md:items-start">
                  {history.historyImage && (
                    <div className="w-full md:w-[400px] shrink-0">
                      <div className="w-full aspect-[4/5] rounded-[2rem] overflow-hidden shadow-xl border border-black/5 dark:border-white/10">
                        <img src={history.historyImage} alt="Nossa História" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                      </div>
                    </div>
                  )}

                  <div className="flex-1 w-full">
                    {history.historyOverline !== "" && (
                      <span className="block text-xs uppercase tracking-widest font-bold mb-4" style={{ color: theme.primaryColor }}>
                        {history.historyOverline ?? "NOSSA HISTÓRIA"}
                      </span>
                    )}
                    {history.historyTitle && (
                      <h2 className="font-serif font-medium text-3xl md:text-5xl mb-6 leading-tight">
                        {history.historyTitle}
                      </h2>
                    )}
                    {(history.useGlobalBio !== false ? globalBio : history.historyText) && (
                      <p className="text-base md:text-lg opacity-80 whitespace-pre-wrap leading-relaxed">
                        {history.useGlobalBio !== false ? globalBio : history.historyText}
                      </p>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 mt-12">
                      {history.historyStat1Value && (
                        <div className="flex flex-col gap-1 text-left">
                          <span className="font-serif font-medium text-3xl md:text-4xl" style={{ color: theme.primaryColor }}>{history.historyStat1Value}</span>
                          <span className="text-sm font-medium opacity-70">{history.historyStat1Label}</span>
                        </div>
                      )}
                      {history.historyStat2Value && (
                        <div className="flex flex-col gap-1 text-left">
                          <span className="font-serif font-medium text-3xl md:text-4xl" style={{ color: theme.primaryColor }}>{history.historyStat2Value}</span>
                          <span className="text-sm font-medium opacity-70">{history.historyStat2Label}</span>
                        </div>
                      )}
                      {history.historyStat3Value && (
                        <div className="flex flex-col gap-1 text-left col-span-2 sm:col-span-1">
                          <span className="font-serif font-medium text-3xl md:text-4xl" style={{ color: theme.primaryColor }}>{history.historyStat3Value}</span>
                          <span className="text-sm font-medium opacity-70">{history.historyStat3Label}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── SERVIÇOS (banco de dados) ── */}
          {(dbServices.length > 0 || dbPackages.length > 0) && (
            <div id="servicos" className="px-6 sm:px-10 py-14 md:py-24 scroll-mt-20">
              <div className="max-w-6xl mx-auto w-full">
                <div className="flex flex-col items-center text-center mb-12">
                  <span className="block text-xs uppercase tracking-widest font-bold mb-4" style={{ color: theme.primaryColor }}>
                    {servicesConfig.servicesOverline || "NOSSOS SERVIÇOS"}
                  </span>
                  <h2 className="font-serif font-medium text-3xl md:text-5xl mb-6 leading-tight">
                    {servicesConfig.servicesTitle || "Terapias para cada momento"}
                  </h2>
                  <p className="text-base md:text-lg opacity-80 max-w-2xl">
                    {servicesConfig.servicesSubtitle || "Escolha a experiência que melhor se adapta ao que você precisa hoje."}
                  </p>
                </div>

                {/* Categorias */}
                {dbCategories.length > 0 && dbServices.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mb-10 pb-6 border-b border-border/20">
                    <span className="text-sm font-semibold opacity-50 mr-2 flex items-center">Filtre por:</span>
                    {dbCategories.filter((cat: any) => dbServices.some((srv: any) => srv.category_id === cat.id)).map((cat: any) => (
                      <div key={cat.id} className={cn("px-4 py-1.5 rounded-full text-sm font-medium border shadow-sm cursor-pointer hover:-translate-y-0.5 transition-transform", altBg, borderColor)}>
                        {cat.name}
                      </div>
                    ))}
                  </div>
                )}

                {/* Serviços */}
                {dbServices.length > 0 && servicesConfig.showServices !== false && (
                  <div className="mb-14">
                    {servicesConfig.servicesDisplay === "pills" ? (
                      <div className="flex flex-wrap justify-center gap-3">
                        {sortedServices.map((srv: any) => (
                          <div key={srv.id} className={cn("px-5 py-3 rounded-full flex items-center gap-3 border shadow-sm transition-transform hover:-translate-y-1", cardBg, borderColor)}>
                            <span className="font-bold text-sm">{srv.name}</span>
                            <span className="text-xs opacity-50 px-3 border-l" style={{ borderColor: theme.primaryColor }}>{srv.duration}m</span>
                            <span className="font-bold whitespace-nowrap" style={{ color: theme.primaryColor }}>R$ {Number(srv.price).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="relative w-full group/carousel">
                        <Carousel
                          opts={{
                            align: "start",
                            loop: false,
                          }}
                          className="w-full"
                        >
                          <CarouselContent className="-ml-4 md:-ml-6 py-4 -my-4">
                            {sortedServices.map((srv: any) => {
                              const isFeatured = featuredPackageName && srv.name.toLowerCase().trim() === featuredPackageName;
                              return (
                                <CarouselItem key={srv.id} className="pl-4 md:pl-6 md:basis-1/2 lg:basis-1/3">
                                  <div className={cn(
                                    "h-full rounded-2xl flex flex-col overflow-hidden relative shadow-sm border hover:shadow-md transition-all group/card",
                                    cardBg, borderColor
                                  )}>
                                    {/* Imagem do Serviço */}
                                    <div className="w-full aspect-[4/3] shrink-0 relative bg-muted border-b overflow-hidden" style={{ borderColor: theme.primaryColor + '20' }}>
                                      {srv.image_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={srv.image_url}
                                          alt={srv.name}
                                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105 cursor-pointer"
                                          onClick={() => setLightboxImage(srv.image_url)}
                                        />
                                      ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <Briefcase className="w-12 h-12 text-muted-foreground/20" />
                                        </div>
                                      )}
                                    </div>

                                    {/* Conteúdo */}
                                    <div className="p-6 flex flex-col flex-1 bg-white">
                                      <div className="flex-1">
                                        <h4 className="font-bold text-lg mb-3 text-slate-900">{srv.name}</h4>
                                        {srv.description && <p className="text-sm text-slate-600 mb-4 line-clamp-3 leading-relaxed">{srv.description}</p>}
                                      </div>

                                      {/* Rodapé do Card */}
                                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                                        <div className="flex items-center gap-1.5 font-bold text-sm text-slate-800">
                                          <span style={{ color: theme.primaryColor }}>R$ {Number(srv.price).toFixed(2)}</span>
                                          <span className="text-slate-400 font-normal">/</span>
                                          <span className="text-slate-500 font-normal">{srv.duration} min</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </CarouselItem>
                              );
                            })}
                          </CarouselContent>

                          {/* Controles do Carrossel */}
                          {sortedServices.length > 2 && (
                            <CarouselDots />
                          )}
                        </Carousel>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PACOTES ── */}
          {dbPackages.length > 0 && servicesConfig.showPackages !== false && (
            <div id="pacotes" className={cn("px-6 sm:px-10 py-14 md:py-24 scroll-mt-20", altBg)}>
              <div className="max-w-5xl mx-auto w-full">
                <h2 className="font-bold text-2xl md:text-4xl mb-3 flex items-center gap-3">
                  <Package className="h-8 w-8 shrink-0" style={{ color: theme.primaryColor }} /> Pacotes e Planos
                </h2>
                <p className="text-base opacity-60 mb-10">
                  {servicesConfig.packagesSubtitle || "Planos flexíveis para quem quer incluir o autocuidado na rotina."}
                </p>

                {servicesConfig.packagesDisplay === "pills" ? (
                  <div className="flex flex-wrap gap-3">
                    {sortedPackages.map((pkg: any) => (
                      <div key={pkg.id} className={cn("px-5 py-3 rounded-full flex items-center gap-3 border shadow-sm transition-transform hover:-translate-y-1", altBg, borderColor)}>
                        <span className="font-bold text-sm whitespace-nowrap">{pkg.name}</span>
                        <span className="text-xs opacity-50 px-3 border-l whitespace-nowrap" style={{ borderColor: theme.primaryColor }}>{pkg.total_sessions} sessões</span>
                        <span className="font-bold whitespace-nowrap" style={{ color: theme.primaryColor }}>R$ {Number(pkg.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="relative w-full group/carousel">
                    <Carousel opts={{ align: "start", loop: false }} className="w-full">
                      <CarouselContent className="-ml-4 md:-ml-6 py-4 -my-4">
                        {sortedPackages.map((pkg: any) => {
                          const isFeatured = featuredPackageName && pkg.name.toLowerCase().trim() === featuredPackageName.toLowerCase().trim();
                          return (
                            <CarouselItem key={pkg.id} className="pl-4 md:pl-6 md:basis-1/2 lg:basis-1/3">
                              <div className={cn(
                                "h-full rounded-2xl flex flex-col relative shadow-sm border hover:shadow-md transition-all group/card p-6 bg-white border-black/10"
                              )}
                                style={isFeatured ? { backgroundColor: theme.primaryColor + "08" } : {}}>

                                {/* Header */}
                                <div className="flex items-start justify-between gap-4 mb-4">
                                  <h4 className="font-serif font-bold text-xl text-slate-900">{pkg.name}</h4>
                                  {isFeatured && (
                                    <div className="shrink-0">
                                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 flex items-center gap-1">
                                        <Star className="h-3 w-3" type="solid" /> Mais Popular
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Description */}
                                <p className="text-sm text-slate-500 mb-6 flex-1">
                                  {pkg.description || `${pkg.total_sessions} sessões inclusas. Ideal para quem quer manter a rotina de autocuidado com desconto.`}
                                </p>

                                {/* Footer */}
                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                                  <span className="font-bold text-lg text-slate-900">
                                    R$ {Number(pkg.price).toFixed(2)}
                                  </span>
                                  <button
                                    className="text-sm font-bold flex items-center gap-1.5 transition-all hover:opacity-80"
                                    style={{ color: theme.primaryColor }}
                                  >
                                    Reservar
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                      <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </CarouselItem>
                          );
                        })}
                      </CarouselContent>

                      {/* Controles do Carrossel */}
                      {sortedPackages.length > 2 && (
                        <CarouselDots />
                      )}
                    </Carousel>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PROFISSIONAIS ── */}
          {professionals.length > 0 && (
            <div id="profissionais" className="px-6 sm:px-10 py-14 md:py-24 scroll-mt-20">
              <div className="max-w-5xl mx-auto w-full">
                <h2 className="font-bold text-2xl md:text-4xl mb-12 flex items-center gap-3">
                  <User className="h-8 w-8" style={{ color: theme.primaryColor }} /> Nossa Equipe
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-8 justify-items-center pt-4">
                  {professionals.map((prof: any) => {
                    const isSelected = selectedProfessional?.id === prof.id;
                    return (
                    <div
                      key={prof.id}
                      className={cn(
                        "flex flex-col items-center gap-3 snap-start cursor-pointer transition-all",
                        isSelected ? "opacity-100" : "opacity-80 hover:opacity-100"
                      )}
                      onClick={() => handleSelectProfessional(prof)}
                    >
                      <div className={cn(
                        "w-28 h-36 md:w-36 md:h-48 rounded-[1.5rem] overflow-hidden shadow-lg border relative",
                        isSelected ? `ring-4 ring-offset-2 ring-[${theme.primaryColor}]` : ""
                      )}
                      style={isSelected ? { '--tw-ring-color': theme.primaryColor } as any : {}}
                      >
                        {prof.instagram_url && (
                          <a
                            href={sanitizeUrl(prof.instagram_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              "absolute top-2 right-2 p-1.5 rounded-full z-10 backdrop-blur-md bg-black/30 text-white hover:bg-black/50 transition-colors",
                              !prof.show_instagram && "hidden"
                            )}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Instagram className="h-5 w-5" />
                          </a>
                        )}
                        {prof.profile_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={prof.profile_image_url}
                            alt={prof.display_name || "Profissional"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-4xl font-bold opacity-20">
                            {prof.display_name ? prof.display_name.charAt(0).toUpperCase() : (prof.email ? prof.email.charAt(0).toUpperCase() : "U")}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-center justify-center px-2 text-center">
                        <h4 className={cn("font-bold text-lg leading-tight", isSelected && "text-primary")} style={isSelected ? { color: theme.primaryColor } : {}}>{prof.display_name || "Profissional"}</h4>
                        <p className="text-sm opacity-60 mt-1">{prof.profession || "Especialista"}</p>
                      </div>
                    </div>
                  )})}
                </div>
                {selectedProfessional && selectedProfessional.bio && (
                  <div className="mt-8 p-6 rounded-2xl bg-muted/50 border shadow-sm animate-fade-up max-w-3xl mx-auto text-center" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                    <h3 className="font-bold text-lg mb-2" style={{ color: theme.primaryColor }}>Sobre {selectedProfessional.display_name || selectedProfessional.name?.split(' ')[0]}</h3>
                    <p className="text-sm opacity-80 leading-relaxed whitespace-pre-wrap">{selectedProfessional.bio}</p>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* VÍDEO - Temporarily disabled */}

          {/* ── CONTATO & FORMULÁRIO ── */}
          <div id="contato" className={cn("px-6 sm:px-10 py-14 md:py-24 scroll-mt-20", altBg)}>
            <div className="max-w-5xl mx-auto w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-14">

                {/* Esquerda: Info */}
                <div>
                  <h2 className="font-bold text-2xl md:text-4xl mb-4">Fale Conosco</h2>
                  <p className="text-base opacity-70 mb-10 leading-relaxed">
                    Estamos à disposição para tirar suas dúvidas. Entre em contato pelos canais abaixo ou envie uma mensagem.
                  </p>

                  <div className="flex flex-col gap-6">

                    {(org.settings?.phone_whatsapp || org.settings?.phone_landline || contact.whatsapp || contact.phone) && (
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", altBg)}>
                          <Phone className="h-6 w-6" style={{ color: theme.primaryColor }} />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider opacity-50 mb-0.5">Telefone / WhatsApp</p>
                          <p className="text-base font-medium">{org.settings?.phone_whatsapp || org.settings?.phone_landline || contact.whatsapp || contact.phone}</p>
                        </div>
                      </div>
                    )}

                    {contact.email && (
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", altBg)}>
                          <Envelope className="h-6 w-6" style={{ color: theme.primaryColor }} />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider opacity-50 mb-0.5">E-mail</p>
                          <p className="text-base font-medium">{contact.email}</p>
                        </div>
                      </div>
                    )}

                    {contact.address && (
                      <a
                        href={sanitizeUrl(contact.mapUrl) || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 hover:opacity-80 transition-opacity"
                      >
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", altBg)}>
                          <Pin className="h-6 w-6" style={{ color: theme.primaryColor }} />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider opacity-50 mb-0.5">Endereço <span className="lowercase font-normal opacity-70">(Ver no Mapa)</span></p>
                          <p className="text-base opacity-90">{contact.address}</p>
                        </div>
                      </a>
                    )}
                  </div>
                </div>

                {/* Direita: Formulário */}
                <div className={cn("rounded-3xl p-8 border shadow-sm", isDark ? "bg-white/5 border-white/10" : "bg-white border-black/8")}>
                  <h3 className="font-bold text-xl mb-2">Reserve sua sessão</h3>
                  <p className="text-sm opacity-60 mb-6">
                    Preencha o formulário e entraremos em contato pelo WhatsApp para confirmar o horário.
                  </p>
                  {formSent ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                        <CheckCircle className="h-10 w-10 text-emerald-500" />
                      </div>
                      <h4 className="font-bold text-xl mb-2">Mensagem enviada!</h4>
                      <p className="text-sm opacity-70">Abrimos o WhatsApp com seus dados. Em breve entraremos em contato!</p>
                    </div>
                  ) : (
                    <form onSubmit={handleContactSubmit} className="flex flex-col gap-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold opacity-70">Nome *</label>
                          <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className={cn("w-full h-11 rounded-xl border px-4 text-sm focus:outline-none focus:ring-1 transition", inputBg)}
                            style={{ "--tw-ring-color": theme.primaryColor } as any}
                            placeholder="Seu nome completo"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold opacity-70">WhatsApp</label>
                          <input
                            type="tel"
                            value={formData.whatsapp}
                            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                            className={cn("w-full h-11 rounded-xl border px-4 text-sm focus:outline-none focus:ring-1 transition", inputBg)}
                            placeholder="(11) 99999-9999"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold opacity-70">E-mail</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className={cn("w-full h-11 rounded-xl border px-4 text-sm focus:outline-none focus:ring-1 transition", inputBg)}
                          placeholder="exemplo@email.com"
                        />
                      </div>
                      {dbServices.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold opacity-70">Serviço de Interesse</label>
                          <Select
                            value={formData.service}
                            onValueChange={(val) => setFormData({ ...formData, service: val === "none" ? "" : val })}
                          >
                            <SelectTrigger className={cn("w-full h-11 rounded-xl border px-4 text-sm focus:outline-none focus:ring-1 transition bg-transparent", inputBg)}>
                              <SelectValue placeholder="Selecione um serviço..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none" className="text-muted-foreground">Selecione um serviço...</SelectItem>
                              {dbServices.map((srv: any) => (
                                <SelectItem key={`srv-${srv.id}`} value={srv.name}>{srv.name} — R$ {Number(srv.price).toFixed(2)}</SelectItem>
                              ))}
                              {dbPackages.map((pkg: any) => (
                                <SelectItem key={`pkg-${pkg.id}`} value={pkg.name}>{pkg.name} (Pacote) — R$ {Number(pkg.price).toFixed(2)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold opacity-70">Mensagem (Opcional)</label>
                        <textarea
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          className={cn("w-full min-h-[100px] rounded-xl border p-4 text-sm focus:outline-none focus:ring-1 transition resize-none", inputBg)}
                          placeholder="Dúvidas, preferências de horário..."
                        />
                      </div>
                      <button
                        type="submit"
                        className="mt-2 w-full h-12 rounded-xl text-white font-bold transition-transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-sm"
                        style={{ backgroundColor: theme.primaryColor }}
                      >
                        <Whatsapp className="h-5 w-5" />
                        Enviar pelo WhatsApp
                      </button>
                      <p className="text-[10px] text-center opacity-40">Ao enviar, você será redirecionado para o WhatsApp com sua mensagem pronta.</p>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>



          {/* ── RODAPÉ ── */}
          <footer className="w-full bg-black text-white pt-16 pb-8 px-6 sm:px-10">
            <div className="max-w-5xl mx-auto w-full">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                <div>
                  <h3 className="font-bold text-2xl mb-4">{org.name}</h3>
                  <p className="text-sm opacity-60 leading-relaxed mb-6">
                    {presentation.subheadline || "Transformando vidas e oferecendo o melhor atendimento para você se sentir especial todos os dias."}
                  </p>
                  {/* Redes sociais do link na bio */}
                  {socialLinks && socialLinks.length > 0 && (
                    <div className="flex gap-3 flex-wrap">
                      {socialLinks.map((link: any, i: number) => {
                        const platform = link.platform?.toLowerCase() || "";
                        const Icon = SOCIAL_ICONS[platform] || Globe;
                        return (
                          <a
                            key={i}
                            href={sanitizeUrl(link.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                            title={link.platform}
                          >
                            <Icon className="h-4 w-4" />
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-4">Links Rápidos</h4>
                  <div className="flex flex-col gap-2 text-sm opacity-70">
                    <a href="#sobre" className="hover:opacity-100 hover:translate-x-1 transition-all w-fit">Sobre</a>
                    <a href="#servicos" className="hover:opacity-100 hover:translate-x-1 transition-all w-fit">Serviços</a>
                    {dbPackages.length > 0 && <a href="#pacotes" className="hover:opacity-100 hover:translate-x-1 transition-all w-fit">Pacotes</a>}
                    {professionals.length > 0 && <a href="#profissionais" className="hover:opacity-100 hover:translate-x-1 transition-all w-fit">Nossa Equipe</a>}
                    <button onClick={() => setTermsOpen(true)} className="text-left hover:opacity-100 hover:translate-x-1 transition-all w-fit">
                      Termos de Uso
                    </button>
                  </div>
                </div>

                {(contact?.showBusinessHoursSite && contact?.businessHours) && (
                  <div>
                    <h4 className="font-bold text-lg mb-4">Horário de Funcionamento</h4>
                    <div className="flex flex-col gap-2 text-sm opacity-70">
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 shrink-0 mt-0.5" />
                        <p className="leading-relaxed">{contact.businessHours}</p>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs opacity-40">
                <p>© {new Date().getFullYear()} {org.name}. Todos os direitos reservados.</p>
                <a href="https://www.totten.com.br/landingpage" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 hover:underline transition-all">Desenvolvido com Totten</a>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* MODAL TERMOS DE USO */}
      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Termos de Uso</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm opacity-80 leading-relaxed whitespace-pre-wrap">
            {org.settings?.terms_of_use || `Termos de Uso e Privacidade

1. Coleta de Dados
Coletamos apenas as informações essenciais (como nome e telefone) necessárias para a prestação do serviço e identificação do cliente.

2. Uso das Informações
Seus dados são utilizados exclusivamente para gerenciar seus agendamentos, enviar confirmações e contatar você sobre o serviço contratado.

3. Compartilhamento
Garantimos que suas informações pessoais não serão vendidas, alugadas ou compartilhadas com terceiros.

4. Segurança
Adotamos medidas de segurança para proteger seus dados contra acessos não autorizados e manter a privacidade de suas informações.

Ao utilizar nosso sistema, você concorda com a coleta e o uso de suas informações conforme descrito nestes termos.`}
          </div>
        </DialogContent>
      </Dialog>

      {/* LIGHTBOX DE IMAGENS */}
      <Dialog open={!!lightboxImage} onOpenChange={(open) => !open && setLightboxImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none flex items-center justify-center">
          <DialogTitle className="sr-only">Visualizar Imagem</DialogTitle>
          {lightboxImage && (
            <img src={lightboxImage} alt="Imagem ampliada" className="w-full h-auto max-h-[85vh] object-contain rounded-md" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

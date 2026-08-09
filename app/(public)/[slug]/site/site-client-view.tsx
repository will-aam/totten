"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Star, Briefcase, Youtube, Pin, Globe, Menu, X, Envelope, User, Phone,
  CheckCircle, Whatsapp, Instagram, Facebook, Twitter, Tiktok, Clock,
  ArrowRight, Package
} from "@boxicons/react";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";

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

export function SiteClientView({ org, proSiteData, theme, presentation, contact, media, socialProof, servicesConfig, socialLinks = [], profileConfig = {} }: any) {
  const history = proSiteData?.history || {};
  const isAvatarLayout = presentation.heroLayout === "avatar-cover";
  const isBlogLayout = presentation?.heroLayout === "classic-blog";
  const displayImage = isBlogLayout ? ((presentation as any).proHeroImage || presentation.heroImage) : presentation.heroImage;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [formSent, setFormSent] = useState(false);
  const [formData, setFormData] = useState({ name: "", whatsapp: "", email: "", service: "", message: "" });
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSent, setNewsletterSent] = useState(false);

  // WhatsApp do contato (preferência: campo whatsapp, fallback: phone)
  const whatsappRaw = contact.whatsapp || contact.phone || "";
  const whatsappNumber = whatsappRaw.replace(/\D/g, "");
  const whatsappUrl = whatsappNumber ? `https://wa.me/55${whatsappNumber}` : "#";

  // Link para agendar
  const bookingUrl = `/${org.slug}`;

  // Dados do banco
  const professionals = org.admins || [];
  const dbServices = org.services || [];
  const dbPackages = org.package_templates || [];
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

  // Pacote em destaque
  const featuredPackageName = servicesConfig?.featuredPackageName?.toLowerCase().trim();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Noto+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Oxanium:wght@400;500;600;700&family=Roboto:ital,wght@0,400;0,500;0,700;1,400&family=Sora:wght@400;500;600;700&display=swap');
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .animate-fade-up { animation: fadeInUp 0.5s ease forwards; }
      `}</style>

      <div
        className={cn("min-h-screen w-full flex flex-col relative z-10 transition-colors duration-500 font-sans", theme.css)}
        style={{ color: theme.textColor }}
      >
        {/* ─────────────── NAVBAR ─────────────── */}
        <header className={cn(
          "fixed top-0 inset-x-0 h-16 md:h-20 z-50 backdrop-blur-md border-b flex items-center px-6 md:px-10 justify-between transition-all",
          isDark ? "bg-black/60 border-white/10" : "bg-white/80 border-black/10"
        )}>
          <div className="font-bold text-lg md:text-xl tracking-tight">{org.name}</div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-7 font-medium text-sm">
            <a href="#sobre" className="hover:opacity-70 transition-opacity">Sobre</a>
            <a href="#servicos" className="hover:opacity-70 transition-opacity">Serviços</a>
            {dbPackages.length > 0 && <a href="#pacotes" className="hover:opacity-70 transition-opacity">Pacotes</a>}
            {professionals.length > 0 && <a href="#profissionais" className="hover:opacity-70 transition-opacity">Equipe</a>}
            <a href="#contato" className="hover:opacity-70 transition-opacity">Contato</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {whatsappNumber && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center hover:opacity-70 transition-opacity bg-emerald-500/10 text-emerald-600 p-2.5 rounded-full"
                title="WhatsApp"
              >
                <Whatsapp className="h-5 w-5" />
              </a>
            )}
            <a
              href={bookingUrl}
              className="px-5 py-2.5 rounded-full text-sm font-bold text-white shadow-sm hover:scale-105 transition-transform"
              style={{ backgroundColor: theme.primaryColor }}
            >
              Agendar
            </a>
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
            <a href="#sobre" onClick={() => setMobileMenuOpen(false)}>Sobre</a>
            <a href="#servicos" onClick={() => setMobileMenuOpen(false)}>Serviços</a>
            {dbPackages.length > 0 && <a href="#pacotes" onClick={() => setMobileMenuOpen(false)}>Pacotes</a>}
            {professionals.length > 0 && <a href="#profissionais" onClick={() => setMobileMenuOpen(false)}>Equipe</a>}
            <a href="#contato" onClick={() => setMobileMenuOpen(false)}>Contato</a>
            <a
              href={bookingUrl}
              className="px-8 py-4 rounded-full text-lg font-bold text-white mt-2"
              style={{ backgroundColor: theme.primaryColor }}
            >
              Agendar Agora
            </a>
          </div>
        )}

        {/* ─────────────── MAIN ─────────────── */}
        <main className="w-full min-h-screen relative pt-16 md:pt-20">

          {/* ── HERO ── */}
          {isBlogLayout ? (
            <div className="px-6 sm:px-10 relative z-10 flex flex-col lg:flex-row gap-10 lg:gap-16 max-w-7xl mx-auto w-full pb-14 mt-8 md:mt-16 items-center">
              
              {/* Mobile Image (rendered on top for mobile, hidden on lg) */}
              {displayImage && (
                <div className="w-full relative lg:hidden mb-2 animate-fade-up" style={{ animationDelay: '0.1s' }}>
                  <div className="w-full h-[300px] sm:h-[400px] relative rounded-[2rem] overflow-hidden shadow-xl border border-black/5 dark:border-white/10">
                    <img src={displayImage} alt="Hero" className="w-full h-full object-cover" />
                    {/* Floating Box */}
                    {(presentation.floatingBoxTitle || presentation.floatingBoxSubtitle) && (
                      presentation.floatingBoxLink ? (
                        <a href={presentation.floatingBoxLink} target="_blank" rel="noopener noreferrer" className="absolute bottom-4 left-4 bg-white/95 dark:bg-black/90 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-black/5 dark:border-white/10 max-w-[200px] hover:scale-105 transition-transform block">
                          {presentation.floatingBoxTitle && <div className="text-sm font-bold text-black dark:text-white leading-tight">{presentation.floatingBoxTitle}</div>}
                          {presentation.floatingBoxSubtitle && <div className="text-xs font-medium text-black/60 dark:text-white/60 mt-1">{presentation.floatingBoxSubtitle}</div>}
                        </a>
                      ) : (
                        <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-black/90 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-black/5 dark:border-white/10 max-w-[200px]">
                          {presentation.floatingBoxTitle && <div className="text-sm font-bold text-black dark:text-white leading-tight">{presentation.floatingBoxTitle}</div>}
                          {presentation.floatingBoxSubtitle && <div className="text-xs font-medium text-black/60 dark:text-white/60 mt-1">{presentation.floatingBoxSubtitle}</div>}
                        </div>
                      )
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
                   {presentation.ctaPrimaryText && (
                     <a href={bookingUrl} className="w-full px-8 py-4 rounded-full text-base font-bold shadow-lg text-white hover:scale-105 transition-transform flex items-center justify-center text-center gap-2" style={{ backgroundColor: theme.primaryColor }}>
                       {presentation.ctaPrimaryText}
                     </a>
                   )}
                   {presentation.ctaSecondaryText && (
                     <a href="#servicos" className={cn("w-full px-8 py-4 rounded-full text-base font-bold border hover:scale-105 transition-transform flex items-center justify-center text-center gap-2", isDark ? "border-white/20 text-white hover:bg-white/10" : "border-black/15 text-current hover:bg-black/5")}>
                       {presentation.ctaSecondaryText}
                     </a>
                   )}
                 </div>
                 
                 {/* Highlights */}
                 {(presentation.highlight1 || presentation.highlight2 || presentation.highlight3) && (
                   <div className="flex flex-wrap gap-x-6 gap-y-3 mt-10 animate-fade-up" style={{ animationDelay: '0.4s' }}>
                     {[presentation.highlight1, presentation.highlight2, presentation.highlight3].filter(Boolean).map((highlight, i) => (
                       <div key={i} className="flex items-center gap-2 text-sm opacity-80 font-medium">
                         <div className="w-5 h-5 rounded-full flex items-center justify-center border border-current opacity-70">
                           <CheckCircle className="w-3.5 h-3.5" />
                         </div>
                         {highlight}
                       </div>
                     ))}
                   </div>
                 )}
              </div>

              {/* Desktop Image (rendered on right for lg, hidden on mobile) */}
              {displayImage && (
                <div className="hidden lg:block w-full lg:w-1/2 relative animate-fade-up" style={{ animationDelay: '0.3s' }}>
                  <div className="w-full aspect-[4/3] relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-black/5 dark:border-white/10 group">
                    <img src={displayImage} alt="Hero" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    {/* Floating Box */}
                    {(presentation.floatingBoxTitle || presentation.floatingBoxSubtitle) && (
                      presentation.floatingBoxLink ? (
                        <a href={presentation.floatingBoxLink} target="_blank" rel="noopener noreferrer" className="absolute bottom-6 left-6 bg-white/95 dark:bg-black/90 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-black/5 dark:border-white/10 max-w-[240px] animate-fade-up hover:scale-105 transition-transform block">
                          {presentation.floatingBoxTitle && <div className="text-base font-bold text-black dark:text-white leading-tight mb-1">{presentation.floatingBoxTitle}</div>}
                          {presentation.floatingBoxSubtitle && <div className="text-sm font-medium text-black/60 dark:text-white/60">{presentation.floatingBoxSubtitle}</div>}
                        </a>
                      ) : (
                        <div className="absolute bottom-6 left-6 bg-white/95 dark:bg-black/90 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-black/5 dark:border-white/10 max-w-[240px] animate-fade-up">
                          {presentation.floatingBoxTitle && <div className="text-base font-bold text-black dark:text-white leading-tight mb-1">{presentation.floatingBoxTitle}</div>}
                          {presentation.floatingBoxSubtitle && <div className="text-sm font-medium text-black/60 dark:text-white/60">{presentation.floatingBoxSubtitle}</div>}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative w-full">
              {presentation.heroImage ? (
                <div className={cn(
                  "w-full relative shrink-0",
                  isAvatarLayout ? "h-64 md:h-[450px]" : "h-80 md:h-[560px]"
                )}>
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
                <div className={cn("w-full bg-muted/20 border-b border-border/10 shrink-0 h-48 md:h-64")} />
              )}

              <div className={cn(
                "px-6 sm:px-10 relative z-10 flex flex-col pb-14 max-w-5xl mx-auto w-full",
                isAvatarLayout
                  ? (presentation.heroImage ? "-mt-16 md:-mt-24" : "-mt-12 md:-mt-16")
                  : (presentation.heroImage ? "-mt-20 md:-mt-32" : "-mt-12 md:-mt-16"),
                theme.headerStyle === "center" ? "text-center items-center" : "text-left items-start"
              )}>
                {/* Avatar (layout avatar-cover) */}
                {isAvatarLayout && (
                  org.link_bio?.profile_image_url ? (
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 shadow-md overflow-hidden mb-4 shrink-0" style={{ borderColor: isDark ? '#0f172a' : '#ffffff', backgroundColor: isDark ? '#0f172a' : '#ffffff' }}>
                      <img src={org.link_bio.profile_image_url} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 shadow-md bg-muted/50 mb-4 shrink-0" style={{ borderColor: isDark ? '#0f172a' : '#ffffff' }} />
                  )
                )}

                {/* Badge Personalizável */}
                {presentation.badgeText && (
                  <div className={cn(
                    "inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border w-fit",
                    isDark ? "bg-white/10 border-white/20 text-white/80" : "bg-black/5 border-black/10 text-black/80"
                  )}>
                    {presentation.badgeText}
                  </div>
                )}

                <h1 className="font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight drop-shadow-sm mt-1">
                  {presentation.headline || org.name}
                </h1>
                <p className="text-base sm:text-lg opacity-80 mt-4 font-medium drop-shadow-sm max-w-xl">
                  {presentation.subheadline || "Subtítulo de apoio ou missão do seu negócio."}
                </p>

                {/* Dual CTA */}
                <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-8", theme.headerStyle === "center" ? "mx-auto max-w-lg" : "max-w-md")}>
                  {presentation.ctaPrimaryText && (
                    <a
                      href={bookingUrl}
                      className="w-full px-8 py-4 rounded-full text-base font-bold shadow-lg text-white backdrop-blur-sm hover:scale-105 transition-transform flex items-center justify-center text-center gap-2"
                      style={{ backgroundColor: theme.primaryColor }}
                    >
                      {presentation.ctaPrimaryText}
                    </a>
                  )}
                  {presentation.ctaSecondaryText && (
                    <a
                      href="#servicos"
                      className={cn(
                        "w-full px-8 py-4 rounded-full text-base font-bold border hover:scale-105 transition-transform flex items-center justify-center text-center gap-2",
                        isDark ? "border-white/20 text-white hover:bg-white/10" : "border-black/15 text-current hover:bg-black/5"
                      )}
                    >
                      {presentation.ctaSecondaryText}
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  )}
                </div>

                {/* Highlights */}
                {(presentation.highlight1 || presentation.highlight2 || presentation.highlight3) && (
                  <div className={cn("flex flex-wrap gap-x-6 gap-y-3 mt-8", theme.headerStyle === "center" ? "justify-center" : "justify-start")}>
                    {[presentation.highlight1, presentation.highlight2, presentation.highlight3].filter(Boolean).map((highlight, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm opacity-80 font-medium">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center border border-current opacity-70">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </div>
                        {highlight}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

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
          {history.showHistory !== false && (history.historyTitle || history.historyText) && (
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
                    {history.historyText && (
                      <p className="text-base md:text-lg opacity-80 whitespace-pre-wrap leading-relaxed">
                        {history.historyText}
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
              <div className="max-w-5xl mx-auto w-full">
                <h2 className="font-bold text-2xl md:text-4xl mb-3 flex items-center gap-3">
                  <Briefcase className="h-8 w-8 shrink-0" style={{ color: theme.primaryColor }} /> Nossos Serviços
                </h2>
                <p className="text-base opacity-60 mb-10">
                  Escolha a experiência que melhor se adapta ao que você precisa.
                </p>

                {/* Categorias */}
                {dbCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-10 pb-6 border-b border-border/20">
                    <span className="text-sm font-semibold opacity-50 mr-2 flex items-center">Especialidades:</span>
                    {dbCategories.map((cat: any) => (
                      <div key={cat.id} className={cn("px-4 py-1.5 rounded-full text-sm font-medium border shadow-sm", altBg, borderColor)}>
                        {cat.name}
                      </div>
                    ))}
                  </div>
                )}

                {/* Serviços */}
                {dbServices.length > 0 && servicesConfig.showServices !== false && (
                  <div className="mb-14">
                    {servicesConfig.servicesDisplay === "pills" ? (
                      <div className="flex flex-wrap gap-3">
                        {dbServices.map((srv: any) => (
                          <div key={srv.id} className={cn("px-5 py-3 rounded-full flex items-center gap-3 border shadow-sm transition-transform hover:-translate-y-1", cardBg, borderColor)}>
                            <span className="font-bold text-sm">{srv.name}</span>
                            <span className="text-xs opacity-50 px-3 border-l" style={{ borderColor: theme.primaryColor }}>{srv.duration}m</span>
                            <span className="font-bold whitespace-nowrap" style={{ color: theme.primaryColor }}>R$ {Number(srv.price).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {dbServices.map((srv: any) => (
                          <div key={srv.id} className={cn("p-6 rounded-3xl flex flex-col justify-between relative shadow-sm border hover:-translate-y-1 transition-all group", cardBg, borderColor)}>
                            <div>
                              <h4 className="font-bold text-lg mb-2">{srv.name}</h4>
                              {srv.description && <p className="text-sm opacity-70 mb-4 line-clamp-3">{srv.description}</p>}
                            </div>
                            <div className={cn("flex items-center justify-between mt-4 pt-4 border-t", borderColor)}>
                              <span className="text-sm font-medium opacity-60">{srv.duration} min</span>
                              <span className="font-bold text-lg" style={{ color: theme.primaryColor }}>
                                R$ {Number(srv.price).toFixed(2)}
                              </span>
                            </div>
                            <a
                              href={bookingUrl}
                              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                              style={{ backgroundColor: theme.primaryColor }}
                            >
                              {servicesConfig.ctaText || "Reservar"}
                            </a>
                          </div>
                        ))}
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
                  Planos flexíveis para quem quer incluir o autocuidado na rotina.
                </p>

                {servicesConfig.packagesDisplay === "pills" ? (
                  <div className="flex flex-wrap gap-3">
                    {dbPackages.map((pkg: any) => (
                      <div key={pkg.id} className={cn("px-5 py-3 rounded-full flex items-center gap-3 border shadow-sm transition-transform hover:-translate-y-1", altBg, borderColor)}>
                        <span className="font-bold text-sm">{pkg.name}</span>
                        <span className="text-xs opacity-50 px-3 border-l" style={{ borderColor: theme.primaryColor }}>{pkg.total_sessions} sessões</span>
                        <span className="font-bold whitespace-nowrap" style={{ color: theme.primaryColor }}>R$ {Number(pkg.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dbPackages.map((pkg: any) => {
                      const isFeatured = featuredPackageName && pkg.name.toLowerCase().trim() === featuredPackageName;
                      return (
                        <div
                          key={pkg.id}
                          className={cn(
                            "p-6 rounded-3xl flex flex-col justify-between relative shadow-sm border hover:-translate-y-1 transition-all",
                            isFeatured
                              ? "border-2 ring-2 scale-[1.03]"
                              : (isDark ? "bg-white/5 border-white/10" : "bg-white border-black/10")
                          )}
                          style={isFeatured ? { borderColor: theme.primaryColor, boxShadow: `0 0 0 2px ${theme.primaryColor}40`, backgroundColor: theme.primaryColor + "08" } : {}}
                        >
                          {isFeatured && (
                            <div
                              className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1.5 shadow-md"
                              style={{ backgroundColor: theme.primaryColor }}
                            >
                              <Star className="h-3.5 w-3.5" type="solid" /> Mais Popular
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-xl mb-1">{pkg.name}</h4>
                            <p className="text-sm opacity-60 mb-4">{pkg.total_sessions} sessões</p>
                          </div>
                          <div>
                            <p className="font-bold text-3xl mb-4" style={{ color: theme.primaryColor }}>
                              R$ {Number(pkg.price).toFixed(2)}
                            </p>
                            <a
                              href={bookingUrl}
                              className={cn(
                                "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90",
                                isFeatured ? "text-white shadow-md" : (isDark ? "text-white border border-white/20 hover:bg-white/10" : "text-current border border-black/15 hover:bg-black/5")
                              )}
                              style={isFeatured ? { backgroundColor: theme.primaryColor } : {}}
                            >
                              Escolher Plano
                            </a>
                          </div>
                        </div>
                      );
                    })}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                  {professionals.map((prof: any) => (
                    <div key={prof.id} className="flex flex-col group">
                      <div className={cn("w-full aspect-[4/5] rounded-3xl shadow-sm flex items-center justify-center mb-4 overflow-hidden border", cardBg, borderColor)}>
                        <span className="text-4xl font-bold opacity-20">
                          {prof.display_name ? prof.display_name.charAt(0).toUpperCase() : prof.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-start justify-between px-2">
                        <div>
                          <h4 className="font-bold text-lg leading-tight">{prof.display_name || "Profissional"}</h4>
                          <p className="text-sm opacity-60 mt-1">Especialista</p>
                        </div>
                        {prof.show_instagram && prof.instagram_url && (
                          <a
                            href={prof.instagram_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-full bg-pink-500/10 text-pink-600 hover:bg-pink-500/20 transition-colors"
                          >
                            <Instagram className="h-5 w-5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── AVALIAÇÕES DO GOOGLE ── */}
          {socialProof.useGoogleReviews && (
            <div className={cn("px-6 sm:px-10 py-14 md:py-24 overflow-hidden", altBg)}>
              <div className="max-w-5xl mx-auto w-full">
                <h2 className="font-bold text-2xl md:text-4xl mb-4 flex items-center gap-3">
                  <Star className="h-8 w-8 text-amber-500" type="solid" /> Avaliações do Google
                </h2>
                <p className="text-base opacity-70 mb-12">Veja o que nossos clientes dizem sobre nós.</p>
                <div className="flex gap-6 overflow-x-auto no-scrollbar snap-x pb-8 -mx-6 px-6 sm:mx-0 sm:px-0">
                  {[
                    { name: "Mariana Silva", text: "Excelente atendimento! O espaço é lindo e os profissionais são maravilhosos." },
                    { name: "Roberto Alves", text: "Muito satisfeito com o serviço prestado. Recomendo a todos!" },
                    { name: "Carla Mendes", text: "Lugar muito acolhedor, saí de lá me sentindo renovada." },
                  ].map((testi, i) => (
                    <div key={i} className={cn("w-80 md:w-96 shrink-0 p-8 rounded-3xl shadow-sm snap-center border flex flex-col justify-between", cardBg, borderColor)}>
                      <div>
                        <div className="flex text-amber-400 mb-4 gap-1">
                          {[...Array(5)].map((_, s) => <Star key={s} className="h-5 w-5" type="solid" />)}
                        </div>
                        <p className="text-base opacity-80 mb-6 leading-relaxed">"{testi.text}"</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm", altBg)}>
                          {testi.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{testi.name}</p>
                          <p className="text-xs opacity-50">Local Guide</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── VÍDEO ── */}
          {(media as any).videoUrl && (
            <div className="px-6 sm:px-10 py-14 md:py-24">
              <div className="max-w-5xl mx-auto w-full">
                <h2 className="font-bold text-2xl md:text-4xl mb-4 flex items-center gap-3">
                  <Youtube className="h-8 w-8" style={{ color: theme.primaryColor }} />
                  {(media as any).videoTitle || "Conheça nosso espaço"}
                </h2>
                {(media as any).videoDescription && (
                  <p className="text-base opacity-70 mb-8 max-w-2xl">{(media as any).videoDescription}</p>
                )}

                <div className={cn(
                  "grid gap-10",
                  (media as any).videoFeatures?.length > 0 ? "md:grid-cols-[1fr_auto]" : "grid-cols-1"
                )}>
                  <div className="w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black">
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
                  {(media as any).videoFeatures?.length > 0 && (
                    <div className="flex flex-col justify-center gap-4 md:w-56">
                      {((media as any).videoFeatures as string[]).map((feat, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: theme.primaryColor }} />
                          <span className="text-base opacity-80 leading-snug">{feat}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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
                    {contact.businessHours && (
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", altBg)}>
                          <Clock className="h-6 w-6" style={{ color: theme.primaryColor }} />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider opacity-50 mb-0.5">Horário de Funcionamento</p>
                          <p className="text-base font-medium">{contact.businessHours}</p>
                        </div>
                      </div>
                    )}

                    {(contact.whatsapp || contact.phone) && (
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", altBg)}>
                          <Phone className="h-6 w-6" style={{ color: theme.primaryColor }} />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider opacity-50 mb-0.5">Telefone / WhatsApp</p>
                          <p className="text-base font-medium">{contact.whatsapp || contact.phone}</p>
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
                        href={contact.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`}
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
                          <select
                            value={formData.service}
                            onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                            className={cn("w-full h-11 rounded-xl border px-4 text-sm focus:outline-none focus:ring-1 transition appearance-none", inputBg)}
                          >
                            <option value="">Selecione um serviço...</option>
                            {dbServices.map((srv: any) => (
                              <option key={srv.id} value={srv.name}>{srv.name} — R$ {Number(srv.price).toFixed(2)}</option>
                            ))}
                            {dbPackages.map((pkg: any) => (
                              <option key={pkg.id} value={pkg.name}>{pkg.name} (Pacote) — R$ {Number(pkg.price).toFixed(2)}</option>
                            ))}
                          </select>
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

          {/* ── NEWSLETTER ── */}
          <div className="px-6 sm:px-10 py-14">
            <div className="max-w-5xl mx-auto w-full">
              <div
                className="rounded-3xl p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative"
                style={{ backgroundColor: theme.primaryColor }}
              >
                <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at 70% 50%, white 0%, transparent 70%)" }} />
                <div className="relative z-10 text-white">
                  <h2 className="font-bold text-2xl md:text-3xl mb-2">Receba novidades e promoções</h2>
                  <p className="text-base opacity-80">Assine e fique por dentro de ofertas exclusivas e dicas de bem-estar.</p>
                </div>
                <div className="relative z-10 w-full md:w-auto shrink-0">
                  {newsletterSent ? (
                    <div className="flex items-center gap-3 text-white font-semibold text-lg">
                      <CheckCircle className="h-7 w-7" /> Obrigado por assinar!
                    </div>
                  ) : (
                    <form onSubmit={handleNewsletter} className="flex gap-3 w-full md:w-auto">
                      <input
                        type="email"
                        required
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="h-12 rounded-xl px-4 text-sm bg-white/20 text-white placeholder:text-white/60 border border-white/30 focus:outline-none focus:bg-white/30 transition w-full md:w-64"
                      />
                      <button
                        type="submit"
                        className="h-12 px-6 rounded-xl bg-white font-bold text-sm hover:bg-white/90 transition-colors shrink-0"
                        style={{ color: theme.primaryColor }}
                      >
                        Assinar
                      </button>
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
                            href={link.url}
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
                <div>
                  <h4 className="font-bold text-lg mb-4">Agendamento Online</h4>
                  <p className="text-sm opacity-60 mb-4">Agende seu horário de forma rápida e prática, 24h por dia.</p>
                  <a
                    href={bookingUrl}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-black bg-white hover:bg-gray-100 transition-colors"
                  >
                    Agendar Horário
                  </a>
                </div>
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
            {org.settings?.terms_of_use || "Nenhum termo de uso foi cadastrado para esta clínica ainda."}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

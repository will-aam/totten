"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Star, Briefcase, Youtube, Pin, Globe, Menu, X, Envelope, User, Phone, CheckCircle, Search, Layout, Whatsapp, Instagram } from "@boxicons/react";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";

const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
};

export function SiteClientView({ org, proSiteData, theme, presentation, contact, media, socialProof, servicesConfig }: any) {
  const isAvatarLayout = presentation.heroLayout === "avatar-cover";
  const isBlogLayout = presentation.heroLayout === "classic-blog";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [formSent, setFormSent] = useState(false);

  // Derivar URL do WhatsApp
  const whatsappNumber = contact.phone ? contact.phone.replace(/\D/g, "") : "";
  const whatsappUrl = whatsappNumber ? `https://wa.me/55${whatsappNumber}` : "#";

  // Link para agendar (pode ser o link-na-bio da clinica)
  const bookingUrl = `/${org.slug}`;

  // Lista de profissionais e serviços reais do banco
  const professionals = org.admins || [];
  const dbServices = org.services || [];
  const dbPackages = org.package_templates || [];
  const dbCategories = org.categories || [];

  // Ajustes de cores para não depender do dark mode do sistema
  const isDark = theme.css?.includes("900") || theme.css?.includes("black") || theme.css?.includes("slate-950");
  const altBg = isDark ? "bg-white/5" : "bg-black/5";
  const borderColor = isDark ? "border-white/10" : "border-black/10";
  const cardBg = isDark ? "bg-white/5" : "bg-white";
  const inputBg = isDark ? "bg-white/10 text-white placeholder:text-white/50" : "bg-white text-black placeholder:text-black/50";

  const handleContactSubmit = (e: any) => {
    e.preventDefault();
    setFormSent(true);
    setTimeout(() => setFormSent(false), 3000);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Noto+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Oxanium:wght@400;500;600;700&family=Roboto:ital,wght@0,400;0,500;0,700;1,400&family=Sora:wght@400;500;600;700&display=swap');
      `}</style>
      
      <div 
        className={cn("min-h-screen w-full flex flex-col relative z-10 transition-colors duration-500 font-sans", theme.css)}
        style={{ color: theme.textColor }}
      >
        {/* NAVBAR */}
        <header className={cn("fixed top-0 inset-x-0 h-16 md:h-20 z-50 backdrop-blur-md border-b flex items-center px-6 md:px-10 justify-between transition-all", isDark ? "bg-black/60 border-white/10" : "bg-white/80 border-black/10")}>
          <div className="font-bold text-lg md:text-xl tracking-tight flex items-center gap-2">
            {org.name}
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 font-medium text-sm">
            <a href="#sobre" className="hover:opacity-70 transition-opacity">Sobre</a>
            <a href="#servicos" className="hover:opacity-70 transition-opacity">Serviços</a>
            <a href="#profissionais" className="hover:opacity-70 transition-opacity">Equipe</a>
            <a href="#contato" className="hover:opacity-70 transition-opacity">Contato</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {whatsappNumber && (
              <a 
                href={whatsappUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center hover:opacity-70 transition-opacity bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-2 rounded-full"
                title="WhatsApp"
              >
                <Whatsapp className="h-6 w-6" />
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

          {/* Mobile Nav Toggle */}
          <button className="md:hidden p-2 -mr-2" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="h-7 w-7" />
          </button>
        </header>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div className={cn("fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 text-xl font-medium animate-in fade-in slide-in-from-top-10", isDark ? "bg-slate-900 text-white" : "bg-white text-black")}>
            <button className="absolute top-6 right-6 p-2" onClick={() => setMobileMenuOpen(false)}>
              <X className="h-8 w-8" />
            </button>
            <a href="#sobre" onClick={() => setMobileMenuOpen(false)}>Sobre</a>
            <a href="#servicos" onClick={() => setMobileMenuOpen(false)}>Serviços</a>
            <a href="#profissionais" onClick={() => setMobileMenuOpen(false)}>Equipe</a>
            <a href="#contato" onClick={() => setMobileMenuOpen(false)}>Contato</a>
            <a 
              href={bookingUrl}
              className="px-8 py-4 rounded-full text-lg font-bold text-white mt-4"
              style={{ backgroundColor: theme.primaryColor }}
            >
              Agendar Agora
            </a>
          </div>
        )}

        {/* MAIN CONTENT */}
        <main className="w-full min-h-screen relative pt-16 md:pt-20">
          
          {/* HERO */}
          <div className="relative w-full">
            {presentation.heroImage ? (
              <div className={cn(
                "w-full relative shrink-0", 
                isAvatarLayout ? "h-64 md:h-[450px]" : 
                isBlogLayout ? "h-48 md:h-[400px]" : "h-80 md:h-[550px]"
              )}>
                <img 
                  src={presentation.heroImage} 
                  alt="Hero" 
                  className="w-full h-full object-cover"
                  style={(!isAvatarLayout && !isBlogLayout) ? {
                    WebkitMaskImage: "linear-gradient(to top, transparent 0%, black 75%)",
                    maskImage: "linear-gradient(to top, transparent 0%, black 75%)"
                  } : {}}
                />
              </div>
            ) : (
              <div className={cn("w-full bg-muted/20 border-b border-border/10 shrink-0", (isAvatarLayout || isBlogLayout) ? "h-48 md:h-64" : "h-48 md:h-64")} />
            )}
            
            <div className={cn(
              "px-6 sm:px-10 relative z-10 flex flex-col pb-12 max-w-5xl mx-auto w-full", 
              isAvatarLayout 
                 ? (presentation.heroImage ? "-mt-16 md:-mt-24" : "-mt-12 md:-mt-16") 
                 : isBlogLayout 
                   ? "mt-8 md:mt-12" // Push down instead of overlap
                   : (presentation.heroImage ? "-mt-20 md:-mt-28" : "-mt-12 md:-mt-16"),
              theme.headerStyle === "center" ? "text-center items-center" : "text-left items-start"
            )}>
              {/* AVATAR */}
              {isAvatarLayout && (
                org.link_bio?.profile_image_url ? (
                   <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 shadow-md overflow-hidden mb-4 shrink-0" style={{ borderColor: theme.css.includes('slate-900') ? '#0f172a' : '#ffffff', backgroundColor: theme.css.includes('slate-900') ? '#0f172a' : '#ffffff' }}>
                     <img src={org.link_bio.profile_image_url} alt="Avatar" className="w-full h-full object-cover" />
                   </div>
                ) : (
                   <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 shadow-md bg-muted/50 mb-4 shrink-0" style={{ borderColor: theme.css.includes('slate-900') ? '#0f172a' : '#ffffff' }} />
                )
              )}

              <h1 className="font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight drop-shadow-sm mt-2">
                {presentation.headline || org.name}
              </h1>
              <p className="text-base sm:text-lg opacity-80 mt-3 font-medium drop-shadow-sm max-w-lg">
                {presentation.subheadline || "Subtítulo de apoio ou missão do seu negócio."}
              </p>
              
              <a 
                href={bookingUrl}
                className="mt-8 px-8 py-4 rounded-full text-base font-bold shadow-lg w-fit text-white backdrop-blur-sm hover:scale-105 transition-transform" 
                style={{ backgroundColor: theme.primaryColor }}
              >
                {servicesConfig.ctaText || "Agendar Agora"}
              </a>
            </div>
          </div>

          {/* BIO */}
          {presentation.bio && (
            <div id="sobre" className={cn("px-6 sm:px-10 py-12 md:py-20 scroll-mt-20", altBg)}>
              <div className="max-w-5xl mx-auto w-full">
                <h2 className="font-bold text-2xl md:text-3xl mb-6">Sobre a clínica</h2>
                <p className="text-base md:text-lg opacity-80 whitespace-pre-wrap leading-relaxed max-w-4xl">{presentation.bio}</p>
              </div>
            </div>
          )}

          {/* SERVIÇOS (Do Banco de Dados) */}
          {(dbServices.length > 0 || dbPackages.length > 0) && (
            <div id="servicos" className="px-6 sm:px-10 py-12 md:py-24 scroll-mt-20">
              <div className="max-w-5xl mx-auto w-full">
                <h2 className="font-bold text-2xl md:text-4xl mb-6 flex items-center gap-3">
                  <Briefcase className="h-8 w-8" style={{ color: theme.primaryColor }} /> Nossos Serviços
                </h2>
                
                {/* Categorias (Pílulas) */}
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
                  <div className="mb-12">
                    <h3 className="text-xl font-semibold mb-6 opacity-80">Procedimentos</h3>
                    
                    {servicesConfig.servicesDisplay === "pills" ? (
                      <div className="flex flex-wrap gap-3">
                        {dbServices.map((srv: any) => (
                          <div key={srv.id} className={cn("px-5 py-3 rounded-full flex items-center gap-3 border shadow-sm transition-transform hover:-translate-y-1 cursor-default", cardBg, borderColor)}>
                             <span className="font-bold text-sm">{srv.name}</span>
                             <span className="text-xs opacity-50 px-3 border-l" style={{ borderColor: theme.primaryColor }}>{srv.duration}m</span>
                             <span className="font-bold whitespace-nowrap" style={{ color: theme.primaryColor }}>R$ {Number(srv.price).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {dbServices.map((srv: any) => (
                          <div key={srv.id} className={cn("p-6 rounded-3xl flex flex-col justify-between relative shadow-sm border hover:-translate-y-1 transition-transform cursor-default", cardBg, borderColor)}>
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
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Pacotes */}
                {dbPackages.length > 0 && servicesConfig.showPackages !== false && (
                  <div>
                    <h3 className="text-xl font-semibold mb-6 opacity-80">Pacotes</h3>
                    
                    {servicesConfig.packagesDisplay === "pills" ? (
                      <div className="flex flex-wrap gap-3">
                        {dbPackages.map((pkg: any) => (
                          <div key={pkg.id} className={cn("px-5 py-3 rounded-full flex items-center gap-3 border shadow-sm transition-transform hover:-translate-y-1 cursor-default", altBg, borderColor)}>
                             <span className="font-bold text-sm">{pkg.name}</span>
                             <span className="text-xs opacity-50 px-3 border-l" style={{ borderColor: theme.primaryColor }}>{pkg.total_sessions} sessões</span>
                             <span className="font-bold whitespace-nowrap" style={{ color: theme.primaryColor }}>R$ {Number(pkg.price).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {dbPackages.map((pkg: any) => (
                          <div key={pkg.id} className={cn("p-6 rounded-3xl flex items-center justify-between relative shadow-sm border hover:-translate-y-1 transition-transform cursor-default", altBg, borderColor)}>
                            <div>
                              <h4 className="font-bold text-lg">{pkg.name}</h4>
                              <p className="text-sm opacity-70 mt-1">{pkg.total_sessions} sessões</p>
                            </div>
                            <span className="font-bold text-xl" style={{ color: theme.primaryColor }}>
                              R$ {Number(pkg.price).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PROFISSIONAIS */}
          {professionals.length > 0 && (
            <div id="profissionais" className={cn("px-6 sm:px-10 py-12 md:py-24 scroll-mt-20", altBg)}>
              <div className="max-w-5xl mx-auto w-full">
                <h2 className="font-bold text-2xl md:text-4xl mb-12 flex items-center gap-3">
                  <User className="h-8 w-8" style={{ color: theme.primaryColor }} /> Nossa Equipe
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                  {professionals.map((prof: any) => (
                    <div key={prof.id} className="flex flex-col group relative">
                      <div className={cn("w-full aspect-[4/5] rounded-3xl shadow-sm flex items-center justify-center mb-4 overflow-hidden border", cardBg, borderColor)}>
                        {/* Como não tem foto no BD ainda, usamos as iniciais */}
                        <span className="text-4xl font-bold opacity-20">
                          {prof.display_name ? prof.display_name.charAt(0).toUpperCase() : prof.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-start justify-between px-2">
                        <div className="flex flex-col">
                          <h4 className="font-bold text-lg leading-tight">{prof.display_name || "Profissional"}</h4>
                          <p className="text-sm opacity-60 mt-1">Especialista</p>
                        </div>
                        {prof.show_instagram && prof.instagram_url && (
                          <a 
                            href={prof.instagram_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-full bg-pink-500/10 text-pink-600 hover:bg-pink-500/20 transition-colors"
                            title="Instagram"
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

          {/* TESTIMONIALS (Google Reviews Mock for now) */}
          {socialProof.useGoogleReviews && (
            <div className="px-6 sm:px-10 py-12 md:py-24 overflow-hidden">
              <div className="max-w-5xl mx-auto w-full">
                <h2 className="font-bold text-2xl md:text-4xl mb-4 flex items-center gap-3">
                  <Star className="h-8 w-8 text-amber-500" type="solid" /> Avaliações do Google
                </h2>
                <p className="text-base opacity-70 mb-12">Veja o que nossos clientes dizem sobre nós no Google.</p>
                
                <div className="flex gap-6 overflow-x-auto no-scrollbar snap-x pb-8 -mx-6 px-6 sm:mx-0 sm:px-0">
                  {/* Static Mocks for Google Reviews */}
                  {[
                    { name: "Mariana Silva", text: "Excelente atendimento! O espaço é lindo e os profissionais são maravilhosos." },
                    { name: "Roberto Alves", text: "Muito satisfeito com o serviço prestado. Recomendo a todos!" },
                    { name: "Carla Mendes", text: "Lugar muito acolhedor, saí de lá me sentindo renovada." }
                  ].map((testi, i) => (
                    <div key={i} className={cn("w-80 md:w-96 shrink-0 p-8 rounded-3xl shadow-sm snap-center border flex flex-col justify-between", cardBg, borderColor)}>
                      <div>
                        <div className="flex text-amber-400 mb-4 gap-1">
                          <Star className="h-5 w-5" type="solid" /><Star className="h-5 w-5" type="solid" /><Star className="h-5 w-5" type="solid" /><Star className="h-5 w-5" type="solid" /><Star className="h-5 w-5" type="solid" />
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

          {/* VIDEO SECTION */}
          {media.videoUrl && (
            <div className={cn("px-6 sm:px-10 py-12 md:py-24", altBg)}>
              <div className="max-w-5xl mx-auto w-full">
                <h2 className="font-bold text-2xl md:text-4xl mb-12 flex items-center gap-3">
                  <Youtube className="h-8 w-8" style={{ color: theme.primaryColor }} /> Conheça nosso espaço
                </h2>
                <div className="w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src={getYouTubeEmbedUrl(media.videoUrl) || ""} 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          )}

          {/* CONTACT & FORM SECTION */}
          <div id="contato" className="px-6 sm:px-10 py-12 md:py-24 scroll-mt-20">
            <div className="max-w-5xl mx-auto w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                
                {/* Left: Info */}
                <div>
                  <h2 className="font-bold text-2xl md:text-4xl mb-6">Fale Conosco</h2>
                  <p className="text-base opacity-70 mb-10 leading-relaxed">
                    Estamos à disposição para tirar suas dúvidas. Entre em contato conosco pelos canais abaixo ou envie uma mensagem diretamente pelo formulário.
                  </p>

                  <div className="flex flex-col gap-6">
                    {contact.phone && (
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", altBg)}>
                          <Phone className="h-6 w-6" style={{ color: theme.primaryColor }} />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider opacity-50 mb-1">Telefone / WhatsApp</p>
                          <p className="text-lg font-medium">{contact.phone}</p>
                        </div>
                      </div>
                    )}
                    
                    {contact.email && (
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", altBg)}>
                          <Envelope className="h-6 w-6" style={{ color: theme.primaryColor }} />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider opacity-50 mb-1">E-mail</p>
                          <p className="text-lg font-medium">{contact.email}</p>
                        </div>
                      </div>
                    )}

                    {contact.address && (
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 mt-4 hover:opacity-80 transition-opacity"
                      >
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", altBg)}>
                          <Pin className="h-6 w-6" style={{ color: theme.primaryColor }} />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider opacity-50 mb-1">Endereço <span className="lowercase font-normal opacity-70">(Ver no Mapa)</span></p>
                          <p className="text-base opacity-90">{contact.address}</p>
                        </div>
                      </a>
                    )}
                  </div>
                </div>

                {/* Right: Contact Form */}
                <div className={cn("rounded-3xl p-8 border", altBg, borderColor)}>
                  <h3 className="font-bold text-xl mb-6">Envie uma mensagem</h3>
                  {formSent ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center animate-in fade-in zoom-in">
                      <CheckCircle className="h-16 w-16 text-emerald-500 mb-4" />
                      <h4 className="font-bold text-xl mb-2">Mensagem enviada!</h4>
                      <p className="text-sm opacity-70">Agradecemos o contato. Retornaremos em breve no seu e-mail.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleContactSubmit} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold opacity-80">Seu Nome</label>
                        <input required type="text" className={cn("w-full h-12 rounded-xl border px-4 focus:outline-none focus:border-primary", inputBg, borderColor)} placeholder="Como podemos te chamar?" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold opacity-80">Seu E-mail</label>
                        <input required type="email" className={cn("w-full h-12 rounded-xl border px-4 focus:outline-none focus:border-primary", inputBg, borderColor)} placeholder="exemplo@email.com" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold opacity-80">Assunto</label>
                        <input required type="text" className={cn("w-full h-12 rounded-xl border px-4 focus:outline-none focus:border-primary", inputBg, borderColor)} placeholder="Sobre o que deseja falar?" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold opacity-80">Mensagem</label>
                        <textarea required className={cn("w-full min-h-[120px] rounded-xl border p-4 focus:outline-none focus:border-primary resize-none", inputBg, borderColor)} placeholder="Escreva sua mensagem aqui..."></textarea>
                      </div>
                      <button 
                        type="submit" 
                        className="mt-4 w-full h-12 rounded-xl text-white font-bold transition-transform hover:scale-[1.02]"
                        style={{ backgroundColor: theme.primaryColor }}
                      >
                        Enviar Mensagem
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* STRUCTURED FOOTER */}
          <footer className="w-full bg-black text-white pt-16 pb-8 px-6 sm:px-10 mt-auto">
            <div className="max-w-5xl mx-auto w-full">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                <div>
                  <h3 className="font-bold text-2xl mb-4">{org.name}</h3>
                  <p className="text-sm opacity-60 leading-relaxed">
                    Transformando vidas e oferecendo o melhor atendimento para você se sentir especial todos os dias.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-4">Links Rápidos</h4>
                  <div className="flex flex-col gap-2 text-sm opacity-70">
                    <a href="#sobre" className="hover:opacity-100 hover:translate-x-1 transition-all w-fit">Sobre a Clínica</a>
                    <a href="#servicos" className="hover:opacity-100 hover:translate-x-1 transition-all w-fit">Serviços e Pacotes</a>
                    <a href="#profissionais" className="hover:opacity-100 hover:translate-x-1 transition-all w-fit">Nossa Equipe</a>
                    <button onClick={() => setTermsOpen(true)} className="text-left hover:opacity-100 hover:translate-x-1 transition-all w-fit">
                      Termos de Uso
                    </button>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-4">Agendamento</h4>
                  <p className="text-sm opacity-60 mb-4">Agende seu horário online de forma rápida e prática 24 horas por dia.</p>
                  <a 
                    href={bookingUrl}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-black bg-white hover:bg-gray-100 transition-colors w-full sm:w-auto"
                  >
                    Agendar Horário
                  </a>
                </div>
              </div>
              
              <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs opacity-40">
                <p>&copy; {new Date().getFullYear()} {org.name}. Todos os direitos reservados.</p>
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
            {org.settings?.terms_of_use || "Nenhum termo de uso foi cadastrado para esta clínica ainda. As políticas gerais de agendamento e cancelamento se aplicam de acordo com a administração do local."}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

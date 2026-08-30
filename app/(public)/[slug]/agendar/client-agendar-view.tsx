"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn, sanitizeUrl } from "@/lib/utils";
import {
  MapPin,
  Clock,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  CheckCircle2,
  Copy,

} from "lucide-react";
import { Heart, ArrowLeft, ArrowRight, Check, Instagram, Facebook, Youtube, Whatsapp, Globe } from "@boxicons/react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";
import { getAvailableTimesAndProfessionals } from "@/app/actions/availability";
import { PRO_THEMES } from "@/app/(private)/admin/self-service/_components/booking-appearance-settings";

export function ClientAgendarView({ org }: { org: any }) {
  const router = useRouter();
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [packagesOpen, setPackagesOpen] = useState(true);
  const [servicesOpen, setServicesOpen] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [isMounted, setIsMounted] = useState(false);
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
  const [previewFeatures, setPreviewFeatures] = useState<{
    showPackages: boolean;
    showTeam: boolean;
    showTeamLikes: boolean;
    showMostBooked: boolean;
  } | null>(null);
  const [previewGeneral, setPreviewGeneral] = useState<any>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);

  const timeSelectionRef = useRef<HTMLDivElement>(null);

  // Availability State
  const [availableSlots, setAvailableSlots] = useState<Record<string, any[]>>({});
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  // Booking Wizard State
  const [bookingWizardOpen, setBookingWizardOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [bookingData, setBookingData] = useState({
    date: undefined as Date | undefined,
    time: null as string | null,
    firstName: "",
    phone: "",
    email: "",
    professionalId: null as string | null,
    professionalName: null as string | null,
    professionalImage: null as string | null,
    notes: "",
  });

  const handleOpenBooking = (item: any) => {
    setSelectedItem(item);
    setBookingData(prev => ({
      ...prev,
      phone: typeof window !== "undefined" ? localStorage.getItem(`totten_client_phone_${org.slug}`) || "" : "",
      professionalId: selectedProfessional?.id || null,
      professionalName: selectedProfessional?.name || null,
      professionalImage: selectedProfessional?.image_url || null,
    }));
    setBookingStep(1);
    setPolicyAccepted(false);
    setBookingWizardOpen(true);
  };

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const loggedIn = localStorage.getItem(`totten_client_logged_in_${org.slug}`);
      if (loggedIn) setIsLoggedIn(true);
    }

    // Listen for live preview feature updates from admin panel
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "TOTTEN_PREVIEW_FEATURES") {
        setPreviewFeatures(event.data.features);
        if (event.data.general) {
          setPreviewGeneral(event.data.general);
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [org.slug]);

  const tc = (org.link_bio?.theme_config as any) || {};
  const presentation = (org.link_bio?.presentation as any) || {};

  const bookingThemeId = org.settings?.booking_theme || "light";
  const systemTheme = PRO_THEMES.find(t => t.id === bookingThemeId) || PRO_THEMES[0];

  const isDark = systemTheme.id === "dark";

  const theme = {
    primaryColor: systemTheme.primary,
    textColor: systemTheme.txt,
    css: systemTheme.css,
    fontFamily: tc.fontFamily || "Inter, sans-serif",
  };

  const bgClass = systemTheme.css;
  const cardBgClass = isDark ? "bg-white/10 border-white/20 backdrop-blur-md" : "bg-white/80 border-black/10 backdrop-blur-md";
  const textClass = isDark ? "text-white" : "text-slate-900";
  const mutedTextClass = isDark ? "text-white/70" : "text-slate-600";

  const professionals = org.professionals || [];
  const socialLinks = (org.link_bio?.social_links as any) || {};

  const getFilteredServices = () => {
    const allServices = org.services || [];
    if (!selectedProfessional) return allServices;
    if (selectedProfessional.role === "OWNER" && (!selectedProfessional.services || selectedProfessional.services.length === 0)) return allServices;
    return allServices.filter((srv: any) => selectedProfessional.services?.some((ps: any) => ps.id === srv.id));
  };

  const getFilteredPackages = () => {
    const allPackages = org.packageTemplates || [];
    if (!selectedProfessional) return allPackages;
    if (selectedProfessional.role === "OWNER" && (!selectedProfessional.package_templates || selectedProfessional.package_templates.length === 0)) return allPackages;
    return allPackages.filter((pkg: any) => selectedProfessional.package_templates?.some((pp: any) => pp.id === pkg.id));
  };

  const services = getFilteredServices();
  const packageTemplates = getFilteredPackages();

  // Live preview feature flags (from postMessage) override defaults
  const showTeam = previewFeatures ? previewFeatures.showTeam : true;
  const showTeamLikes = previewFeatures ? previewFeatures.showTeamLikes : true;
  const showPackages = previewFeatures ? previewFeatures.showPackages : true;

  // Header Banner
  const profileConfig = (org.link_bio?.profile_config as any) || {};
  const professionalSiteConfig = (org.link_bio?.professional_site_config as any) || {};
  const globalContact = Object.keys(profileConfig.contact || {}).length > 0
    ? profileConfig.contact
    : professionalSiteConfig.contact || {};
  const bannerUrl = profileConfig.bannerImage || org.settings?.cover_image_url || presentation.heroImage;
  return (
    <div className={cn("min-h-screen w-full relative", bgClass, theme.css)} style={{ color: theme.textColor, fontFamily: theme.fontFamily }}>

      {/* Top Navigation Bar / Floating Area do Cliente */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          asChild
          size="sm"
          className="rounded-full shadow-xl text-xs font-bold h-10 px-5 backdrop-blur-md border border-white/20"
          style={{
            backgroundColor: theme.primaryColor,
            color: "#ffffff"
          }}
        >
          <a href={`/${org.slug}/login`}>
            <User className="w-4 h-4 mr-2" /> Área do Cliente
          </a>
        </Button>
      </div>

      {/* Header Banner - Full Width */}
      <header className="w-full h-64 md:h-[520px] relative bg-muted">
        {bannerUrl ? (
          <img src={bannerUrl} alt="Capa" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-slate-200" />
        )}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent" />
      </header>

      {/* Main Content Card - Overlaps Banner */}
      <section className="max-w-4xl mx-auto relative z-10 px-4 md:px-6 -mt-24 md:-mt-32">
        <div className={cn(
          "w-full rounded-t-[2rem] md:rounded-t-[2.5rem] rounded-b-none shadow-2xl border-x border-t border-b-0 flex flex-col relative min-h-[60vh]",
          cardBgClass
        )}>

          {/* Logo and Name */}
          <div className="flex flex-col items-center relative px-6">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background overflow-hidden bg-muted shadow-2xl -mt-16 md:-mt-20">
              {org.link_bio?.profile_image_url ? (
                <img src={org.link_bio.profile_image_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center font-bold text-slate-400 text-2xl">{org.name.charAt(0)}</div>
              )}
            </div>
            <div className="mt-6 md:mt-8 flex flex-col items-center">
              <h1 className="font-black text-2xl md:text-3xl text-center tracking-tight leading-tight">{org.name}</h1>
            </div>
          </div>

          <div className="p-5 md:p-10 space-y-10 md:space-y-12 mt-2">

            {/* Profissionais */}
            {showTeam && professionals.length > 0 && (
              <section>
                <h2 className="font-bold text-lg md:text-xl mb-4">Nossa Equipe</h2>

                <div className="flex overflow-x-auto gap-4 md:gap-6 pb-6 pt-4 scrollbar-hide -mx-5 px-5 md:-mx-10 md:px-10 snap-x">
                  {professionals.map((prof: any) => {
                    const isSelected = selectedProfessional?.id === prof.id;
                    return (
                      <div
                        key={prof.id}
                        className={cn(
                          "flex flex-col items-center gap-3 min-w-[120px] md:min-w-[150px] shrink-0 snap-start cursor-pointer transition-all",
                          isSelected ? "opacity-100" : "opacity-80 hover:opacity-100"
                        )}
                        onClick={() => handleSelectProfessional(prof)}
                      >
                        {/* Foto */}
                        <div className={cn(
                          "w-28 h-36 md:w-36 md:h-48 rounded-[1.5rem] overflow-hidden shadow-lg border bg-muted relative",
                          isSelected ? `ring-4 ring-offset-2 ring-[${theme.primaryColor}]` : ""
                        )}
                          style={isSelected ? { '--tw-ring-color': theme.primaryColor } as any : {}}
                        >
                          {prof.image_url ? (
                            <img
                              src={prof.image_url}
                              alt={prof.name}
                              className="w-full h-full object-cover object-center"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-slate-400 bg-slate-100">
                              {prof.name.charAt(0)}
                            </div>
                          )}
                          <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-[2rem]"></div>
                        </div>

                        {/* Nome + Curtidas */}
                        <div className="flex flex-col items-center gap-1">
                          <span className={cn("text-base md:text-lg font-bold text-center leading-tight tracking-tight", isSelected && "text-primary")} style={isSelected ? { color: theme.primaryColor } : {}}>
                            {prof.name.split(" ")[0]}
                          </span>
                          {prof.profession && (
                            <span className={cn("text-xs font-medium text-center leading-tight uppercase tracking-wider", mutedTextClass)}>
                              {prof.profession}
                            </span>
                          )}
                          <div className="flex items-center gap-1 mt-2 bg-black/5 dark:bg-white/5 py-1 px-3 rounded-full">
                            {showTeamLikes && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isLoggedIn) {
                                    setLikes(prev => ({ ...prev, [prof.id]: !prev[prof.id] }));
                                  }
                                }}
                                className={cn("flex items-center gap-1.5 transition-all hover:scale-110 active:scale-95",
                                  isMounted && likes[prof.id] ? "text-rose-500" : (isDark ? "text-white/40 hover:text-rose-400" : "text-slate-400 hover:text-rose-500"),
                                  isMounted && isLoggedIn ? "cursor-pointer" : "cursor-default"
                                )}
                              >
                                <Heart pack={isMounted && likes[prof.id] ? "filled" : "basic"} className="w-4 h-4 md:w-5 md:h-5" />
                                <span className="text-xs font-bold">{isMounted && likes[prof.id] ? "1" : "0"}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {selectedProfessional && selectedProfessional.bio && (
                  <div className="mt-8 p-6 rounded-2xl bg-muted/50 border shadow-sm animate-fade-up max-w-3xl mx-auto text-center" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                    <h3 className="font-bold text-lg mb-2" style={{ color: theme.primaryColor }}>Sobre {selectedProfessional.name?.split(' ')[0]}</h3>
                    <p className="text-sm opacity-80 leading-relaxed whitespace-pre-wrap">{selectedProfessional.bio}</p>
                  </div>
                )}
              </section>
            )}

            {/* Pacotes e Planos */}
            {showPackages && packageTemplates.length > 0 && (
              <section>
                <div
                  className="flex items-center justify-between mb-4 cursor-pointer select-none"
                  onClick={() => setPackagesOpen(!packagesOpen)}
                >
                  <h2 className="font-bold text-lg">Pacotes e Planos</h2>
                  <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    {packagesOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                {packagesOpen && (
                  <div className="flex flex-col">
                    {packageTemplates.map((pkg: any) => (
                      <div
                        key={pkg.id}
                        className={cn(
                          "py-6 flex flex-col md:flex-row md:items-center justify-between border-b last:border-0 transition-all cursor-pointer gap-4 md:gap-6",
                          isDark ? "border-white/10" : "border-slate-100"
                        )}
                        onClick={() => handleOpenBooking(pkg)}
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg md:text-xl leading-tight tracking-tight">{pkg.name}</h3>
                          {pkg.service?.name && (
                            <p className={cn("text-xs font-semibold uppercase tracking-wider mt-2", mutedTextClass)}>{pkg.service.name} &bull; {pkg.total_sessions} sessões</p>
                          )}
                          {pkg.description && (
                            <p className={cn("text-sm mt-2 line-clamp-2 leading-relaxed", mutedTextClass)}>{pkg.description}</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 mt-2 md:mt-0">
                          <span className="text-xl font-black tracking-tight whitespace-nowrap">
                            R$ {Number(pkg.price).toFixed(2)}
                          </span>
                          <Button
                            className="rounded-xl px-6 h-10 shadow-sm font-bold transition-transform active:scale-95 whitespace-nowrap bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                            onClick={(e) => { e.stopPropagation(); handleOpenBooking(pkg); }}
                          >
                            Agendar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Serviços */}
            {services.length > 0 && (
              <section>
                <div
                  className="flex items-center justify-between mb-4 cursor-pointer select-none"
                  onClick={() => setServicesOpen(!servicesOpen)}
                >
                  <h2 className="font-bold text-lg">Serviços</h2>
                  <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    {servicesOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                {servicesOpen && (
                  <div className="flex flex-col">
                    {services.map((srv: any) => (
                      <div
                        key={srv.id}
                        className={cn(
                          "py-6 flex gap-4 md:gap-6 border-b last:border-0 transition-all cursor-pointer",
                          isDark ? "border-white/10" : "border-slate-100"
                        )}
                        onClick={() => handleOpenBooking(srv)}
                      >
                        {/* Service Image */}
                        <div
                          className="w-24 h-24 md:w-28 md:h-28 shrink-0 rounded-[1.25rem] bg-muted overflow-hidden relative cursor-zoom-in"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (srv.image_url) setLightboxImage(srv.image_url);
                          }}
                        >
                          {srv.image_url ? (
                            <img src={srv.image_url} alt={srv.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Briefcase className="w-8 h-8 opacity-20" />
                            </div>
                          )}
                          <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-[1.25rem]"></div>
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="mb-2">
                            <h3 className="font-bold text-base md:text-lg leading-tight line-clamp-2">{srv.name}</h3>
                            <p className={cn("text-sm line-clamp-2 mt-1 leading-relaxed", mutedTextClass)}>
                              {srv.description || "Agende este serviço agora mesmo."}
                            </p>
                          </div>

                          <div className="mt-auto flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                            <div className="flex items-center gap-3">
                              <span className="text-lg md:text-xl font-black tracking-tight whitespace-nowrap">
                                R$ {Number(srv.price).toFixed(2)}
                              </span>
                              <span className={cn("text-xs flex items-center gap-1 font-medium whitespace-nowrap", mutedTextClass)}>
                                &bull; <Clock className="w-3.5 h-3.5 shrink-0" /> {srv.duration} min
                              </span>
                            </div>

                            <Button
                              className="rounded-xl px-6 h-10 w-full md:w-auto shadow-sm font-bold transition-transform active:scale-95 whitespace-nowrap shrink-0 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                              onClick={(e) => { e.stopPropagation(); handleOpenBooking(srv); }}
                            >
                              Agendar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Avaliações (apenas clientes logados) */}
            {isMounted && isLoggedIn && (
              <section className={cn("p-4 rounded-2xl border", cardBgClass)}>
                <h2 className="font-bold text-lg mb-3">Avaliações</h2>
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <span className={cn("text-sm", mutedTextClass)}>Nenhuma avaliação encontrada.</span>
                  <button className={cn("mt-4 px-4 py-2 rounded-full text-sm font-medium transition-transform active:scale-95", "bg-slate-900 text-white dark:bg-white dark:text-slate-900")}>
                    Deixar Avaliação
                  </button>
                </div>
              </section>
            )}

            {/* Localização e Contato Global */}
            {(globalContact.address || globalContact.businessHours) && (
              <section className={cn("p-4 rounded-2xl border", cardBgClass)}>
                <h2 className="font-bold text-lg mb-3">Localização e Contato</h2>

                {globalContact.address && (
                  <div className="flex items-start gap-3 mb-4">
                    <MapPin className={cn("w-5 h-5 mt-0.5 shrink-0", mutedTextClass)} />
                    <div>
                      <p className="text-sm font-medium">{globalContact.address}</p>
                      {globalContact.mapUrl && sanitizeUrl(globalContact.mapUrl) && (
                        <a href={sanitizeUrl(globalContact.mapUrl)} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 inline-block">
                          Ver no mapa
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {globalContact.businessHours && globalContact.showBusinessHoursBooking !== false && (
                  <div className="flex items-start gap-3">
                    <Clock className={cn("w-5 h-5 mt-0.5 shrink-0", mutedTextClass)} />
                    <div>
                      <p className="text-sm font-medium">Horário de Funcionamento</p>
                      <p className={cn("text-xs mt-1", mutedTextClass)}>{globalContact.businessHours}</p>
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Simple Footer */}
          <footer className="p-6 pb-10 border-t mt-auto flex flex-col items-center gap-4" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
            {socialLinks?.activePlatforms?.length > 0 && (
              <div className="flex gap-3 flex-wrap justify-center">
                {(socialLinks.activePlatforms || []).filter((platform: string) => socialLinks.visibility?.[platform]?.booking).map((platform: string, i: number) => {
                  let Icon = Globe;
                  if (platform === "whatsapp") Icon = Whatsapp;
                  if (platform === "instagram") Icon = Instagram;
                  if (platform === "facebook") Icon = Facebook;
                  if (platform === "youtube") Icon = Youtube;

                  const val = platform === "whatsapp" ? (globalContact?.phone || socialLinks.values?.[platform]) : socialLinks.values?.[platform];

                  const getHref = (p: string, v: string) => {
                    if (!v) return "#";
                    if (p === "whatsapp") {
                      let number = v.replace(/\D/g, "");
                      if (number.length === 10 || number.length === 11) number = `55${number}`;
                      return `https://wa.me/${number}`;
                    }
                    if (p === "instagram") return v.includes("instagram.com") ? v : `https://instagram.com/${v.replace("@", "")}`;
                    if (p === "facebook") return v.includes("facebook.com") ? v : `https://facebook.com/${v}`;
                    if (p === "youtube") return v.includes("youtube.com") ? v : `https://youtube.com/${v}`;
                    if (v.startsWith("http")) return v;
                    return `https://${v}`;
                  };

                  return (
                    <a
                      key={i}
                      href={sanitizeUrl(getHref(platform, val))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center transition-colors"
                      title={platform}
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            )}
            <p className="text-center text-xs opacity-50 font-medium">
              &copy; {new Date().getFullYear()} {org.name}. Todos os direitos reservados.
            </p>
          </footer>
        </div>
      </section>

      {/* Lightbox Modal */}
      <Dialog open={!!lightboxImage} onOpenChange={(open) => !open && setLightboxImage(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none flex items-center justify-center">
          <DialogTitle className="sr-only">Visualizar Imagem</DialogTitle>
          {lightboxImage && (
            <img src={lightboxImage || undefined} alt="Imagem ampliada" className="w-full h-auto max-h-[85vh] object-contain rounded-md" />
          )}
        </DialogContent>
      </Dialog>

      {/* Booking Wizard Modal */}
      <Dialog open={bookingWizardOpen} onOpenChange={(open) => !open && setBookingWizardOpen(false)}>
        <DialogContent className={cn("w-full max-w-none m-0 sm:max-w-[425px] p-0 overflow-hidden flex flex-col h-[100dvh] sm:h-[650px] border-0 rounded-none sm:rounded-2xl", isDark ? "bg-[#0f172a] text-white sm:border-white/10" : "bg-white text-slate-900 sm:border-black/10")} style={{ color: theme.textColor }}>

          {/* Header */}
          <div className="shrink-0 p-4 border-b flex items-center justify-between" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
            <div className="flex items-center gap-3">
              {bookingStep > 1 && (
                <button
                  onClick={() => setBookingStep(bookingStep - 1)}
                  className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <DialogTitle className="text-lg font-bold">
                {bookingStep === 1 && "Selecione o Horário"}
                {bookingStep === 2 && "Seus Dados"}
                {bookingStep === 3 && "Revisão do Agendamento"}
                {bookingStep === 4 && "Pagamento Antecipado"}
              </DialogTitle>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">

            {/* STEP 1: Date & Time */}
            {bookingStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="bg-muted/50 p-4 rounded-xl flex items-center gap-3 border" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                  <Calendar className="w-6 h-6 opacity-50" />
                  <div>
                    <p className="font-bold text-sm">Serviço/Pacote Selecionado</p>
                    <p className="text-xs opacity-70">{selectedItem?.name}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold">Selecione uma Data</h3>
                  <div className="bg-card overflow-hidden -mx-2">
                    <CalendarComponent
                      mode="single"
                      selected={bookingData.date}
                      onSelect={async (date) => {
                        setBookingData({
                          ...bookingData,
                          date,
                          time: null,
                          professionalId: selectedProfessional?.id || null,
                          professionalName: selectedProfessional?.name || null,
                          professionalImage: selectedProfessional?.image_url || null
                        });
                        if (!date) {
                          setAvailableSlots({});
                          return;
                        }

                        setIsLoadingAvailability(true);
                        const formattedDate = format(date, "yyyy-MM-dd");
                        // Asumindo que selectedItem tem um id de serviço
                        const res = await getAvailableTimesAndProfessionals(org.slug, selectedItem?.id || selectedItem?.service?.id, formattedDate);

                        if (res.success && res.availableSlots) {
                          let finalSlots = res.availableSlots;
                          if (selectedProfessional) {
                            const filteredSlots: Record<string, any[]> = {};
                            for (const time in finalSlots) {
                              const prosAtTime = finalSlots[time];
                              const hasProf = prosAtTime.some((p: any) => p.id === selectedProfessional.id);
                              if (hasProf) {
                                filteredSlots[time] = prosAtTime.filter((p: any) => p.id === selectedProfessional.id);
                              }
                            }
                            finalSlots = filteredSlots;
                          }
                          setAvailableSlots(finalSlots);
                        } else {
                          setAvailableSlots({});
                        }

                        setIsLoadingAvailability(false);

                        setTimeout(() => {
                          timeSelectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                      }}
                      locale={ptBR}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      className="w-full flex justify-center [&_.rdp]:w-full [&_.rdp-months]:w-full [&_.rdp-month]:w-full [&_.rdp-table]:w-full [&_.rdp-table_th]:font-medium [&_.rdp-table_th]:text-muted-foreground [&_.rdp-day]:w-full [&_.rdp-day]:h-12"
                    />
                  </div>
                </div>

                {bookingData.date && (
                  <div className="space-y-3 animate-in fade-in pt-4" ref={timeSelectionRef}>
                    <h3 className="font-bold">Horários Disponíveis</h3>
                    {isLoadingAvailability ? (
                      <div className="flex justify-center p-6"><div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin opacity-50"></div></div>
                    ) : Object.keys(availableSlots).length === 0 ? (
                      <div className="p-4 bg-muted/50 rounded-xl text-center text-sm opacity-70 border" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>Nenhum horário disponível para esta data.</div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {Object.keys(availableSlots).sort().map(time => {
                          const isSelected = bookingData.time === time;
                          return (
                            <button
                              key={time}
                              onClick={() => {
                                const nextProfId = selectedProfessional ? selectedProfessional.id : null;
                                const nextProfName = selectedProfessional ? selectedProfessional.name : null;
                                const nextProfImage = selectedProfessional ? selectedProfessional.image_url : null;
                                setBookingData({ ...bookingData, time, professionalId: nextProfId, professionalName: nextProfName, professionalImage: nextProfImage });
                              }}
                              className={cn(
                                "relative py-3 rounded-xl text-sm font-bold border text-center transition-all overflow-hidden",
                                isSelected ? "shadow-md scale-[1.02]" : "bg-transparent hover:bg-black/5 dark:hover:bg-white/5"
                              )}
                              style={isSelected ? { backgroundColor: theme.primaryColor, color: tc.buttonText || "#fff", borderColor: theme.primaryColor } : { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }}
                            >
                              {isSelected && (
                                <div className="absolute inset-0 flex items-center justify-between px-3" style={{ backgroundColor: theme.primaryColor }}>
                                  <span className="flex-1 text-center font-black text-base">{time}</span>
                                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                                </div>
                              )}
                              <span className={cn(isSelected && "invisible")}>{time}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Seleção de Profissional (Aparece após selecionar o horário) */}
                {bookingData.time && availableSlots[bookingData.time] && !selectedProfessional && (
                  <div className="space-y-3 animate-in fade-in pt-4 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                    <h3 className="font-bold">Com quem você deseja agendar?</h3>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={() => setBookingData({ ...bookingData, professionalId: "ANY", professionalName: "Qualquer Profissional", professionalImage: null })}
                        className={cn(
                          "relative p-3 rounded-xl flex items-center gap-3 border text-left transition-all overflow-hidden",
                          bookingData.professionalId === "ANY" ? "shadow-md scale-[1.02] ring-2 ring-offset-2" : "bg-transparent hover:bg-black/5 dark:hover:bg-white/5"
                        )}
                        style={(bookingData.professionalId === "ANY" ? { borderColor: theme.primaryColor, "--tw-ring-color": theme.primaryColor, "--tw-ring-offset-color": isDark ? '#0f172a' : '#ffffff' } : { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }) as React.CSSProperties}
                      >
                        <div className="w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0 border flex items-center justify-center opacity-50" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                          <User className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">Qualquer Profissional</p>
                          <p className="text-xs opacity-70">Escolha automática (Aleatório)</p>
                        </div>
                        {bookingData.professionalId === "ANY" && <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: theme.primaryColor }} />}
                      </button>

                      {availableSlots[bookingData.time].map((pro: any) => {
                        const isSelected = bookingData.professionalId === pro.id;
                        return (
                          <button
                            key={pro.id}
                            onClick={() => setBookingData({ ...bookingData, professionalId: pro.id, professionalName: pro.name, professionalImage: pro.image_url })}
                            className={cn(
                              "relative p-3 rounded-xl flex items-center gap-3 border text-left transition-all overflow-hidden",
                              isSelected ? "shadow-md scale-[1.02] ring-2 ring-offset-2" : "bg-transparent hover:bg-black/5 dark:hover:bg-white/5"
                            )}
                            style={(isSelected ? { borderColor: theme.primaryColor, "--tw-ring-color": theme.primaryColor, "--tw-ring-offset-color": isDark ? '#0f172a' : '#ffffff' } : { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }) as React.CSSProperties}
                          >
                            <div className="w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0 border" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                              {pro.image_url ? (
                                <img src={pro.image_url} alt={pro.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center opacity-50"><User className="w-5 h-5" /></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm truncate">{pro.name}</p>
                            </div>
                            {isSelected && <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: theme.primaryColor }} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Client Data */}
            {bookingStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <p className="text-sm opacity-70">Preencha seus dados para prosseguir com o agendamento.</p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input
                      value={bookingData.firstName}
                      onChange={e => setBookingData({ ...bookingData, firstName: e.target.value })}
                      placeholder="Seu nome"
                      className={cn(isDark ? "bg-black/20 border-white/10" : "")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp</Label>
                    <Input
                      value={bookingData.phone}
                      onChange={e => setBookingData({ ...bookingData, phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                      className={cn(isDark ? "bg-black/20 border-white/10" : "")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <Input
                      type="email"
                      value={bookingData.email || ""}
                      onChange={e => setBookingData({ ...bookingData, email: e.target.value })}
                      placeholder="seu.email@exemplo.com"
                      className={cn(isDark ? "bg-black/20 border-white/10" : "")}
                    />
                    <p className="text-xs opacity-70">Necessário para acessar sua área do cliente no futuro.</p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Review */}
            {bookingStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-5">

                  <div className="flex justify-between items-start border-b pb-5" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Resumo do Serviço</p>
                      <p className="font-bold text-lg leading-tight">{selectedItem?.name}</p>
                      <div className="flex items-center gap-2 mt-2 opacity-80">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{bookingData.date ? format(bookingData.date, "dd 'de' MMMM", { locale: ptBR }) : ""} às {bookingData.time}</span>
                      </div>
                      {bookingData.professionalName && (
                        <div className="flex items-center gap-2 mt-1 opacity-80">
                          <User className="w-4 h-4" />
                          <span className="text-sm">Com {bookingData.professionalName}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-1">Valor</p>
                      <span className="font-black text-xl">
                        R$ {Number(selectedItem?.price || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-1">Cliente</p>
                      <p className="text-sm font-medium flex items-center gap-2"><User className="w-3 h-3" /> {bookingData.firstName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-1">WhatsApp</p>
                      <p className="text-sm font-medium">{bookingData.phone}</p>
                    </div>
                  </div>

                  {previewGeneral?.requirePrepayment !== false && (
                    <div className="bg-amber-100 text-amber-900 p-4 rounded-none border-l-4 border-amber-500 text-sm flex items-start gap-3 dark:bg-amber-900/30 dark:text-amber-200">
                      <p>
                        Será necessário realizar o <strong>pagamento antecipado de 50%</strong> do valor via PIX na próxima tela para confirmar a reserva do seu horário.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2 pt-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider opacity-60">Observações (Opcional)</Label>
                    <Textarea
                      value={bookingData.notes}
                      onChange={e => setBookingData({ ...bookingData, notes: e.target.value })}
                      placeholder="Algum detalhe importante? Ex: Chegarei 5 min atrasado..."
                      className={cn("h-20 resize-none", isDark ? "bg-black/20 border-white/10" : "")}
                    />
                  </div>

                  {/* Política de Cancelamento */}
                  <div className="space-y-3 pt-4 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                    <Label className="text-xs font-bold uppercase tracking-wider opacity-80">Política de Cancelamento</Label>
                    <div className="text-xs p-4 rounded-xl border bg-muted/30 overflow-y-auto max-h-32 whitespace-pre-wrap leading-relaxed">
                      {previewGeneral?.termsText || `Política de Cancelamento\n\n• Cancelamentos ou remarcações devem ser feitos com no mínimo 24 horas de antecedência.\n• Em caso de atraso, o atendimento poderá ser reduzido ou cancelado, respeitando o tempo da agenda.\n• Em situações excepcionais, cada caso será avaliado com carinho.`}
                      {previewGeneral?.requirePrepayment !== false && (
                        <span className="font-bold block mt-3">
                          • A taxa de sinal não é reembolsável em casos de cancelamento fora do prazo ou não comparecimento.
                        </span>
                      )}
                    </div>

                    <label className="flex items-start gap-3 p-4 bg-muted/40 cursor-pointer hover:bg-muted/60 transition-colors mt-2">
                      <div className="mt-0.5">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded"
                          checked={policyAccepted}
                          onChange={(e) => setPolicyAccepted(e.target.checked)}
                          style={{ accentColor: theme.primaryColor }}
                        />
                      </div>
                      <span className="text-sm font-medium leading-tight">Declaro que li e concordo com a política de cancelamento</span>
                    </label>
                  </div>

                </div>
              </div>
            )}

            {/* STEP 4: Payment */}
            {bookingStep === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 text-center">

                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <h3 className="font-bold text-xl">Quase lá!</h3>
                <p className="text-sm opacity-70 px-4">
                  Transfira a metade do serviço via PIX para a chave abaixo para confirmar seu agendamento.
                </p>

                <div className="bg-muted/20 py-8 border-y my-6">
                  <p className="text-sm font-medium opacity-70 mb-1">Valor a pagar agora</p>
                  <p className="text-4xl font-black mb-8 tracking-tight text-slate-900 dark:text-white">
                    R$ {(Number(selectedItem?.price || 0) / 2).toFixed(2)}
                  </p>

                  <p className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-2">Chave PIX (Telefone/Email/CPF)</p>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={previewGeneral?.pixKey || "(00) 00000-0000"}
                      className={cn("font-mono text-center", isDark ? "bg-black/40 border-white/10" : "bg-white")}
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      className={cn("shrink-0 transition-colors", copiedPix ? "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500" : "")}
                      onClick={() => {
                        setCopiedPix(true);
                        setTimeout(() => setCopiedPix(false), 2000);
                      }}
                    >
                      {copiedPix ? <Check className="w-5 h-5" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="text-left bg-blue-50 text-blue-900 p-5 text-sm mx-4 mb-6 dark:bg-blue-950/40 dark:text-blue-200 whitespace-pre-wrap border-l-4 border-blue-500 leading-relaxed shadow-sm">
                  {previewGeneral?.paymentInstructions || `Agendamento confirmado com sucesso!\n\nRecebi seu pagamento e seu horário está oficialmente reservado.\n\nPeço, por gentileza, que chegue no horário agendado. Para manter a organização da agenda e não prejudicar os atendimentos seguintes, não tolero atrasos.\n\nEm caso de atraso, o atendimento poderá ser reduzido, remarcado ou cancelado, conforme a disponibilidade do dia.\n\nAgradeço pela compreensão e estou ansiosa para atender você!`}
                </div>

                <div className="px-4">
                  <a
                    href={`https://wa.me/${globalContact?.phone?.replace(/\D/g, '') || ""}?text=Ol%C3%A1%2C%20fiz%20um%20agendamento%20para%20o%20dia%20${bookingData.date ? format(bookingData.date, "dd/MM/yyyy") : ""}%20%C3%A0s%20${bookingData.time}%20${bookingData.professionalName ? `com%20${bookingData.professionalName}%20` : ""}e%20aqui%20est%C3%A1%20meu%20comprovante%3A`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center rounded-xl h-14 font-bold mb-6 bg-[#25D366] hover:bg-[#25D366]/90 text-white transition-colors shadow-lg shadow-[#25D366]/20"
                  >
                    Enviar comprovante via WhatsApp
                  </a>
                </div>

                {/* Re-exibir Política no finalzinho */}
                <div className="px-4 text-left">
                  <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2">Lembrete</p>
                  <div className="text-xs p-4 rounded-xl border bg-muted/30 overflow-y-auto max-h-32 whitespace-pre-wrap leading-relaxed opacity-80">
                    {previewGeneral?.termsText || `Política de Cancelamento\n\n• Cancelamentos ou remarcações devem ser feitos com no mínimo 24 horas de antecedência.\n• A taxa de sinal não é reembolsável em casos de cancelamento fora do prazo ou não comparecimento.\n• Em caso de atraso, o atendimento poderá ser reduzido ou cancelado, respeitando o tempo da agenda.\n• O não comparecimento sem aviso implica na perda do sinal.\n• Em situações excepcionais, cada caso será avaliado com carinho.`}
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div className="shrink-0 p-4 border-t flex flex-col gap-3" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
            {bookingStep === 1 && (
              <Button
                onClick={() => setBookingStep(2)}
                disabled={!bookingData.date || !bookingData.time || !bookingData.professionalId}
                className="w-full h-12 rounded-xl font-bold"
                style={(!bookingData.date || !bookingData.time || !bookingData.professionalId) ? {} : { backgroundColor: theme.primaryColor, color: tc.buttonText || "#fff" }}
              >
                Próximo <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            )}

            {bookingStep === 2 && (
              <Button
                onClick={() => setBookingStep(3)}
                disabled={!bookingData.firstName || !bookingData.phone || !bookingData.email}
                className="w-full h-12 rounded-xl font-bold"
                style={(!bookingData.firstName || !bookingData.phone || !bookingData.email) ? {} : { backgroundColor: theme.primaryColor, color: tc.buttonText || "#fff" }}
              >
                Próximo <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            )}

            {bookingStep === 3 && (
              <Button
                onClick={() => {
                  if (previewGeneral?.requirePrepayment !== false) {
                    setBookingStep(4);
                  } else {
                    const profNameText = bookingData.professionalName ? `%0AProfissional%3A%20${bookingData.professionalName}` : "";
                    const waUrl = `https://wa.me/${globalContact?.phone?.replace(/\D/g, '') || ""}?text=Ol%C3%A1%2C%20gostaria%20de%20agendar%20o%20servi%C3%A7o%20*${selectedItem?.name}*%20para%20o%20dia%20*${bookingData.date ? format(bookingData.date, "dd/MM/yyyy") : ""}*%20%C3%A0s%20*${bookingData.time}*.%0A%0AMeus%20dados%3A%0ANome%3A%20${bookingData.firstName}%0ATelefone%3A%20${bookingData.phone}${profNameText}`;
                    window.open(waUrl, '_blank');
                    setBookingWizardOpen(false);
                  }
                }}
                disabled={!policyAccepted}
                className="w-full h-12 rounded-xl font-bold text-base"
                style={!policyAccepted ? {} : { backgroundColor: theme.primaryColor, color: tc.buttonText || "#fff" }}
              >
                {previewGeneral?.requirePrepayment !== false ? "Confirmar" : "Confirmar pelo WhatsApp"}
              </Button>
            )}

            {bookingStep === 4 && (
              <Button
                onClick={() => { setBookingWizardOpen(false); }}
                variant="outline"
                className="w-full h-12 rounded-xl font-bold"
              >
                Fechar
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

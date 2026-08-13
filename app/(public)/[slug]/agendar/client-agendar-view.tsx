"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MapPin,
  Clock,
  Briefcase,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Heart } from "@boxicons/react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";


export function ClientAgendarView({ org }: { org: any }) {
  const router = useRouter();
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [packagesOpen, setPackagesOpen] = useState(true);
  const [servicesOpen, setServicesOpen] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const loggedIn = localStorage.getItem(`totten_client_logged_in_${org.slug}`);
      if (loggedIn) setIsLoggedIn(true);
    }
  }, [org.slug]);

  const tc = (org.link_bio?.theme_config as any) || {};
  const presentation = (org.link_bio?.presentation as any) || {};

  const theme = {
    primaryColor: tc.buttonBg || "#0f172a",
    textColor: tc.textColor || "#0f172a",
    css: tc.css || "",
  };

  const isDark = theme.css?.includes("900") || theme.css?.includes("black") || theme.css?.includes("slate-950");

  const bgClass = isDark ? "bg-[#0f172a]" : "bg-slate-50";
  const cardBgClass = isDark ? "bg-white/5 border-white/10" : "bg-white border-black/5";
  const textClass = isDark ? "text-white" : "text-slate-900";
  const mutedTextClass = isDark ? "text-white/60" : "text-slate-500";

  const professionals = org.professionals || [];
  const services = org.services || [];
  const packageTemplates = org.packageTemplates || [];

  // Header Banner
  const profileConfig = (org.link_bio?.profile_config as any) || {};
  const professionalSiteConfig = (org.link_bio?.professional_site_config as any) || {};
  const globalContact = Object.keys(profileConfig.contact || {}).length > 0
    ? profileConfig.contact
    : professionalSiteConfig.contact || {};
  const bannerUrl = profileConfig.bannerImage || org.settings?.cover_image_url || presentation.heroImage;

  return (
    <div className={cn("flex justify-center h-screen overflow-hidden w-full", bgClass, theme.css)} style={{ color: theme.textColor }}>

      {/* Mobile-like Container for Desktop */}
      <div className={cn(
        "w-full max-w-md h-full flex flex-col relative overflow-hidden",
        "md:my-auto md:h-[90vh] md:rounded-[2rem] md:shadow-2xl md:border",
        cardBgClass
      )}>

        {/* Top Navigation Bar */}
        <div className="shrink-0 z-50 px-4 py-3 flex items-center justify-end border-b backdrop-blur-md" style={{ backgroundColor: isDark ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.8)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
          <Button
            asChild
            size="sm"
            className="rounded-full text-xs font-bold h-8 px-4"
            style={{
              backgroundColor: theme.primaryColor,
              color: tc.buttonText || "#ffffff"
            }}
          >
            <a href={`/${org.slug}/login`}>
              Área do Cliente
            </a>
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide pb-24">

          {/* Cover Image or Header */}
          {bannerUrl ? (
            <div className="w-full h-56 relative bg-muted shrink-0">
              <img src={bannerUrl} alt="Capa" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3 text-white">
                <div className="w-16 h-16 rounded-full border-2 border-white overflow-hidden bg-white shrink-0">
                  {org.link_bio?.profile_image_url ? (
                    <img src={org.link_bio.profile_image_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-200" />
                  )}
                </div>
                <div className="pb-1 flex-1 min-w-0">
                  <h1 className="font-bold text-xl leading-tight truncate">{org.name}</h1>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full px-5 pt-6 pb-2 flex items-center gap-4 shrink-0">
              <div className="w-16 h-16 rounded-full border-2 overflow-hidden shrink-0" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                {org.link_bio?.profile_image_url ? (
                  <img src={org.link_bio.profile_image_url} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-bold text-xl leading-tight truncate">{org.name}</h1>
              </div>
            </div>
          )}

          <div className="p-5 space-y-8">

            {/* Profissionais */}
            {professionals.length > 0 && (
              <section>
                <h2 className="font-bold text-lg mb-4">Nossa Equipe</h2>

                <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide -mx-5 px-5">
                  {professionals.map((prof: any) => (
                    <div
                      key={prof.id}
                      className="flex flex-col items-center gap-2.5 min-w-[96px] shrink-0"
                    >
                      {/* Foto */}
                      <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-md bg-muted relative">
                        {prof.image_url ? (
                          <img
                            src={prof.image_url}
                            alt={prof.name}
                            className="w-full h-full object-cover transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-slate-400 bg-slate-100">
                            {prof.name.charAt(0)}
                          </div>
                        )}
                      </div>

                      {/* Nome + Curtidas */}
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-xs font-semibold text-center leading-tight">
                          {prof.name.split(" ")[0]}
                        </span>
                        {prof.profession && (
                          <span className={cn("text-[10px] text-center leading-tight", mutedTextClass)}>
                            {prof.profession}
                          </span>
                        )}
                        <div className="flex items-center gap-1 mt-0.5">
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isLoggedIn) {
                                setLikes(prev => ({ ...prev, [prof.id]: !prev[prof.id] }));
                              }
                            }}
                            className={cn("flex items-center gap-1 transition-colors", 
                              isMounted && likes[prof.id] ? "text-rose-500" : (isDark ? "text-white/40" : "text-slate-300"),
                              isMounted && isLoggedIn ? "hover:text-rose-500 cursor-pointer" : "cursor-default"
                            )}
                          >
                            <Heart pack={isMounted && likes[prof.id] ? "filled" : "basic"} className="w-4 h-4" />
                            <span className="text-[10px]">{isMounted && likes[prof.id] ? "1" : "0"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Pacotes e Planos */}
            {packageTemplates.length > 0 && (
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
                  <div className="space-y-3">
                    {packageTemplates.map((pkg: any) => (
                    <div
                      key={pkg.id}
                      className={cn(
                        "rounded-2xl p-4 flex items-center justify-between border shadow-sm transition-all cursor-pointer gap-3",
                        isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-100"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm">{pkg.name}</h3>
                        {pkg.service?.name && (
                          <p className={cn("text-[11px] mt-0.5", mutedTextClass)}>{pkg.service.name} &bull; {pkg.total_sessions} sessões</p>
                        )}
                        {pkg.description && (
                          <p className={cn("text-xs mt-1 line-clamp-1", mutedTextClass)}>{pkg.description}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-sm font-bold" style={{ color: theme.primaryColor }}>
                          R$ {Number(pkg.price).toFixed(2)}
                        </span>
                        {pkg.validity_days && (
                          <span className={cn("text-[10px] flex items-center gap-1 mt-0.5", mutedTextClass)}>
                            <Clock className="w-3 h-3" /> {pkg.validity_days} dias
                          </span>
                        )}
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
                  <div className="space-y-3">
                    {services.map((srv: any) => (
                    <div
                      key={srv.id}
                      className={cn(
                        "rounded-2xl p-3 flex gap-3 border shadow-sm transition-all cursor-pointer",
                        isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-100"
                      )}
                    >
                      {/* Service Image */}
                      <div
                        className="w-20 h-20 shrink-0 rounded-xl bg-muted overflow-hidden relative cursor-zoom-in"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (srv.image_url) setLightboxImage(srv.image_url);
                        }}
                      >
                        {srv.image_url ? (
                          <img src={srv.image_url} alt={srv.name} className="w-full h-full object-cover transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Briefcase className="w-6 h-6 opacity-20" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 py-1 flex flex-col">
                        <h3 className="font-bold text-sm truncate">{srv.name}</h3>
                        <p className={cn("text-xs line-clamp-2 mt-0.5", mutedTextClass)}>
                          {srv.description || "Agende este serviço agora mesmo."}
                        </p>

                        <div className="mt-auto flex items-center justify-between pt-2">
                          <span className="text-sm font-bold" style={{ color: theme.primaryColor }}>
                            R$ {Number(srv.price).toFixed(2)}
                          </span>
                          <span className={cn("text-xs flex items-center gap-1", mutedTextClass)}>
                            <Clock className="w-3 h-3" /> {srv.duration} min
                          </span>
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
                      {globalContact.mapUrl && (
                        <a href={globalContact.mapUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 inline-block">
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
          <footer className="mt-8 py-6 text-center text-xs opacity-50 border-t border-current/10">
            <p>© {new Date().getFullYear()} {org.name}</p>
          </footer>
        </div>
      </div>

      {/* Lightbox Modal */}
      <Dialog open={!!lightboxImage} onOpenChange={(open) => !open && setLightboxImage(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none flex items-center justify-center">
          <DialogTitle className="sr-only">Visualizar Imagem</DialogTitle>
          {lightboxImage && (
            <img src={lightboxImage || undefined} alt="Imagem ampliada" className="w-full h-auto max-h-[85vh] object-contain rounded-md" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

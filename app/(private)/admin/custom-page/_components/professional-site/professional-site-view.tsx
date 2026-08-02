"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Save, ChevronRight, ChevronLeft, MapAlt, Star, Briefcase } from "@boxicons/react";
import { cn } from "@/lib/utils";

// Importando as seções recém-criadas
import { ProPresentation } from "./pro-presentation";
import { ProServices } from "./pro-services";
import { ProMedia } from "./pro-media";
import { ProSocialProof } from "./pro-social-proof";
import { ProContact } from "./pro-contact";
import { ProTheme } from "./pro-theme";

export function ProfessionalSiteView() {
  const [currentStep, setCurrentStep] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Estados dos formulários do Site Profissional
  const [presentation, setPresentation] = useState({ headline: "", subheadline: "", bio: "", heroImage: "" });
  const [services, setServices] = useState({ ctaText: "", ctaLink: "", servicesList: [] as any[] });
  const [media, setMedia] = useState({});
  const [socialProof, setSocialProof] = useState({ testimonials: [] as any[] });
  const [contact, setContact] = useState({ address: "", mapUrl: "", phone: "", email: "" });
  const [theme, setTheme] = useState({ id: "light", css: "bg-slate-50", textColor: "#0f172a", primaryColor: "#0f172a", headerStyle: "center" });

  const STEPS = [
    { id: "presentation", title: "Apresentação", component: <ProPresentation data={presentation} onChange={setPresentation} /> },
    { id: "services", title: "Serviços", component: <ProServices data={services} onChange={setServices} /> },
    { id: "media", title: "Galeria e Mídia", component: <ProMedia data={media} onChange={setMedia} /> },
    { id: "social-proof", title: "Depoimentos", component: <ProSocialProof data={socialProof} onChange={setSocialProof} /> },
    { id: "contact", title: "Contato", component: <ProContact data={contact} onChange={setContact} /> },
    { id: "theme", title: "Aparência", component: <ProTheme data={theme} onChange={setTheme} /> },
  ];

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
  };
  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) handleNext();
    if (touchStart - touchEnd < -75) handlePrev();
  };

  // Mobile Preview específico do Site Profissional
  const ProSiteMockup = () => (
    <div className="w-[320px] h-[650px] bg-black rounded-[3rem] border-8 border-black shadow-2xl relative overflow-hidden ring-1 ring-border/20 mx-auto">
      <div className="absolute top-0 inset-x-0 h-6 bg-black z-20 rounded-b-2xl w-40 mx-auto" />
      
      <div className={cn("w-full h-full flex flex-col pb-8 relative z-10 transition-colors duration-500 overflow-y-auto no-scrollbar", theme.css)} style={{ color: theme.textColor }}>
        
        {/* HERO / HEADER SECTION */}
        <div className="relative w-full">
          {presentation.heroImage ? (
            <div className="w-full h-64 relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={presentation.heroImage} 
                alt="Hero" 
                className="w-full h-full object-cover"
                style={{
                  WebkitMaskImage: "linear-gradient(to top, transparent 0%, black 60%)",
                  maskImage: "linear-gradient(to top, transparent 0%, black 60%)"
                }}
              />
            </div>
          ) : (
            <div className="w-full pt-12 pb-4 flex items-center justify-center">
              <div className="w-20 h-20 bg-muted/20 rounded-full shrink-0 shadow-sm border border-border/10" />
            </div>
          )}
          
          <div className={cn(
            "px-6 relative z-10 flex flex-col pb-6", 
            presentation.heroImage ? "-mt-24" : "",
            theme.headerStyle === "center" ? "text-center items-center" : "text-left items-start"
          )}>
            <h1 className="font-bold text-2xl leading-tight drop-shadow-sm">
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
                <div key={i} className="p-4 rounded-xl bg-foreground/5 flex flex-col gap-1">
                  <div className="flex justify-between items-start font-semibold">
                    <span>{srv.title || "Serviço"}</span>
                    <span style={{ color: theme.primaryColor }}>{srv.price}</span>
                  </div>
                  <p className="text-xs opacity-70 mt-1">{srv.description}</p>
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

        {/* CONTACT SECTION */}
        {(contact.address || contact.phone) && (
          <div className="px-6 py-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <MapAlt className="h-5 w-5" /> Onde Estamos
            </h2>
            {contact.address && <p className="text-sm opacity-80 mb-4">{contact.address}</p>}
            {contact.mapUrl && (
              <div className="w-full h-32 bg-muted/20 rounded-xl overflow-hidden mb-4 border border-border/10 flex items-center justify-center text-xs opacity-50">
                Mapa (Prévia)
              </div>
            )}
            {contact.phone && <p className="text-sm font-semibold">📞 {contact.phone}</p>}
            {contact.email && <p className="text-sm opacity-80 mt-1">📧 {contact.email}</p>}
          </div>
        )}
        
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* COLUNA ESQUERDA: Formulários do Site */}
      <div className="flex-1 flex flex-col gap-6 w-full max-w-full overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/50 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Site Profissional
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Configure sua página profissional completa com serviços, biografia e depoimentos.
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button className="flex-1 md:flex-none rounded-full h-10 shadow-sm w-full md:w-32">
              <Save className="mr-2 h-4 w-4" /> Salvar
            </Button>
          </div>
        </div>

        {/* Área de Formulário com Swap por Touch */}
        <div
          className="w-full animate-in fade-in duration-300 touch-pan-y"
          onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
          onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
          onTouchEnd={handleTouchEnd}
        >
          {STEPS[currentStep].component}
        </div>

        {/* Paginação */}
        <div className="flex justify-center gap-2 mt-2">
          {STEPS.map((step, idx) => (
            <div
              key={step.id}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                idx === currentStep ? "w-6 bg-primary" : "w-2 bg-border",
                idx < currentStep ? "bg-primary/50" : ""
              )}
            />
          ))}
        </div>

        {/* Navegação Anterior / Próximo */}
        <div className="flex items-center justify-between mt-2">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <ChevronLeft className="h-5 w-5 mr-1" /> Anterior
          </Button>
          
          <div className="flex flex-col items-center hidden sm:flex">
            <span className="text-sm font-medium text-foreground">
              {STEPS[currentStep].title}
            </span>
            <span className="text-xs text-muted-foreground mt-0.5">
              Seção {currentStep + 1} de {STEPS.length}
            </span>
          </div>

          <Button
            variant="ghost"
            onClick={handleNext}
            disabled={currentStep === STEPS.length - 1}
            className="rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            Próximo <ChevronRight className="h-5 w-5 ml-1" />
          </Button>
        </div>
      </div>

      {/* COLUNA DIREITA: Preview do Celular */}
      <div className="hidden lg:flex w-85 shrink-0 flex-col items-center">
        <div className="sticky top-24">
          <ProSiteMockup />
        </div>
      </div>
    </div>
  );
}

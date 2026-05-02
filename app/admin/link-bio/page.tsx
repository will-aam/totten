"use client";

import { useState } from "react";
import { AdminHeader } from "@/components/admin-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Save,
  ChevronRight,
  ChevronLeft,
  Instagram,
  Facebook,
  Youtube,
  MessageCircle,
  Globe,
  Mobile,
  X,
} from "@boxicons/react";
import { cn } from "@/lib/utils";

import { ProfileSettings } from "@/components/link-bio/profile-settings";
import { ThemeSettings } from "@/components/link-bio/theme-settings";
import { SocialSettings } from "@/components/link-bio/social-settings";
import { AdditionalLinks } from "@/components/link-bio/additional-links";

export default function LinkBioPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  // Lógica para detectar o arrastar do dedo no celular (Swipe)
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const [profile, setProfile] = useState({
    slug: "studiomaria",
    name: "Studio Maria Spa",
    bio: "Especialistas em relaxamento e estética avançada. Agende seu horário!",
  });
  const [theme, setTheme] = useState({
    id: "solid",
    color: "#FAF9F6",
    css: "",
    font: "font-sans",
    textColor: "#0f172a", // Cor do texto e dos ícones
    buttonBg: "#ffffff", // Cor do fundo do botão
    buttonText: "#0f172a", // Cor da letra do botão
  });
  const [socials, setSocials] = useState({
    activePlatforms: ["whatsapp", "instagram"],
    values: { whatsapp: "", instagram: "" },
  });
  const [links, setLinks] = useState([
    { id: "1", title: "Agendar Horário", url: "" },
  ]);

  const STEPS = [
    {
      id: "profile",
      title: "Perfil e Link",
      component: <ProfileSettings data={profile} onChange={setProfile} />,
    },
    {
      id: "theme",
      title: "Aparência",
      component: <ThemeSettings data={theme} onChange={setTheme} />,
    },
    {
      id: "social",
      title: "Redes Sociais",
      component: <SocialSettings data={socials} onChange={setSocials} />,
    },
    {
      id: "links",
      title: "Links Adicionais",
      component: <AdditionalLinks data={links} onChange={setLinks} />,
    },
  ];

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
  };
  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  // Detectando o final do arraste
  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) handleNext(); // Arrastou pra esquerda
    if (touchStart - touchEnd < -75) handlePrev(); // Arrastou pra direita
  };

  const renderSocialIcon = (id: string) => {
    switch (id) {
      case "whatsapp":
        return <MessageCircle className="h-5 w-5" />;
      case "instagram":
        return <Instagram className="h-5 w-5" />;
      case "facebook":
        return <Facebook className="h-5 w-5" />;
      case "youtube":
        return <Youtube className="h-5 w-5" />;
      case "website":
        return <Globe className="h-5 w-5" />;
      default:
        return null;
    }
  };

  // Extraímos o Celular para uma variável para não repetir código (usaremos no Desktop e no Modal Mobile)
  const PhoneMockup = () => (
    <div className="w-[320px] h-162.5 bg-black rounded-[3rem] border-8 border-black shadow-2xl relative overflow-hidden ring-1 ring-border/20 mx-auto">
      <div className="absolute top-0 inset-x-0 h-6 bg-black z-20 rounded-b-2xl w-40 mx-auto" />

      <div
        className={cn(
          "w-full h-full flex flex-col items-center pt-16 px-6 relative z-10 transition-colors duration-500",
          theme.id !== "solid" ? theme.css : "",
          theme.font,
        )}
        style={theme.id === "solid" ? { backgroundColor: theme.color } : {}}
      >
        <div className="h-20 w-20 rounded-full bg-black/10 border-2 border-white/30 shadow-sm mb-4" />

        {/* Textos aplicam a cor escolhida e a fonte */}
        <h2
          className="font-bold text-xl text-center"
          style={{ color: theme.textColor }}
        >
          {profile.name || "Seu Nome"}
        </h2>
        <p
          className="text-center text-sm mt-2 leading-relaxed font-medium"
          style={{ color: theme.textColor }}
        >
          {profile.bio || "Sua biografia aparecerá aqui..."}
        </p>

        {/* Ícones elegantes (vazados, combinando com a cor do texto) */}
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          {socials.activePlatforms.map((platform) => (
            <div
              key={platform}
              className="h-11 w-11 rounded-full flex items-center justify-center shadow-sm border hover:scale-110 transition-transform cursor-pointer"
              style={{ borderColor: theme.textColor, color: theme.textColor }}
            >
              {renderSocialIcon(platform)}
            </div>
          ))}
        </div>

        {/* Botões lendo as cores novas */}
        <div className="w-full mt-6 flex flex-col gap-3">
          {links.map((link) => (
            <div
              key={link.id}
              className="w-full h-12 rounded-full flex items-center justify-center text-sm font-bold shadow-sm px-4 text-center truncate cursor-pointer hover:opacity-90 transition-opacity"
              style={{
                backgroundColor: theme.buttonBg,
                color: theme.buttonText,
              }}
            >
              {link.title || "Novo Botão"}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  return (
    <>
      <AdminHeader title="Link na Bio" />

      <div className="flex flex-col lg:flex-row gap-8 p-4 md:p-6 max-w-7xl mx-auto w-full pb-32 md:pb-6 relative">
        {/* COLUNA ESQUERDA: Carrossel Limpo e Arrastável */}
        <div className="flex-1 flex flex-col gap-6 w-full max-w-full overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/50 pb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Página Personalizada
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Crie seu link para o Instagram e direcione seus clientes.
              </p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button className="flex-1 md:flex-none rounded-full h-10 shadow-sm w-full md:w-32">
                <Save className="mr-2 h-4 w-4" /> Salvar
              </Button>
            </div>
          </div>

          {/* Área de Swipe + Componente Ativo */}
          <div
            className="w-full animate-in fade-in duration-300 touch-pan-y"
            onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
            onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
            onTouchEnd={handleTouchEnd}
          >
            {STEPS[currentStep].component}
          </div>

          {/* Controle Minimalista do Carrossel */}
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <ChevronLeft className="h-5 w-5 mr-1" /> Anterior
            </Button>
            <span className="text-sm font-medium text-muted-foreground hidden sm:block">
              {STEPS[currentStep].title}
            </span>
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

        {/* COLUNA DIREITA: Preview do Celular (Desktop) */}
        <div className="hidden lg:flex w-85 shrink-0 flex-col items-center">
          <div className="sticky top-24">
            <PhoneMockup />
          </div>
        </div>
      </div>

      {/* BOTÃO FLUTUANTE DE PREVIEW PARA MOBILE */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 lg:hidden">
        <Button
          onClick={() => setShowMobilePreview(true)}
          className="rounded-full shadow-xl bg-primary text-primary-foreground h-12 px-6 border-2 border-background/20 backdrop-blur-md"
        >
          <Mobile className="mr-2 h-5 w-5" />
          Ver Preview
        </Button>
      </div>

      {/* MODAL DE PREVIEW MOBILE */}
      <Dialog open={showMobilePreview} onOpenChange={setShowMobilePreview}>
        <DialogContent className="w-screen h-dvh max-w-none bg-background/95 backdrop-blur-md border-0 p-0 m-0 flex flex-col rounded-none z-50">
          <DialogTitle className="sr-only">Preview do Celular</DialogTitle>
          <div className="flex items-center justify-between p-4 bg-background/80 backdrop-blur-md z-50 absolute top-0 w-full">
            <span className="font-semibold text-foreground">
              Preview ao vivo
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMobilePreview(false)}
              className="rounded-full bg-muted/50"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-hidden pt-12">
            <div className="scale-90 origin-center">
              <PhoneMockup />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

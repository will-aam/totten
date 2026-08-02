// app/(private)/admin/custom-page/page.tsx
"use client";

import { useState, useEffect } from "react";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Save,
  ChevronRight,
  ChevronLeft,
  Instagram,
  Facebook,
  Youtube,
  Whatsapp,
  Globe,
  Mobile,
  X,
} from "@boxicons/react";
import { cn } from "@/lib/utils";

import { ProfileSettings } from "./_components/profile-settings";
import { ThemeSettings } from "./_components/theme-settings";
import { SocialSettings } from "./_components/social-settings";
import { AdditionalLinks } from "./_components/additional-links";

export default function CustomPage() {
  const [activeTab, setActiveTab] = useState<"link-bio" | "professional-site">("link-bio");
  const [currentStep, setCurrentStep] = useState(0);
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  // Lógica para detectar o arrastar do dedo no celular (Swipe)
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const [profile, setProfile] = useState({
    slug: "studiomaria",
    name: "Studio Maria Spa",
    bio: "Especialistas em relaxamento e estética avançada. Agende seu horário!",
    image: "", // Novo estado para a foto de perfil
  });
  const [theme, setTheme] = useState({
    id: "solid",
    color: "#FAF9F6",
    css: "",
    fontFamily: "Inter, sans-serif",
    textColor: "#0f172a", // Cor do texto e dos ícones
    buttonBg: "#ffffff", // Cor do fundo do botão
    buttonText: "#0f172a", // Cor da letra do botão
    backgroundImage: "", // Link da imagem de fundo personalizada
  });
  const [socials, setSocials] = useState({
    activePlatforms: ["whatsapp", "instagram"],
    values: { whatsapp: "", instagram: "" },
    position: "top", // 'top' ou 'bottom'
    style: "circle", // 'circle' ou 'transparent'
    size: "medium", // 'small', 'medium', 'large'
  });
  const [links, setLinks] = useState([
    { id: "1", title: "Agendar Horário", url: "" },
  ]);

  // Carregar dados salvos do rascunho (localStorage)
  useEffect(() => {
    const savedState = localStorage.getItem("customPageDraft");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.currentStep !== undefined) setCurrentStep(parsed.currentStep);
        if (parsed.profile) {
          setProfile({
            ...parsed.profile,
            image: parsed.profile.image || "",
          });
        }
        if (parsed.theme) {
          // Backward compatibility for old "font" property
          if (parsed.theme.font && !parsed.theme.fontFamily) {
             parsed.theme.fontFamily = "Inter, sans-serif";
          }
          setTheme(parsed.theme);
        }
        if (parsed.socials) {
          setSocials({
            ...parsed.socials,
            position: parsed.socials.position || "top",
            style: parsed.socials.style || "circle",
            size: parsed.socials.size || "medium",
          });
        }
        if (parsed.links) setLinks(parsed.links);
      } catch (e) {
        console.error("Error loading draft", e);
      }
    }
  }, []);

  // Salvar rascunho sempre que houver mudança
  useEffect(() => {
    const draft = { currentStep, profile, theme, socials, links };
    localStorage.setItem("customPageDraft", JSON.stringify(draft));
  }, [currentStep, profile, theme, socials, links]);

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

  const getIconSize = () => {
    switch (socials.size) {
      case "small": return "h-4 w-4";
      case "large": return "h-7 w-7";
      default: return "h-5 w-5"; // medium
    }
  };

  const getWrapperSize = () => {
    switch (socials.size) {
      case "small": return "h-8 w-8";
      case "large": return "h-14 w-14";
      default: return "h-11 w-11"; // medium
    }
  };

  const renderSocialIcon = (id: string, className: string) => {
    switch (id) {
      case "whatsapp":
        return <Whatsapp className={className} />;
      case "instagram":
        return <Instagram className={className} />;
      case "facebook":
        return <Facebook className={className} />;
      case "youtube":
        return <Youtube className={className} />;
      case "website":
        return <Globe className={className} />;
      default:
        return null;
    }
  };

  const SocialIconsBlock = () => (
    <div className={cn(
      "flex flex-wrap justify-center w-full",
      socials.style === "circle" ? "gap-3" : "gap-1" // Menos gap quando é só ícone
    )}>
      {socials.activePlatforms.map((platform) => (
        <div
          key={platform}
          className={cn(
            "rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer",
            socials.style === "circle" ? getWrapperSize() : "p-2.5", // Usa dimensões fixas no círculo, padding dinâmico no transparente
            socials.style === "circle" ? "shadow-sm border" : "bg-transparent"
          )}
          style={{ 
            borderColor: socials.style === "circle" ? theme.textColor : "transparent", 
            color: theme.textColor 
          }}
        >
          {renderSocialIcon(platform, getIconSize())}
        </div>
      ))}
    </div>
  );

  // Extraímos o Celular para uma variável para não repetir código (usaremos no Desktop e no Modal Mobile)
  const PhoneMockup = () => (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Noto+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Oxanium:wght@400;500;600;700&family=Roboto:ital,wght@0,400;0,500;0,700;1,400&family=Sora:wght@400;500;600;700&display=swap');
      `}</style>
      <div className="w-[320px] h-[650px] bg-black rounded-[3rem] border-8 border-black shadow-2xl relative overflow-hidden ring-1 ring-border/20 mx-auto">
        <div className="absolute top-0 inset-x-0 h-6 bg-black z-20 rounded-b-2xl w-40 mx-auto" />

        <div
          className={cn(
            "w-full h-full flex flex-col items-center pt-16 px-6 pb-8 relative z-10 transition-colors duration-500 overflow-y-auto no-scrollbar",
            theme.id !== "solid" && theme.id !== "custom" ? theme.css : "",
            theme.id === "custom" ? "bg-cover bg-center bg-no-repeat" : ""
          )}
          style={{
            ...(theme.id === "solid" ? { backgroundColor: theme.color } : {}),
            ...(theme.id === "custom" && theme.backgroundImage ? { backgroundImage: `url(${theme.backgroundImage})` } : {}),
            ...(theme.id === "custom" && !theme.backgroundImage ? { backgroundColor: "#1e293b" } : {}), // Fundo padrão para custom sem link
            fontFamily: theme.fontFamily || "Inter, sans-serif"
          }}
        >
          <div className="h-20 w-20 shrink-0 rounded-full bg-black/10 border-2 border-white/30 shadow-sm mb-4 relative overflow-hidden">
            {profile.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.image} alt="Profile" className="w-full h-full object-cover" />
            )}
          </div>

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

          {/* Renderiza as redes sociais no Topo (acima dos botões) */}
          {socials.position === "top" && (
            <div className="mt-6 w-full">
              <SocialIconsBlock />
            </div>
          )}

          {/* Botões lendo as cores novas */}
          <div className="w-full mt-6 flex flex-col gap-3 flex-1">
            {links.map((link) => (
              <div
                key={link.id}
                className="w-full h-12 shrink-0 rounded-full flex items-center justify-center text-sm font-bold shadow-sm px-4 text-center truncate cursor-pointer hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: theme.buttonBg,
                  color: theme.buttonText,
                }}
              >
                {link.title || "Novo Botão"}
              </div>
            ))}
          </div>

          {/* Renderiza as redes sociais no Rodapé (abaixo dos botões) */}
          {socials.position === "bottom" && (
            <div className="mt-auto pt-6 w-full">
              <SocialIconsBlock />
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      <AdminHeader title="Página Personalizada" />

      <div className="flex flex-col gap-6 p-6 md:p-8 relative pb-32 md:pb-8">
        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="link-bio">Link na Bio</TabsTrigger>
            <TabsTrigger value="professional-site">Site Profissional</TabsTrigger>
          </TabsList>

          <TabsContent value="link-bio" className="mt-0">
            <div className="flex flex-col lg:flex-row gap-8 w-full max-w-[1600px] mx-auto">
              {/* COLUNA ESQUERDA: Carrossel Limpo e Arrastável */}
              <div className="flex-1 flex flex-col gap-6 w-full max-w-full overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/50 pb-6">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                      Link na Bio
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

                {/* Indicador de Paginação Visual (Dots) */}
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

                {/* Controle Minimalista do Carrossel */}
                <div className="flex items-center justify-between mt-2">
                  <Button
                    variant="ghost"
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                    className="rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <ChevronLeft removePadding className="h-5 w-5 mr-1" /> Anterior
                  </Button>
                  
                  <div className="flex flex-col items-center hidden sm:flex">
                    <span className="text-sm font-medium text-foreground">
                      {STEPS[currentStep].title}
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5">
                      Passo {currentStep + 1} de {STEPS.length}
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    onClick={handleNext}
                    disabled={currentStep === STEPS.length - 1}
                    className="rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    Próximo <ChevronRight removePadding className="h-5 w-5 ml-1" />
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
          </TabsContent>

          <TabsContent value="professional-site" className="mt-0">
            <div className="w-full flex flex-col h-full min-h-[400px] items-center justify-center border-2 border-dashed border-border/50 rounded-xl bg-muted/20 p-8 text-center animate-in fade-in duration-300">
              <h2 className="text-xl font-semibold mb-2">Site Profissional</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Em breve, você poderá configurar aqui o seu site profissional completo, apresentando seu negócio de forma incrível.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* BOTÃO FLUTUANTE DE PREVIEW PARA MOBILE - APENAS SE ESTIVER NO LINK NA BIO */}
      {activeTab === "link-bio" && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 lg:hidden">
          <Button
            onClick={() => setShowMobilePreview(true)}
            className="rounded-full shadow-xl bg-primary text-primary-foreground h-12 px-6 border-2 border-background/20 backdrop-blur-md"
          >
            <Mobile className="mr-2 h-5 w-5" />
            Ver Preview
          </Button>
        </div>
      )}

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

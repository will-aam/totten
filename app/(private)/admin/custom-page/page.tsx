// app/(private)/admin/custom-page/page.tsx
"use client";

import { useState, useEffect } from "react";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  ChevronRight,
  ChevronLeft,
  X,
  Copy,
  Check,
  Cog,
  Link,
  GlobeAmericas,
  Calendar,
} from "@boxicons/react";
import { cn } from "@/lib/utils";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";


const MobileGlobe = ({ pack, ...props }: any) => <Cog {...props} />;
const MobileLink = ({ pack, ...props }: any) => <Link {...props} />;
const MobileSite = ({ pack, ...props }: any) => <GlobeAmericas {...props} />;
const MobileCalendar = ({ pack, ...props }: any) => <Calendar {...props} />;

import { ProfileSettings } from "./_components/profile-settings";
import { ThemeSettings } from "./_components/theme-settings";
import { SocialSettings } from "./_components/social-settings";
import { AdditionalLinks } from "./_components/additional-links";
import { ProfessionalSiteView } from "./_components/professional-site/professional-site-view";
import { BookingSiteView } from "./_components/booking-site/booking-site-view";
import { PhoneMockup } from "./_components/phone-mockup";
import { GlobalSettings } from "./_components/global-settings";
import { getCustomPageAction, updateCustomPageAction } from "@/app/actions/custom-page";
import { toast } from "sonner";

export default function CustomPage() {
  const [activeTab, setActiveTab] = useState<"global" | "link-bio" | "professional-site" | "booking-site">("global");
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const renderCopyLinkBox = (tab: "link-bio" | "professional-site" | "booking-site") => {
    let suffix = "";
    let title = "Seu Link Exclusivo";
    if (tab === "professional-site") { suffix = "/site"; title = "Link do seu Site Profissional"; }
    if (tab === "booking-site") { suffix = "/agendar"; title = "Link da sua Página de Agendamento"; }

    return (
      <div className="flex flex-col gap-2 p-4 border border-border/50 bg-muted/10 rounded-xl mb-6 w-full max-w-[1600px] mx-auto">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <div className="flex items-center">
          <span className="bg-muted text-muted-foreground px-3 py-2 border border-border/50 border-r-0 rounded-l-md text-sm h-11 flex items-center shrink-0">
            totten.com.br/
          </span>
          <Input
            value={profile.slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            className={cn(
              "rounded-none bg-background border-border/50 h-11 focus-visible:ring-1",
              tab !== "link-bio" ? "border-r-0" : ""
            )}
            placeholder="seunome"
          />
          {tab !== "link-bio" && (
            <span className="bg-muted text-muted-foreground px-3 py-2 border border-border/50 border-l-0 text-sm h-11 flex items-center shrink-0">
              {suffix}
            </span>
          )}
          <button
            onClick={() => {
              const origin = typeof window !== 'undefined' && window.location.origin.includes('localhost') ? window.location.origin : 'https://www.totten.com.br';
              navigator.clipboard.writeText(`${origin}/${profile.slug}${suffix}`);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="bg-muted text-muted-foreground px-3 py-2 border border-border/50 border-l-0 rounded-r-md text-sm h-11 flex items-center hover:bg-muted/80 hover:text-foreground transition-colors shrink-0 outline-none"
            title="Copiar link"
          >
            {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Apenas letras minúsculas. Sem espaços ou números.
        </p>
      </div>
    );
  };

  const handleSlugChange = (val: string) => {
    const formatted = val
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z]/g, "")
      .toLowerCase();
    setProfile(prev => ({ ...prev, slug: formatted }));
  };

  // Lógica para detectar o arrastar do dedo no celular (Swipe)
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const [profile, setProfile] = useState({
    slug: "studiomaria",
    name: "Studio Maria Spa",
    role: "Especialista",
    bio: "Especialistas em relaxamento e estética avançada. Agende seu horário!",
    image: "", // Novo estado para a foto de perfil
    bannerImage: "",
    layout: "classic", // 'classic', 'banner', 'header'
  });
  const [theme, setTheme] = useState({
    id: "solid",
    color: "#FAF9F6",
    css: "",
    fontFamily: "Inter, sans-serif",
    textColor: "#0f172a",
    buttonBg: "#ffffff",
    buttonText: "#0f172a",
    backgroundImage: "",
    buttonStyle: "solid",
    buttonRounding: "pill",
    buttonShadow: "none",
    buttonShadowColor: "#000000",
    bgStyle: "solid",
    bgGradientDirection: "to-b",
    bgGradientColor2: "#000000",
    bgNoise: false,
    bgBlur: "none",
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
  const [globalContact, setGlobalContact] = useState({ whatsapp: "", phone: "" });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [proSiteConfig, setProSiteConfig] = useState<any>(null);

  // Carregar dados do banco de dados
  useEffect(() => {
    async function loadData() {
      try {
        const response = await getCustomPageAction();
        if (response.success && response.data) {
          const data = response.data;

          if (data.organization) {
            setProfile(prev => ({
              ...prev,
              slug: data.organization.slug || prev.slug,
              name: data.organization.name || prev.name,
              image: data.profile_image_url || prev.image,
              bio: data.bio_text || prev.bio
            }));
            if (data.organization.settings) {
              setGlobalContact({
                whatsapp: data.organization.settings.phone_whatsapp || "",
                phone: data.organization.settings.phone_landline || ""
              });
            }
          } else if (data.profile_image_url || data.bio_text) {
            setProfile(prev => ({
              ...prev,
              image: data.profile_image_url || prev.image,
              bio: data.bio_text || prev.bio
            }));
          }

          if (data.profile_config) {
            const pc = data.profile_config as any;
            setProfile(prev => ({
              ...prev,
              role: pc.role || prev.role,
              layout: pc.layout || prev.layout,
              bannerImage: pc.bannerImage || prev.bannerImage
            }));
          }

          if (data.theme_config) {
            const tc = data.theme_config as any;
            setTheme(prev => ({
              ...prev,
              id: tc.id || prev.id,
              color: tc.color || data.theme_color_light || prev.color,
              css: tc.css || prev.css,
              fontFamily: tc.fontFamily || data.font_family || prev.fontFamily,
              textColor: tc.textColor || prev.textColor,
              buttonBg: tc.buttonBg || prev.buttonBg,
              buttonText: tc.buttonText || prev.buttonText,
              backgroundImage: tc.backgroundImage || prev.backgroundImage,
              buttonStyle: tc.buttonStyle || prev.buttonStyle,
              buttonRounding: tc.buttonRounding || prev.buttonRounding,
              buttonShadow: tc.buttonShadow || prev.buttonShadow,
              bgStyle: tc.bgStyle || prev.bgStyle,
              bgGradientDirection: tc.bgGradientDirection || prev.bgGradientDirection,
              bgBlur: tc.bgBlur || prev.bgBlur
            }));
          } else if (data.theme_color_light) {
            setTheme(prev => ({
              ...prev,
              color: data.theme_color_light,
              fontFamily: data.font_family || prev.fontFamily
            }));
          }

          if (data.social_links) {
            const sl = data.social_links as any;
            setSocials(prev => ({
              ...prev,
              activePlatforms: sl.activePlatforms || prev.activePlatforms,
              values: sl.values || prev.values,
              position: sl.position || prev.position,
              style: sl.style || prev.style,
              size: sl.size || prev.size
            }));

            if (sl.links) {
              setLinks(sl.links);
            }
          }

          if (data.professional_site_config) {
            setProSiteConfig(data.professional_site_config);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await updateCustomPageAction({
        slug: profile.slug,
        name: profile.name,
        profileImageUrl: profile.image,
        bioText: profile.bio,
        themeColorLight: theme.color,
        fontFamily: theme.fontFamily,
        themeConfig: {
          id: theme.id,
          color: theme.color,
          css: theme.css,
          fontFamily: theme.fontFamily,
          textColor: theme.textColor,
          buttonBg: theme.buttonBg,
          buttonText: theme.buttonText,
          backgroundImage: theme.backgroundImage,
          buttonStyle: theme.buttonStyle,
          buttonRounding: theme.buttonRounding,
          buttonShadow: theme.buttonShadow,
          bgStyle: theme.bgStyle,
          bgGradientDirection: theme.bgGradientDirection,
          bgBlur: theme.bgBlur
        },
        profileConfig: {
          role: profile.role,
          layout: profile.layout,
          bannerImage: profile.bannerImage
        },
        socialLinks: {
          activePlatforms: socials.activePlatforms,
          values: socials.values,
          position: socials.position,
          style: socials.style,
          size: socials.size,
          links: links
        }
      });

      if (response.success) {
        toast.success("Link na Bio salvo com sucesso!");
      } else {
        toast.error(response.error || "Erro ao salvar.");
      }
    } catch (error) {
      toast.error("Ocorreu um erro ao salvar as configurações.");
    } finally {
      setIsSaving(false);
    }
  };

  const STEPS = [
    {
      id: "profile",
      title: "Perfil e Redes Sociais",
      component: (
        <div className="flex flex-col gap-8">
          <ProfileSettings data={profile} onChange={setProfile} />
          <SocialSettings data={socials} onChange={setSocials} globalContact={globalContact} />
        </div>
      ),
    },
    {
      id: "theme",
      title: "Aparência",
      component: <ThemeSettings data={theme} onChange={setTheme} />,
    },
    {
      id: "links",
      title: "Links Adicionais",
      component: <AdditionalLinks data={links} onChange={setLinks} />,
    },
  ];

  const isStepDone = (stepId: string) => {
    switch (stepId) {
      case "profile": return !!(profile.layout) && (socials.activePlatforms && socials.activePlatforms.length > 0);
      case "theme": return true;
      case "links": return links && links.length > 0 && links.some(l => l.title || l.url);
      default: return false;
    }
  };

  const getIconSize = () => {
    switch (socials.size) {
      case "small": return "h-4 w-4";
      case "large": return "h-7 w-7";
      default: return "h-5 w-5"; // medium
    }
  };



  return (
    <>
      <AdminHeader title="Página Personalizada" />

      <div className="flex flex-col gap-6 p-6 md:p-8 relative pb-32 md:pb-8">

        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
          <TabsList className="hidden md:grid w-full lg:w-[600px] grid-cols-4 h-auto gap-1 bg-muted p-1 rounded-xl mb-8">
            <TabsTrigger
              value="global"
              className="flex items-center gap-2 py-2 rounded-lg"
            >
              <Cog size="sm" /> Global
            </TabsTrigger>
            <TabsTrigger
              value="link-bio"
              className="flex items-center gap-2 py-2 rounded-lg"
            >
              <Link size="sm" /> Link na Bio
            </TabsTrigger>
            <TabsTrigger
              value="professional-site"
              className="flex items-center gap-2 py-2 rounded-lg"
            >
              <GlobeAmericas size="sm" /> Site
            </TabsTrigger>
            <TabsTrigger
              value="booking-site"
              className="flex items-center gap-2 py-2 rounded-lg"
            >
              <Calendar size="sm" /> Agenda
            </TabsTrigger>
          </TabsList>

          <MobileBottomNav
            items={[
              { id: "global", label: "Global", icon: MobileGlobe },
              { id: "link-bio", label: "Link na Bio", icon: MobileLink },
              { id: "professional-site", label: "Site", icon: MobileSite },
              { id: "booking-site", label: "Agenda", icon: MobileCalendar },
            ]}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as any)}
          />

          <TabsContent value="global" className="mt-0">
            <GlobalSettings profile={profile} setProfile={setProfile} socials={socials} setSocials={setSocials} globalContact={globalContact} theme={theme} setTheme={setTheme} />
          </TabsContent>

          <TabsContent value="link-bio" className="mt-0">
            {renderCopyLinkBox("link-bio")}
            <div className="flex flex-col lg:flex-row gap-8 w-full max-w-[1600px] mx-auto">
              {/* COLUNA ESQUERDA: Carrossel Limpo e Arrastável */}
              <div className="flex-1 flex flex-col gap-6 w-full max-w-full overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/50 pb-6">
                  <div>

                    <p className="text-sm text-muted-foreground mt-0.5">
                      Crie seu link para o Instagram e direcione seus clientes.
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
                      disabled={isLoading || isSaving}
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

              {/* COLUNA DIREITA: Preview do Celular (Desktop) */}
              <div className="hidden lg:flex w-85 shrink-0 flex-col items-center">
                <div className="sticky top-24">
                  <PhoneMockup
                    profile={profile}
                    theme={theme}
                    socials={socials}
                    links={links}
                    activeTab={activeTab}
                    proSiteConfig={proSiteConfig}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="professional-site" className="mt-0">
            {renderCopyLinkBox("professional-site")}
            <ProfessionalSiteView profile={profile} initialData={proSiteConfig} globalContact={globalContact} />
          </TabsContent>

          <TabsContent value="booking-site" className="mt-0">
            {renderCopyLinkBox("booking-site")}
            <BookingSiteView profile={profile} />
          </TabsContent>
        </Tabs>
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
              <PhoneMockup
                profile={profile}
                theme={theme}
                socials={socials}
                links={links}
                activeTab={activeTab}
                proSiteConfig={proSiteConfig}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

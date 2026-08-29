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
  ArrowOutUpLeftStrokeSquare,
  LoaderLines,
  Save,
} from "@boxicons/react";
import { cn } from "@/lib/utils";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

const MobileGlobe = ({ pack, ...props }: any) => <Cog {...props} />;
const MobileLink = ({ pack, ...props }: any) => <Link {...props} />;
const MobileSite = ({ pack, ...props }: any) => <GlobeAmericas {...props} />;
const MobileCalendar = ({ pack, ...props }: any) => <Calendar {...props} />;
import { ImageAlt } from "@boxicons/react";
const MobileGallery = ({ pack, ...props }: any) => <ImageAlt {...props} />;

import { ProfileSettings } from "./_components/profile-settings";
import { ThemeSettings } from "./_components/theme-settings";
import { AdditionalLinks } from "./_components/additional-links";
import { ProfessionalSiteView } from "./_components/professional-site/professional-site-view";
import { BookingSiteView } from "./_components/booking-site/booking-site-view";
import { PhoneMockup } from "./_components/phone-mockup";
import { GlobalSettings } from "./_components/global-settings";
import { getCustomPageAction, updateCustomPageAction } from "@/app/actions/custom-page";
import { toast } from "sonner";

let cachedCustomPageData: any = null;

export default function CustomPage() {
  const [activeTab, setActiveTab] = useState<"global" | "link-bio" | "professional-site" | "booking-site">("global");
  
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const renderCopyLinkBox = (tab: "link-bio" | "professional-site" | "booking-site") => {
    let suffix = "";
    let title = "Seu Link Exclusivo";
    if (tab === "professional-site") { suffix = "/site"; title = "Link do seu Site Profissional"; }
    if (tab === "booking-site") { suffix = "/agendar"; title = "Link da sua Página de Agendamento"; }

    let isLocked = false;
    let lockMessage = "";

    if (tab === "link-bio") {
      const hasValidLink = links && links.some((l: any) =>
        (l.type === 'system-site' || l.type === 'system-booking') ? !!l.title?.trim() : (l.title?.trim() && l.url?.trim())
      );
      if (!hasValidLink) {
        isLocked = true;
        lockMessage = "Configure pelo menos um link adicional válido para ativar a página.";
      }
    } else if (tab === "professional-site") {
      const hasHeadline = proSiteConfig?.presentation?.headline?.trim();
      const hasImage = proSiteConfig?.presentation?.heroImage?.trim();
      if (!hasHeadline || !hasImage) {
        isLocked = true;
        lockMessage = "Configure um título e adicione uma imagem de capa na etapa 'Apresentação' para ativar o site.";
      }
    }

    if (isLocked) {
      return null;
    }

    return (
      <div className="flex flex-col gap-2 mb-6 w-full max-w-[1600px] mx-auto">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <div className="flex items-center">
          <span className="bg-muted text-muted-foreground px-3 py-2 border border-border/50 border-r-0 rounded-l-md text-sm h-11 flex items-center shrink-0">
            totten.com.br/
          </span>
          <Input
            value={profile.slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            maxLength={30}
            disabled={isLocked}
            className={cn(
              "rounded-none bg-background border-border/50 h-11 focus-visible:ring-1 max-w-[140px]",
              tab !== "link-bio" ? "border-r-0" : ""
            )}
            placeholder="seunome"
          />
          {tab !== "link-bio" && (
            <span className={cn("bg-muted text-muted-foreground px-3 py-2 border border-border/50 border-l-0 text-sm h-11 flex items-center shrink-0")}>
              {suffix}
            </span>
          )}

          {/* Copiar */}
          <button
            onClick={() => {
              const origin = typeof window !== 'undefined' && window.location.origin.includes('localhost') ? window.location.origin : 'https://www.totten.com.br';
              navigator.clipboard.writeText(`${origin}/${profile.slug}${suffix}`);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="bg-muted text-muted-foreground px-3 py-2 border border-border/50 border-l-0 text-sm h-11 flex items-center hover:bg-muted/80 hover:text-foreground transition-colors shrink-0 outline-none"
            title="Copiar link"
          >
            {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
          </button>
          {/* Abrir em nova aba */}
          <a
            href={`/${profile.slug}${suffix}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-muted text-muted-foreground px-3 py-2 border border-border/50 border-l-0 rounded-r-md text-sm h-11 flex items-center hover:bg-muted/80 hover:text-foreground transition-colors shrink-0"
            title="Abrir página"
          >
            <ArrowOutUpLeftStrokeSquare flip="horizontal" className="h-5 w-5" />
          </a>
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
    slug: "",
    name: "",
    role: "",
    bio: "",
    image: "",
    bannerImage: "",
    logo: "",
    layout: "classic",
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
    visibility: {
      whatsapp: { site: false, booking: false, bio: false },
      instagram: { site: false, booking: false, bio: false },
      facebook: { site: false, booking: false, bio: false },
      youtube: { site: false, booking: false, bio: false },
      website: { site: false, booking: false, bio: false }
    },
    position: "top", // 'top' ou 'bottom'
    style: "circle", // 'circle' ou 'transparent'
    size: "medium", // 'small', 'medium', 'large'
  });
  const [links, setLinks] = useState([
    { id: "1", title: "Agendar Horário", url: "" },
  ]);
  const [globalContact, setGlobalContact] = useState({ whatsapp: "", phone: "" });
  const [globalLocation, setGlobalLocation] = useState<any>({ address: "", mapUrl: "", businessHours: "", showBusinessHoursSite: false, showBusinessHoursBooking: false });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [proSiteConfig, setProSiteConfig] = useState<any>(null);

  // Carregar dados do banco de dados
  useEffect(() => {
    async function loadData() {
      try {
        let response;
        if (cachedCustomPageData) {
          response = { success: true, data: cachedCustomPageData };
        } else {
          response = await getCustomPageAction();
          if (response.success && response.data) {
            cachedCustomPageData = response.data;
          }
        }

        if (response.success && response.data) {
          const data = response.data;

          if (data.organization_name !== undefined || data.profile_image_url !== undefined) {
            setProfile(prev => ({
              ...prev,
              slug: data.organization_slug || prev.slug,
              name: data.organization_name || prev.name,
              image: data.profile_image_url || prev.image,
              logo: data.logo_url || prev.logo,
              bio: data.bio_text || prev.bio
            }));
            
            if (data.global_contact) {
              setGlobalContact({
                whatsapp: data.global_contact.whatsapp || "",
                phone: data.global_contact.landline || ""
              });
            }
            if (data.global_location !== undefined) {
              setGlobalLocation((prev: any) => ({
                ...prev,
                address: data.global_location || prev.address
              }));
            }
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
          let loadedContact = null;
          if (data.profile_config && (data.profile_config as any).contact) {
            loadedContact = (data.profile_config as any).contact;
          } else if (data.professional_site_config && (data.professional_site_config as any).contact) {
            loadedContact = (data.professional_site_config as any).contact;
          }

          if (loadedContact) {
            setGlobalLocation({
              address: loadedContact.address || "",
              mapUrl: loadedContact.mapUrl || "",
              businessHours: loadedContact.businessHours || "",
              showBusinessHoursSite: loadedContact.showBusinessHoursSite ?? loadedContact.showBusinessHours ?? false,
              showBusinessHoursBooking: loadedContact.showBusinessHoursBooking ?? false
            });
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
              visibility: sl.visibility || prev.visibility,
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
    if (activeTab === "global") {
      if (!profile.name || profile.name.trim().length < 3 || profile.name.trim().length > 30) {
        toast.error("O Nome de exibição deve ter entre 3 e 30 caracteres.");
        return;
      }
      if (!profile.bio || profile.bio.trim().length < 32) {
        toast.error("A descrição do seu negócio deve ter no mínimo 32 caracteres.");
        return;
      }
      if (!globalLocation.address || globalLocation.address.trim() === "") {
        toast.error("O Endereço completo é obrigatório.");
        return;
      }
    }

    setIsSaving(true);
    try {
      const response = await updateCustomPageAction({
        slug: profile.slug,
        name: profile.name,
        profileImageUrl: profile.image,
        logoUrl: profile.logo,
        bioText: profile.bio,
        themeColorLight: theme.color,
        themeColorDark: theme.bgGradientColor2,
        fontFamily: theme.fontFamily,
        themeConfig: {
          id: theme.id,
          css: theme.css,
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
          bannerImage: profile.bannerImage,
          contact: globalLocation
        },
        socialLinks: {
          activePlatforms: socials.activePlatforms,
          values: socials.values,
          position: socials.position,
          style: socials.style,
          size: socials.size,
          links: links,
          visibility: socials.visibility
        },
        globalContactWhatsapp: globalContact.whatsapp,
        globalLocationAddress: globalLocation.address
      });

      if (response.success) {
        cachedCustomPageData = null; // Invalidate cache after saving
        toast.success(
          activeTab === "global"
            ? "Configurações Globais salvas com sucesso!"
            : "Link na Bio salvo com sucesso!"
        );
        setPreviewKey(k => k + 1);
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
      title: "Perfil",
      component: (
        <div className="flex flex-col gap-8">
          <ProfileSettings data={profile} onChange={setProfile} />
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



  const getIconSize = () => {
    return "h-7 w-7"; // Sempre grande
  };


  const isGlobalSettingsValid = () => {
    if (!profile.name || profile.name.trim().length < 3) return false;
    if (!profile.image && !profile.logo) return false;
    return true;
  };

  const globalValid = isGlobalSettingsValid();

  return (
    <>
      <AdminHeader title="Página Personalizada" />

      <div className="flex flex-col gap-6 p-6 md:p-8 relative pb-32 md:pb-8">

        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
          <TabsList className="hidden md:grid w-full lg:w-[750px] grid-cols-4 h-auto gap-1 bg-muted p-1 rounded-xl mb-8">
            <TabsTrigger
              value="global"
              className="flex items-center gap-2 py-2 rounded-lg"
            >
              <Cog size="sm" /> Global
            </TabsTrigger>
            <TabsTrigger
              value="link-bio"
              disabled={!globalValid}
              className="flex items-center gap-2 py-2 rounded-lg disabled:opacity-50"
            >
              <Link size="sm" /> Link na Bio
            </TabsTrigger>
            <TabsTrigger
              value="professional-site"
              disabled={!globalValid}
              className="flex items-center gap-2 py-2 rounded-lg disabled:opacity-50"
            >
              <GlobeAmericas size="sm" /> Site
            </TabsTrigger>
            <TabsTrigger
              value="booking-site"
              disabled={!globalValid}
              className="flex items-center gap-2 py-2 rounded-lg disabled:opacity-50"
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
            onChange={(id) => {
              if (id !== "global" && !globalValid) {
                toast.error("Preencha as configurações globais obrigatórias (Nome e Imagens) primeiro.");
                return;
              }
              setActiveTab(id as any);
            }}
          />

          <TabsContent value="global" className="mt-0">
            <GlobalSettings
              profile={profile} setProfile={setProfile}
              socials={socials} setSocials={setSocials}
              globalContact={globalContact} setGlobalContact={setGlobalContact}
              theme={theme} setTheme={setTheme}
              globalLocation={globalLocation} setGlobalLocation={setGlobalLocation}
              proSiteConfig={proSiteConfig} setProSiteConfig={setProSiteConfig}
              onSave={handleSave}
              isSaving={isSaving}
            />
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
                      className="flex-1 md:hidden rounded-full h-10 shadow-sm w-full"
                    >
                      {isSaving ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-10 mt-2 lg:h-[calc(100vh-360px)] lg:overflow-y-auto custom-scrollbar lg:pr-4 pb-20">
                  {STEPS.map((step, index) => (
                    <div key={step.id} id={`step-${step.id}`} className="flex flex-col gap-2 scroll-m-20 p-5 border border-border/50 rounded-xl bg-card shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-sm">
                          {index + 1}
                        </span>
                        {step.id === 'profile' || step.id === 'theme' ? (
                          <span className="text-[10px] uppercase font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">Obrigatório</span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Opcional</span>
                        )}
                      </div>
                      {step.component}
                    </div>
                  ))}
                </div>
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
                    previewKey={previewKey}
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

      {/* Fixed Floating Save Button (Mobile & Desktop) */}
      <div className="flex fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50">
        <Button
          onClick={handleSave}
          disabled={isSaving || !globalValid}
          className={cn(
            "h-16 w-16 rounded-full shadow-lg flex items-center justify-center transition-all duration-300",
            globalValid
              ? "bg-black hover:bg-black/90 text-white hover:scale-105"
              : "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
          )}
          title={globalValid ? "Salvar alterações" : "Preencha os campos obrigatórios (Nome e Avatar/Logo) na aba Global"}
        >
          {isSaving ? (
            <LoaderLines className="animate-spin" style={{ width: '32px', height: '32px', fontSize: '32px' }} />
          ) : (
            <Save style={{ width: '32px', height: '32px', fontSize: '32px' }} />
          )}
        </Button>
      </div>


      {/* MODAL DE PREVIEW MOBILE */}
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
            <PhoneMockup
              profile={profile}
              theme={theme}
              socials={socials}
              links={links}
              activeTab={activeTab}
              proSiteConfig={proSiteConfig}
              isFullScreen={true}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

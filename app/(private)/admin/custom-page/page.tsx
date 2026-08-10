// app/(private)/admin/custom-page/page.tsx
"use client";

import { useState, useEffect } from "react";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Save,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Instagram,
  Facebook,
  Youtube,
  Whatsapp,
  Globe,
  Mobile,
  X,
  Copy,
  Check,
  Camera,
  Image as ImageIcon
} from "@boxicons/react";
import { cn } from "@/lib/utils";
import { compressImage } from "@/lib/image-utils";

import { ProfileSettings } from "./_components/profile-settings";
import { ThemeSettings } from "./_components/theme-settings";
import { SocialSettings } from "./_components/social-settings";
import { AdditionalLinks } from "./_components/additional-links";
import { ProfessionalSiteView } from "./_components/professional-site/professional-site-view";
import { getCustomPageAction, updateCustomPageAction } from "@/app/actions/custom-page";
import { uploadImageAction } from "@/app/actions/upload-image";
import { toast } from "sonner";
import { Loader2, Loader } from "lucide-react";

export default function CustomPage() {
  const [activeTab, setActiveTab] = useState<"link-bio" | "professional-site">("link-bio");
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const origin = typeof window !== 'undefined' && window.location.origin.includes('localhost') ? window.location.origin : 'https://www.totten.com.br';
    const suffix = activeTab === "professional-site" ? "/site" : "";
    navigator.clipboard.writeText(`${origin}/${profile.slug}${suffix}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      component: <SocialSettings data={socials} onChange={setSocials} globalContact={globalContact} />,
    },
    {
      id: "links",
      title: "Links Adicionais",
      component: <AdditionalLinks data={links} onChange={setLinks} />,
    },
  ];

  const isStepDone = (stepId: string) => {
    switch (stepId) {
      case "profile": return !!(profile.name || profile.bio);
      case "theme": return true;
      case "social": return socials.activePlatforms && socials.activePlatforms.length > 0;
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

  const getButtonClassNames = () => {
    const rounding = theme.buttonRounding || "pill";
    let roundingClass = "rounded-full";
    if (rounding === "square") roundingClass = "rounded-none";
    if (rounding === "round") roundingClass = "rounded-md";
    if (rounding === "more-round") roundingClass = "rounded-2xl";

    const style = theme.buttonStyle || "solid";
    let styleClass = "";
    if (style === "glass") {
      styleClass = "bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 shadow-sm";
    } else if (style === "outline") {
      styleClass = "bg-transparent border-2 hover:opacity-80";
    } else {
      styleClass = "hover:opacity-90";
    }

    return cn(
      "w-full h-12 shrink-0 flex items-center justify-center text-sm font-bold px-4 text-center truncate cursor-pointer transition-all",
      roundingClass,
      styleClass
    );
  };

  const getButtonStyles = () => {
    const style = theme.buttonStyle || "solid";
    let customStyle: any = { color: theme.buttonText || "#000000" };

    if (style === "solid") {
      customStyle.backgroundColor = theme.buttonBg || "#ffffff";
      const shadow = theme.buttonShadow || "none";
      const shadowColor = theme.buttonShadowColor || "#000000";

      if (shadow === "soft") {
        customStyle.boxShadow = `4px 4px 10px 0px ${shadowColor}40`;
      } else if (shadow === "strong") {
        customStyle.boxShadow = `6px 6px 15px 0px ${shadowColor}80`;
      } else if (shadow === "hard") {
        customStyle.boxShadow = `5px 5px 0px 0px ${shadowColor}`;
      }
    } else if (style === "outline") {
      customStyle.borderColor = theme.buttonBg || "#ffffff";
    }

    return customStyle;
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
    <div className="flex flex-wrap justify-center w-full gap-1">
      {socials.activePlatforms.map((platform) => (
        <div
          key={platform}
          className="rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer p-2.5 bg-transparent"
          style={{
            color: theme.textColor
          }}
        >
          {renderSocialIcon(platform, getIconSize())}
        </div>
      ))}
    </div>
  );

  const getBackgroundStyle = () => {
    let style: any = {};
    if (theme.id === "solid") {
      const bgStyle = theme.bgStyle || "solid";
      if (bgStyle === "solid") {
        style.backgroundColor = theme.color;
      } else if (bgStyle === "gradient") {
        const dir = theme.bgGradientDirection || "to-b";
        const c1 = theme.color || "#ffffff";
        const c2 = theme.bgGradientColor2 || "#000000";
        if (dir === "to-b") style.backgroundImage = `linear-gradient(to bottom, ${c1}, ${c2})`;
        if (dir === "to-t") style.backgroundImage = `linear-gradient(to top, ${c1}, ${c2})`;
        if (dir === "radial") style.backgroundImage = `radial-gradient(circle, ${c1}, ${c2})`;
      }
    } else if (theme.id === "custom") {
      if (theme.backgroundImage) {
        style.backgroundImage = `url(${theme.backgroundImage})`;
      } else {
        style.backgroundColor = "#1e293b";
      }
    }
    return style;
  };

  // Extraímos o Celular para uma variável para não repetir código (usaremos no Desktop e no Modal Mobile)
  const PhoneMockup = () => {
    const isPro = activeTab === "professional-site";
    const proHeroLayout = proSiteConfig?.presentation?.heroLayout || "fade-cover";
    
    // Mapear os layouts do proSiteConfig para a estrutura existente ou usar o novo
    let layout = profile.layout || "classic";
    if (isPro) {
      if (proHeroLayout === "fade-cover") layout = "header";
      else if (proHeroLayout === "avatar-cover") layout = "banner";
      else layout = proHeroLayout; // classic-blog
    }

    return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Noto+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Oxanium:wght@400;500;600;700&family=Roboto:ital,wght@0,400;0,500;0,700;1,400&family=Sora:wght@400;500;600;700&display=swap');
      `}</style>
      <div className="w-[320px] h-[650px] bg-black rounded-[3rem] border-8 border-black shadow-2xl relative overflow-hidden ring-1 ring-border/20 mx-auto">
        <div className="absolute top-0 inset-x-0 h-6 bg-black z-30 rounded-b-2xl w-40 mx-auto" />

        {/* CAMADA DE FUNDO BASE */}
        <div
          className={cn(
            "absolute inset-0 z-0 transition-colors duration-500",
            theme.id !== "solid" && theme.id !== "custom" ? theme.css : "",
            theme.id === "custom" ? "bg-cover bg-center bg-no-repeat" : ""
          )}
          style={getBackgroundStyle()}
        />

        {/* EFEITOS DE FUNDO */}
        {(theme.id === "solid" || theme.id === "custom") && theme.bgNoise && (
          <div
            className="absolute inset-0 z-0 opacity-[0.15] mix-blend-overlay pointer-events-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
          />
        )}
        {(theme.id === "solid" || theme.id === "custom") && theme.bgBlur && theme.bgBlur !== "none" && (
          <div className={cn(
            "absolute inset-0 z-0 bg-white/10 pointer-events-none",
            theme.bgBlur === "sm" ? "backdrop-blur-sm" :
            theme.bgBlur === "md" ? "backdrop-blur-md" :
            theme.bgBlur === "xl" ? "backdrop-blur-xl" :
            theme.bgBlur === "3xl" ? "backdrop-blur-3xl" :
            "backdrop-blur-[50px]"
          )} />
        )}

        {/* CAMADA DE CONTEÚDO */}
        <div
          className={cn(
            "w-full h-full flex flex-col items-center pb-8 relative z-20 overflow-y-auto no-scrollbar",
            (!layout || layout === "classic") ? "pt-16 px-6" : "pt-0 px-0"
          )}
          style={{ fontFamily: theme.fontFamily || "Inter, sans-serif" }}
        >
          {layout === "classic-blog" && (
            <>
              {/* Navbar do Blog */}
              <div className="w-full h-14 bg-background/80 backdrop-blur-md border-b border-border/50 flex items-center justify-between px-4 shrink-0 z-30 sticky top-0">
                <span className="font-bold text-sm truncate" style={{ color: theme.textColor }}>
                  {profile.name || "Seu Nome"}
                </span>
              </div>
              {/* Banner Central */}
              <div className="w-full h-40 bg-black/5 relative shrink-0">
                {profile.bannerImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.bannerImage} alt="Banner" className="w-full h-full object-cover" />
                )}
              </div>
            </>
          )}
          
          {layout === "banner" && (
            <div className="w-full h-32 bg-black/5 relative shrink-0">
              {profile.bannerImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.bannerImage} alt="Banner" className="w-full h-full object-cover" />
              )}
            </div>
          )}
          {layout === "header" && (
            <div className="w-full h-64 relative shrink-0">
              {profile.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={profile.image} 
                  alt="Header" 
                  className="w-full h-full object-cover object-top" 
                  style={{ 
                    maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)", 
                    WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)" 
                  }} 
                />
              ) : (
                <div className="w-full h-full bg-black/5" style={{ 
                  maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)", 
                  WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)" 
                }} />
              )}
            </div>
          )}

          <div className={cn(
            "flex flex-col items-center w-full flex-1",
            (layout === "banner" || layout === "header" || layout === "classic-blog") ? "px-6" : ""
          )}>
            {layout !== "header" && layout !== "classic-blog" && (
              <div className={cn(
                "h-20 w-20 shrink-0 rounded-full bg-black/10 border-2 border-white/30 shadow-sm relative overflow-hidden",
                (!layout || layout === "classic") ? "mb-4" : 
                layout === "banner" ? "-mt-10 mb-3" : ""
              )}>
                {profile.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.image} alt="Profile" className="w-full h-full object-cover" />
                )}
              </div>
            )}

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
          {socials.position === "top" && socials.activePlatforms.length > 0 && (
            <div className="mt-6 w-full">
              <SocialIconsBlock />
            </div>
          )}

          {/* Botões lendo as cores novas */}
          <div className="w-full mt-6 flex flex-col gap-3">
            {links.map((link) => (
              <div
                key={link.id}
                className={getButtonClassNames()}
                style={getButtonStyles()}
              >
                {link.title || "Novo Botão"}
              </div>
            ))}
          </div>

          <div className="mt-auto w-full pt-8 flex flex-col items-center">
            {/* Renderiza as redes sociais no Rodapé (abaixo dos botões) */}
            {socials.position === "bottom" && socials.activePlatforms.length > 0 && (
              <div className="w-full mb-6">
                <SocialIconsBlock />
              </div>
            )}

            {/* Footer do sistema */}
            <div className="w-full flex justify-center pb-2">
              <span
                className="text-[10px] font-medium opacity-50 uppercase tracking-wider"
                style={{ color: theme.textColor }}
              >
                by Totten
              </span>
            </div>
          </div>
          </div>
        </div>
      </div>
    </>
    );
  };

  const GlobalImagesBlock = () => {
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isUploadingBanner, setIsUploadingBanner] = useState(false);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setIsUploadingAvatar(true);
        try {
          const compressedBase64 = await compressImage(file, 500);
          const res = await uploadImageAction(compressedBase64, "avatar");
          if (res.success && res.url) {
            setProfile({ ...profile, image: res.url });
          } else {
            toast.error(res.error || "Erro ao fazer upload da imagem");
          }
        } catch (error) {
          console.error("Erro ao processar imagem de perfil:", error);
          toast.error("Erro inesperado ao processar imagem.");
        } finally {
          setIsUploadingAvatar(false);
        }
      }
    };

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setIsUploadingBanner(true);
        try {
          const compressedBase64 = await compressImage(file, 1200);
          const res = await uploadImageAction(compressedBase64, "banner");
          if (res.success && res.url) {
            setProfile({ ...profile, bannerImage: res.url });
          } else {
            toast.error(res.error || "Erro ao fazer upload da imagem");
          }
        } catch (error) {
          console.error("Erro ao processar imagem de banner:", error);
          toast.error("Erro inesperado ao processar banner.");
        } finally {
          setIsUploadingBanner(false);
        }
      }
    };

    const [isExpanded, setIsExpanded] = useState(true);

    return (
      <div className="flex flex-col p-5 border border-border/50 bg-card rounded-xl w-full max-w-[1600px] mx-auto shadow-sm">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary" /> 
            <h3 className="font-semibold text-foreground text-sm">
              Imagens Globais da Marca
            </h3>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
        
        {isExpanded && (
          <div className="flex flex-col mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="text-xs text-muted-foreground mb-4">
              Defina seu Avatar e Banner. Eles podem ser exibidos no seu Link na Bio ou Site Profissional dependendo do layout escolhido.
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
          {/* Avatar */}
          <div className="flex items-center gap-4 flex-1 border border-border/50 p-4 rounded-lg bg-muted/20">
            <div className="h-16 w-16 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center relative overflow-hidden group cursor-pointer hover:bg-muted/80 transition-colors shrink-0">
              {profile.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.image} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <Camera className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
              )}
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full z-20">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
              <input type="file" accept="image/png, image/jpeg" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
            </div>
            <div className="flex flex-col">
              <p className="font-medium text-xs text-foreground">Avatar (Perfil)</p>
              <label className="text-[11px] font-semibold text-primary hover:underline w-fit cursor-pointer mt-1">
                Fazer upload
                <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleAvatarUpload} />
              </label>
              {profile.image && (
                <button onClick={() => setProfile({ ...profile, image: "" })} className="text-[11px] font-semibold text-destructive hover:underline w-fit mt-1">
                  Remover
                </button>
              )}
            </div>
          </div>
          
          {/* Banner */}
          <div className="flex items-center gap-4 flex-1 border border-border/50 p-4 rounded-lg bg-muted/20">
            <div className="h-16 w-24 rounded-md bg-muted border-2 border-dashed border-border flex items-center justify-center relative overflow-hidden group cursor-pointer hover:bg-muted/80 transition-colors shrink-0">
              {profile.bannerImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.bannerImage} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
              )}
              {isUploadingBanner && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl z-20">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
              <input type="file" accept="image/png, image/jpeg" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" onChange={handleBannerUpload} disabled={isUploadingBanner} />
            </div>
            <div className="flex flex-col">
              <p className="font-medium text-xs text-foreground">Imagem de Capa (Banner)</p>
              <label className="text-[11px] font-semibold text-primary hover:underline w-fit cursor-pointer mt-1">
                Fazer upload
                <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleBannerUpload} />
              </label>
              {profile.bannerImage && (
                <button onClick={() => setProfile({ ...profile, bannerImage: "" })} className="text-[11px] font-semibold text-destructive hover:underline w-fit mt-1">
                  Remover
                </button>
              )}
            </div>
            </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <AdminHeader title="Página Personalizada" />

      <div className="flex flex-col gap-6 p-6 md:p-8 relative pb-32 md:pb-8">
        
        <GlobalImagesBlock />

        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="link-bio">Link na Bio</TabsTrigger>
            <TabsTrigger value="professional-site">Site Profissional</TabsTrigger>
          </TabsList>

          {/* Bloco fixo do link (serve para ambos) */}
          <div className="flex flex-col gap-2 p-4 border border-border/50 bg-muted/10 rounded-xl mb-6 w-full max-w-[1600px] mx-auto">
            <span className="text-sm font-medium text-foreground">
              {activeTab === "link-bio" ? "Seu Link Exclusivo" : "Link do seu Site Profissional"}
            </span>
            <div className="flex items-center">
              <span className="bg-muted text-muted-foreground px-3 py-2 border border-border/50 border-r-0 rounded-l-md text-sm h-11 flex items-center shrink-0">
                totten.com.br/
              </span>
              <Input
                value={profile.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                className={cn(
                  "rounded-none bg-background border-border/50 h-11 focus-visible:ring-1",
                  activeTab === "professional-site" ? "border-r-0" : ""
                )}
                placeholder="seunome"
              />
              {activeTab === "professional-site" && (
                <span className="bg-muted text-muted-foreground px-3 py-2 border border-border/50 border-l-0 text-sm h-11 flex items-center shrink-0">
                  /site
                </span>
              )}
              <button
                onClick={handleCopyLink}
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

          <TabsContent value="link-bio" className="mt-0">
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
                  <PhoneMockup />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="professional-site" className="mt-0">
            <ProfessionalSiteView profile={profile} initialData={proSiteConfig} globalContact={globalContact} />
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
              <PhoneMockup />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

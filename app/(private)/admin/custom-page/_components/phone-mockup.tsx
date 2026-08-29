"use client";

import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { Instagram, Facebook, Youtube, Whatsapp, Globe } from "@boxicons/react";

interface PhoneMockupProps {
  profile: any;
  theme: any;
  socials: any;
  links: any;
  activeTab: "global" | "link-bio" | "professional-site" | "booking-site";
  proSiteConfig: any;
  previewKey?: number;
  isFullScreen?: boolean;
}

export function PhoneMockup({
  profile,
  theme,
  socials,
  links,
  activeTab,
  proSiteConfig,
  previewKey = 0,
  isFullScreen = false,
}: PhoneMockupProps) {
  const [localKey, setLocalKey] = useState(0);

  if (!profile?.slug) {
    return (
      <div className={cn("relative mx-auto flex items-center justify-center bg-black", isFullScreen ? "w-full h-full" : "rounded-[3rem] border-8 border-black w-[320px] h-[650px]")}>
        <p className="text-white/50 text-sm">Carregando prévia...</p>
      </div>
    );
  }

  // IF IT IS PRO OR BOOKING SITE, WE USE THE IFRAME PREVIEW
  if (activeTab === "professional-site" || activeTab === "booking-site") {
    let url = `/${profile.slug}`;
    if (activeTab === "professional-site") {
      url = `/${profile.slug}/site`;
    } else if (activeTab === "booking-site") {
      url = `/${profile.slug}/agendar`;
    }

    const iframeSrc = `${url}?t=${previewKey + localKey}`;

    return (
      <div className={cn("relative mx-auto", isFullScreen ? "w-full h-full" : "w-[320px] h-[650px]")}>
        {/* Fake Notch Removed */}

        {/* Refresh button */}
        <button
          onClick={() => setLocalKey(k => k + 1)}
          className="absolute bottom-3 right-3 z-30 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-colors"
          title="Atualizar prévia"
        >
          <RefreshCw className="h-4 w-4" />
        </button>

        <div className={cn("bg-black relative overflow-hidden mx-auto flex", isFullScreen ? "w-full h-full" : "w-[320px] h-[650px] rounded-[3rem] border-8 border-black")}>
          <iframe
            key={iframeSrc}
            src={iframeSrc}
            className="w-full h-full border-none bg-white"
            title="Prévia do Site"
          />
        </div>
      </div>
    );
  }

  // ELSE, IF IT'S LINK-BIO OR GLOBAL, WE USE THE FAST DOM PREVIEW (REAL-TIME)
  const getButtonClassNames = () => {
    const rounding = theme?.buttonRounding || "pill";
    let roundingClass = "rounded-full";
    if (rounding === "square") roundingClass = "rounded-none";
    if (rounding === "round") roundingClass = "rounded-md";
    if (rounding === "more-round") roundingClass = "rounded-2xl";

    const style = theme?.buttonStyle || "solid";
    let styleClass = "";
    if (style === "glass") {
      styleClass = "bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 shadow-sm";
    } else if (style === "outline") {
      styleClass = "bg-transparent border-2 hover:opacity-80";
    } else {
      styleClass = "hover:opacity-90";
    }

    return cn(
      "w-full h-12 shrink-0 flex items-center justify-center text-sm font-medium px-4 text-center truncate cursor-pointer transition-all",
      roundingClass,
      styleClass
    );
  };

  const getButtonStyles = () => {
    const style = theme?.buttonStyle || "solid";
    let customStyle: any = { color: theme?.buttonText || "#000000" };

    if (style === "solid") {
      customStyle.backgroundColor = theme?.buttonBg || "#ffffff";
      const shadow = theme?.buttonShadow || "none";
      const shadowColor = theme?.buttonShadowColor || "#000000";

      if (shadow === "soft") {
        customStyle.boxShadow = `4px 4px 10px 0px ${shadowColor}40`;
      } else if (shadow === "strong") {
        customStyle.boxShadow = `6px 6px 15px 0px ${shadowColor}80`;
      } else if (shadow === "hard") {
        customStyle.boxShadow = `5px 5px 0px 0px ${shadowColor}`;
      }
    } else if (style === "outline") {
      customStyle.borderColor = theme?.buttonBg || "#ffffff";
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

  const getIconSize = () => {
    return "h-7 w-7"; // Sempre grande
  };

  const SocialIconsBlock = () => (
    <div className="flex flex-wrap justify-center w-full gap-1">
      {(socials?.activePlatforms || []).filter((platform: string) => socials?.visibility?.[platform]?.bio).map((platform: string) => (
        <div
          key={platform}
          className="rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer p-2.5 bg-transparent"
          style={{
            color: theme?.textColor || "#000000"
          }}
        >
          {renderSocialIcon(platform, getIconSize())}
        </div>
      ))}
    </div>
  );

  const getBackgroundStyle = () => {
    let style: any = {};
    if (theme?.id === "solid") {
      const bgStyle = theme?.bgStyle || "solid";
      if (bgStyle === "solid") {
        style.backgroundColor = theme?.color;
      } else if (bgStyle === "gradient") {
        const dir = theme?.bgGradientDirection || "to-b";
        const c1 = theme?.color || "#ffffff";
        const c2 = theme?.bgGradientColor2 || "#000000";
        if (dir === "to-b") style.backgroundImage = `linear-gradient(to bottom, ${c1}, ${c2})`;
        if (dir === "to-t") style.backgroundImage = `linear-gradient(to top, ${c1}, ${c2})`;
        if (dir === "radial") style.backgroundImage = `radial-gradient(circle, ${c1}, ${c2})`;
      }
    } else if (theme?.id === "custom") {
      if (theme?.backgroundImage) {
        style.backgroundImage = `url(${theme.backgroundImage})`;
      } else {
        style.backgroundColor = "#1e293b";
      }
    }
    return style;
  };

  let layout = profile?.layout || "classic";

  return (
    <>
      <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Noto+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Oxanium:wght@400;500;600;700&family=Roboto:ital,wght@0,400;0,500;0,700;1,400&family=Sora:wght@400;500;600;700&display=swap');
    `}</style>
      <div className={cn("bg-black relative overflow-hidden mx-auto", isFullScreen ? "w-full h-full" : "w-[320px] h-[650px] rounded-[3rem] border-8 border-black shadow-2xl ring-1 ring-border/20")}>
        {!isFullScreen && <div className="absolute top-0 inset-x-0 h-6 bg-black z-30 rounded-b-2xl w-40 mx-auto" />}

        {/* CAMADA DE FUNDO BASE */}
        <div
          className={cn(
            "absolute inset-0 z-0 transition-colors duration-500",
            theme?.id !== "solid" && theme?.id !== "custom" ? theme?.css : "",
            theme?.id === "custom" ? "bg-cover bg-center bg-no-repeat" : ""
          )}
          style={getBackgroundStyle()}
        />

        {/* EFEITOS DE FUNDO */}
        {(theme?.id === "solid" || theme?.id === "custom") && theme?.bgNoise && (
          <div
            className="absolute inset-0 z-0 opacity-[0.15] mix-blend-overlay pointer-events-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
          />
        )}
        {(theme?.id === "solid" || theme?.id === "custom") && theme?.bgBlur && theme?.bgBlur !== "none" && (
          <div className={cn(
            "absolute -inset-10 z-0 bg-white/10 pointer-events-none",
            theme?.bgBlur === "sm" ? "backdrop-blur-sm" :
              theme?.bgBlur === "md" ? "backdrop-blur-md" :
                theme?.bgBlur === "xl" ? "backdrop-blur-xl" :
                  theme?.bgBlur === "3xl" ? "backdrop-blur-3xl" :
                    "backdrop-blur-[50px]"
          )} />
        )}

        {/* CAMADA DE CONTEÚDO */}
        <div
          className={cn(
            "w-full h-full flex flex-col items-center pb-8 relative z-20 overflow-y-auto no-scrollbar",
            (!layout || layout === "classic") ? "pt-16 px-6" : "pt-0 px-0"
          )}
          style={{ fontFamily: theme?.fontFamily || "Inter, sans-serif" }}
        >
          {layout === "classic-blog" && (
            <>
              {/* Navbar do Blog */}
              <div className="w-full h-14 bg-background/80 backdrop-blur-md border-b border-border/50 flex items-center justify-between px-4 shrink-0 z-30 sticky top-0">
                <span className="font-bold text-sm truncate" style={{ color: theme?.textColor || "#000000" }}>
                  {profile?.name || "Seu Nome"}
                </span>
              </div>
              {/* Banner Central */}
              <div className="w-full h-40 bg-black/5 relative shrink-0">
                {profile?.bannerImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.bannerImage} alt="Banner" className="w-full h-full object-cover" />
                )}
              </div>
            </>
          )}

          {layout === "banner" && (
            <div className="w-full h-32 bg-black/5 relative shrink-0">
              {profile?.bannerImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.bannerImage} alt="Banner" className="w-full h-full object-cover" />
              )}
            </div>
          )}
          {layout === "header" && (
            <div className="w-full h-64 relative shrink-0">
              {profile?.image ? (
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
                {profile?.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.image} alt="Profile" className="w-full h-full object-cover" />
                )}
              </div>
            )}

            {/* Textos aplicam a cor escolhida e a fonte */}
            <h2
              className="font-bold text-xl text-center"
              style={{ color: theme?.textColor || "#000000" }}
            >
              {profile?.name || "Seu Nome"}
            </h2>
            <p
              className="text-center text-sm mt-2 leading-relaxed font-medium"
              style={{ color: theme?.textColor || "#000000" }}
            >
              {profile?.bio || "Sua biografia aparecerá aqui..."}
            </p>



            {/* Botões lendo as cores novas */}
            <div className="w-full mt-6 flex flex-col gap-3">
              {links?.map((link: any) => (
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
              {socials?.activePlatforms?.length > 0 && (
                <div className="w-full mb-6">
                  <SocialIconsBlock />
                </div>
              )}

              {/* Footer do sistema */}
              <div className="w-full flex justify-center pb-2">
                <span
                  className="text-[10px] font-medium opacity-50 uppercase tracking-wider"
                  style={{ color: theme?.textColor || "#000000" }}
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
}

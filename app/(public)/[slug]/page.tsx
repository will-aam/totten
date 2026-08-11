import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import {
  Instagram,
  Facebook,
  Youtube,
  Whatsapp,
  Globe,
} from "@boxicons/react";

export default async function PublicLinkBioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!slug) return notFound();

  // Find organization by slug
  const org = await prisma.organization.findUnique({
    where: { slug },
    include: { link_bio: true, settings: true },
  });

  if (!org || !org.link_bio) {
    return notFound();
  }

  const linkBio = org.link_bio;
  const socials = linkBio.social_links as any || { activePlatforms: [], values: {}, position: "top", style: "circle", size: "medium" };
  const links = socials.links || [];

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

  const getHref = (platform: string, value: string) => {
    if (!value) return "#";
    if (platform === "whatsapp") {
      let number = value.replace(/\D/g, "");
      if (number.length === 10 || number.length === 11) {
        number = `55${number}`;
      }
      return `https://wa.me/${number}`;
    }
    if (platform === "instagram") {
      return value.includes("instagram.com") ? value : `https://instagram.com/${value.replace("@", "")}`;
    }
    if (platform === "facebook") {
      return value.includes("facebook.com") ? value : `https://facebook.com/${value}`;
    }
    if (platform === "youtube") {
      return value.includes("youtube.com") ? value : `https://youtube.com/${value}`;
    }
    if (value.startsWith("http")) return value;
    return `https://${value}`;
  };

  const tc = linkBio.theme_config as any || {};
  const theme = {
    id: tc.id || "solid",
    color: tc.color || linkBio.theme_color_light || "#ffffff",
    css: tc.css || "",
    fontFamily: tc.fontFamily || linkBio.font_family || "Inter, sans-serif",
    textColor: tc.textColor || linkBio.theme_color_dark || "#0f172a",
    buttonBg: tc.buttonBg || "#ffffff",
    buttonText: tc.buttonText || tc.textColor || linkBio.theme_color_dark || "#0f172a",
    backgroundImage: tc.backgroundImage || "",
    buttonStyle: tc.buttonStyle || "solid",
    buttonRounding: tc.buttonRounding || "pill",
    buttonShadow: tc.buttonShadow || "none",
    buttonShadowColor: tc.buttonShadowColor || "#000000",
    bgStyle: tc.bgStyle || "solid",
    bgGradientDirection: tc.bgGradientDirection || "to-b",
    bgGradientColor2: tc.bgGradientColor2 || "#000000",
    bgNoise: tc.bgNoise || false,
    bgBlur: tc.bgBlur || "none",
  };

  const pc = linkBio.profile_config as any || {};
  const profile = {
    role: pc.role || "",
    layout: pc.layout || "classic",
    bannerImage: pc.bannerImage || "",
    name: org.name,
    bio: linkBio.bio_text || "",
    image: linkBio.profile_image_url || "",
  };

  const getButtonClassNames = () => {
    const rounding = theme.buttonRounding || "pill";
    let roundingClass = "rounded-full";
    if (rounding === "none") roundingClass = "rounded-none";
    if (rounding === "sm") roundingClass = "rounded-md";
    if (rounding === "md") roundingClass = "rounded-xl";
    if (rounding === "lg") roundingClass = "rounded-2xl";

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
      "w-full min-h-[56px] shrink-0 flex items-center justify-center text-base font-medium px-6 text-center cursor-pointer transition-all",
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

  const SocialIconsBlock = () => (
    <div className="flex flex-wrap justify-center w-full gap-3">
      {socials.activePlatforms.map((platform: string) => {
        const val = platform === "whatsapp" ? (org.settings?.phone_whatsapp || socials.values[platform]) : socials.values[platform];
        return (
        <a
          key={platform}
          href={getHref(platform, val)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer p-3 bg-transparent"
          style={{
            color: theme.textColor
          }}
        >
          {renderSocialIcon(platform, getIconSize())}
        </a>
      )})}
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Noto+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Oxanium:wght@400;500;600;700&family=Roboto:ital,wght@0,400;0,500;0,700;1,400&family=Sora:wght@400;500;600;700&display=swap');
      `}</style>

      {/* DESKTOP BACKGROUND */}
      <div className="min-h-screen w-full bg-[#121212] flex flex-col items-center light">
        
        {/* CONTAINER DO LINK NA BIO */}
        <div className="w-full max-w-[600px] min-h-screen sm:min-h-[800px] sm:h-fit relative flex flex-col sm:rounded-3xl shadow-[0_40px_80px_-20px_rgba(0,0,0,1)] overflow-hidden bg-black mx-auto sm:my-12">
          
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
            "w-full h-full min-h-screen flex flex-col relative z-20 pb-16",
            (!profile.layout || profile.layout === "classic") ? "pt-16 px-6" : "pt-0 px-0"
          )}
          style={{ fontFamily: theme.fontFamily || "Inter, sans-serif" }}
        >
          
          {/* TOPO (BANNERS/HEADERS) */}
          <div className="w-full max-w-2xl mx-auto flex flex-col items-center flex-1">
            {profile.layout === "banner" && (
              <div className="w-full h-48 md:h-64 bg-black/5 relative shrink-0">
                {profile.bannerImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.bannerImage} alt="Banner" className="w-full h-full object-cover" />
                )}
              </div>
            )}
            {profile.layout === "header" && (
              <div className="w-full h-80 md:h-96 relative shrink-0">
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
              "flex flex-col items-center w-full px-6 max-w-lg mx-auto flex-1"
            )}>
              {profile.layout !== "header" && (
                <div className={cn(
                  "h-28 w-28 shrink-0 rounded-full bg-black/10 border-2 border-white/30 shadow-sm relative overflow-hidden",
                  (!profile.layout || profile.layout === "classic") ? "mb-6" : 
                  profile.layout === "banner" ? "-mt-14 mb-4" : ""
                )}>
                  {profile.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.image} alt={org.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <span className="text-3xl font-bold" style={{ color: theme.textColor }}>
                        {org.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <h1
                className="font-bold text-2xl md:text-3xl text-center"
                style={{ color: theme.textColor }}
              >
                {profile.name}
              </h1>
              
              {profile.bio && (
                <p
                  className="text-center text-base mt-3 leading-relaxed font-medium"
                  style={{ color: theme.textColor }}
                >
                  {profile.bio}
                </p>
              )}

              {/* Redes Sociais - Topo */}
              {socials.position === "top" && socials.activePlatforms.length > 0 && (
                <div className="mt-8 w-full">
                  <SocialIconsBlock />
                </div>
              )}

              {/* Botões/Links */}
              <div className="w-full mt-8 flex flex-col gap-4">
                {links.map((link: any) => (
                  <a
                    key={link.id}
                    href={link.url.startsWith("http") ? link.url : `https://${link.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={getButtonClassNames()}
                    style={getButtonStyles()}
                  >
                    {link.title}
                  </a>
                ))}
              </div>

              {/* Push to bottom block */}
              <div className="mt-auto w-full pt-10 pb-4 flex flex-col items-center">
                {/* Redes Sociais - Rodapé */}
                {socials.position === "bottom" && socials.activePlatforms.length > 0 && (
                  <div className="w-full mb-6">
                    <SocialIconsBlock />
                  </div>
                )}

                {/* Rodapé Totten */}
                <div className="w-full flex justify-center">
                  <span
                    className="text-xs font-medium opacity-50 uppercase tracking-widest"
                    style={{ color: theme.textColor }}
                  >
                    by Totten
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

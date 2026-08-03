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
    include: { link_bio: true },
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
  };

  const SocialIconsBlock = () => (
    <div className={cn(
      "flex flex-wrap justify-center w-full",
      socials.style === "circle" ? "gap-3" : "gap-1"
    )}>
      {(socials.activePlatforms || []).map((platform: string) => (
        <a
          key={platform}
          href={getHref(platform, socials.values[platform])}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer",
            socials.style === "circle" ? getWrapperSize() : "p-2.5",
            socials.style === "circle" ? "shadow-sm border" : "bg-transparent"
          )}
          style={{ 
            borderColor: socials.style === "circle" ? theme.textColor : "transparent", 
            color: theme.textColor 
          }}
        >
          {renderSocialIcon(platform, getIconSize())}
        </a>
      ))}
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Noto+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Oxanium:wght@400;500;600;700&family=Roboto:ital,wght@0,400;0,500;0,700;1,400&family=Sora:wght@400;500;600;700&display=swap');
      `}</style>
      <div 
        className={cn(
          "min-h-screen w-full flex flex-col items-center pt-16 px-6 pb-8",
          theme.id !== "solid" && theme.id !== "custom" ? theme.css : "",
          theme.id === "custom" ? "bg-cover bg-center bg-no-repeat bg-fixed" : ""
        )}
        style={{
          ...(theme.id === "solid" ? { backgroundColor: theme.color } : {}),
          ...(theme.id === "custom" && theme.backgroundImage ? { backgroundImage: `url(${theme.backgroundImage})` } : {}),
          ...(theme.id === "custom" && !theme.backgroundImage ? { backgroundColor: "#1e293b" } : {}),
          fontFamily: theme.fontFamily
        }}
      >
        <div className="w-full max-w-md mx-auto flex flex-col items-center">
          <div className="h-24 w-24 shrink-0 rounded-full bg-black/10 border-2 border-white/30 shadow-sm mb-6 relative overflow-hidden">
            {linkBio.profile_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={linkBio.profile_image_url} alt={org.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <span className="text-2xl font-bold" style={{ color: theme.textColor }}>
                  {org.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <h1
            className="font-bold text-2xl text-center mb-2"
            style={{ color: theme.textColor }}
          >
            {org.name}
          </h1>
          
          {linkBio.bio_text && (
            <p
              className="text-center text-base leading-relaxed font-medium mb-6"
              style={{ color: theme.textColor }}
            >
              {linkBio.bio_text}
            </p>
          )}

          {socials.position === "top" && (
            <div className="mb-6 w-full">
              <SocialIconsBlock />
            </div>
          )}

          <div className="w-full flex flex-col gap-4 mb-6">
            {links.map((link: any) => (
              <a
                key={link.id}
                href={link.url.startsWith("http") ? link.url : `https://${link.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[56px] rounded-full flex items-center justify-center text-base font-bold shadow-sm px-6 text-center hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: theme.buttonBg,
                  color: theme.buttonText,
                }}
              >
                {link.title}
              </a>
            ))}
          </div>

          {socials.position === "bottom" && (
            <div className="mt-2 w-full">
              <SocialIconsBlock />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { Star, Briefcase, Youtube, Pin, Globe } from "@boxicons/react";

const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
};

export default async function ProfessionalSitePage({
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
  const proSiteData = (linkBio.professional_site_config as any) || {};

  const presentation = proSiteData.presentation || {};
  const services = proSiteData.services || { servicesList: [] };
  const media = proSiteData.media || {};
  const socialProof = proSiteData.socialProof || { testimonials: [] };
  const contact = proSiteData.contact || {};
  const theme = proSiteData.theme || { id: "light", css: "bg-slate-50", textColor: "#0f172a", primaryColor: "#0f172a", headerStyle: "center" };

  const isAvatarLayout = presentation.heroLayout === "avatar-cover";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Noto+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Oxanium:wght@400;500;600;700&family=Roboto:ital,wght@0,400;0,500;0,700;1,400&family=Sora:wght@400;500;600;700&display=swap');
      `}</style>
      <div 
        className={cn(
          "min-h-screen w-full flex flex-col pb-16 relative z-10 transition-colors duration-500 font-sans",
          theme.css
        )}
        style={{ color: theme.textColor }}
      >
        <div className="w-full max-w-2xl mx-auto bg-background/5 shadow-2xl min-h-screen relative overflow-hidden">
          {/* HERO / HEADER SECTION */}
          <div className="relative w-full">
            {presentation.heroImage ? (
              <div className={cn("w-full relative shrink-0", isAvatarLayout ? "h-64" : "h-80")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={presentation.heroImage} 
                  alt="Hero" 
                  className="w-full h-full object-cover"
                  style={!isAvatarLayout ? {
                    WebkitMaskImage: "linear-gradient(to top, transparent 0%, black 75%)",
                    maskImage: "linear-gradient(to top, transparent 0%, black 75%)"
                  } : {}}
                />
              </div>
            ) : (
              <div className={cn("w-full bg-muted/20 border-b border-border/10 shrink-0", isAvatarLayout ? "h-48" : "h-48")} />
            )}
            
            <div className={cn(
              "px-6 sm:px-10 relative z-10 flex flex-col pb-8", 
              isAvatarLayout 
                 ? (presentation.heroImage ? "-mt-16" : "-mt-12") 
                 : (presentation.heroImage ? "-mt-20" : "-mt-12"),
              theme.headerStyle === "center" ? "text-center items-center" : "text-left items-start"
            )}>
              {/* AVATAR DO LINK NA BIO INTEGRADO */}
              {isAvatarLayout && (
                linkBio.profile_image_url ? (
                   <div className="w-32 h-32 rounded-full border-4 shadow-md overflow-hidden mb-4 shrink-0" style={{ borderColor: theme.css.includes('slate-900') ? '#0f172a' : '#ffffff', backgroundColor: theme.css.includes('slate-900') ? '#0f172a' : '#ffffff' }}>
                     <img src={linkBio.profile_image_url} alt="Avatar" className="w-full h-full object-cover" />
                   </div>
                ) : (
                   <div className="w-32 h-32 rounded-full border-4 shadow-md bg-muted/50 mb-4 shrink-0" style={{ borderColor: theme.css.includes('slate-900') ? '#0f172a' : '#ffffff' }} />
                )
              )}

              <h1 className="font-bold text-3xl sm:text-4xl leading-tight drop-shadow-sm mt-2">
                {presentation.headline || org.name}
              </h1>
              <p className="text-base sm:text-lg opacity-80 mt-3 font-medium drop-shadow-sm max-w-lg">
                {presentation.subheadline || "Subtítulo de apoio ou missão do seu negócio."}
              </p>
              
              {services.ctaText && services.ctaLink && (
                <a 
                  href={services.ctaLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 px-8 py-4 rounded-full text-base font-bold shadow-lg w-fit text-white backdrop-blur-sm hover:scale-105 transition-transform" 
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  {services.ctaText}
                </a>
              )}
            </div>
          </div>

          {/* BIO SECTION */}
          {presentation.bio && (
            <div className="px-6 sm:px-10 py-10 bg-foreground/5">
              <h2 className="font-bold text-xl sm:text-2xl mb-4">Sobre mim</h2>
              <p className="text-base opacity-80 whitespace-pre-wrap leading-relaxed">{presentation.bio}</p>
            </div>
          )}

          {/* SERVICES SECTION */}
          {(services.servicesList && services.servicesList.length > 0) && (
            <div className="px-6 sm:px-10 py-10">
              <h2 className="font-bold text-xl sm:text-2xl mb-6 flex items-center gap-2">
                <Briefcase className="h-6 w-6" /> Serviços
              </h2>
              <div className="flex flex-col gap-4">
                {services.servicesList.map((srv: any, i: number) => (
                  <div key={i} className="p-5 sm:p-6 rounded-2xl flex flex-col gap-3 relative shadow-sm border" style={{ borderColor: 'rgba(150,150,150,0.15)', backgroundColor: 'rgba(150,150,150,0.03)' }}>
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="font-bold text-lg sm:text-xl leading-snug">{srv.title || "Serviço"}</h3>
                      <span className="font-bold text-base shrink-0 px-3 py-1 rounded-lg" style={{ color: theme.primaryColor, backgroundColor: 'rgba(150,150,150,0.1)' }}>
                        {srv.price}
                      </span>
                    </div>
                    <p className="text-base opacity-75 leading-relaxed">{srv.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TESTIMONIALS SECTION */}
          {(socialProof.testimonials && socialProof.testimonials.length > 0) && (
            <div className="px-6 sm:px-10 py-10 bg-foreground/5 overflow-hidden">
              <h2 className="font-bold text-xl sm:text-2xl mb-6 flex items-center gap-2">
                <Star className="h-6 w-6" /> Depoimentos
              </h2>
              <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x pb-6 -mx-6 px-6 sm:-mx-10 sm:px-10">
                {socialProof.testimonials.map((testi: any, i: number) => (
                  <div key={i} className="w-72 sm:w-80 shrink-0 p-6 rounded-2xl bg-background shadow-sm snap-center border border-border/20">
                    <div className="flex text-amber-400 mb-3">
                      <Star className="h-4 w-4" type="solid" /><Star className="h-4 w-4" type="solid" /><Star className="h-4 w-4" type="solid" /><Star className="h-4 w-4" type="solid" /><Star className="h-4 w-4" type="solid" />
                    </div>
                    <p className="text-sm sm:text-base opacity-80 italic mb-4">"{testi.text}"</p>
                    <p className="text-sm font-bold">{testi.name || "Cliente"}</p>
                    <p className="text-xs opacity-60">{testi.role}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIDEO SECTION */}
          {media.videoUrl && (
            <div className="px-6 sm:px-10 py-10">
              <h2 className="font-bold text-xl sm:text-2xl mb-6 flex items-center gap-2">
                <Youtube className="h-6 w-6" /> Vídeo em Destaque
              </h2>
              <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-lg border border-border/10 bg-black/10">
                <iframe 
                  width="100%" 
                  height="100%" 
                  src={getYouTubeEmbedUrl(media.videoUrl) || ""} 
                  title="YouTube video player" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* CONTACT SECTION */}
          {(contact.address || contact.phone || contact.email) && (
            <div className="px-6 sm:px-10 py-10 mb-10">
              <h2 className="font-bold text-xl sm:text-2xl mb-6 flex items-center gap-2">
                <Pin className="h-6 w-6" /> Localização e Contato
              </h2>
              <div className="flex flex-col gap-4">
                {contact.address && (
                  <p className="text-base opacity-90 leading-relaxed bg-foreground/5 p-4 rounded-xl">
                    {contact.address}
                  </p>
                )}
                
                {contact.mapUrl && (
                  <a 
                    href={contact.mapUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-full h-20 bg-muted/20 rounded-xl border border-border/10 flex items-center justify-center text-sm font-bold opacity-80 hover:opacity-100 hover:bg-muted/30 transition-all shadow-sm"
                  >
                    <Globe className="h-5 w-5 mr-2" /> Abrir no Google Maps
                  </a>
                )}
                
                <div className="flex flex-col gap-2 mt-2">
                  {contact.phone && <p className="text-base font-semibold flex items-center gap-2">📞 {contact.phone}</p>}
                  {contact.email && <p className="text-base opacity-80 flex items-center gap-2">📧 {contact.email}</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

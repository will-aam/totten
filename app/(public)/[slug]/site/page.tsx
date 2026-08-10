import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SiteClientView } from "./site-client-view";

export default async function ProfessionalSitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!slug) return notFound();

  // Find organization by slug with all required nested data for the site
  const org = await prisma.organization.findUnique({
    where: { slug },
    include: { 
      link_bio: true,
      settings: true,
      categories: { where: { active: true }, select: { id: true, name: true } },
      admins: { where: { active: true }, select: { id: true, display_name: true, email: true, instagram_url: true, show_instagram: true, profile_image_url: true, profession: true } },
      services: { where: { active: true, available_online: true }, select: { id: true, name: true, description: true, duration: true, price: true, image_url: true } },
      package_templates: { where: { active: true, available_online: true }, select: { id: true, name: true, total_sessions: true, price: true, image_url: true } }
    },
  });

  if (!org || !org.link_bio) {
    return notFound();
  }

  const linkBio = org.link_bio;
  const proSiteData = (linkBio.professional_site_config as any) || {};
  const profileConfig = (linkBio.profile_config as any) || {};
  const socialLinks = (linkBio.social_links as any) || [];

  const presentation = proSiteData.presentation || {};
  // Reutilizar banner do link na bio caso não exista hero próprio
  presentation.heroImage = profileConfig.bannerImage || presentation.heroImage;

  const services = proSiteData.services || { servicesList: [] };
  const media = proSiteData.media || {};
  const socialProof = proSiteData.socialProof || { testimonials: [] };
  const contact = proSiteData.contact || {};
  const theme = proSiteData.theme || { id: "light", css: "bg-slate-50", textColor: "#0f172a", primaryColor: "#0f172a", headerStyle: "center" };

  const isAvatarLayout = presentation.heroLayout === "avatar-cover";

  // Serialize Decimal to number to avoid Server->Client boundary error
  const safeOrg = {
    ...org,
    services: org.services.map((s: any) => ({ ...s, price: Number(s.price) })),
    package_templates: org.package_templates.map((p: any) => ({ ...p, price: Number(p.price) }))
  };

  return (
    <SiteClientView 
      org={safeOrg} 
      proSiteData={proSiteData}
      theme={theme}
      isAvatarLayout={isAvatarLayout}
      presentation={presentation}
      contact={contact}
      media={media}
      socialProof={socialProof}
      servicesConfig={services}
      socialLinks={socialLinks}
      profileConfig={profileConfig}
    />
  );
}

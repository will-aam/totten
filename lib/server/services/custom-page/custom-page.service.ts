import { getTenantPrisma } from "@/lib/prisma";

export class CustomPageService {
  /**
   * Busca as configurações da Página Personalizada (Link na Bio + Site Profissional).
   */
  static async getCustomPage(organizationId: string) {
    const prisma = getTenantPrisma(organizationId);

    const linkBio = await prisma.linkBio.findUnique({
      where: { organization_id: organizationId },
    });

    return linkBio;
  }

  /**
   * Atualiza as configurações da Página Personalizada (upsert).
   */
  static async updateCustomPage(organizationId: string, data: any) {
    const prisma = getTenantPrisma(organizationId);

    const updateData: any = {};
    
    if (data.profileImageUrl !== undefined) updateData.profile_image_url = data.profileImageUrl;
    if (data.bioText !== undefined) updateData.bio_text = data.bioText;
    if (data.themeColorLight !== undefined) updateData.theme_color_light = data.themeColorLight;
    if (data.themeColorDark !== undefined) updateData.theme_color_dark = data.themeColorDark;
    if (data.fontFamily !== undefined) updateData.font_family = data.fontFamily;
    if (data.socialLinks !== undefined) updateData.social_links = data.socialLinks;
    if (data.professionalSiteConfig !== undefined) updateData.professional_site_config = data.professionalSiteConfig;

    return await prisma.linkBio.upsert({
      where: { organization_id: organizationId },
      update: updateData,
      create: {
        organization_id: organizationId,
        profile_image_url: data.profileImageUrl || "",
        bio_text: data.bioText || "",
        theme_color_light: data.themeColorLight || "#ffffff",
        theme_color_dark: data.themeColorDark || "#000000",
        font_family: data.fontFamily || "Inter",
        social_links: data.socialLinks || {},
        professional_site_config: data.professionalSiteConfig || {},
      },
    });
  }
}

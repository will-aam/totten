import { getTenantPrisma } from "@/lib/prisma";

export class CustomPageService {
  /**
   * Busca as configurações da Página Personalizada (Link na Bio + Site Profissional).
   */
  static async getCustomPage(organizationId: string) {
    const prisma = getTenantPrisma(organizationId);

    const linkBio = await prisma.linkBio.findUnique({
      where: { organization_id: organizationId },
      include: { 
        organization: { 
          select: { 
            slug: true, 
            name: true,
            settings: {
              select: {
                phone_whatsapp: true,
                phone_landline: true
              }
            }
          } 
        } 
      }
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
    if (data.themeConfig !== undefined) updateData.theme_config = data.themeConfig;
    if (data.socialLinks !== undefined) updateData.social_links = data.socialLinks;
    if (data.professionalSiteConfig !== undefined) updateData.professional_site_config = data.professionalSiteConfig;
    if (data.profileConfig !== undefined) updateData.profile_config = data.profileConfig;

    if (data.slug || data.name) {
      const orgUpdateData: any = {};
      if (data.slug) orgUpdateData.slug = data.slug;
      if (data.name) orgUpdateData.name = data.name;
      await prisma.organization.update({
        where: { id: organizationId },
        data: orgUpdateData,
      });
    }

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
        theme_config: data.themeConfig || {},
        social_links: data.socialLinks || {},
        professional_site_config: data.professionalSiteConfig || {},
        profile_config: data.profileConfig || {},
      },
    });
  }
}

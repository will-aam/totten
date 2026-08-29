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
                phone_landline: true,
                address: true
              }
            }
          } 
        } 
      }
    });

    if (linkBio) {
      return {
        id: linkBio.id,
        profile_image_url: linkBio.profile_image_url,
        logo_url: linkBio.logo_url,
        bio_text: linkBio.bio_text,
        theme_color_light: linkBio.theme_color_light,
        theme_color_dark: linkBio.theme_color_dark,
        font_family: linkBio.font_family,
        theme_config: linkBio.theme_config as any || {},
        social_links: linkBio.social_links as any || {},
        professional_site_config: linkBio.professional_site_config as any || {},
        profile_config: linkBio.profile_config as any || {},
        organization_slug: linkBio.organization.slug,
        organization_name: linkBio.organization.name,
        global_contact: {
          whatsapp: linkBio.organization.settings?.phone_whatsapp,
          landline: linkBio.organization.settings?.phone_landline
        },
        global_location: linkBio.organization.settings?.address
      };
    }

    // Se não existe, cria um padrão
    const newLinkBio = await prisma.linkBio.create({
      data: {
        organization_id: organizationId,
        theme_color_light: "#ffffff",
        theme_color_dark: "#000000",
        font_family: "Inter",
        social_links: {
          instagram: "",
          facebook: "",
          youtube: "",
          website: ""
        },
        profile_config: {
          displayName: "",
          occupation: "",
          location: ""
        }
      },
      include: { 
        organization: { 
          select: { 
            slug: true, 
            name: true,
            settings: {
              select: {
                phone_whatsapp: true,
                phone_landline: true,
                address: true
              }
            }
          } 
        } 
      }
    });

    return {
      id: newLinkBio.id,
      profile_image_url: newLinkBio.profile_image_url,
      logo_url: newLinkBio.logo_url,
      bio_text: newLinkBio.bio_text,
      theme_color_light: newLinkBio.theme_color_light,
      theme_color_dark: newLinkBio.theme_color_dark,
      font_family: newLinkBio.font_family,
      theme_config: newLinkBio.theme_config as any || {},
      social_links: newLinkBio.social_links as any || {},
      professional_site_config: newLinkBio.professional_site_config as any || {},
      profile_config: newLinkBio.profile_config as any || {},
      organization_slug: newLinkBio.organization.slug,
      organization_name: newLinkBio.organization.name,
      global_contact: {
        whatsapp: newLinkBio.organization.settings?.phone_whatsapp,
        landline: newLinkBio.organization.settings?.phone_landline
      },
      global_location: newLinkBio.organization.settings?.address
    };
  }

  /**
   * Atualiza as configurações da Página Personalizada (upsert).
   */
  static async updateCustomPage(organizationId: string, data: any) {
    const prisma = getTenantPrisma(organizationId);

    const updateData: any = {};
    if (data.profileImageUrl !== undefined) updateData.profile_image_url = data.profileImageUrl;
    if (data.logoUrl !== undefined) updateData.logo_url = data.logoUrl;
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

      if (data.name) {
        await prisma.settings.updateMany({
          where: { organization_id: organizationId },
          data: { company_name: data.name },
        });
      }
    }
    
    if (data.globalContactWhatsapp !== undefined) {
      await prisma.settings.updateMany({
        where: { organization_id: organizationId },
        data: { phone_whatsapp: data.globalContactWhatsapp },
      });
    }
    
    if (data.globalLocationAddress !== undefined) {
      await prisma.settings.updateMany({
        where: { organization_id: organizationId },
        data: { address: data.globalLocationAddress },
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

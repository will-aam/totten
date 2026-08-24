"use server";

import { requireAuth } from "@/lib/auth";
import { CustomPageService } from "@/lib/server/services/custom-page/custom-page.service";
import { revalidatePath } from "next/cache";
import { sanitizeUrl } from "@/lib/utils";

export async function getCustomPageAction() {
  try {
    const admin = await requireAuth();
    const data = await CustomPageService.getCustomPage(admin.organizationId);
    return { success: true, data };
  } catch (error: any) {
    if (error.name === "AuthError" || error.message === "Não autorizado") {
      return { success: false, error: "Sessão expirada. Faça login novamente." };
    }
    console.error("[ACTION getCustomPageAction]", error);
    return { success: false, error: "Erro interno ao buscar página personalizada." };
  }
}

export async function updateCustomPageAction(data: {
  slug?: string;
  name?: string;
  profileImageUrl?: string;
  bioText?: string;
  themeColorLight?: string;
  themeColorDark?: string;
  fontFamily?: string;
  themeConfig?: any;
  socialLinks?: any;
  professionalSiteConfig?: any;
  profileConfig?: any;
}) {
  try {
    // Sanitização de links contra XSS
    if (data.socialLinks && data.socialLinks.links) {
      data.socialLinks.links = data.socialLinks.links.map((link: any) => ({
        ...link,
        url: sanitizeUrl(link.url) || "",
      }));
    }
    if (data.profileConfig && data.profileConfig.contact && data.profileConfig.contact.mapUrl) {
      data.profileConfig.contact.mapUrl = sanitizeUrl(data.profileConfig.contact.mapUrl) || "";
    }
    if (data.professionalSiteConfig && data.professionalSiteConfig.contact && data.professionalSiteConfig.contact.mapUrl) {
      data.professionalSiteConfig.contact.mapUrl = sanitizeUrl(data.professionalSiteConfig.contact.mapUrl) || "";
    }
    const admin = await requireAuth();
    await CustomPageService.updateCustomPage(admin.organizationId, data);
    
    // Revalida a rota para atualizar na UI e no site público futuramente
    revalidatePath("/admin/custom-page");

    return { success: true };
  } catch (error: any) {
    if (error.name === "AuthError" || error.message === "Não autorizado") {
      return { success: false, error: "Sessão expirada. Faça login novamente." };
    }
    console.error("[ACTION updateCustomPageAction]", error);
    return { success: false, error: "Erro interno ao atualizar página personalizada." };
  }
}

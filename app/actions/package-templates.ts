// app/actions/package-templates.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Função auxiliar para limpar dados sensíveis/decimais
function sanitizePackage(pkg: any) {
  if (!pkg) return null;
  return {
    ...pkg,
    price: Number(pkg.price || 0),
  };
}

export async function updatePackageTemplate(
  id: string,
  data: {
    name?: string;
    description?: string;
    total_sessions?: number;
    price?: number;
    validity_days?: number | null;
    active?: boolean;
  },
) {
  try {
    const admin = await requireAuth();

    const updated = await prisma.packageTemplate.update({
      where: { id, organization_id: admin.organizationId },
      data: {
        name: data.name,
        description: data.description,
        total_sessions: data.total_sessions,
        price: data.price,
        validity_days: data.validity_days, // ✅ Sincronizado com o Prisma
        active: data.active,
      },
    });

    revalidatePath("/admin/services");
    return { success: true, package: sanitizePackage(updated) };
  } catch (error) {
    console.error("Erro ao atualizar pacote:", error);
    return { success: false, error: "Erro ao atualizar pacote." };
  }
}

// 🔥 ESTA É A FUNÇÃO QUE O TS NÃO ESTAVA ACHANDO
export async function togglePackageTemplateStatus(
  id: string,
  currentStatus: boolean,
) {
  try {
    const admin = await requireAuth();

    const updated = await prisma.packageTemplate.update({
      where: { id, organization_id: admin.organizationId },
      data: { active: !currentStatus },
    });

    revalidatePath("/admin/services");

    return { success: true, package: sanitizePackage(updated) };
  } catch (error) {
    console.error("Erro ao mudar status do pacote:", error);
    return { success: false, error: "Erro ao mudar status do pacote." };
  }
}

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

export async function togglePackageTemplateStatus(
  id: string,
  currentStatus: boolean, // O status atual (true = ativo, false = inativo)
) {
  try {
    const admin = await requireAuth();

    // LÓGICA DE DEFESA: Se a intenção é ATIVAR (currentStatus era false)
    if (currentStatus === false) {
      const pkg = await prisma.packageTemplate.findUnique({
        where: { id, organization_id: admin.organizationId },
        include: { service: true },
      });

      if (!pkg) return { success: false, error: "Pacote não encontrado." };

      // Verifica se o serviço base está inativo
      if (pkg.service && !pkg.service.active) {
        return {
          success: false,
          error: `Erro: O serviço base '${pkg.service.name}' está inativo. Ative o serviço antes de ativar o pacote.`,
        };
      }
    }

    // Se passou na trava (ou se a intenção é apenas inativar), executa o update
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

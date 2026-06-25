"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
// Importando as regras de negócio centralizadas
import {
  validatePackageDeactivation,
  validatePackageActivation,
} from "@/lib/validation/catalog";

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

    // Nota: Se você quiser garantir que uma alteração via formulário de edição
    // também respeite as regras de inativação, você poderia chamar os validadores aqui também.
    // Por enquanto, focamos na ação de Toggle que é onde o status muda diretamente.

    const updated = await prisma.packageTemplate.update({
      where: { id, organization_id: admin.organizationId },
      data: {
        name: data.name,
        description: data.description,
        total_sessions: data.total_sessions,
        price: data.price,
        validity_days: data.validity_days,
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
  currentStatus: boolean, // true = estava ativo, false = estava inativo
) {
  try {
    const admin = await requireAuth();

    // 1. LÓGICA DE INATIVAÇÃO (está ativo e quer inativar)
    if (currentStatus === true) {
      const validation = await validatePackageDeactivation(
        id,
        admin.organizationId,
      );
      if (!validation.success) {
        return { success: false, error: validation.message };
      }
    }

    // 2. LÓGICA DE ATIVAÇÃO (estava inativo e quer ativar)
    if (currentStatus === false) {
      const validation = await validatePackageActivation(
        id,
        admin.organizationId,
      );
      if (!validation.success) {
        return { success: false, error: validation.message };
      }
    }

    // Se passou na validação, executa o update
    const updated = await prisma.packageTemplate.update({
      where: { id, organization_id: admin.organizationId },
      data: { active: !currentStatus },
    });

    revalidatePath("/admin/services");
    revalidatePath("/admin/packages"); // Garantir que a lista de pacotes atualize
    return { success: true, package: sanitizePackage(updated) };
  } catch (error) {
    console.error("Erro ao mudar status do pacote:", error);
    return { success: false, error: "Erro ao mudar status do pacote." };
  }
}

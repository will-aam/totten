// app/actions/payment-methods.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { revalidatePath } from "next/cache";
import { PaymentMethod } from "@prisma/client";

async function getAdminOrg() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("NÃ£o autorizado");

  //  OTIMIZAÃ‡ÃƒO EXTREMA: O Select puxa APENAS o ID da organizaÃ§Ã£o,
  // ignorando senhas, nomes, configuraÃ§Ãµes e dados inÃºteis para esta validaÃ§Ã£o.
  const admin = await prisma.admin.findUnique({
    where: { email: session.user.email },
    select: {
      organizations: {
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!admin || admin.organizations.length === 0) {
    throw new Error("OrganizaÃ§Ã£o nÃ£o encontrada");
  }

  return admin.organizations[0].id;
}

export async function getPaymentMethods() {
  try {
    const organizationId = await getAdminOrg();

    let methods = await prisma.organizationPaymentMethod.findMany({
      where: { organization_id: organizationId },
      orderBy: { created_at: "asc" },
    });

    // Se a organização não possuir nenhum meio de pagamento ainda, ou não tiver "À Vista",
    // garantimos a criação do meio padrão "À Vista"
    const hasAVista = methods.some((m) => m.name.toLowerCase() === "à vista" || m.name.toLowerCase() === "a vista");
    if (!hasAVista) {
      const defaultAVista = await prisma.organizationPaymentMethod.create({
        data: {
          name: "À Vista",
          type: "OUTRO",
          isActive: true,
          feePercentage: 0,
          feeFixed: 0,
          daysToReceive: 0,
          organization_id: organizationId,
        },
      });
      methods = [defaultAVista, ...methods];
    }

    return methods.map((item) => ({
      ...item,
      feePercentage: Number(item.feePercentage),
      feeFixed: Number(item.feeFixed),
    }));
  } catch (error) {
    console.error("Erro ao buscar meios de pagamento:", error);
    return [];
  }
}

export async function upsertPaymentMethod(data: {
  id?: string;
  name: string;
  type: PaymentMethod;
  isActive: boolean;
  feePercentage: number;
  feeFixed: number;
  daysToReceive: number;
}) {
  try {
    const organizationId = await getAdminOrg();

    const payload = {
      name: data.name,
      type: data.type,
      isActive: data.isActive,
      feePercentage: data.feePercentage,
      feeFixed: data.feeFixed,
      daysToReceive: data.daysToReceive,
      organization_id: organizationId,
    };

    if (data.id) {
      await prisma.organizationPaymentMethod.update({
        where: { id: data.id, organization_id: organizationId },
        data: payload,
      });
    } else {
      await prisma.organizationPaymentMethod.create({
        data: payload,
      });
    }

    revalidatePath("/admin/finance/payment-methods");
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar meio de pagamento:", error);
    return { success: false, error: "Falha ao salvar os dados." };
  }
}

export async function deletePaymentMethod(id: string) {
  try {
    const organizationId = await getAdminOrg();

    const existing = await prisma.organizationPaymentMethod.findUnique({
      where: { id, organization_id: organizationId },
    });

    if (existing && (existing.name.toLowerCase() === "à vista" || existing.name.toLowerCase() === "a vista")) {
      return {
        success: false,
        error: "O meio de pagamento 'À Vista' é padrão do sistema e não pode ser excluído, apenas editado.",
      };
    }

    await prisma.organizationPaymentMethod.delete({
      where: { id, organization_id: organizationId },
    });

    revalidatePath("/admin/finance/payment-methods");
    revalidatePath("/admin/finance/settings");
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar:", error);
    return { success: false, error: "Não foi possível excluir." };
  }
}


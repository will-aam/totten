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

    if (!existing) {
      return { success: false, error: "Meio de pagamento não encontrado." };
    }

    if (
      existing.name.toLowerCase() === "à vista" ||
      existing.name.toLowerCase() === "a vista"
    ) {
      return {
        success: false,
        error:
          "O meio de pagamento 'À Vista' é padrão do sistema e não pode ser excluído, apenas editado.",
      };
    }

    // 1. Se este método for o default_payment_method_id nas configurações gerais, desvincula (set null)
    await prisma.settings.updateMany({
      where: {
        organization_id: organizationId,
        default_payment_method_id: id,
      },
      data: {
        default_payment_method_id: null,
      },
    });

    // 2. Verifica se existem transações financeiras vinculadas a este meio de pagamento
    const linkedTransactionsCount = await prisma.transaction.count({
      where: {
        organization_id: organizationId,
        payment_method_id: id,
      },
    });

    if (linkedTransactionsCount > 0) {
      // ✅ SOFT DELETE: Preserva integralmente os vínculos contábeis históricos das transações
      // e apenas desativa a forma de pagamento (isActive: false) para que ela não seja utilizada em novas vendas.
      await prisma.organizationPaymentMethod.update({
        where: { id, organization_id: organizationId },
        data: { isActive: false },
      });

      revalidatePath("/admin/finance/payment-methods");
      revalidatePath("/admin/finance/settings");
      revalidatePath("/admin/finance/transactions");
      revalidatePath("/admin/finance/receivables");

      return {
        success: true,
        softDeleted: true,
        message:
          "Meio de pagamento desativado com sucesso para preservar o histórico contábil das transações.",
      };
    }

    // 3. Se NÃO houver nenhuma transação vinculada, pode ser excluído fisicamente com segurança
    await prisma.organizationPaymentMethod.delete({
      where: { id, organization_id: organizationId },
    });

    revalidatePath("/admin/finance/payment-methods");
    revalidatePath("/admin/finance/settings");
    revalidatePath("/admin/finance/transactions");
    revalidatePath("/admin/finance/receivables");

    return { success: true, softDeleted: false };
  } catch (error) {
    console.error("Erro ao deletar:", error);
    return { success: false, error: "Não foi possível excluir." };
  }
}


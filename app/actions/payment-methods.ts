// app/actions/payment-methods.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { PaymentMethod } from "@prisma/client";

async function getAdminOrg() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Não autorizado");

  // 🔥 OTIMIZAÇÃO EXTREMA: O Select puxa APENAS o ID da organização,
  // ignorando senhas, nomes, configurações e dados inúteis para esta validação.
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
    throw new Error("Organização não encontrada");
  }

  return admin.organizations[0].id;
}

export async function getPaymentMethods() {
  try {
    const organizationId = await getAdminOrg();

    const methods = await prisma.organizationPaymentMethod.findMany({
      where: { organization_id: organizationId },
      orderBy: { created_at: "asc" },
    });

    // CORREÇÃO: Convertemos os objetos Decimal para Number aqui no servidor
    // Assim o Next.js consegue serializar os dados para o Client Component sem erro.
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

    await prisma.organizationPaymentMethod.delete({
      where: { id, organization_id: organizationId },
    });

    revalidatePath("/admin/finance/payment-methods");
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar:", error);
    return { success: false, error: "Não foi possível excluir." };
  }
}

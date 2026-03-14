// app/actions/transactions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { TransactionType, TransactionStatus } from "@prisma/client";

async function getAdminOrg() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Não autorizado");

  const admin = await prisma.admin.findUnique({
    where: { email: session.user.email },
    include: { organizations: true },
  });

  if (!admin || admin.organizations.length === 0) {
    throw new Error("Organização não encontrada");
  }

  return admin.organizations[0].id;
}

// --- 1. CRIAR TRANSAÇÃO MANUAL (AGORA COM SUPORTE A RECORRÊNCIA) ---
export async function createTransaction(data: {
  type: TransactionType;
  description: string;
  amount: number;
  date: string;
  status: TransactionStatus;
  paymentMethodId?: string;
  isRecurring?: boolean;
  frequency?: string;
  duration?: number;
}) {
  try {
    const organizationId = await getAdminOrg();

    if (data.isRecurring && data.duration && data.duration > 1) {
      const recurrenceId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const transactionsToCreate = [];

      for (let i = 0; i < data.duration; i++) {
        const txDate = new Date(data.date + "T12:00:00Z");
        if (data.frequency === "WEEKLY") {
          txDate.setDate(txDate.getDate() + i * 7);
        } else {
          txDate.setMonth(txDate.getMonth() + i);
        }

        transactionsToCreate.push({
          type: data.type,
          description: data.description,
          amount: data.amount,
          date: txDate,
          status: i === 0 ? data.status : "PENDENTE",
          payment_method_id: data.paymentMethodId || null,
          organization_id: organizationId,
          recurrence_id: recurrenceId,
          installment: `${i + 1}/${data.duration}`,
        });
      }

      await prisma.transaction.createMany({
        data: transactionsToCreate,
      });
    } else {
      await prisma.transaction.create({
        data: {
          type: data.type,
          description: data.description,
          amount: data.amount,
          date: new Date(data.date + "T12:00:00Z"),
          status: data.status,
          payment_method_id: data.paymentMethodId || null,
          organization_id: organizationId,
        },
      });
    }

    revalidatePath("/admin/finance/dashboard");
    revalidatePath("/admin/finance/transactions");
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar transação:", error);
    return { success: false, error: "Falha ao registrar movimentação." };
  }
}

// --- 2. ATUALIZAR TRANSAÇÃO MANUAL ---
export async function updateTransaction(
  id: string,
  data: {
    type: TransactionType;
    description: string;
    amount: number;
    date: string;
    status: TransactionStatus;
    paymentMethodId?: string;
    updateFuture?: boolean; // 🔥 Habilitamos a edição em lote
  },
) {
  try {
    const organizationId = await getAdminOrg();

    // 1. Acha a transação atual para saber de onde partir
    const currentTx = await prisma.transaction.findUnique({
      where: { id, organization_id: organizationId },
    });

    if (!currentTx) throw new Error("Transação não encontrada.");

    // 2. Atualiza a transação que o usuário clicou (Atualiza tudo)
    await prisma.transaction.update({
      where: { id },
      data: {
        type: data.type,
        description: data.description,
        amount: data.amount,
        date: new Date(data.date + "T12:00:00Z"),
        status: data.status,
        payment_method_id: data.paymentMethodId || null,
      },
    });

    // 3. Lógica Mágica: Se marcou para atualizar o futuro
    if (data.updateFuture && currentTx.recurrence_id) {
      await prisma.transaction.updateMany({
        where: {
          organization_id: organizationId,
          recurrence_id: currentTx.recurrence_id,
          date: { gt: currentTx.date }, // Apenas as parcelas com data MAIOR que a atual
        },
        data: {
          description: data.description,
          amount: data.amount,
          payment_method_id: data.paymentMethodId || null,
          // Atenção: NÃO mexemos na "date" e nem no "status" das futuras!
        },
      });
    }

    revalidatePath("/admin/finance/dashboard");
    revalidatePath("/admin/finance/transactions");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar transação:", error);
    return { success: false, error: "Falha ao atualizar movimentação." };
  }
}

// --- 3. EXCLUIR TRANSAÇÃO MANUAL ---
export async function deleteTransaction(id: string, deleteFuture?: boolean) {
  try {
    const organizationId = await getAdminOrg();

    const currentTx = await prisma.transaction.findUnique({
      where: { id, organization_id: organizationId },
    });

    if (!currentTx) throw new Error("Transação não encontrada.");

    // Se pediu para apagar o futuro também
    if (deleteFuture && currentTx.recurrence_id) {
      await prisma.transaction.deleteMany({
        where: {
          organization_id: organizationId,
          recurrence_id: currentTx.recurrence_id,
          date: { gte: currentTx.date }, // Deleta a atual (gte) e as maiores que ela (futuras)
        },
      });
    } else {
      // Deleta apenas a selecionada
      await prisma.transaction.delete({
        where: { id },
      });
    }

    revalidatePath("/admin/finance/dashboard");
    revalidatePath("/admin/finance/transactions");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir transação:", error);
    return { success: false, error: "Falha ao excluir movimentação." };
  }
}

// --- 4. BUSCAR EXTRATO COMPLETO DO MÊS ---
export async function getFullTransactions(month: number, year: number) {
  try {
    const organizationId = await getAdminOrg();

    // Limites do mês filtrado
    const targetMonth = month - 1;
    const monthStart = new Date(year, targetMonth, 1, 0, 0, 0);
    const monthEnd = new Date(year, targetMonth + 1, 0, 23, 59, 59, 999);

    // 1. Agendamentos Realizados (Receitas e Insumos)
    const appointments = await prisma.appointment.findMany({
      where: {
        organization_id: organizationId,
        status: "REALIZADO",
        date_time: { gte: monthStart, lte: monthEnd },
      },
      include: { service: true, client: true },
    });

    // 2. Transações Manuais
    const manualTransactions = await prisma.transaction.findMany({
      where: {
        organization_id: organizationId,
        date: { gte: monthStart, lte: monthEnd },
      },
      include: { client: true, payment_method: true },
    });

    // 3. Mesclar tudo
    const historyFromAppts = appointments.flatMap((a) => {
      const items = [];

      // Receita do Serviço
      items.push({
        id: `rec_${a.id}`, // ID falso para UI
        originalId: a.id,
        isManual: false, // Avisa o Front-end que não pode editar por aqui
        type: "RECEITA" as const,
        description: a.service.name,
        amount: Number(a.service.price),
        date: a.date_time.toISOString(),
        status: (a.payment_method ? "PAGO" : "PENDENTE") as "PAGO" | "PENDENTE",
        clientName: a.client.name,
        paymentMethod: a.payment_method || undefined,
      });

      // Despesa do Insumo
      if (a.service.material_cost && Number(a.service.material_cost) > 0) {
        items.push({
          id: `custo_${a.id}`, // ID falso para UI
          originalId: a.id,
          isManual: false, // Avisa o Front-end que não pode editar por aqui
          type: "DESPESA" as const,
          description: `Insumos: ${a.service.name}`,
          amount: Number(a.service.material_cost),
          date: a.date_time.toISOString(),
          status: "PAGO" as const,
          clientName: a.client.name,
        });
      }
      return items;
    });

    const historyFromTx = manualTransactions.map((t) => ({
      id: t.id,
      originalId: t.id,
      isManual: true, // Avisa o Front-end que esse PODE editar e excluir
      type: t.type,
      description: t.description,
      amount: Number(t.amount),
      date: t.date.toISOString(),
      status: t.status,
      clientName: t.client?.name,
      paymentMethod: t.payment_method?.type || undefined,
      recurrence_id: t.recurrence_id,
      installment: t.installment,
    }));

    // Retorna tudo ordenado (mais recentes primeiro)
    return [...historyFromAppts, ...historyFromTx].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  } catch (error) {
    console.error("Erro ao buscar extrato:", error);
    return [];
  }
}
// --- 5. ATUALIZAÇÃO RÁPIDA DE STATUS (INLINE) ---
export async function updateTransactionStatus(
  id: string,
  status: TransactionStatus,
) {
  try {
    const organizationId = await getAdminOrg();

    // Atualiza apenas o status da transação específica
    await prisma.transaction.update({
      where: { id, organization_id: organizationId },
      data: { status },
    });

    revalidatePath("/admin/finance/dashboard");
    revalidatePath("/admin/finance/transactions");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    return { success: false, error: "Falha ao atualizar o status." };
  }
}

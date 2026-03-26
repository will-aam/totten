// app/actions/transactions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import {
  TransactionType,
  TransactionStatus,
  PaymentMethod,
} from "@prisma/client";

// 🔥 OTIMIZAÇÃO: Busca apenas o ID necessário para não encher a RAM
async function getAdminOrg() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Não autorizado");

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

// --- 1. CRIAR TRANSAÇÃO MANUAL (COM RECORRÊNCIA) ---
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
      const recurrenceId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
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
    updateFuture?: boolean;
  },
) {
  try {
    const organizationId = await getAdminOrg();

    const currentTx = await prisma.transaction.findUnique({
      where: { id, organization_id: organizationId },
      select: { recurrence_id: true, date: true }, // 🔥 OTIMIZAÇÃO: Trazendo só o que precisa
    });

    if (!currentTx) throw new Error("Transação não encontrada.");

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

    if (data.updateFuture && currentTx.recurrence_id) {
      await prisma.transaction.updateMany({
        where: {
          organization_id: organizationId,
          recurrence_id: currentTx.recurrence_id,
          date: { gt: currentTx.date },
        },
        data: {
          description: data.description,
          amount: data.amount,
          payment_method_id: data.paymentMethodId || null,
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
      select: { recurrence_id: true, date: true }, // 🔥 OTIMIZAÇÃO
    });

    if (!currentTx) throw new Error("Transação não encontrada.");

    if (deleteFuture && currentTx.recurrence_id) {
      await prisma.transaction.deleteMany({
        where: {
          organization_id: organizationId,
          recurrence_id: currentTx.recurrence_id,
          date: { gte: currentTx.date },
        },
      });
    } else {
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

    const targetMonth = month - 1;
    const monthStart = new Date(year, targetMonth, 1, 0, 0, 0);
    const monthEnd = new Date(year, targetMonth + 1, 0, 23, 59, 59, 999);

    // 🔥 OTIMIZAÇÃO: Usar Select para puxar menos dados (Economia de tráfego)
    const appointments = await prisma.appointment.findMany({
      where: {
        organization_id: organizationId,
        status: "REALIZADO",
        date_time: { gte: monthStart, lte: monthEnd },
      },
      select: {
        id: true,
        date_time: true,
        payment_method: true,
        client: { select: { name: true } },
        service: { select: { name: true, price: true, material_cost: true } },
      },
    });

    const manualTransactions = await prisma.transaction.findMany({
      where: {
        organization_id: organizationId,
        date: { gte: monthStart, lte: monthEnd },
      },
      select: {
        id: true,
        type: true,
        description: true,
        amount: true,
        date: true,
        status: true,
        recurrence_id: true,
        installment: true,
        client: { select: { name: true } },
        payment_method: { select: { type: true } },
      },
    });

    const historyFromAppts = appointments.flatMap((a) => {
      const items = [];

      items.push({
        id: `rec_${a.id}`,
        originalId: a.id,
        isManual: false,
        type: "RECEITA" as const,
        description: a.service.name,
        amount: Number(a.service.price),
        date: a.date_time.toISOString(),
        status: (a.payment_method ? "PAGO" : "PENDENTE") as "PAGO" | "PENDENTE",
        clientName: a.client.name,
        paymentMethod: a.payment_method || undefined,
      });

      if (a.service.material_cost && Number(a.service.material_cost) > 0) {
        items.push({
          id: `custo_${a.id}`,
          originalId: a.id,
          isManual: false,
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
      isManual: true,
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

// --- 6. BUSCAR CONTAS A RECEBER (PENDENTES) ---
export async function getPendingReceivables() {
  try {
    const organizationId = await getAdminOrg();

    // 🔥 OTIMIZAÇÃO: Buscando estritamente os dados necessários
    const pendingAppointments = await prisma.appointment.findMany({
      where: {
        organization_id: organizationId,
        status: "REALIZADO",
        payment_method: null,
      },
      select: {
        id: true,
        date_time: true,
        client: { select: { name: true } },
        service: { select: { name: true, price: true } },
      },
      orderBy: { date_time: "asc" },
    });

    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        organization_id: organizationId,
        type: "RECEITA",
        status: "PENDENTE",
      },
      select: {
        id: true,
        date: true,
        description: true,
        amount: true,
        client: { select: { name: true } },
      },
      orderBy: { date: "asc" },
    });

    const formattedAppointments = pendingAppointments.map((a) => ({
      id: a.id,
      sourceType: "APPOINTMENT" as const,
      description: a.service.name,
      amount: Number(a.service.price),
      date: a.date_time.toISOString(),
      clientName: a.client.name,
    }));

    const formattedTransactions = pendingTransactions.map((t) => ({
      id: t.id,
      sourceType: "TRANSACTION" as const,
      description: t.description,
      amount: Number(t.amount),
      date: t.date.toISOString(),
      clientName: t.client?.name || "Sem cliente",
    }));

    return [...formattedAppointments, ...formattedTransactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  } catch (error) {
    console.error("Erro ao buscar contas a receber:", error);
    return [];
  }
}

// --- 7. DAR BAIXA EM UM RECEBIMENTO ---
export async function processReceivablePayment(
  id: string,
  sourceType: "APPOINTMENT" | "TRANSACTION",
  paymentMethod: string,
  paymentMethodId?: string,
) {
  try {
    const organizationId = await getAdminOrg();

    if (sourceType === "APPOINTMENT") {
      await prisma.appointment.update({
        where: { id, organization_id: organizationId },
        data: {
          payment_method: paymentMethod as PaymentMethod, // Cast seguro para Enum
          has_charge: false,
        },
      });
      revalidatePath("/admin/agenda");
    } else {
      await prisma.transaction.update({
        where: { id, organization_id: organizationId },
        data: {
          status: "PAGO",
          payment_method_id: paymentMethodId || null,
        },
      });
    }

    revalidatePath("/admin/finance/dashboard");
    revalidatePath("/admin/finance/transactions");
    revalidatePath("/admin/finance/receivables");

    return { success: true };
  } catch (error) {
    console.error("Erro ao dar baixa em recebimento:", error);
    return { success: false, error: "Falha ao processar pagamento." };
  }
}

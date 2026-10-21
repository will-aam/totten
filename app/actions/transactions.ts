// app/actions/transactions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth"; //  Substituído pela sua função robusta
import { revalidatePath } from "next/cache";
import {
  TransactionType,
  TransactionStatus,
  PaymentMethod,
} from "@prisma/client";
import {
  triggerZibeeSyncById,
  deleteTransactionFromZibee,
} from "@/lib/server/integrations/zibee.service";

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
    const admin = await requireAuth();

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
          organization_id: admin.organizationId,
          recurrence_id: recurrenceId,
          installment: `${i + 1}/${data.duration}`,
          admin_id: admin.id, //  RASTREABILIDADE
        });
      }

      await prisma.transaction.createMany({
        data: transactionsToCreate,
      });

      // Disparo automático em lote para o Zibee (assíncrono e não-bloqueante)
      prisma.transaction
        .findMany({
          where: { recurrence_id: recurrenceId, organization_id: admin.organizationId },
          select: { id: true },
        })
        .then((txs) => txs.forEach((t) => triggerZibeeSyncById(t.id)))
        .catch(console.error);
    } else {
      const createdTx = await prisma.transaction.create({
        data: {
          type: data.type,
          description: data.description,
          amount: data.amount,
          date: new Date(data.date + "T12:00:00Z"),
          status: data.status,
          payment_method_id: data.paymentMethodId || null,
          organization_id: admin.organizationId,
          admin_id: admin.id, //  RASTREABILIDADE
        },
      });

      // Disparo automático imediato para o Zibee (assíncrono e não-bloqueante)
      triggerZibeeSyncById(createdTx.id).catch(console.error);
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
    const admin = await requireAuth();

    const currentTx = await prisma.transaction.findUnique({
      where: { id, organization_id: admin.organizationId },
      select: {
        recurrence_id: true,
        date: true,
        package_id: true,
        appointment_id: true,
        stock_item_id: true,
      },
    });

    if (!currentTx) throw new Error("Transação não encontrada.");

    if (currentTx.package_id || currentTx.appointment_id || currentTx.stock_item_id) {
      return {
        success: false,
        error: "Esta movimentação foi gerada automaticamente pelo sistema e não pode ser editada diretamente pelo extrato financeiro.",
      };
    }

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
          organization_id: admin.organizationId,
          recurrence_id: currentTx.recurrence_id,
          date: { gt: currentTx.date },
        },
        data: {
          description: data.description,
          amount: data.amount,
          payment_method_id: data.paymentMethodId || null,
        },
      });

      // Sincronizar futuras também no Zibee
      prisma.transaction
        .findMany({
          where: {
            organization_id: admin.organizationId,
            recurrence_id: currentTx.recurrence_id,
            date: { gte: currentTx.date },
          },
          select: { id: true },
        })
        .then((txs) => txs.forEach((t) => triggerZibeeSyncById(t.id)))
        .catch(console.error);
    } else {
      triggerZibeeSyncById(id).catch(console.error);
    }

    revalidatePath("/admin/finance/dashboard");
    revalidatePath("/admin/finance/transactions");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao atualizar transação:", error);
    return {
      success: false,
      error: error?.message || "Falha ao atualizar movimentação.",
    };
  }
}

// --- 3. EXCLUIR TRANSAÇÃO MANUAL ---
export async function deleteTransaction(id: string, deleteFuture?: boolean) {
  try {
    const admin = await requireAuth();

    const currentTx = await prisma.transaction.findUnique({
      where: { id, organization_id: admin.organizationId },
      select: {
        recurrence_id: true,
        date: true,
        package_id: true,
        appointment_id: true,
        stock_item_id: true,
      },
    });

    if (!currentTx) throw new Error("Transação não encontrada.");

    if (currentTx.package_id || currentTx.appointment_id || currentTx.stock_item_id) {
      return {
        success: false,
        error: "Esta movimentação foi gerada automaticamente pelo sistema e não pode ser excluída diretamente pelo extrato financeiro.",
      };
    }

    if (deleteFuture && currentTx.recurrence_id) {
      const txsToDelete = await prisma.transaction.findMany({
        where: {
          organization_id: admin.organizationId,
          recurrence_id: currentTx.recurrence_id,
          date: { gte: currentTx.date },
        },
        select: { id: true },
      });

      await prisma.transaction.deleteMany({
        where: {
          organization_id: admin.organizationId,
          recurrence_id: currentTx.recurrence_id,
          date: { gte: currentTx.date },
        },
      });

      // Remove do Zibee
      txsToDelete.forEach((t) =>
        deleteTransactionFromZibee(t.id, admin.organizationId).catch(console.error),
      );
    } else {
      await prisma.transaction.delete({
        where: { id },
      });

      // Remove do Zibee
      deleteTransactionFromZibee(id, admin.organizationId).catch(console.error);
    }

    revalidatePath("/admin/finance/dashboard");
    revalidatePath("/admin/finance/transactions");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao excluir transação:", error);
    return {
      success: false,
      error: error?.message || "Falha ao excluir movimentação.",
    };
  }
}

// --- 4. BUSCAR EXTRATO COMPLETO DO MÊS ---
export async function getFullTransactions(month: number, year: number) {
  try {
    const admin = await requireAuth();

    const targetMonth = month - 1;
    const monthStart = new Date(year, targetMonth, 1, 0, 0, 0);
    const monthEnd = new Date(year, targetMonth + 1, 0, 23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: {
        organization_id: admin.organizationId,
        date: { gte: monthStart, lte: monthEnd },
        NOT: {
          type: "RECEITA",
          appointment: {
            package_id: { not: null },
          },
        },
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
        package_id: true,
        appointment_id: true,
        stock_item_id: true,
        package: { select: { id: true, name: true } },
        client: { select: { name: true } },
        payment_method: { select: { type: true } },
        admin: { select: { display_name: true } },
        appointment: {
          select: {
            client: { select: { name: true } },
            payment_method: true,
            professional: { select: { display_name: true } },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return transactions.map((t) => {
      const isManual = !t.package_id && !t.appointment_id && !t.stock_item_id;
      return {
        id: t.id,
        originalId: t.id,
        isManual,
        type: t.type,
        description: t.description,
        amount: Number(t.amount),
        date: t.date.toISOString(),
        status: t.status,
        clientName: t.client?.name || t.appointment?.client?.name || undefined,
        paymentMethod:
          t.payment_method?.type || t.appointment?.payment_method || undefined,
        recurrence_id: t.recurrence_id,
        installment: t.installment,
        package_id: t.package_id || undefined,
        packageName: t.package?.name || undefined,
        appointment_id: t.appointment_id || undefined,
        stock_item_id: t.stock_item_id || undefined,
        professionalName:
          t.admin?.display_name ||
          t.appointment?.professional?.display_name ||
          undefined,
      };
    });
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
    const admin = await requireAuth();

    await prisma.transaction.update({
      where: { id, organization_id: admin.organizationId },
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
    const admin = await requireAuth();

    const pendingAppointments = await prisma.appointment.findMany({
      where: {
        organization_id: admin.organizationId,
        status: "REALIZADO",
        payment_method: null,
        package_id: null, // Sessões de pacote já são quitadas na venda do pacote
      },
      select: {
        id: true,
        date_time: true,
        snapshot_service_name: true,
        snapshot_service_price: true,
        client: { select: { name: true } },
        service: { select: { name: true, price: true } },
      },
      orderBy: { date_time: "asc" },
    });

    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        organization_id: admin.organizationId,
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
      description: a.snapshot_service_name || a.service?.name || "Serviço",
      amount: Number(a.snapshot_service_price ?? a.service?.price ?? 0),
      date: a.date_time.toISOString(),
      clientName: a.client?.name || "Sem cliente",
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
    const admin = await requireAuth();

    if (sourceType === "APPOINTMENT") {
      const appt = await prisma.appointment.findUnique({
        where: { id, organization_id: admin.organizationId },
        include: { client: true, service: true, transactions: true },
      });

      if (!appt) throw new Error("Agendamento não encontrado.");

      if (appt.package_id) {
        return {
          success: false,
          error: "Agendamentos vinculados a pacotes já foram quitados na aquisição do pacote.",
        };
      }

      const apptPrice = appt.snapshot_service_price ?? appt.service.price;
      const apptName = appt.snapshot_service_name ?? appt.service.name;

      let txIdToSync: string | null = null;

      await prisma.$transaction(async (tx) => {
        await tx.appointment.update({
          where: { id, organization_id: admin.organizationId },
          data: {
            payment_method: paymentMethod as PaymentMethod, // Cast seguro para Enum
            has_charge: false,
            professional_id: admin.id, // Assina o apontamento (baixa no caixa)
          },
        });

        const revenueTx = appt.transactions.find((t) => t.type === "RECEITA");

        if (!revenueTx) {
          const newTx = await tx.transaction.create({
            data: {
              type: "RECEITA",
              description: `Serviço Realizado: ${apptName} (${appt.client.name})`,
              amount: apptPrice,
              date: new Date(),
              status: "PAGO",
              organization_id: admin.organizationId,
              appointment_id: appt.id,
              client_id: appt.client_id,
              payment_method_id: paymentMethodId || null,
              admin_id: admin.id,
            },
          });
          txIdToSync = newTx.id;
        } else {
          await tx.transaction.update({
            where: { id: revenueTx.id },
            data: {
              status: "PAGO",
              payment_method_id: paymentMethodId || null,
              admin_id: admin.id,
            },
          });
          txIdToSync = revenueTx.id;
        }
      });

      if (txIdToSync) {
        triggerZibeeSyncById(txIdToSync).catch(console.error);
      }

      revalidatePath("/admin/agenda");
    } else {
      await prisma.transaction.update({
        where: { id, organization_id: admin.organizationId },
        data: {
          status: "PAGO",
          payment_method_id: paymentMethodId || null,
          admin_id: admin.id, // Assina quem quitou a pendência
        },
      });

      // Sincroniza a liquidação no Zibee
      triggerZibeeSyncById(id).catch(console.error);
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

// --- 7.1. DAR BAIXA EM TODOS OS RECEBIMENTOS (EM MASSA) ---
export async function processAllReceivablesPayment(
  paymentMethod: string,
  paymentMethodId?: string,
) {
  try {
    const admin = await requireAuth();

    // 1. Busca todos os agendamentos pendentes da organização (excluindo pacotes)
    const pendingAppointments = await prisma.appointment.findMany({
      where: {
        organization_id: admin.organizationId,
        status: "REALIZADO",
        payment_method: null,
        package_id: null,
      },
      include: {
        client: true,
        service: true,
        transactions: true,
      },
    });

    // 2. Busca todas as transações manuais pendentes da organização
    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        organization_id: admin.organizationId,
        type: "RECEITA",
        status: "PENDENTE",
      },
      select: {
        id: true,
      },
    });

    const createdOrUpdatedTxIds: string[] = [];

    await prisma.$transaction(async (tx) => {
      // Baixa nos agendamentos
      for (const appt of pendingAppointments) {
        await tx.appointment.update({
          where: { id: appt.id },
          data: {
            payment_method: paymentMethod as PaymentMethod,
            has_charge: false,
            professional_id: admin.id,
          },
        });

        const apptPrice = appt.snapshot_service_price ?? appt.service.price;
        const apptName = appt.snapshot_service_name ?? appt.service.name;

        const revenueTx = appt.transactions.find((t) => t.type === "RECEITA");

        if (!revenueTx) {
          const newTx = await tx.transaction.create({
            data: {
              type: "RECEITA",
              description: `Serviço Realizado: ${apptName} (${appt.client.name})`,
              amount: apptPrice,
              date: new Date(),
              status: "PAGO",
              organization_id: admin.organizationId,
              appointment_id: appt.id,
              client_id: appt.client_id,
              payment_method_id: paymentMethodId || null,
              admin_id: admin.id,
            },
          });
          createdOrUpdatedTxIds.push(newTx.id);
        } else {
          await tx.transaction.update({
            where: { id: revenueTx.id },
            data: {
              status: "PAGO",
              payment_method_id: paymentMethodId || null,
              admin_id: admin.id,
            },
          });
          createdOrUpdatedTxIds.push(revenueTx.id);
        }
      }

      // Baixa nas transações manuais
      if (pendingTransactions.length > 0) {
        await tx.transaction.updateMany({
          where: {
            id: { in: pendingTransactions.map((t) => t.id) },
            organization_id: admin.organizationId,
          },
          data: {
            status: "PAGO",
            payment_method_id: paymentMethodId || null,
            admin_id: admin.id,
          },
        });

        pendingTransactions.forEach((t) => createdOrUpdatedTxIds.push(t.id));
      }
    });

    // Sincroniza Zibee em background
    createdOrUpdatedTxIds.forEach((txId) => {
      triggerZibeeSyncById(txId).catch(console.error);
    });

    revalidatePath("/admin/finance/dashboard");
    revalidatePath("/admin/finance/transactions");
    revalidatePath("/admin/finance/receivables");
    revalidatePath("/admin/agenda");

    return {
      success: true,
      count: pendingAppointments.length + pendingTransactions.length,
    };
  } catch (error) {
    console.error("Erro ao dar baixa em todos os recebimentos:", error);
    return { success: false, error: "Falha ao processar pagamentos em lote." };
  }
}

// --- 8. HISTÓRICO PAGINADO E BUSCA SERVER-SIDE ---
export async function getPaginatedTransactions(params: {
  month?: number;
  year?: number;
  startDate?: string;
  endDate?: string;
  specificDate?: string;
  type?: "RECEITA" | "DESPESA" | "ALL";
  status?: TransactionStatus | "ALL";
  paymentMethod?: string;
  page: number;
  limit: number;
  search?: string;
}) {
  try {
    const admin = await requireAuth();

    const andConditions: any[] = [
      {
        organization_id: admin.organizationId,
        NOT: {
          type: "RECEITA",
          appointment: {
            package_id: { not: null },
          },
        },
      },
    ];

    // 1. Filtro de Data
    if (params.specificDate) {
      const [sYear, sMonth, sDay] = params.specificDate.split("-").map(Number);
      const startOfDay = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0);
      const endOfDay = new Date(sYear, sMonth - 1, sDay, 23, 59, 59, 999);
      andConditions.push({
        date: { gte: startOfDay, lte: endOfDay },
      });
    } else if (params.startDate || params.endDate) {
      const dateRange: any = {};
      if (params.startDate) {
        const [sYear, sMonth, sDay] = params.startDate.split("-").map(Number);
        dateRange.gte = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0);
      }
      if (params.endDate) {
        const [eYear, eMonth, eDay] = params.endDate.split("-").map(Number);
        dateRange.lte = new Date(eYear, eMonth - 1, eDay, 23, 59, 59, 999);
      }
      andConditions.push({ date: dateRange });
    } else if (params.month && params.year) {
      const targetMonth = params.month - 1;
      const monthStart = new Date(params.year, targetMonth, 1, 0, 0, 0);
      const monthEnd = new Date(params.year, targetMonth + 1, 0, 23, 59, 59, 999);
      andConditions.push({
        date: { gte: monthStart, lte: monthEnd },
      });
    }

    // 2. Filtro de Tipo (RECEITA / DESPESA)
    if (params.type && params.type !== "ALL") {
      andConditions.push({ type: params.type });
    }

    // 3. Filtro de Status (PAGO / PENDENTE / ATRASADO)
    if (params.status && params.status !== "ALL") {
      andConditions.push({ status: params.status });
    }

    // 4. Filtro por Forma de Pagamento
    if (params.paymentMethod && params.paymentMethod !== "ALL") {
      andConditions.push({
        OR: [
          { payment_method: { type: params.paymentMethod as any } },
          { appointment: { payment_method: params.paymentMethod as any } },
        ],
      });
    }

    // 5. Busca Inteligente (Nome, CPF, Telefone/WhatsApp, Descrição, Pacote, Profissional, Valor)
    if (params.search && params.search.trim().length > 0) {
      const search = params.search.trim();
      const onlyDigits = search.replace(/\D/g, "");

      const cleanNumberStr = search
        .replace(/R\$/gi, "")
        .replace(/\s/g, "")
        .replace(/\./g, "")
        .replace(",", ".");
      const parsedAmount = parseFloat(cleanNumberStr);
      const isNumeric =
        !isNaN(parsedAmount) && parsedAmount > 0 && isFinite(parsedAmount);

      const searchOrConditions: any[] = [
        { description: { contains: search, mode: "insensitive" } },
        { client: { name: { contains: search, mode: "insensitive" } } },
        { appointment: { client: { name: { contains: search, mode: "insensitive" } } } },
        { package: { name: { contains: search, mode: "insensitive" } } },
        { admin: { display_name: { contains: search, mode: "insensitive" } } },
        { appointment: { professional: { display_name: { contains: search, mode: "insensitive" } } } },
      ];

      // Busca por CPF
      searchOrConditions.push(
        { client: { cpf: { contains: search, mode: "insensitive" } } },
        { appointment: { client: { cpf: { contains: search, mode: "insensitive" } } } },
      );
      if (onlyDigits.length >= 3) {
        searchOrConditions.push(
          { client: { cpf: { contains: onlyDigits, mode: "insensitive" } } },
          { appointment: { client: { cpf: { contains: onlyDigits, mode: "insensitive" } } } },
        );
      }

      // Busca por Telefone / WhatsApp
      searchOrConditions.push(
        { client: { phone_whatsapp: { contains: search, mode: "insensitive" } } },
        { appointment: { client: { phone_whatsapp: { contains: search, mode: "insensitive" } } } },
      );
      if (onlyDigits.length >= 4) {
        searchOrConditions.push(
          { client: { phone_whatsapp: { contains: onlyDigits, mode: "insensitive" } } },
          { appointment: { client: { phone_whatsapp: { contains: onlyDigits, mode: "insensitive" } } } },
        );
      }

      // Busca por Valor exato (ex: 650, 150.00, etc.)
      if (isNumeric) {
        searchOrConditions.push({ amount: parsedAmount });
      }

      andConditions.push({ OR: searchOrConditions });
    }

    const where = {
      AND: andConditions,
    };

    const skip = (params.page - 1) * params.limit;

    const [total, rawTxs] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { date: "desc" },
        select: {
          id: true,
          type: true,
          description: true,
          amount: true,
          date: true,
          status: true,
          recurrence_id: true,
          installment: true,
          package_id: true,
          appointment_id: true,
          stock_item_id: true,
          package: { select: { id: true, name: true } },
          client: {
            select: {
              id: true,
              name: true,
              cpf: true,
              phone_whatsapp: true,
            },
          },
          payment_method: { select: { type: true, name: true } },
          admin: { select: { display_name: true } },
          appointment: {
            select: {
              client: {
                select: {
                  id: true,
                  name: true,
                  cpf: true,
                  phone_whatsapp: true,
                },
              },
              payment_method: true,
              professional: { select: { display_name: true } },
            },
          },
        },
      }),
    ]);

    const data = rawTxs.map((t) => {
      const isManual = !t.package_id && !t.appointment_id && !t.stock_item_id;
      return {
        id: t.id,
        originalId: t.id,
        isManual,
        type: t.type,
        description: t.description,
        amount: Number(t.amount),
        date: t.date.toISOString(),
        status: t.status,
        clientName: t.client?.name || t.appointment?.client?.name || undefined,
        clientCpf: t.client?.cpf || t.appointment?.client?.cpf || undefined,
        clientPhone:
          t.client?.phone_whatsapp ||
          t.appointment?.client?.phone_whatsapp ||
          undefined,
        paymentMethod:
          t.payment_method?.type || t.appointment?.payment_method || undefined,
        paymentMethodName: t.payment_method?.name || undefined,
        recurrence_id: t.recurrence_id,
        installment: t.installment,
        package_id: t.package_id || undefined,
        packageName: t.package?.name || undefined,
        appointment_id: t.appointment_id || undefined,
        stock_item_id: t.stock_item_id || undefined,
        professionalName:
          t.admin?.display_name ||
          t.appointment?.professional?.display_name ||
          undefined,
      };
    });

    return {
      data,
      total,
      page: params.page,
      totalPages: Math.ceil(total / params.limit) || 1,
    };
  } catch (error) {
    console.error("Erro ao buscar histórico paginado:", error);
    throw error;
  }
}

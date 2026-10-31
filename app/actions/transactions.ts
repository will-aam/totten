// app/actions/transactions.ts (Schema atualizado com settlement_date e due_date)
"use server";

import { prisma } from "@/lib/prisma";
import { requireFinancePermission } from "@/lib/auth";
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
import {
  calculatePaymentSettlementAndFee,
  createSettledRevenueWithFee,
} from "@/lib/server/services/payments/settlement.service";
import {
  parseDateToBrasilia,
  getBrasiliaDayRange,
  getBrasiliaMonthRange,
  addBrasiliaMonths,
  addBrasiliaWeeks,
} from "@/lib/date-utils";

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
    const admin = await requireFinancePermission();

    if (data.isRecurring && data.duration && data.duration > 1) {
      const recurrenceId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const transactionsToCreate = [];

      for (let i = 0; i < data.duration; i++) {
        const baseDate = parseDateToBrasilia(data.date);
        const txDate =
          data.frequency === "WEEKLY"
            ? addBrasiliaWeeks(baseDate, i)
            : addBrasiliaMonths(baseDate, i);

        transactionsToCreate.push({
          type: data.type,
          description: data.description,
          amount: data.amount,
          date: txDate,
          due_date: txDate,
          settlement_date: i === 0 && data.status === "PAGO" ? txDate : null,
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
        .then((txs) =>
          txs.forEach((t) =>
            triggerZibeeSyncById(t.id, admin.organizationId).catch(console.error),
          ),
        )
        .catch(console.error);
    } else {
      let txDate = parseDateToBrasilia(data.date);
      let feeAmount = 0;
      let methodId = data.paymentMethodId || null;
      let settlementDate: Date | null = null;

      if (data.type === "RECEITA" && data.paymentMethodId && data.status === "PAGO") {
        const calculation = await calculatePaymentSettlementAndFee({
          organizationId: admin.organizationId,
          grossAmount: data.amount,
          paymentMethodId: data.paymentMethodId,
          baseDate: txDate,
        });
        settlementDate = calculation.settlementDate;
        feeAmount = calculation.feeAmount;
        if (calculation.method?.id) {
          methodId = calculation.method.id;
        }
      }

      const createdTx = await prisma.transaction.create({
        data: {
          type: data.type,
          description: data.description,
          amount: data.amount,
          date: txDate, // Regime de competência: a data escolhida para a transação
          settlement_date: settlementDate || (data.status === "PAGO" ? txDate : null),
          due_date: data.status === "PENDENTE" ? txDate : null,
          status: data.status,
          payment_method_id: methodId,
          organization_id: admin.organizationId,
          admin_id: admin.id, //  RASTREABILIDADE
        },
      });

      // Disparo automático imediato para o Zibee (assíncrono e não-bloqueante)
      triggerZibeeSyncById(createdTx.id, admin.organizationId).catch(console.error);

      if (feeAmount > 0) {
        const feeTx = await prisma.transaction.create({
          data: {
            type: "DESPESA",
            description: `Taxa - ${data.description}`,
            amount: feeAmount,
            date: txDate, // Mesma competência
            settlement_date: settlementDate || txDate, // Mesma liquidação
            status: "PAGO",
            payment_method_id: methodId,
            organization_id: admin.organizationId,
            admin_id: admin.id,
            parent_transaction_id: createdTx.id,
          },
        });
        triggerZibeeSyncById(feeTx.id, admin.organizationId).catch(console.error);
      }
    }

    revalidatePath("/admin/finance/dashboard");
    revalidatePath("/admin/finance/transactions");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao criar transação:", error);
    return {
      success: false,
      error: error?.message || "Falha ao registrar movimentação.",
    };
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
    const admin = await requireFinancePermission();

    const currentTx = await prisma.transaction.findUnique({
      where: { id, organization_id: admin.organizationId },
      include: {
        child_transactions: true,
      },
    });

    if (!currentTx) throw new Error("Transação não encontrada.");

    if (currentTx.package_id || currentTx.appointment_id || currentTx.stock_item_id) {
      return {
        success: false,
        error: "Esta movimentação foi gerada automaticamente pelo sistema e não pode ser editada diretamente pelo extrato financeiro.",
      };
    }

    const txDate = data.date ? parseDateToBrasilia(data.date) : currentTx.date;
    const finalAmount = Number(data.amount);
    const finalType = data.type;
    const finalStatus = data.status;
    const finalPaymentMethodId =
      data.paymentMethodId !== undefined
        ? data.paymentMethodId || null
        : currentTx.payment_method_id;

    let settlementDate: Date | null = null;
    let feeAmount = 0;
    let appliedMethodId = finalPaymentMethodId;

    if (finalStatus === "PAGO") {
      if (finalType === "RECEITA") {
        if (finalPaymentMethodId) {
          const calculation = await calculatePaymentSettlementAndFee({
            organizationId: admin.organizationId,
            grossAmount: finalAmount,
            paymentMethodId: finalPaymentMethodId,
            baseDate: txDate,
          });
          settlementDate = calculation.settlementDate;
          feeAmount = calculation.feeAmount;
          if (calculation.method?.id) {
            appliedMethodId = calculation.method.id;
          }
        } else {
          settlementDate = txDate;
        }
      } else {
        // DESPESA PAGA: liquidação ocorre na data de competência
        settlementDate = txDate;
      }
    }

    const syncedTxIds: string[] = [];
    const deletedFeeTxIds: string[] = [];

    await prisma.$transaction(async (tx) => {
      // 1. Atualiza a transação principal com o D+X correto
      await tx.transaction.update({
        where: { id },
        data: {
          type: finalType,
          description: data.description,
          amount: finalAmount,
          date: txDate,
          settlement_date: settlementDate,
          due_date:
            finalStatus === "PENDENTE"
              ? currentTx.due_date || txDate
              : currentTx.due_date,
          status: finalStatus,
          payment_method_id: appliedMethodId,
        },
      });
      syncedTxIds.push(id);

      // 2. Gestão das despesas filhas de taxa (parent_transaction_id)
      const existingFeeTxs = currentTx.child_transactions.filter(
        (c) => c.type === "DESPESA",
      );

      if (finalStatus === "PAGO" && finalType === "RECEITA" && feeAmount > 0) {
        if (existingFeeTxs.length > 0) {
          // Atualiza a primeira taxa existente e remove duplicadas caso haja
          const [primaryFee, ...redundantFees] = existingFeeTxs;
          await tx.transaction.update({
            where: { id: primaryFee.id },
            data: {
              amount: feeAmount,
              description: `Taxa - ${data.description}`,
              date: txDate,
              settlement_date: settlementDate || txDate,
              status: "PAGO",
              payment_method_id: appliedMethodId,
            },
          });
          syncedTxIds.push(primaryFee.id);

          if (redundantFees.length > 0) {
            const redundantIds = redundantFees.map((f) => f.id);
            await tx.transaction.deleteMany({
              where: { id: { in: redundantIds } },
            });
            deletedFeeTxIds.push(...redundantIds);
          }
        } else {
          // Cria uma nova taxa vinculada com parent_transaction_id
          const createdFee = await tx.transaction.create({
            data: {
              type: "DESPESA",
              description: `Taxa - ${data.description}`,
              amount: feeAmount,
              date: txDate,
              settlement_date: settlementDate || txDate,
              status: "PAGO",
              payment_method_id: appliedMethodId,
              organization_id: admin.organizationId,
              admin_id: admin.id,
              parent_transaction_id: id,
            },
          });
          syncedTxIds.push(createdFee.id);
        }
      } else {
        // Se a movimentação não for PAGA, ou não for RECEITA, ou não tiver taxa, remove taxas filhas
        if (existingFeeTxs.length > 0) {
          const idsToDelete = existingFeeTxs.map((f) => f.id);
          await tx.transaction.deleteMany({
            where: { id: { in: idsToDelete } },
          });
          deletedFeeTxIds.push(...idsToDelete);
        }
      }

      // 3. Atualizar futuras na recorrência se solicitado
      if (data.updateFuture && currentTx.recurrence_id) {
        await tx.transaction.updateMany({
          where: {
            organization_id: admin.organizationId,
            recurrence_id: currentTx.recurrence_id,
            date: { gt: currentTx.date },
          },
          data: {
            description: data.description,
            amount: finalAmount,
            payment_method_id: appliedMethodId,
          },
        });
      }
    });

    // 4. Sincronização externa (Zibee) não-bloqueante
    for (const txId of syncedTxIds) {
      triggerZibeeSyncById(txId, admin.organizationId).catch(console.error);
    }
    for (const delId of deletedFeeTxIds) {
      deleteTransactionFromZibee(delId, admin.organizationId).catch(console.error);
    }

    if (data.updateFuture && currentTx.recurrence_id) {
      prisma.transaction
        .findMany({
          where: {
            organization_id: admin.organizationId,
            recurrence_id: currentTx.recurrence_id,
            date: { gt: currentTx.date },
          },
          select: { id: true },
        })
        .then((txs) =>
          txs.forEach((t) =>
            triggerZibeeSyncById(t.id, admin.organizationId).catch(console.error),
          ),
        )
        .catch(console.error);
    }

    revalidatePath("/admin/finance/dashboard");
    revalidatePath("/admin/finance/transactions");
    revalidatePath("/admin/finance/receivables");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao atualizar transação:", error);
    return {
      success: false,
      error: error?.message || "Falha ao atualizar movimentação.",
    };
  }
}

// --- 3. EXCLUIR TRANSAÇÃO MANUAL OU ESTORNAR TRANSAÇÃO VINCULADA (HOOK REVERSO) ---
export async function deleteTransaction(id: string, deleteFuture?: boolean) {
  try {
    const admin = await requireFinancePermission();

    const currentTx = await prisma.transaction.findUnique({
      where: { id, organization_id: admin.organizationId },
      include: {
        appointment: {
          include: {
            client: true,
            service: true,
            transactions: true,
          },
        },
        child_transactions: true,
      },
    });

    if (!currentTx) throw new Error("Transação não encontrada.");

    if (currentTx.package_id || currentTx.stock_item_id) {
      return {
        success: false,
        error:
          "Esta movimentação está vinculada a pacotes ou estoque e deve ser gerenciada pelo respectivo módulo.",
      };
    }

    // Se estiver vinculada a um agendamento, aplica o Hook Reverso de Estorno
    if (currentTx.appointment_id && currentTx.appointment) {
      const appt = currentTx.appointment;

      await prisma.$transaction(async (tx) => {
        // 1. Deleta taxas filhas atreladas a esta transação
        await tx.transaction.deleteMany({
          where: { parent_transaction_id: currentTx.id },
        });

        // 2. Deleta a transação em si
        await tx.transaction.delete({
          where: { id: currentTx.id },
        });

        // 3. Atualiza o agendamento correspondente
        if (currentTx.type === "RECEITA" && currentTx.status === "PAGO") {
          const otherPaidRevenues = appt.transactions.filter(
            (t) =>
              t.id !== currentTx.id &&
              t.type === "RECEITA" &&
              t.status === "PAGO",
          );

          const stillHasPayment = otherPaidRevenues.length > 0;
          const isCancelled = appt.status === "CANCELADO";

          await tx.appointment.update({
            where: { id: appt.id },
            data: {
              payment_method: stillHasPayment ? appt.payment_method : null,
              has_charge: !stillHasPayment && !isCancelled,
              mp_payment_status: stillHasPayment ? appt.mp_payment_status : null,
            },
          });

          // Registra nota de auditoria reversa no prontuário do cliente
          if (appt.client_id) {
            await tx.clientNote.create({
              data: {
                client_id: appt.client_id,
                organization_id: admin.organizationId,
                text: `Estorno Financeiro: O pagamento de R$ ${Number(currentTx.amount).toFixed(2)} referente ao agendamento de ${appt.snapshot_service_name || appt.service?.name || "serviço"} foi excluído/estornado por ${admin.name || admin.email}. Status financeiro do agendamento revertido.`,
                date: new Date(),
              },
            });
          }
        }
      });

      // Remove do Zibee se aplicável
      deleteTransactionFromZibee(id, admin.organizationId).catch(console.error);

      revalidatePath("/admin/finance/dashboard");
      revalidatePath("/admin/finance/transactions");
      revalidatePath("/admin/finance/receivables");
      revalidatePath("/admin/agenda");
      return { success: true };
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
      // Deleta quaisquer taxas filhas antes de deletar a transação
      await prisma.transaction.deleteMany({
        where: { parent_transaction_id: id },
      });

      await prisma.transaction.delete({
        where: { id },
      });

      // Remove do Zibee
      deleteTransactionFromZibee(id, admin.organizationId).catch(console.error);
    }

    revalidatePath("/admin/finance/dashboard");
    revalidatePath("/admin/finance/transactions");
    revalidatePath("/admin/finance/receivables");
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
    const admin = await requireFinancePermission();

    const { monthStart, monthEnd } = getBrasiliaMonthRange(year, month);

    const transactions = await prisma.transaction.findMany({
      where: {
        organization_id: admin.organizationId,
        parent_transaction_id: null,
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
        settlement_date: true,
        due_date: true,
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
        settlementDate: t.settlement_date ? t.settlement_date.toISOString() : null,
        dueDate: t.due_date ? t.due_date.toISOString() : null,
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
    const admin = await requireFinancePermission();

    const currentTx = await prisma.transaction.findUnique({
      where: { id, organization_id: admin.organizationId },
      include: {
        child_transactions: true,
      },
    });

    if (!currentTx) throw new Error("Transação não encontrada.");

    if (currentTx.status === status) {
      return { success: true };
    }

    const txDate = currentTx.date;
    const finalAmount = Number(currentTx.amount);
    const finalType = currentTx.type;
    const paymentMethodId = currentTx.payment_method_id;

    let settlementDate: Date | null = null;
    let feeAmount = 0;
    let appliedMethodId = paymentMethodId;

    if (status === "PAGO") {
      if (finalType === "RECEITA") {
        if (paymentMethodId) {
          const calculation = await calculatePaymentSettlementAndFee({
            organizationId: admin.organizationId,
            grossAmount: finalAmount,
            paymentMethodId,
            baseDate: txDate,
          });
          settlementDate = calculation.settlementDate;
          feeAmount = calculation.feeAmount;
          if (calculation.method?.id) {
            appliedMethodId = calculation.method.id;
          }
        } else {
          settlementDate = txDate;
        }
      } else {
        settlementDate = txDate;
      }
    }

    const syncedTxIds: string[] = [];
    const deletedFeeTxIds: string[] = [];

    await prisma.$transaction(async (tx) => {
      // 1. Atualiza a transação com data de liquidação calculada
      await tx.transaction.update({
        where: { id },
        data: {
          status,
          settlement_date: settlementDate,
          due_date:
            status === "PENDENTE"
              ? currentTx.due_date || txDate
              : currentTx.due_date,
          payment_method_id: appliedMethodId,
        },
      });
      syncedTxIds.push(id);

      // 2. Se a transação estiver atrelada a um agendamento, sincroniza a cobrança pendente
      if (currentTx.appointment_id) {
        if (status === "PAGO") {
          await tx.appointment.update({
            where: { id: currentTx.appointment_id },
            data: { has_charge: false },
          });
        } else if (status === "PENDENTE") {
          await tx.appointment.update({
            where: { id: currentTx.appointment_id },
            data: { has_charge: true },
          });
        }
      }

      // 3. Gestão das despesas de taxa (child_transactions)
      const existingFeeTxs = currentTx.child_transactions.filter(
        (c) => c.type === "DESPESA",
      );

      if (status === "PAGO" && finalType === "RECEITA" && feeAmount > 0) {
        if (existingFeeTxs.length > 0) {
          const [primaryFee, ...redundantFees] = existingFeeTxs;
          await tx.transaction.update({
            where: { id: primaryFee.id },
            data: {
              amount: feeAmount,
              description: `Taxa - ${currentTx.description}`,
              date: txDate,
              settlement_date: settlementDate || txDate,
              status: "PAGO",
              payment_method_id: appliedMethodId,
            },
          });
          syncedTxIds.push(primaryFee.id);

          if (redundantFees.length > 0) {
            const redundantIds = redundantFees.map((f) => f.id);
            await tx.transaction.deleteMany({
              where: { id: { in: redundantIds } },
            });
            deletedFeeTxIds.push(...redundantIds);
          }
        } else {
          const createdFee = await tx.transaction.create({
            data: {
              type: "DESPESA",
              description: `Taxa - ${currentTx.description}`,
              amount: feeAmount,
              date: txDate,
              settlement_date: settlementDate || txDate,
              status: "PAGO",
              payment_method_id: appliedMethodId,
              organization_id: admin.organizationId,
              admin_id: admin.id,
              parent_transaction_id: id,
            },
          });
          syncedTxIds.push(createdFee.id);
        }
      } else {
        // Se mudou para status diferente de PAGO ou não há taxa, remove taxas filhas
        if (existingFeeTxs.length > 0) {
          const idsToDelete = existingFeeTxs.map((f) => f.id);
          await tx.transaction.deleteMany({
            where: { id: { in: idsToDelete } },
          });
          deletedFeeTxIds.push(...idsToDelete);
        }
      }
    });

    // 4. Sincronização externa Zibee
    for (const txId of syncedTxIds) {
      triggerZibeeSyncById(txId, admin.organizationId).catch(console.error);
    }
    for (const delId of deletedFeeTxIds) {
      deleteTransactionFromZibee(delId, admin.organizationId).catch(console.error);
    }

    revalidatePath("/admin/finance/dashboard");
    revalidatePath("/admin/finance/transactions");
    revalidatePath("/admin/finance/receivables");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao atualizar status:", error);
    return {
      success: false,
      error: error?.message || "Falha ao atualizar o status.",
    };
  }
}

// --- 6. BUSCAR CONTAS A RECEBER (PENDENTES) ---
export async function getPendingReceivables() {
  try {
    const admin = await requireFinancePermission();

    const pendingAppointments = await prisma.appointment.findMany({
      where: {
        organization_id: admin.organizationId,
        status: "REALIZADO",
        package_id: null, // Sessões de pacote já são quitadas na venda do pacote
        transactions: {
          none: {
            status: "PENDENTE", // Assegura exclusão mútua: se já gerou transação PENDENTE, ela é tratada em pendingTransactions
          },
        },
        OR: [
          { payment_method: null },
          { has_charge: true },
          {
            transactions: {
              none: {
                type: "RECEITA",
                status: "PAGO",
              },
            },
          },
        ],
      },
      select: {
        id: true,
        date_time: true,
        snapshot_service_name: true,
        snapshot_service_price: true,
        client: { select: { name: true } },
        service: { select: { name: true, price: true } },
        transactions: {
          where: { type: "RECEITA", status: "PAGO" },
          select: { id: true, amount: true, description: true },
        },
      },
      orderBy: { date_time: "asc" },
    });

    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        organization_id: admin.organizationId,
        type: "RECEITA",
        status: "PENDENTE",
        appointment_id: null, // Evita duplicidade com agendamentos já computados acima
      },
      select: {
        id: true,
        date: true,
        due_date: true,
        description: true,
        amount: true,
        installment: true,
        client: { select: { name: true } },
      },
      orderBy: { date: "asc" },
    });

    const formattedAppointments = [];

    for (const a of pendingAppointments) {
      const fullPrice = Number(a.snapshot_service_price ?? a.service?.price ?? 0);
      const totalPaid = a.transactions.reduce((acc, t) => acc + Number(t.amount), 0);
      const remainingAmount = Math.max(0, Number((fullPrice - totalPaid).toFixed(2)));

      // Se o agendamento já tiver sido 100% quitado (ex: sinal cobriu integralmente), não exibe no a receber
      if (remainingAmount <= 0.01) {
        continue;
      }

      const serviceName = a.snapshot_service_name || a.service?.name || "Serviço";
      const hasDeposit = totalPaid > 0;
      const description = hasDeposit
        ? `${serviceName} (Saldo a Receber — Sinal de R$ ${totalPaid.toFixed(2)} já pago via MP)`
        : serviceName;

      formattedAppointments.push({
        id: a.id,
        sourceType: "APPOINTMENT" as const,
        description,
        amount: remainingAmount,
        totalServicePrice: fullPrice,
        depositPaidAmount: totalPaid,
        hasDeposit,
        date: a.date_time.toISOString(),
        dueDate: a.date_time.toISOString(),
        installment: undefined as string | undefined,
        clientName: a.client?.name || "Sem cliente",
      });
    }

    const formattedTransactions = pendingTransactions.map((t) => ({
      id: t.id,
      sourceType: "TRANSACTION" as const,
      description: t.description,
      amount: Number(t.amount),
      totalServicePrice: Number(t.amount),
      depositPaidAmount: 0,
      hasDeposit: false,
      date: (t.due_date || t.date).toISOString(), // Ordena e exibe pela data de vencimento real
      dueDate: (t.due_date || t.date).toISOString(),
      installment: t.installment || undefined,
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
    const admin = await requireFinancePermission();

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

      const fullPrice = Number(appt.snapshot_service_price ?? appt.service.price);
      const apptName = appt.snapshot_service_name ?? appt.service.name;

      // Desconta qualquer valor já pago anteriormente (ex: sinal online PIX Mercado Pago)
      const paidRevenue = appt.transactions
        .filter((t) => t.type === "RECEITA" && t.status === "PAGO")
        .reduce((acc, t) => acc + Number(t.amount), 0);

      const remainingAmount = Math.max(0, Number((fullPrice - paidRevenue).toFixed(2)));

      let txIdToSync: string | null = null;

      await prisma.$transaction(async (tx) => {
        await tx.appointment.update({
          where: { id, organization_id: admin.organizationId },
          data: {
            payment_method: paymentMethod as PaymentMethod, // Cast seguro para Enum
            has_charge: false,
          },
        });

        // Se o agendamento já estava 100% quitado (ex: sinal integral), não gera receita duplicada
        if (remainingAmount <= 0.01) {
          return;
        }

        const pendingRevenueTx = appt.transactions.find(
          (t) => t.type === "RECEITA" && t.status === "PENDENTE",
        );

        const desc =
          paidRevenue > 0
            ? `Serviço Quitado (Saldo Restante): ${apptName} (${appt.client.name})`
            : `Serviço Realizado: ${apptName} (${appt.client.name})`;

        const paymentDate = new Date();

        if (!pendingRevenueTx) {
          const originalDueDate = appt.date_time || paymentDate;
          const result = await createSettledRevenueWithFee({
            prismaClient: tx,
            organizationId: admin.organizationId,
            grossAmount: remainingAmount,
            description: desc,
            paymentMethodId: paymentMethodId || null,
            paymentMethodEnum: paymentMethod as PaymentMethod,
            appointmentId: appt.id,
            clientId: appt.client_id,
            adminId: admin.id,
            baseDate: paymentDate,
            dueDate: originalDueDate, // Preserva a data original do agendamento como vencimento
            feeDescription: `Taxa Cartão - Serviço: ${apptName}`,
          });
          txIdToSync = result.revenueTx.id;
          if (result.feeTx) {
            triggerZibeeSyncById(result.feeTx.id, admin.organizationId).catch(console.error);
          }

          if (appt.client_id) {
            const dueTime = new Date(originalDueDate).setHours(0, 0, 0, 0);
            const payTime = new Date(paymentDate).setHours(0, 0, 0, 0);
            const diffDays = Math.floor((payTime - dueTime) / (1000 * 60 * 60 * 24));
            const noteText =
              diffDays > 0
                ? `Ação: Serviço quitado com ${diffDays} ${diffDays === 1 ? "dia" : "dias"} de atraso: ${apptName} (R$ ${remainingAmount.toFixed(2)}) via ${paymentMethod}. Vencimento original: ${new Intl.DateTimeFormat("pt-BR").format(originalDueDate)}. Quitado por: ${admin.name || admin.email}.`
                : `Ação: Serviço quitado em dia: ${apptName} (R$ ${remainingAmount.toFixed(2)}) via ${paymentMethod}. Vencimento original: ${new Intl.DateTimeFormat("pt-BR").format(originalDueDate)}. Quitado por: ${admin.name || admin.email}.`;

            await tx.clientNote.create({
              data: {
                client_id: appt.client_id,
                organization_id: admin.organizationId,
                text: noteText,
                date: paymentDate,
              },
            });
          }
        } else {
          const originalDueDate = pendingRevenueTx.due_date || pendingRevenueTx.date || appt.date_time || paymentDate;
          const { settlementDate, feeAmount, method } =
            await calculatePaymentSettlementAndFee({
              prismaClient: tx,
              organizationId: admin.organizationId,
              grossAmount: remainingAmount,
              paymentMethodId: paymentMethodId || null,
              paymentMethodEnum: paymentMethod as PaymentMethod,
              baseDate: paymentDate,
            });

          await tx.transaction.update({
            where: { id: pendingRevenueTx.id },
            data: {
              amount: remainingAmount,
              status: "PAGO",
              date: paymentDate, // Data do efetivo pagamento no caixa
              due_date: originalDueDate, // Preserva o vencimento original para controle de inadimplência/pontualidade
              settlement_date: settlementDate, // Guarda a data em que o valor compensará na conta (D+X)
              payment_method_id: method?.id || paymentMethodId || null,
              admin_id: admin.id,
            },
          });
          txIdToSync = pendingRevenueTx.id;

          if (feeAmount > 0) {
            const feeTx = await tx.transaction.create({
              data: {
                type: "DESPESA",
                description: `Taxa Cartão - Serviço: ${apptName}`,
                amount: feeAmount,
                date: paymentDate,
                settlement_date: settlementDate, // Liquidação bancária
                status: "PAGO",
                organization_id: admin.organizationId,
                appointment_id: appt.id,
                client_id: appt.client_id,
                payment_method_id: method?.id || paymentMethodId || null,
                admin_id: admin.id,
                parent_transaction_id: pendingRevenueTx.id,
              },
            });
            triggerZibeeSyncById(feeTx.id, admin.organizationId).catch(console.error);
          }

          if (appt.client_id) {
            const dueTime = new Date(originalDueDate).setHours(0, 0, 0, 0);
            const payTime = new Date(paymentDate).setHours(0, 0, 0, 0);
            const diffDays = Math.floor((payTime - dueTime) / (1000 * 60 * 60 * 24));
            const methodLabel = method?.name || paymentMethod;
            const noteText =
              diffDays > 0
                ? `Ação: Serviço quitado com ${diffDays} ${diffDays === 1 ? "dia" : "dias"} de atraso: ${apptName} (R$ ${remainingAmount.toFixed(2)}) via ${methodLabel}. Vencimento original: ${new Intl.DateTimeFormat("pt-BR").format(originalDueDate)}. Quitado por: ${admin.name || admin.email}.`
                : `Ação: Serviço quitado em dia: ${apptName} (R$ ${remainingAmount.toFixed(2)}) via ${methodLabel}. Vencimento original: ${new Intl.DateTimeFormat("pt-BR").format(originalDueDate)}. Quitado por: ${admin.name || admin.email}.`;

            await tx.clientNote.create({
              data: {
                client_id: appt.client_id,
                organization_id: admin.organizationId,
                text: noteText,
                date: paymentDate,
              },
            });
          }
        }
      });

      if (txIdToSync) {
        triggerZibeeSyncById(txIdToSync, admin.organizationId).catch(console.error);
      }

      revalidatePath("/admin/agenda");
    } else {
      const manualTx = await prisma.transaction.findUnique({
        where: { id, organization_id: admin.organizationId },
        include: { client: true, package: true },
      });

      if (manualTx) {
        const paymentDate = new Date();
        const originalDueDate = manualTx.due_date || manualTx.date;

        const { settlementDate, feeAmount, method } =
          await calculatePaymentSettlementAndFee({
            organizationId: admin.organizationId,
            grossAmount: Number(manualTx.amount),
            paymentMethodId: paymentMethodId || null,
            paymentMethodEnum: paymentMethod as PaymentMethod,
            baseDate: paymentDate,
          });

        await prisma.transaction.update({
          where: { id, organization_id: admin.organizationId },
          data: {
            status: "PAGO",
            date: paymentDate, // Data do efetivo pagamento no caixa
            due_date: originalDueDate, // Preserva a data de vencimento original sem sobrescrever!
            settlement_date: settlementDate, // Guarda a data de liquidação bancária D+X
            payment_method_id: method?.id || paymentMethodId || null,
            admin_id: admin.id, // Assina quem quitou a pendência
          },
        });

        if (feeAmount > 0) {
          const feeTx = await prisma.transaction.create({
            data: {
              type: "DESPESA",
              description: `Taxa - ${manualTx.description}`,
              amount: feeAmount,
              date: paymentDate,
              settlement_date: settlementDate, // Liquidação
              status: "PAGO",
              organization_id: admin.organizationId,
              client_id: manualTx.client_id,
              payment_method_id: method?.id || paymentMethodId || null,
              admin_id: admin.id,
              parent_transaction_id: manualTx.id,
            },
          });
          triggerZibeeSyncById(feeTx.id, admin.organizationId).catch(console.error);
        }

        // Histórico de pontualidade/inadimplência do cliente
        if (manualTx.client_id) {
          const dueTime = new Date(originalDueDate).setHours(0, 0, 0, 0);
          const payTime = new Date(paymentDate).setHours(0, 0, 0, 0);
          const diffDays = Math.floor((payTime - dueTime) / (1000 * 60 * 60 * 24));
          const methodLabel = method?.name || paymentMethod;
          const isInstallment = !!manualTx.installment;
          const labelType = isInstallment
            ? `Parcela (${manualTx.installment}) de pacote`
            : "Cobrança avulsa";

          const noteText =
            diffDays > 0
              ? `Ação: ${labelType} quitada com ${diffDays} ${diffDays === 1 ? "dia" : "dias"} de atraso: ${manualTx.description} (R$ ${Number(manualTx.amount).toFixed(2)}) via ${methodLabel}. Vencimento original: ${new Intl.DateTimeFormat("pt-BR").format(originalDueDate)}. Quitado por: ${admin.name || admin.email}.`
              : `Ação: ${labelType} quitada em dia: ${manualTx.description} (R$ ${Number(manualTx.amount).toFixed(2)}) via ${methodLabel}. Vencimento original: ${new Intl.DateTimeFormat("pt-BR").format(originalDueDate)}. Quitado por: ${admin.name || admin.email}.`;

          await prisma.clientNote.create({
            data: {
              client_id: manualTx.client_id,
              organization_id: admin.organizationId,
              text: noteText,
              date: paymentDate,
            },
          });
        }
      }

      // Sincroniza a liquidação no Zibee
      triggerZibeeSyncById(id, admin.organizationId).catch(console.error);
    }

    revalidatePath("/admin/finance/dashboard");
    revalidatePath("/admin/finance/transactions");
    revalidatePath("/admin/finance/receivables");

    return { success: true };
  } catch (error: any) {
    console.error("Erro ao dar baixa em recebimento:", error);
    return {
      success: false,
      error: error?.message || "Falha ao processar pagamento.",
    };
  }
}

// --- 7.1. DAR BAIXA EM TODOS OS RECEBIMENTOS (EM MASSA) ---
export async function processAllReceivablesPayment(
  paymentMethod: string,
  paymentMethodId?: string,
) {
  try {
    const admin = await requireFinancePermission();

    // 1. Busca todos os agendamentos pendentes da organização (excluindo pacotes)
    const pendingAppointments = await prisma.appointment.findMany({
      where: {
        organization_id: admin.organizationId,
        status: "REALIZADO",
        package_id: null,
        transactions: {
          none: {
            status: "PENDENTE", // Assegura exclusão mútua contra duplicidade na baixa em lote
          },
        },
        OR: [
          { payment_method: null },
          { has_charge: true },
          {
            transactions: {
              none: {
                type: "RECEITA",
                status: "PAGO",
              },
            },
          },
        ],
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
        appointment_id: null, // Evita duplicidade com agendamentos já computados acima
      },
      select: {
        id: true,
      },
    });

    const createdOrUpdatedTxIds: string[] = [];

    const paymentDate = new Date();

    await prisma.$transaction(async (tx) => {
      // Baixa nos agendamentos
      for (const appt of pendingAppointments) {
        const fullPrice = Number(appt.snapshot_service_price ?? appt.service.price);
        const apptName = appt.snapshot_service_name ?? appt.service.name;

        // Desconta qualquer sinal já pago (ex: sinal via Mercado Pago)
        const paidRevenue = appt.transactions
          .filter((t) => t.type === "RECEITA" && t.status === "PAGO")
          .reduce((acc, t) => acc + Number(t.amount), 0);

        const remainingAmount = Math.max(0, Number((fullPrice - paidRevenue).toFixed(2)));

        if (remainingAmount <= 0.01) {
          continue;
        }

        await tx.appointment.update({
          where: { id: appt.id },
          data: {
            payment_method: paymentMethod as PaymentMethod,
            has_charge: false,
          },
        });

        const pendingRevenueTx = appt.transactions.find(
          (t) => t.type === "RECEITA" && t.status === "PENDENTE",
        );

        const desc =
          paidRevenue > 0
            ? `Serviço Quitado (Saldo Restante): ${apptName} (${appt.client.name})`
            : `Serviço Realizado: ${apptName} (${appt.client.name})`;

        if (!pendingRevenueTx) {
          const originalDueDate = appt.date_time || paymentDate;
          const result = await createSettledRevenueWithFee({
            prismaClient: tx,
            organizationId: admin.organizationId,
            grossAmount: remainingAmount,
            description: desc,
            paymentMethodId: paymentMethodId || null,
            paymentMethodEnum: paymentMethod as PaymentMethod,
            appointmentId: appt.id,
            clientId: appt.client_id,
            adminId: admin.id,
            baseDate: paymentDate,
            dueDate: originalDueDate, // Preserva a data original do agendamento como vencimento
            feeDescription: `Taxa Cartão - Serviço: ${apptName}`,
          });
          createdOrUpdatedTxIds.push(result.revenueTx.id);
          if (result.feeTx) {
            createdOrUpdatedTxIds.push(result.feeTx.id);
          }

          if (appt.client_id) {
            const dueTime = new Date(originalDueDate).setHours(0, 0, 0, 0);
            const payTime = new Date(paymentDate).setHours(0, 0, 0, 0);
            const diffDays = Math.floor((payTime - dueTime) / (1000 * 60 * 60 * 24));
            const noteText =
              diffDays > 0
                ? `Ação: Serviço quitado em lote com ${diffDays} ${diffDays === 1 ? "dia" : "dias"} de atraso: ${apptName} (R$ ${remainingAmount.toFixed(2)}) via ${paymentMethod}. Vencimento original: ${new Intl.DateTimeFormat("pt-BR").format(originalDueDate)}. Quitado por: ${admin.name || admin.email}.`
                : `Ação: Serviço quitado em lote em dia: ${apptName} (R$ ${remainingAmount.toFixed(2)}) via ${paymentMethod}. Vencimento original: ${new Intl.DateTimeFormat("pt-BR").format(originalDueDate)}. Quitado por: ${admin.name || admin.email}.`;

            await tx.clientNote.create({
              data: {
                client_id: appt.client_id,
                organization_id: admin.organizationId,
                text: noteText,
                date: paymentDate,
              },
            });
          }
        } else {
          const originalDueDate = pendingRevenueTx.due_date || pendingRevenueTx.date || appt.date_time || paymentDate;
          const { settlementDate, feeAmount, method } =
            await calculatePaymentSettlementAndFee({
              prismaClient: tx,
              organizationId: admin.organizationId,
              grossAmount: remainingAmount,
              paymentMethodId: paymentMethodId || null,
              paymentMethodEnum: paymentMethod as PaymentMethod,
              baseDate: paymentDate,
            });

          await tx.transaction.update({
            where: { id: pendingRevenueTx.id },
            data: {
              amount: remainingAmount,
              status: "PAGO",
              date: paymentDate, // Data do efetivo pagamento no caixa
              due_date: originalDueDate, // Preserva a data de vencimento original
              settlement_date: settlementDate, // Guarda compensação sem alterar competência
              payment_method_id: method?.id || paymentMethodId || null,
              admin_id: admin.id,
            },
          });
          createdOrUpdatedTxIds.push(pendingRevenueTx.id);

          if (feeAmount > 0) {
            const feeTx = await tx.transaction.create({
              data: {
                type: "DESPESA",
                description: `Taxa Cartão - Serviço: ${apptName}`,
                amount: feeAmount,
                date: paymentDate,
                settlement_date: settlementDate,
                status: "PAGO",
                organization_id: admin.organizationId,
                appointment_id: appt.id,
                client_id: appt.client_id,
                payment_method_id: method?.id || paymentMethodId || null,
                admin_id: admin.id,
                parent_transaction_id: pendingRevenueTx.id,
              },
            });
            createdOrUpdatedTxIds.push(feeTx.id);
          }

          if (appt.client_id) {
            const dueTime = new Date(originalDueDate).setHours(0, 0, 0, 0);
            const payTime = new Date(paymentDate).setHours(0, 0, 0, 0);
            const diffDays = Math.floor((payTime - dueTime) / (1000 * 60 * 60 * 24));
            const methodLabel = method?.name || paymentMethod;
            const noteText =
              diffDays > 0
                ? `Ação: Serviço quitado em lote com ${diffDays} ${diffDays === 1 ? "dia" : "dias"} de atraso: ${apptName} (R$ ${remainingAmount.toFixed(2)}) via ${methodLabel}. Vencimento original: ${new Intl.DateTimeFormat("pt-BR").format(originalDueDate)}. Quitado por: ${admin.name || admin.email}.`
                : `Ação: Serviço quitado em lote em dia: ${apptName} (R$ ${remainingAmount.toFixed(2)}) via ${methodLabel}. Vencimento original: ${new Intl.DateTimeFormat("pt-BR").format(originalDueDate)}. Quitado por: ${admin.name || admin.email}.`;

            await tx.clientNote.create({
              data: {
                client_id: appt.client_id,
                organization_id: admin.organizationId,
                text: noteText,
                date: paymentDate,
              },
            });
          }
        }
      }

      // Baixa nas transações manuais
      if (pendingTransactions.length > 0) {
        const fullPendingTxs = await tx.transaction.findMany({
          where: {
            id: { in: pendingTransactions.map((t) => t.id) },
            organization_id: admin.organizationId,
          },
          include: {
            client: true,
          },
        });

        for (const mTx of fullPendingTxs) {
          const originalDueDate = mTx.due_date || mTx.date;
          const { settlementDate, feeAmount, method } =
            await calculatePaymentSettlementAndFee({
              prismaClient: tx,
              organizationId: admin.organizationId,
              grossAmount: Number(mTx.amount),
              paymentMethodId: paymentMethodId || null,
              paymentMethodEnum: paymentMethod as PaymentMethod,
              baseDate: paymentDate,
            });

          await tx.transaction.update({
            where: { id: mTx.id },
            data: {
              status: "PAGO",
              date: paymentDate, // Data do efetivo pagamento no caixa
              due_date: originalDueDate, // Preserva a data de vencimento original da parcela/cobrança!
              settlement_date: settlementDate, // Guarda a data de liquidação bancária D+X
              payment_method_id: method?.id || paymentMethodId || null,
              admin_id: admin.id,
            },
          });
          createdOrUpdatedTxIds.push(mTx.id);

          if (feeAmount > 0) {
            const feeTx = await tx.transaction.create({
              data: {
                type: "DESPESA",
                description: `Taxa - ${mTx.description}`,
                amount: feeAmount,
                date: paymentDate,
                settlement_date: settlementDate,
                status: "PAGO",
                organization_id: admin.organizationId,
                client_id: mTx.client_id,
                payment_method_id: method?.id || paymentMethodId || null,
                admin_id: admin.id,
                parent_transaction_id: mTx.id,
              },
            });
            createdOrUpdatedTxIds.push(feeTx.id);
          }

          if (mTx.client_id) {
            const dueTime = new Date(originalDueDate).setHours(0, 0, 0, 0);
            const payTime = new Date(paymentDate).setHours(0, 0, 0, 0);
            const diffDays = Math.floor((payTime - dueTime) / (1000 * 60 * 60 * 24));
            const methodLabel = method?.name || paymentMethod;
            const isInstallment = !!mTx.installment;
            const labelType = isInstallment
              ? `Parcela (${mTx.installment}) de pacote`
              : "Cobrança avulsa";

            const noteText =
              diffDays > 0
                ? `Ação: ${labelType} quitada em lote com ${diffDays} ${diffDays === 1 ? "dia" : "dias"} de atraso: ${mTx.description} (R$ ${Number(mTx.amount).toFixed(2)}) via ${methodLabel}. Vencimento original: ${new Intl.DateTimeFormat("pt-BR").format(originalDueDate)}. Quitado por: ${admin.name || admin.email}.`
                : `Ação: ${labelType} quitada em lote em dia: ${mTx.description} (R$ ${Number(mTx.amount).toFixed(2)}) via ${methodLabel}. Vencimento original: ${new Intl.DateTimeFormat("pt-BR").format(originalDueDate)}. Quitado por: ${admin.name || admin.email}.`;

            await tx.clientNote.create({
              data: {
                client_id: mTx.client_id,
                organization_id: admin.organizationId,
                text: noteText,
                date: paymentDate,
              },
            });
          }
        }
      }
    });

    // Sincroniza Zibee em background
    createdOrUpdatedTxIds.forEach((txId) => {
      triggerZibeeSyncById(txId, admin.organizationId).catch(console.error);
    });

    revalidatePath("/admin/finance/dashboard");
    revalidatePath("/admin/finance/transactions");
    revalidatePath("/admin/finance/receivables");
    revalidatePath("/admin/agenda");

    return {
      success: true,
      count: pendingAppointments.length + pendingTransactions.length,
    };
  } catch (error: any) {
    console.error("Erro ao dar baixa em todos os recebimentos:", error);
    return {
      success: false,
      error: error?.message || "Falha ao processar pagamentos em lote.",
    };
  }
}

// --- 7.2. DAR BAIXA EM SELEÇÃO ESPECÍFICA / CLIENTES RECORRENTES (EM LOTE) ---
export async function processBatchReceivablesPayment(
  items: Array<{ id: string; sourceType: "APPOINTMENT" | "TRANSACTION" }>,
  paymentMethod: string,
  paymentMethodId?: string,
) {
  try {
    const admin = await requireFinancePermission();

    if (!items || items.length === 0) {
      return { success: false, error: "Nenhum item selecionado para quitação." };
    }

    const appointmentIds = items
      .filter((i) => i.sourceType === "APPOINTMENT")
      .map((i) => i.id);
    const transactionIds = items
      .filter((i) => i.sourceType === "TRANSACTION")
      .map((i) => i.id);

    const pendingAppointments =
      appointmentIds.length > 0
        ? await prisma.appointment.findMany({
            where: {
              id: { in: appointmentIds },
              organization_id: admin.organizationId,
              package_id: null,
            },
            include: {
              client: true,
              service: true,
              transactions: true,
            },
          })
        : [];

    const pendingTransactions =
      transactionIds.length > 0
        ? await prisma.transaction.findMany({
            where: {
              id: { in: transactionIds },
              organization_id: admin.organizationId,
              type: "RECEITA",
              status: "PENDENTE",
            },
            include: {
              client: true,
            },
          })
        : [];

    const createdOrUpdatedTxIds: string[] = [];
    const paymentDate = new Date();

    await prisma.$transaction(async (tx) => {
      // Baixa nos agendamentos selecionados
      for (const appt of pendingAppointments) {
        const fullPrice = Number(appt.snapshot_service_price ?? appt.service.price);
        const apptName = appt.snapshot_service_name ?? appt.service.name;

        const paidRevenue = appt.transactions
          .filter((t) => t.type === "RECEITA" && t.status === "PAGO")
          .reduce((acc, t) => acc + Number(t.amount), 0);

        const remainingAmount = Math.max(0, Number((fullPrice - paidRevenue).toFixed(2)));

        if (remainingAmount <= 0.01) {
          continue;
        }

        await tx.appointment.update({
          where: { id: appt.id },
          data: {
            payment_method: paymentMethod as PaymentMethod,
            has_charge: false,
          },
        });

        const pendingRevenueTx = appt.transactions.find(
          (t) => t.type === "RECEITA" && t.status === "PENDENTE",
        );

        const desc =
          paidRevenue > 0
            ? `Serviço Quitado (Saldo Restante): ${apptName} (${appt.client.name})`
            : `Serviço Realizado: ${apptName} (${appt.client.name})`;

        if (!pendingRevenueTx) {
          const originalDueDate = appt.date_time || paymentDate;
          const result = await createSettledRevenueWithFee({
            prismaClient: tx,
            organizationId: admin.organizationId,
            grossAmount: remainingAmount,
            description: desc,
            paymentMethodId: paymentMethodId || null,
            paymentMethodEnum: paymentMethod as PaymentMethod,
            appointmentId: appt.id,
            clientId: appt.client_id,
            adminId: admin.id,
            baseDate: paymentDate,
            dueDate: originalDueDate,
            feeDescription: `Taxa Cartão - Serviço: ${apptName}`,
          });
          createdOrUpdatedTxIds.push(result.revenueTx.id);
          if (result.feeTx) {
            createdOrUpdatedTxIds.push(result.feeTx.id);
          }

          if (appt.client_id) {
            const dueTime = new Date(originalDueDate).setHours(0, 0, 0, 0);
            const payTime = new Date(paymentDate).setHours(0, 0, 0, 0);
            const diffDays = Math.floor((payTime - dueTime) / (1000 * 60 * 60 * 24));
            const noteText =
              diffDays > 0
                ? `Ação: Serviço quitado em lote com ${diffDays} ${diffDays === 1 ? "dia" : "dias"} de atraso: ${apptName} (R$ ${remainingAmount.toFixed(2)}) via ${paymentMethod}. Vencimento original: ${new Intl.DateTimeFormat("pt-BR").format(originalDueDate)}. Quitado por: ${admin.name || admin.email}.`
                : `Ação: Serviço quitado em lote em dia: ${apptName} (R$ ${remainingAmount.toFixed(2)}) via ${paymentMethod}. Vencimento original: ${new Intl.DateTimeFormat("pt-BR").format(originalDueDate)}. Quitado por: ${admin.name || admin.email}.`;

            await tx.clientNote.create({
              data: {
                client_id: appt.client_id,
                organization_id: admin.organizationId,
                text: noteText,
                date: paymentDate,
              },
            });
          }
        } else {
          const originalDueDate =
            pendingRevenueTx.due_date ||
            pendingRevenueTx.date ||
            appt.date_time ||
            paymentDate;

          const { settlementDate, feeAmount, method } =
            await calculatePaymentSettlementAndFee({
              prismaClient: tx,
              organizationId: admin.organizationId,
              grossAmount: remainingAmount,
              paymentMethodId: paymentMethodId || null,
              paymentMethodEnum: paymentMethod as PaymentMethod,
              baseDate: paymentDate,
            });

          await tx.transaction.update({
            where: { id: pendingRevenueTx.id },
            data: {
              amount: remainingAmount,
              status: "PAGO",
              date: paymentDate,
              due_date: originalDueDate,
              settlement_date: settlementDate,
              payment_method_id: method?.id || paymentMethodId || null,
              admin_id: admin.id,
            },
          });
          createdOrUpdatedTxIds.push(pendingRevenueTx.id);

          if (feeAmount > 0) {
            const feeTx = await tx.transaction.create({
              data: {
                type: "DESPESA",
                description: `Taxa Cartão - Serviço: ${apptName}`,
                amount: feeAmount,
                date: paymentDate,
                settlement_date: settlementDate,
                status: "PAGO",
                organization_id: admin.organizationId,
                appointment_id: appt.id,
                client_id: appt.client_id,
                payment_method_id: method?.id || paymentMethodId || null,
                admin_id: admin.id,
                parent_transaction_id: pendingRevenueTx.id,
              },
            });
            createdOrUpdatedTxIds.push(feeTx.id);
          }

          if (appt.client_id) {
            const dueTime = new Date(originalDueDate).setHours(0, 0, 0, 0);
            const payTime = new Date(paymentDate).setHours(0, 0, 0, 0);
            const diffDays = Math.floor((payTime - dueTime) / (1000 * 60 * 60 * 24));
            const methodLabel = method?.name || paymentMethod;
            const noteText =
              diffDays > 0
                ? `Ação: Serviço quitado em lote com ${diffDays} ${diffDays === 1 ? "dia" : "dias"} de atraso: ${apptName} (R$ ${remainingAmount.toFixed(2)}) via ${methodLabel}. Vencimento original: ${new Intl.DateTimeFormat("pt-BR").format(originalDueDate)}. Quitado por: ${admin.name || admin.email}.`
                : `Ação: Serviço quitado em lote em dia: ${apptName} (R$ ${remainingAmount.toFixed(2)}) via ${methodLabel}. Vencimento original: ${new Intl.DateTimeFormat("pt-BR").format(originalDueDate)}. Quitado por: ${admin.name || admin.email}.`;

            await tx.clientNote.create({
              data: {
                client_id: appt.client_id,
                organization_id: admin.organizationId,
                text: noteText,
                date: paymentDate,
              },
            });
          }
        }
      }

      // Baixa nas transações selecionadas
      for (const mTx of pendingTransactions) {
        const originalDueDate = mTx.due_date || mTx.date;
        const { settlementDate, feeAmount, method } =
          await calculatePaymentSettlementAndFee({
            prismaClient: tx,
            organizationId: admin.organizationId,
            grossAmount: Number(mTx.amount),
            paymentMethodId: paymentMethodId || null,
            paymentMethodEnum: paymentMethod as PaymentMethod,
            baseDate: paymentDate,
          });

        await tx.transaction.update({
          where: { id: mTx.id },
          data: {
            status: "PAGO",
            date: paymentDate,
            due_date: originalDueDate,
            settlement_date: settlementDate,
            payment_method_id: method?.id || paymentMethodId || null,
            admin_id: admin.id,
          },
        });
        createdOrUpdatedTxIds.push(mTx.id);

        if (feeAmount > 0) {
          const feeTx = await tx.transaction.create({
            data: {
              type: "DESPESA",
              description: `Taxa - ${mTx.description}`,
              amount: feeAmount,
              date: paymentDate,
              settlement_date: settlementDate,
              status: "PAGO",
              organization_id: admin.organizationId,
              client_id: mTx.client_id,
              payment_method_id: method?.id || paymentMethodId || null,
              admin_id: admin.id,
              parent_transaction_id: mTx.id,
            },
          });
          createdOrUpdatedTxIds.push(feeTx.id);
        }

        if (mTx.client_id) {
          const dueTime = new Date(originalDueDate).setHours(0, 0, 0, 0);
          const payTime = new Date(paymentDate).setHours(0, 0, 0, 0);
          const diffDays = Math.floor((payTime - dueTime) / (1000 * 60 * 60 * 24));
          const methodLabel = method?.name || paymentMethod;
          const isInstallment = !!mTx.installment;
          const labelType = isInstallment
            ? `Parcela (${mTx.installment}) de pacote`
            : "Cobrança avulsa";

          const noteText =
            diffDays > 0
              ? `Ação: ${labelType} quitada em lote com ${diffDays} ${diffDays === 1 ? "dia" : "dias"} de atraso: ${mTx.description} (R$ ${Number(mTx.amount).toFixed(2)}) via ${methodLabel}. Vencimento original: ${new Intl.DateTimeFormat("pt-BR").format(originalDueDate)}. Quitado por: ${admin.name || admin.email}.`
              : `Ação: ${labelType} quitada em lote em dia: ${mTx.description} (R$ ${Number(mTx.amount).toFixed(2)}) via ${methodLabel}. Vencimento original: ${new Intl.DateTimeFormat("pt-BR").format(originalDueDate)}. Quitado por: ${admin.name || admin.email}.`;

          await tx.clientNote.create({
            data: {
              client_id: mTx.client_id,
              organization_id: admin.organizationId,
              text: noteText,
              date: paymentDate,
            },
          });
        }
      }
    });

    // Sincroniza Zibee em background
    createdOrUpdatedTxIds.forEach((txId) => {
      triggerZibeeSyncById(txId, admin.organizationId).catch(console.error);
    });

    revalidatePath("/admin/finance/dashboard");
    revalidatePath("/admin/finance/transactions");
    revalidatePath("/admin/finance/receivables");
    revalidatePath("/admin/agenda");

    return {
      success: true,
      count: pendingAppointments.length + pendingTransactions.length,
    };
  } catch (error: any) {
    console.error("Erro ao dar baixa nos recebimentos selecionados:", error);
    return {
      success: false,
      error: error?.message || "Falha ao processar pagamentos selecionados.",
    };
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
  viewMode?: "COMPETENCIA" | "CAIXA";
}) {
  try {
    const admin = await requireFinancePermission();

    const andConditions: any[] = [
      {
        organization_id: admin.organizationId,
        parent_transaction_id: null,
        NOT: {
          type: "RECEITA",
          appointment: {
            package_id: { not: null },
          },
        },
      },
    ];

    const isCaixa = params.viewMode === "CAIXA";

    const buildDateFilter = (range: { gte?: Date; lte?: Date }) => {
      if (isCaixa) {
        return {
          OR: [
            { settlement_date: range },
            { settlement_date: null, date: range },
          ],
        };
      }
      return { date: range };
    };

    // 1. Filtro de Data (Fuso Oficial de Brasília America/Sao_Paulo)
    if (params.specificDate) {
      const { startOfDay, endOfDay } = getBrasiliaDayRange(params.specificDate);
      andConditions.push(buildDateFilter({ gte: startOfDay, lte: endOfDay }));
    } else if (params.startDate || params.endDate) {
      const dateRange: any = {};
      if (params.startDate) {
        dateRange.gte = getBrasiliaDayRange(params.startDate).startOfDay;
      }
      if (params.endDate) {
        dateRange.lte = getBrasiliaDayRange(params.endDate).endOfDay;
      }
      andConditions.push(buildDateFilter(dateRange));
    } else if (params.month && params.year) {
      const { monthStart, monthEnd } = getBrasiliaMonthRange(
        params.year,
        params.month,
      );
      andConditions.push(buildDateFilter({ gte: monthStart, lte: monthEnd }));
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
    const orderBy: any = isCaixa
      ? [{ settlement_date: "desc" }, { date: "desc" }]
      : { date: "desc" };

    const [total, rawTxs] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        skip,
        take: params.limit,
        orderBy,
        select: {
          id: true,
          type: true,
          description: true,
          amount: true,
          date: true,
          settlement_date: true,
          due_date: true,
          status: true,
          recurrence_id: true,
          installment: true,
          package_id: true,
          appointment_id: true,
          stock_item_id: true,
          parent_transaction_id: true,
          child_transactions: {
            select: {
              id: true,
              amount: true,
              type: true,
              description: true,
            },
          },
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
      const isAppointmentLinked = !!t.appointment_id;
      const grossAmount = Number(t.amount);
      const feeChilds = (t.child_transactions || []).filter(
        (c) => c.type === "DESPESA",
      );
      const feeAmount = feeChilds.reduce((acc, c) => acc + Number(c.amount), 0);
      const netAmount =
        t.type === "RECEITA" ? Math.max(0, grossAmount - feeAmount) : grossAmount;

      return {
        id: t.id,
        originalId: t.id,
        isManual,
        isAppointmentLinked,
        parent_transaction_id: t.parent_transaction_id,
        type: t.type,
        description: t.description,
        amount: Number(t.amount),
        grossAmount,
        feeAmount,
        netAmount,
        date: t.date.toISOString(),
        settlementDate: t.settlement_date ? t.settlement_date.toISOString() : null,
        dueDate: t.due_date ? t.due_date.toISOString() : null,
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

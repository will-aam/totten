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
    const admin = await requireAuth();

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
      let txDate = parseDateToBrasilia(data.date);
      let feeAmount = 0;
      let methodId = data.paymentMethodId || null;

      if (data.type === "RECEITA" && data.paymentMethodId && data.status === "PAGO") {
        const calculation = await calculatePaymentSettlementAndFee({
          organizationId: admin.organizationId,
          grossAmount: data.amount,
          paymentMethodId: data.paymentMethodId,
          baseDate: txDate,
        });
        txDate = calculation.settlementDate;
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
          date: txDate,
          status: data.status,
          payment_method_id: methodId,
          organization_id: admin.organizationId,
          admin_id: admin.id, //  RASTREABILIDADE
        },
      });

      // Disparo automático imediato para o Zibee (assíncrono e não-bloqueante)
      triggerZibeeSyncById(createdTx.id).catch(console.error);

      if (feeAmount > 0) {
        const feeTx = await prisma.transaction.create({
          data: {
            type: "DESPESA",
            description: `Taxa - ${data.description}`,
            amount: feeAmount,
            date: txDate,
            status: "PAGO",
            payment_method_id: methodId,
            organization_id: admin.organizationId,
            admin_id: admin.id,
          },
        });
        triggerZibeeSyncById(feeTx.id).catch(console.error);
      }
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
        date: data.date ? parseDateToBrasilia(data.date) : undefined,
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

    const { monthStart, monthEnd } = getBrasiliaMonthRange(year, month);

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

        if (!pendingRevenueTx) {
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
            baseDate: new Date(),
            feeDescription: `Taxa Cartão - Serviço: ${apptName}`,
          });
          txIdToSync = result.revenueTx.id;
          if (result.feeTx) {
            triggerZibeeSyncById(result.feeTx.id).catch(console.error);
          }
        } else {
          const { settlementDate, feeAmount, method } =
            await calculatePaymentSettlementAndFee({
              prismaClient: tx,
              organizationId: admin.organizationId,
              grossAmount: remainingAmount,
              paymentMethodId: paymentMethodId || null,
              paymentMethodEnum: paymentMethod as PaymentMethod,
              baseDate: new Date(),
            });

          await tx.transaction.update({
            where: { id: pendingRevenueTx.id },
            data: {
              amount: remainingAmount,
              status: "PAGO",
              date: settlementDate,
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
                date: settlementDate,
                status: "PAGO",
                organization_id: admin.organizationId,
                appointment_id: appt.id,
                client_id: appt.client_id,
                payment_method_id: method?.id || paymentMethodId || null,
                admin_id: admin.id,
              },
            });
            triggerZibeeSyncById(feeTx.id).catch(console.error);
          }
        }
      });

      if (txIdToSync) {
        triggerZibeeSyncById(txIdToSync).catch(console.error);
      }

      revalidatePath("/admin/agenda");
    } else {
      const manualTx = await prisma.transaction.findUnique({
        where: { id, organization_id: admin.organizationId },
      });

      if (manualTx) {
        const { settlementDate, feeAmount, method } =
          await calculatePaymentSettlementAndFee({
            organizationId: admin.organizationId,
            grossAmount: Number(manualTx.amount),
            paymentMethodId: paymentMethodId || null,
            paymentMethodEnum: paymentMethod as PaymentMethod,
            baseDate: new Date(),
          });

        await prisma.transaction.update({
          where: { id, organization_id: admin.organizationId },
          data: {
            status: "PAGO",
            date: settlementDate,
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
              date: settlementDate,
              status: "PAGO",
              organization_id: admin.organizationId,
              client_id: manualTx.client_id,
              payment_method_id: method?.id || paymentMethodId || null,
              admin_id: admin.id,
            },
          });
          triggerZibeeSyncById(feeTx.id).catch(console.error);
        }
      }

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
          },
        });

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

        const pendingRevenueTx = appt.transactions.find(
          (t) => t.type === "RECEITA" && t.status === "PENDENTE",
        );

        const desc =
          paidRevenue > 0
            ? `Serviço Quitado (Saldo Restante): ${apptName} (${appt.client.name})`
            : `Serviço Realizado: ${apptName} (${appt.client.name})`;

        if (!pendingRevenueTx) {
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
            baseDate: new Date(),
            feeDescription: `Taxa Cartão - Serviço: ${apptName}`,
          });
          createdOrUpdatedTxIds.push(result.revenueTx.id);
          if (result.feeTx) {
            createdOrUpdatedTxIds.push(result.feeTx.id);
          }
        } else {
          const { settlementDate, feeAmount, method } =
            await calculatePaymentSettlementAndFee({
              prismaClient: tx,
              organizationId: admin.organizationId,
              grossAmount: remainingAmount,
              paymentMethodId: paymentMethodId || null,
              paymentMethodEnum: paymentMethod as PaymentMethod,
              baseDate: new Date(),
            });

          await tx.transaction.update({
            where: { id: pendingRevenueTx.id },
            data: {
              amount: remainingAmount,
              status: "PAGO",
              date: settlementDate,
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
                date: settlementDate,
                status: "PAGO",
                organization_id: admin.organizationId,
                appointment_id: appt.id,
                client_id: appt.client_id,
                payment_method_id: method?.id || paymentMethodId || null,
                admin_id: admin.id,
              },
            });
            createdOrUpdatedTxIds.push(feeTx.id);
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
        });

        for (const mTx of fullPendingTxs) {
          const { settlementDate, feeAmount, method } =
            await calculatePaymentSettlementAndFee({
              prismaClient: tx,
              organizationId: admin.organizationId,
              grossAmount: Number(mTx.amount),
              paymentMethodId: paymentMethodId || null,
              paymentMethodEnum: paymentMethod as PaymentMethod,
              baseDate: new Date(),
            });

          await tx.transaction.update({
            where: { id: mTx.id },
            data: {
              status: "PAGO",
              date: settlementDate,
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
                date: settlementDate,
                status: "PAGO",
                organization_id: admin.organizationId,
                client_id: mTx.client_id,
                payment_method_id: method?.id || paymentMethodId || null,
                admin_id: admin.id,
              },
            });
            createdOrUpdatedTxIds.push(feeTx.id);
          }
        }
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

    // 1. Filtro de Data (Fuso Oficial de Brasília America/Sao_Paulo)
    if (params.specificDate) {
      const { startOfDay, endOfDay } = getBrasiliaDayRange(params.specificDate);
      andConditions.push({
        date: { gte: startOfDay, lte: endOfDay },
      });
    } else if (params.startDate || params.endDate) {
      const dateRange: any = {};
      if (params.startDate) {
        dateRange.gte = getBrasiliaDayRange(params.startDate).startOfDay;
      }
      if (params.endDate) {
        dateRange.lte = getBrasiliaDayRange(params.endDate).endOfDay;
      }
      andConditions.push({ date: dateRange });
    } else if (params.month && params.year) {
      const { monthStart, monthEnd } = getBrasiliaMonthRange(
        params.year,
        params.month,
      );
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

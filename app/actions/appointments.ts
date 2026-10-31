// app/actions/appointments.ts
"use server";

import { prisma } from "@/lib/prisma";

import { getTenantPrisma } from "@/lib/prisma";
import { AppointmentStatus, PaymentMethod } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { generateRecurrentDates } from "@/lib/date-utils";
import { randomUUID } from "crypto";
import {
  triggerZibeeSyncById,
  deleteTransactionFromZibee,
} from "@/lib/server/integrations/zibee.service";
import {
  checkAppointmentThrottle,
  recordAppointmentMove,
} from "@/lib/server/security/appointment-throttle";
import { createSettledRevenueWithFee } from "@/lib/server/services/payments/settlement.service";
import { PackageService } from "@/lib/server/services/packages/package.service";


export type CreateAppointmentInput = {
  clientId: string;
  serviceId: string;
  dateTime: Date | string;
  observations?: string;
  packageId?: string;
  repeatCount?: number;
  professionalId?: string;
  isPaid?: boolean;
  paymentMethod?: string | null;
  paymentMethodId?: string | null;
};

export type CreateAppointmentResult =
  | { success: true; appointments: any[] }
  | { success: false; error: string };

// --- 1. CRIAR AGENDAMENTO (RECORRÊNCIA) ---
export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<CreateAppointmentResult> {
  try {
    const admin = await requireAuth();
    const prisma = getTenantPrisma(admin.organizationId);

    const {
      clientId,
      serviceId,
      dateTime,
      observations,
      packageId,
      repeatCount = 1,
      professionalId,
      isPaid = false,
      paymentMethod = null,
      paymentMethodId = null,
    } = input;

    let finalPaymentMethodId = paymentMethodId || null;
    let finalPaymentMethod: PaymentMethod | null = null;

    if (paymentMethod) {
      if (Object.values(PaymentMethod).includes(paymentMethod as any)) {
        finalPaymentMethod = paymentMethod as PaymentMethod;
      } else {
        finalPaymentMethodId = paymentMethod;
      }
    }

    if (finalPaymentMethodId && !finalPaymentMethod) {
      const pmRecord = await prisma.organizationPaymentMethod.findUnique({
        where: { id: finalPaymentMethodId },
        select: { type: true },
      });
      if (pmRecord) {
        finalPaymentMethod = pmRecord.type;
      }
    }

    const firstDateTime =
      typeof dateTime === "string" ? new Date(dateTime) : dateTime;
    const totalSessionsToCreate = Math.max(1, repeatCount);
    const appointmentDates = generateRecurrentDates(
      firstDateTime,
      totalSessionsToCreate,
    );
    const recurrenceId = totalSessionsToCreate > 1 ? randomUUID() : null;

    const service = await prisma.service.findUnique({
      where: { id: serviceId, organization_id: admin.organizationId },
    });

    if (!service) {
      return { success: false, error: "Serviço não encontrado." };
    }

    const targetProfessional = professionalId || admin.id;

    let startSessionNumber = 0;
    let selectedPackage: any = null;

    if (packageId) {
      const pkg = await prisma.package.findUnique({ where: { id: packageId } });
      if (!pkg || pkg.organization_id !== admin.organizationId) {
        return { success: false, error: "Pacote não encontrado." };
      }
      selectedPackage = pkg;

      if (!pkg.active) {
        return {
          success: false,
          error:
            "Este pacote está arquivado e não pode receber novos agendamentos.",
        };
      }

      // NOVO: Lógica FIRST_BOOKING e Verificação de Validade do Pacote
      let packageExpiryDate = pkg.expires_at ? new Date(pkg.expires_at) : null;

      if (!packageExpiryDate && pkg.package_template_id) {
        const settings = await prisma.settings.findUnique({
          where: { organization_id: admin.organizationId },
          select: { package_validity_mode: true },
        });

        if (settings?.package_validity_mode === "FIRST_BOOKING") {
          const template = await prisma.packageTemplate.findUnique({
            where: { id: pkg.package_template_id },
            select: { validity_days: true },
          });

          if (template?.validity_days) {
            // Conta a partir da primeira data de agendamento sendo criada
            packageExpiryDate = new Date(appointmentDates[0]);
            packageExpiryDate.setDate(packageExpiryDate.getDate() + template.validity_days);

            // Atualiza o pacote no banco para já salvar a data de expiração
            await prisma.package.update({
              where: { id: pkg.id },
              data: { expires_at: packageExpiryDate },
            });
          }
        }
      }

      if (packageExpiryDate) {
        // As sessões não podem ser agendadas para DEPOIS do vencimento do pacote.
        for (const appointmentDate of appointmentDates) {
          if (appointmentDate > packageExpiryDate) {
            return {
              success: false,
              error: `O pacote expira em ${packageExpiryDate.toLocaleDateString("pt-BR")}. Não é possível agendar sessões para datas posteriores.`,
            };
          }
        }
      }

      // NOVO: Cálculo estrito contra over-booking (V-02)
      // Considera tanto as sessões já realizadas quanto agendamentos futuros ativos que ainda não foram concluídos
      const scheduledActiveAppointmentsCount = await prisma.appointment.count({
        where: {
          package_id: pkg.id,
          organization_id: admin.organizationId,
          status: {
            in: [
              AppointmentStatus.PENDENTE,
              AppointmentStatus.CONFIRMADO,
              AppointmentStatus.SOLICITADO,
            ],
          },
          package_deducted: false,
        },
      });

      const totalBookedSessions = pkg.used_sessions + scheduledActiveAppointmentsCount;
      const sessionsAvailable = Math.max(0, pkg.total_sessions - totalBookedSessions);

      if (sessionsAvailable < totalSessionsToCreate) {
        return {
          success: false,
          error: `Saldo insuficiente no pacote. O pacote possui ${pkg.total_sessions} sessões no total (${pkg.used_sessions} realizadas e ${scheduledActiveAppointmentsCount} já agendadas). Restam apenas ${sessionsAvailable} vaga(s) para novo agendamento.`,
        };
      }
      startSessionNumber = totalBookedSessions;
    }

    const createdTxIds: string[] = [];

    const appointments = await prisma.$transaction(async (tx) => {
      let currentSessionNumber = startSessionNumber;

      if (packageId) {
        // Trava atômica serializada no banco para evitar race condition de overbooking simultâneo
        const activeScheduledCount = await tx.appointment.count({
          where: {
            package_id: packageId,
            organization_id: admin.organizationId,
            status: {
              in: [
                AppointmentStatus.PENDENTE,
                AppointmentStatus.CONFIRMADO,
                AppointmentStatus.SOLICITADO,
              ],
            },
            package_deducted: false,
          },
        });

        const txPkg = await tx.package.findUnique({
          where: { id: packageId },
          select: { total_sessions: true, used_sessions: true, active: true },
        });

        if (!txPkg || !txPkg.active) {
          throw new Error("Pacote não encontrado ou arquivado.");
        }

        const totalBooked = txPkg.used_sessions + activeScheduledCount;
        const availableInTx = Math.max(0, txPkg.total_sessions - totalBooked);

        if (availableInTx < totalSessionsToCreate) {
          throw new Error(
            `Saldo insuficiente no pacote. O pacote possui ${txPkg.total_sessions} sessões no total (${txPkg.used_sessions} realizadas e ${activeScheduledCount} já agendadas). Restam apenas ${availableInTx} sessão(ões) disponível(is).`
          );
        }

        currentSessionNumber = totalBooked;
      }

      const created: any[] = [];
      for (let i = 0; i < appointmentDates.length; i++) {
        const appt = await tx.appointment.create({
          data: {
            date_time: appointmentDates[i],
            observations,
            client_id: clientId,
            service_id: serviceId,
            package_id: packageId || null,
            organization_id: admin.organizationId,
            recurrence_id: recurrenceId,
            session_number: packageId ? currentSessionNumber + i + 1 : null,
            professional_id: targetProfessional,
            payment_method: (!packageId && isPaid && finalPaymentMethod) ? finalPaymentMethod : null,
            has_charge: !packageId && !isPaid,
            snapshot_service_name: service.name,
            snapshot_service_price: packageId && selectedPackage ? selectedPackage.snapshot_service_price ?? (Number(selectedPackage.total_price) / Math.max(1, selectedPackage.total_sessions)) : service.price,
            snapshot_service_duration: service.duration,
          },
          include: {
            client: { select: { name: true } },
          },
        });
        created.push(appt);

        // Se for avulso e o usuário já marcou como pago no ato do agendamento
        if (!packageId && isPaid) {
          const apptPrice = Number(appt.snapshot_service_price ?? service.price);
          const apptName = appt.snapshot_service_name ?? service.name;
          const clientName = appt.client?.name || "Cliente";

          const { createdTxIds: newTxIds } = await createSettledRevenueWithFee({
            tx,
            organizationId: admin.organizationId,
            grossAmount: apptPrice,
            description: `Serviço Realizado: ${apptName}`,
            appointment_id: appt.id,
            client_id: appt.client_id,
            admin_id: admin.id,
            paymentMethodId: finalPaymentMethodId,
            paymentMethodEnum: finalPaymentMethod,
            status: "PAGO",
            baseDate: appointmentDates[i] || new Date(),
          });
          createdTxIds.push(...newTxIds);
        }
      }

      if (clientId) {
        const dateStr = new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "short",
          timeStyle: "short",
        }).format(firstDateTime);
        const authorName = admin.name || "Administrador";
        const noteText =
          totalSessionsToCreate > 1
            ? `Ação: Série recorrente de ${service.name} (${totalSessionsToCreate} agendamentos a partir de ${dateStr}) criada por: ${authorName}.`
            : `Ação: Agendamento de ${service.name} (${dateStr}) criado por: ${authorName}.`;

        await tx.clientNote.create({
          data: {
            text: noteText,
            client_id: clientId,
            organization_id: admin.organizationId,
            date: new Date(),
          },
        });
      }

      return created;
    });

    for (const txId of createdTxIds) {
      triggerZibeeSyncById(txId, admin.organizationId).catch(console.error);
    }

    revalidatePath("/admin/agenda");
    revalidatePath("/admin/finance/dashboard");
    revalidatePath("/admin/clients");
    revalidatePath("/admin/notes");
    if (clientId) {
      revalidatePath(`/admin/clients/${clientId}`);
    }

    const sanitizedAppointments = appointments.map((appt) => ({
      ...appt,
      snapshot_service_price: appt.snapshot_service_price
        ? Number(appt.snapshot_service_price)
        : null,
    }));

    return { success: true, appointments: sanitizedAppointments };
  } catch (error: any) {
    console.error("Erro ao criar agendamento:", error);
    return { success: false, error: error?.message || "Erro ao criar agendamento." };
  }
}

// --- 2. ATUALIZAR E GERAR DESPESA AUTOMÁTICA ---
export async function updateAppointment(
  id: string,
  data: {
    status: string;
    paymentMethod: string | null;
    paymentMethodId?: string | null;
    observations: string;
    hasCharge: boolean;
  },
  updateAll: boolean = false,
  recurrenceId?: string | null,
) {
  try {
    const admin = await requireAuth();
    const prisma = getTenantPrisma(admin.organizationId);

    const statusMap: Record<string, AppointmentStatus> = {
      a_confirmar: AppointmentStatus.PENDENTE,
      confirmado: AppointmentStatus.CONFIRMADO,
      solicitado: AppointmentStatus.SOLICITADO,
      aprovado: AppointmentStatus.PENDENTE,
      atrasou: AppointmentStatus.PENDENTE,
      nao_compareceu: AppointmentStatus.CANCELADO,
      cancelado: AppointmentStatus.CANCELADO,
      realizado: AppointmentStatus.REALIZADO,
    };

    const finalStatus = statusMap[data.status] || AppointmentStatus.PENDENTE;

    let finalPaymentMethodId = data.paymentMethodId || null;
    let finalPaymentMethod: PaymentMethod | null = null;

    if (data.paymentMethod) {
      if (Object.values(PaymentMethod).includes(data.paymentMethod as any)) {
        finalPaymentMethod = data.paymentMethod as PaymentMethod;
      } else {
        finalPaymentMethodId = data.paymentMethod;
      }
    }

    if (finalPaymentMethodId && !finalPaymentMethod) {
      const pmRecord = await prisma.organizationPaymentMethod.findUnique({
        where: { id: finalPaymentMethodId },
        select: { type: true },
      });
      if (pmRecord) {
        finalPaymentMethod = pmRecord.type;
      }
    }

    let finalHasCharge = data.hasCharge;

    if (
      finalStatus === AppointmentStatus.REALIZADO &&
      finalPaymentMethod !== null
    )
      finalHasCharge = false;
    if (finalStatus === AppointmentStatus.CANCELADO) finalHasCharge = false;

    const currentAppt = await prisma.appointment.findUnique({
      where: { id, organization_id: admin.organizationId },
      include: {
        client: {
          include: {
            appointments: { select: { id: true } },
            packages: { select: { id: true } },
          },
        },
        package: true,
        service: {
          include: {
            stock_items: {
              include: { stock_item: true },
            },
          },
        },
        transactions: {
          select: { id: true, status: true, amount: true, description: true },
        },
      },
    });

    if (!currentAppt)
      return { success: false, error: "Agendamento não encontrado." };

    if (currentAppt.package_id) {
      finalHasCharge = false;
    }

    // Se estiver recusando/cancelando uma solicitação pendente (SOLICITADO)
    if (currentAppt.status === AppointmentStatus.SOLICITADO && finalStatus === AppointmentStatus.CANCELADO) {
      const linkedTxs = currentAppt.transactions || [];
      const paidTxIds = linkedTxs.filter((t) => t.status === "PAGO").map((t) => t.id);
      const unpaidTxs = linkedTxs.filter((t) => t.status !== "PAGO");

      await prisma.$transaction(async (tx) => {
        // Desvincula transações quitadas (ex: sinal pago via PIX/Mercado Pago) e atualiza a descrição
        if (paidTxIds.length > 0) {
          for (const t of linkedTxs.filter((tx) => tx.status === "PAGO")) {
            const extraNote = t.description && t.description.includes("(Solicitação recusada")
              ? ""
              : " (Solicitação recusada pelo estabelecimento)";
            await tx.transaction.update({
              where: { id: t.id },
              data: {
                appointment_id: null,
                description: `${t.description || "Transação"}${extraNote}`,
              },
            });
          }
        }

        // Deleta transações não-pagas (pendentes) vinculadas a esta solicitação
        if (unpaidTxs.length > 0) {
          await tx.transaction.deleteMany({
            where: { id: { in: unpaidTxs.map((t) => t.id) } },
          });
        }

        // Registra log no Histórico de Ações do Cliente (ClientNote)
        const willDeleteClient =
          currentAppt.client.source === "SELF_SERVICE" &&
          currentAppt.client.appointments.length <= 1 &&
          currentAppt.client.packages.length === 0 &&
          paidTxIds.length === 0;

        if (!willDeleteClient) {
          const dateStr = new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
          }).format(currentAppt.date_time);
          const serviceName = currentAppt.snapshot_service_name || currentAppt.service?.name || "Serviço";

          let logText = `Ação: Solicitação de ${serviceName} (${dateStr}) recusada por: ${admin.name || "Administrador"}.`;
          if (paidTxIds.length > 0) {
            const totalPaid = linkedTxs.filter((t) => t.status === "PAGO").reduce((acc, t) => acc + Number(t.amount || 0), 0);
            logText += ` Sinal pago de R$ ${totalPaid.toFixed(2)} foi mantido no caixa.`;
          } else if (unpaidTxs.length > 0) {
            const totalUnpaid = unpaidTxs.reduce((acc, t) => acc + Number(t.amount || 0), 0);
            logText += ` Cobrança pendente de R$ ${totalUnpaid.toFixed(2)} foi cancelada.`;
          }

          await tx.clientNote.create({
            data: {
              text: logText,
              client_id: currentAppt.client.id,
              organization_id: admin.organizationId,
              date: new Date(),
            },
          });
        }

        // Exclui o agendamento recusado para limpar a base
        await tx.appointment.delete({
          where: { id: currentAppt.id },
        });

        // Se o cliente foi criado via auto-agendamento (SELF_SERVICE) e só tinha essa solicitação
        if (willDeleteClient) {
          // Trava de integridade: Só deleta o cliente se ele não tiver registros financeiros vinculados
          const remainingTxs = await tx.transaction.count({
            where: { client_id: currentAppt.client.id },
          });

          if (remainingTxs === 0) {
            await tx.client.delete({
              where: { id: currentAppt.client.id },
            });
          }
        }
      });

      // Remove transações não-pagas do Zibee em segundo plano
      for (const t of unpaidTxs) {
        deleteTransactionFromZibee(t.id, admin.organizationId).catch((err) =>
          console.error("[updateAppointment cancel SOLICITADO] Erro ao sincronizar remoção no Zibee:", err)
        );
      }

      revalidatePath("/admin/agenda");
      revalidatePath("/admin/auto/requests");
      revalidatePath("/admin/clients");
      return { success: true };
    }

    const isMarkingAsDone =
      finalStatus === AppointmentStatus.REALIZADO &&
      currentAppt.status !== AppointmentStatus.REALIZADO;

    const isUnmarkingAsDone =
      currentAppt.status === AppointmentStatus.REALIZADO &&
      finalStatus !== AppointmentStatus.REALIZADO;

    if (isUnmarkingAsDone) {
      if (currentAppt.package_id) {
        finalHasCharge = false;
      } else if (finalStatus === AppointmentStatus.CANCELADO) {
        finalHasCharge = false;
      } else {
        finalHasCharge = true;
      }
    }

    if (isMarkingAsDone && currentAppt.package && !currentAppt.package_deducted) {
      if (!currentAppt.package.active) {
        return {
          success: false,
          error:
            "Este pacote foi arquivado. Esta sessão foi invalidada e não pode receber baixa.",
        };
      }
      if (
        currentAppt.package.used_sessions >= currentAppt.package.total_sessions
      ) {
        return {
          success: false,
          error: "Este pacote já atingiu o limite total de sessões permitidas.",
        };
      }
    }

    const createdTxIds: string[] = [];
    const deletedTxIds: string[] = [];
    let affectedCount = 1;

    await prisma.$transaction(async (tx) => {
      if (updateAll && recurrenceId) {
        const updateResult = await tx.appointment.updateMany({
          where: {
            recurrence_id: recurrenceId,
            organization_id: admin.organizationId,
            status: { not: AppointmentStatus.REALIZADO },
          },
          data: {
            status: finalStatus,
            payment_method: finalPaymentMethod,
            has_charge: finalHasCharge,
            observations: data.observations,
          },
        });

        affectedCount = updateResult.count;
        const newlyCompletedCount = affectedCount;

        if (isMarkingAsDone && currentAppt.package_id && currentAppt.package && newlyCompletedCount > 0) {
          // Trava atômica condicional no banco contra concorrência e race condition
          const maxAllowedIncrement = currentAppt.package.total_sessions - currentAppt.package.used_sessions;
          if (newlyCompletedCount > maxAllowedIncrement) {
            throw new Error(
              `Saldo insuficiente no pacote "${currentAppt.package.name}". Restam ${Math.max(0, maxAllowedIncrement)} sessões, mas foram concluídas ${newlyCompletedCount}.`,
            );
          }

          const pacoteUpdate = await tx.package.updateMany({
            where: {
              id: currentAppt.package_id,
              organization_id: admin.organizationId,
              used_sessions: { lte: currentAppt.package.total_sessions - newlyCompletedCount },
            },
            data: {
              used_sessions: { increment: newlyCompletedCount },
            },
          });

          if (pacoteUpdate.count === 0) {
            throw new Error(
              `Saldo insuficiente no pacote "${currentAppt.package.name}".`,
            );
          }

          const updatedPkg = await tx.package.findUnique({
            where: { id: currentAppt.package_id },
            select: { used_sessions: true, total_sessions: true, active: true },
          });

          const currentUsedSessions = updatedPkg?.used_sessions ?? (currentAppt.package.used_sessions + newlyCompletedCount);
          const stillActive = currentUsedSessions < currentAppt.package.total_sessions;
          const isManuallyArchived = !currentAppt.package.active && (currentAppt.package.used_sessions < currentAppt.package.total_sessions);
          const finalActive = isManuallyArchived ? false : stillActive;

          await tx.package.update({
            where: { id: currentAppt.package_id },
            data: {
              active: finalActive,
            },
          });

          if (!finalActive) {
            await PackageService.handleExhaustedPackageFutureAppointments({
              tx,
              packageId: currentAppt.package_id,
              organizationId: admin.organizationId,
              packageName: currentAppt.package.name,
              excludeAppointmentId: currentAppt.id,
              adminName: admin.name || "Administrador",
            });
          }

          if (recurrenceId) {
            await tx.appointment.updateMany({
              where: {
                recurrence_id: recurrenceId,
                organization_id: admin.organizationId,
                status: AppointmentStatus.REALIZADO,
              },
              data: { package_deducted: true },
            });
          }
        }
      } else {
        if (isMarkingAsDone) {
          const updateResult = await tx.appointment.updateMany({
            where: {
              id,
              organization_id: admin.organizationId,
              status: { not: AppointmentStatus.REALIZADO },
            },
            data: {
              status: finalStatus,
              observations: data.observations,
              payment_method: finalPaymentMethod,
              has_charge: finalHasCharge,
            },
          });

          if (updateResult.count === 0) {
            throw new Error(
              "Este agendamento já foi finalizado simultaneamente (por outro usuário ou no totem).",
            );
          }
        } else {
          await tx.appointment.update({
            where: { id, organization_id: admin.organizationId },
            data: {
              status: finalStatus,
              observations: data.observations,
              payment_method: finalPaymentMethod,
              has_charge: finalHasCharge,
            },
          });
        }

        if (isMarkingAsDone && currentAppt.package_id && currentAppt.package && !currentAppt.package_deducted) {
          // Trava atômica condicional no banco contra concorrência e race condition (evita > total_sessions)
          const pacoteUpdate = await tx.package.updateMany({
            where: {
              id: currentAppt.package_id,
              organization_id: admin.organizationId,
              used_sessions: { lt: currentAppt.package.total_sessions },
            },
            data: {
              used_sessions: { increment: 1 },
            },
          });

          if (pacoteUpdate.count === 0) {
            throw new Error(
              `Saldo de sessões esgotado no pacote "${currentAppt.package.name}".`,
            );
          }

          const updatedPkg = await tx.package.findUnique({
            where: { id: currentAppt.package_id },
            select: { used_sessions: true, total_sessions: true, active: true },
          });

          const currentUsedSessions = updatedPkg?.used_sessions ?? (currentAppt.package.used_sessions + 1);
          const stillActive = currentUsedSessions < currentAppt.package.total_sessions;
          const isManuallyArchived = !currentAppt.package.active && (currentAppt.package.used_sessions < currentAppt.package.total_sessions);
          const finalActive = isManuallyArchived ? false : stillActive;

          await tx.package.update({
            where: { id: currentAppt.package_id },
            data: {
              active: finalActive,
            },
          });

          if (!finalActive) {
            await PackageService.handleExhaustedPackageFutureAppointments({
              tx,
              packageId: currentAppt.package_id,
              organizationId: admin.organizationId,
              packageName: currentAppt.package.name,
              excludeAppointmentId: currentAppt.id,
              adminName: admin.name || "Administrador",
            });
          }

          await tx.appointment.update({
            where: { id: currentAppt.id },
            data: { package_deducted: true },
          });
        }

        if (isUnmarkingAsDone && currentAppt.package_id && currentAppt.package && currentAppt.package_deducted) {
          const isManuallyArchived =
            !currentAppt.package.active &&
            currentAppt.package.used_sessions < currentAppt.package.total_sessions;
          const finalActive = isManuallyArchived ? false : true;

          if (currentAppt.package.used_sessions > 0) {
            await tx.package.update({
              where: { id: currentAppt.package_id },
              data: {
                used_sessions: { decrement: 1 },
                active: finalActive,
              },
            });
          }

          await tx.appointment.update({
            where: { id: currentAppt.id },
            data: { package_deducted: false },
          });
        }
      }

      const service = currentAppt.service;
      const requiresRevenue =
        finalStatus === AppointmentStatus.REALIZADO &&
        !currentAppt.package_id &&
        finalPaymentMethod !== null;

      if (requiresRevenue) {
        // Busca receitas já pagas para esse agendamento (ex: sinal online de 50% via Mercado Pago)
        const paidRevenues = await tx.transaction.findMany({
          where: { appointment_id: currentAppt.id, type: "RECEITA", status: "PAGO" },
        });

        const isSignalRefunded =
          currentAppt.mp_payment_status === "refunded" ||
          currentAppt.mp_payment_status === "charged_back";

        const totalPaid = isSignalRefunded
          ? 0
          : paidRevenues.reduce((acc: number, t: any) => acc + Number(t.amount), 0);
        const apptPrice = Number(currentAppt.snapshot_service_price ?? service.price);
        const remainingAmount = Math.max(0, Number((apptPrice - totalPaid).toFixed(2)));

        if (remainingAmount > 0.01) {
          const apptName = currentAppt.snapshot_service_name ?? service.name;
          const desc =
            totalPaid > 0
              ? `Serviço Quitado (Saldo Restante): ${apptName} (${currentAppt.client.name})`
              : `Serviço Realizado: ${apptName} (${currentAppt.client.name})`;

          const { createdTxIds: newTxIds } = await createSettledRevenueWithFee({
            tx,
            organizationId: admin.organizationId,
            grossAmount: remainingAmount,
            description: desc,
            appointment_id: currentAppt.id,
            client_id: currentAppt.client_id,
            admin_id: admin.id,
            paymentMethodId: finalPaymentMethodId,
            paymentMethodEnum: finalPaymentMethod,
            status: "PAGO",
            baseDate: currentAppt.date_time || new Date(),
          });
          createdTxIds.push(...newTxIds);
        }
      }

      if (isMarkingAsDone) {
        // Se houver check-in registrado previamente (ex: totem com auto_complete_on_checkin = false),
        // atualiza auto_processed para true para permitir o estorno de estoque caso seja cancelado
        await tx.checkIn.updateMany({
          where: { appointment_id: currentAppt.id },
          data: { auto_processed: true, completed_at: new Date() },
        });

        // Trava de idempotência: só desconta estoque e gera despesa se ainda não foi debitado
        if (!currentAppt.stock_deducted) {
          if (service.track_stock && service.stock_items.length > 0) {
            for (const item of service.stock_items) {
              const stockData = item.stock_item;
              const usedQty = item.quantity_used;

              await tx.stockItem.update({
                where: { id: stockData.id },
                data: { quantity: { decrement: usedQty } },
              });

              if (!stockData.was_expensed) {
                const costOfUsedQty =
                  Number(usedQty) * Number(stockData.unit_cost);

                if (costOfUsedQty > 0) {
                  const now = new Date();
                  const expTx = await tx.transaction.create({
                    data: {
                      type: "DESPESA",
                      description: `Custo de Insumo: ${stockData.name}`,
                      amount: costOfUsedQty,
                      date: now,
                      due_date: now,
                      settlement_date: now,
                      status: "PAGO",
                      organization_id: admin.organizationId,
                      appointment_id: currentAppt.id,
                    },
                  });
                  createdTxIds.push(expTx.id);
                }
              }
            }
          } else if (
            !service.track_stock &&
            service.material_cost &&
            Number(service.material_cost) > 0
          ) {
            const now = new Date();
            const expTx = await tx.transaction.create({
              data: {
                type: "DESPESA",
                description: `Custo de Material: ${service.name}`,
                amount: service.material_cost,
                date: now,
                due_date: now,
                settlement_date: now,
                status: "PAGO",
                organization_id: admin.organizationId,
                appointment_id: currentAppt.id,
              },
            });
            createdTxIds.push(expTx.id);
          }

          // Marca o agendamento como insumos debitados
          await tx.appointment.update({
            where: { id: currentAppt.id },
            data: { stock_deducted: true },
          });
        }
      }

      if (isUnmarkingAsDone) {
        // 1. Se houver check-in registrado previamente, reseta auto_processed
        await tx.checkIn.updateMany({
          where: { appointment_id: currentAppt.id },
          data: { auto_processed: false, completed_at: null },
        });

        // 2. Se o estoque havia sido debitado, devolve ao estoque e reseta a flag
        if (currentAppt.stock_deducted) {
          if (service.track_stock && service.stock_items.length > 0) {
            for (const item of service.stock_items) {
              const stockData = item.stock_item;
              const usedQty = item.quantity_used;

              await tx.stockItem.update({
                where: { id: stockData.id },
                data: { quantity: { increment: usedQty } },
              });
            }
          }

          await tx.appointment.update({
            where: { id: currentAppt.id },
            data: { stock_deducted: false },
          });
        }

        // 3. Estorno financeiro: busca transações vinculadas à realização deste agendamento
        const linkedTxs = await tx.transaction.findMany({
          where: {
            appointment_id: currentAppt.id,
            organization_id: admin.organizationId,
          },
        });

        // Despesas geradas na realização: insumos, materiais e taxas de intermediação
        // (preserva taxas do Mercado Pago pagas antecipadamente)
        const expensesToDelete = linkedTxs.filter((t) => {
          if (t.type !== "DESPESA") return false;
          const desc = t.description || "";
          if (desc.startsWith("Taxa Mercado Pago")) return false;
          return (
            desc.startsWith("Custo de Insumo:") ||
            desc.startsWith("Custo de Material:") ||
            desc.startsWith("Taxa ") ||
            t.parent_transaction_id != null
          );
        });

        // Receitas geradas na realização: Serviço Realizado ou Saldo Restante
        // (preserva depósitos/sinais online pré-pagos)
        const revenuesToDelete = linkedTxs.filter((t) => {
          if (t.type !== "RECEITA") return false;
          const desc = t.description || "";
          return (
            desc.startsWith("Serviço Realizado:") ||
            desc.startsWith("Serviço Quitado (Saldo Restante):")
          );
        });

        const txsToDelete = [...expensesToDelete, ...revenuesToDelete];
        if (txsToDelete.length > 0) {
          const idsToDelete = txsToDelete.map((t) => t.id);
          await tx.transaction.deleteMany({
            where: { id: { in: idsToDelete } },
          });
          deletedTxIds.push(...idsToDelete);
        }
      }

      // 4. Auditoria Unificada no Histórico do Cliente (ClientNote)
      if (currentAppt.client_id) {
        const serviceName =
          currentAppt.snapshot_service_name ||
          currentAppt.service?.name ||
          "Serviço";
        const dateStr = new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "short",
          timeStyle: "short",
        }).format(currentAppt.date_time);
        const authorName = admin.name || "Administrador";

        const getStatusLabel = (s: AppointmentStatus) => {
          switch (s) {
            case AppointmentStatus.CONFIRMADO:
              return "Confirmado";
            case AppointmentStatus.REALIZADO:
              return "Realizado";
            case AppointmentStatus.CANCELADO:
              return "Cancelado";
            case AppointmentStatus.PENDENTE:
              return "A Confirmar";
            case AppointmentStatus.SOLICITADO:
              return "Solicitado";
            case AppointmentStatus.VENCIDO:
              return "Vencido";
            default:
              return s;
          }
        };

        const isStatusChanged = currentAppt.status !== finalStatus;
        const oldStatusLabel = getStatusLabel(currentAppt.status);
        const newStatusLabel = getStatusLabel(finalStatus);

        let auditNoteText: string | null = null;

        if (isUnmarkingAsDone) {
          auditNoteText = `Ação: Status de ${serviceName} (${dateStr}) regredido de Realizado para ${newStatusLabel} por: ${authorName}. Lançamentos financeiros e estoque da realização foram estornados.`;
        } else if (isMarkingAsDone) {
          if (updateAll && recurrenceId && affectedCount > 1) {
            auditNoteText = `Ação: ${affectedCount} atendimentos da série recorrente de ${serviceName} (a partir de ${dateStr}) marcados como Realizados por: ${authorName}.`;
          } else {
            auditNoteText = `Ação: Atendimento de ${serviceName} (${dateStr}) marcado como Realizado por: ${authorName}.`;
          }

          if (currentAppt.package_id && currentAppt.package) {
            const added = updateAll && recurrenceId ? affectedCount : 1;
            const newUsed = currentAppt.package.used_sessions + added;
            auditNoteText += ` (Sessão ${newUsed} de ${currentAppt.package.total_sessions} do pacote "${currentAppt.package.name}" debitada).`;
          } else if (finalPaymentMethod) {
            auditNoteText += ` (Pagamento registrado: ${finalPaymentMethod}).`;
          }
        } else if (isStatusChanged) {
          if (updateAll && recurrenceId && affectedCount > 1) {
            auditNoteText = `Ação: Status de ${affectedCount} atendimentos da série recorrente de ${serviceName} (a partir de ${dateStr}) alterado de ${oldStatusLabel} para ${newStatusLabel} por: ${authorName}.`;
          } else {
            auditNoteText = `Ação: Status de ${serviceName} (${dateStr}) alterado de ${oldStatusLabel} para ${newStatusLabel} por: ${authorName}.`;
          }

          if (data.observations?.trim() && data.observations.trim() !== (currentAppt.observations || "").trim()) {
            auditNoteText += ` Obs: "${data.observations.trim()}".`;
          }
        } else {
          // Status não mudou, mas verificamos se a observação foi alterada
          const oldObs = (currentAppt.observations || "").trim();
          const newObs = (data.observations || "").trim();
          if (newObs !== oldObs && newObs.length > 0) {
            auditNoteText = `Ação: Observação do atendimento de ${serviceName} (${dateStr}) atualizada por: ${authorName}. Detalhes: "${newObs}".`;
          }
        }

        if (auditNoteText) {
          await tx.clientNote.create({
            data: {
              text: auditNoteText,
              client_id: currentAppt.client_id,
              organization_id: admin.organizationId,
              date: new Date(),
            },
          });
        }
      }
    });

    for (const txId of createdTxIds) {
      triggerZibeeSyncById(txId, admin.organizationId).catch(console.error);
    }

    for (const txId of deletedTxIds) {
      deleteTransactionFromZibee(txId, admin.organizationId).catch((err) =>
        console.error("[updateAppointment rollback] Erro ao sincronizar remoção no Zibee:", err)
      );
    }

    revalidatePath("/admin/agenda");
    revalidatePath("/admin/auto/requests");
    revalidatePath("/admin/packages");
    revalidatePath("/admin/stock");
    revalidatePath("/admin/finance/dashboard");
    revalidatePath("/admin/finance/transactions");
    revalidatePath("/admin/finance/receivables");
    revalidatePath("/admin/clients");
    revalidatePath("/admin/notes");
    if (currentAppt.client_id) {
      revalidatePath(`/admin/clients/${currentAppt.client_id}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error(error);
    return {
      success: false,
      error: error?.message || "Erro ao atualizar agendamento.",
    };
  }
}

// --- 3. DELETAR (INDIVIDUAL OU SÉRIE) COM LOG DE AUDITORIA ---
export async function deleteAppointment(
  id: string,
  deleteAll: boolean = false,
  recurrenceId?: string | null,
) {
  try {
    const admin = await requireAuth();
    const prisma = getTenantPrisma(admin.organizationId);

    // 1. Busca os registros ANTES de deletar para termos os dados para o log
    const allAppointments = await prisma.appointment.findMany({
      where: {
        ...(deleteAll && recurrenceId
          ? { recurrence_id: recurrenceId }
          : { id }),
        organization_id: admin.organizationId,
      },
      include: {
        package: true,
        client: true,
        check_in: true,
        transactions: {
          select: { id: true, status: true, amount: true, description: true },
        },
      },
    });

    if (allAppointments.length === 0)
      return { success: false, error: "Agendamento não encontrado." };

    // 2. Filtramos os que já foram realizados (não podemos excluir esses)
    const appointmentsToDelete = allAppointments.filter(
      (appt) => appt.status !== AppointmentStatus.REALIZADO
    );

    if (appointmentsToDelete.length === 0) {
      return {
        success: false,
        error: "Não é permitido excluir agendamentos já realizados.",
      };
    }

    const idsToDelete = appointmentsToDelete.map(a => a.id);
    const allTxs = appointmentsToDelete.flatMap((a) => a.transactions || []);
    const paidTxs = allTxs.filter((t) => t.status === "PAGO");
    const unpaidTxs = allTxs.filter((t) => t.status !== "PAGO");

    await prisma.$transaction(async (tx) => {
      // 1. Desvincula transações pagas (ex: sinal ou pré-pagamento) e atualiza a descrição
      if (paidTxs.length > 0) {
        for (const t of paidTxs) {
          const extraNote = t.description && t.description.includes("(Agendamento excluído")
            ? ""
            : " (Agendamento excluído da agenda)";
          await tx.transaction.update({
            where: { id: t.id },
            data: {
              appointment_id: null,
              description: `${t.description || "Transação"}${extraNote}`,
            },
          });
        }
      }

      // 2. Deleta transações não-pagas (pendentes/atrasadas) vinculadas ao agendamento
      if (unpaidTxs.length > 0) {
        await tx.transaction.deleteMany({
          where: { id: { in: unpaidTxs.map((t) => t.id) } },
        });
      }

      for (const appt of appointmentsToDelete) {
        // A. Auditoria: Registra a exclusão no histórico do cliente com contexto financeiro
        const dateStr = new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "short",
          timeStyle: "short",
        }).format(appt.date_time);

        const checkInText = appt.check_in
          ? " e seu Check-in correspondente foram excluídos"
          : " foi excluído";

        const apptPaid = (appt.transactions || []).filter((t) => t.status === "PAGO");
        const apptUnpaid = (appt.transactions || []).filter((t) => t.status !== "PAGO");

        let logText = `Ação: Agendamento de ${appt.snapshot_service_name || "Serviço"} no dia ${dateStr}${checkInText} por: ${admin.name || "Administrador"}.`;
        if (apptPaid.length > 0) {
          const totalPaid = apptPaid.reduce((acc, t) => acc + Number(t.amount || 0), 0);
          logText += ` Sinal pago de R$ ${totalPaid.toFixed(2)} foi mantido no caixa.`;
        } else if (apptUnpaid.length > 0) {
          const totalUnpaid = apptUnpaid.reduce((acc, t) => acc + Number(t.amount || 0), 0);
          logText += ` Cobrança pendente de R$ ${totalUnpaid.toFixed(2)} foi cancelada.`;
        }

        await tx.clientNote.create({
          data: {
            text: logText,
            client_id: appt.client_id,
            organization_id: admin.organizationId,
            date: new Date(),
          },
        });

        // B. Lógica de estorno de sessão de pacote (se necessário)
        if (appt.status === AppointmentStatus.REALIZADO && appt.package_id) {
          await tx.package.update({
            where: { id: appt.package_id },
            data: {
              used_sessions: { decrement: 1 },
              active: true,
            },
          });
        }

        // C. Deleta o Check-in se existir
        await tx.checkIn.deleteMany({
          where: { appointment_id: appt.id },
        });
      }

      // 3. Executa a exclusão propriamente dita
      await tx.appointment.deleteMany({
        where: {
          id: { in: idsToDelete },
          organization_id: admin.organizationId,
        },
      });
    });

    // Sincroniza remoção no Zibee para transações pendentes
    for (const t of unpaidTxs) {
      deleteTransactionFromZibee(t.id, admin.organizationId).catch((err) =>
        console.error("[deleteAppointment] Erro ao sincronizar remoção no Zibee:", err)
      );
    }

    revalidatePath("/admin/agenda");
    revalidatePath("/admin/packages");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/history");

    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir agendamento:", error);
    return { success: false, error: "Erro ao excluir agendamento." };
  }
}

// --- 4. DRAG AND DROP ---
export async function updateAppointmentDateTime(
  id: string,
  newDateIso: string,
) {
  try {
    const admin = await requireAuth();

    // 🛡️ Trava de Segurança & Rate Limit Multi-Camada (Anti-Bot / Anti-Spam / Anti-Afobado)
    const throttle = checkAppointmentThrottle(admin.id, id);
    if (!throttle.allowed) {
      return {
        success: false,
        error: throttle.reason,
      };
    }

    const prisma = getTenantPrisma(admin.organizationId);

    const apptToMove = await prisma.appointment.findUnique({
      where: { id, organization_id: admin.organizationId },
      include: {
        service: true,
        package: true,
        check_in: true,
      },
    });

    if (!apptToMove) {
      return { success: false, error: "Agendamento não encontrado." };
    }

    // Regra: Agendamentos com check-in já realizado não podem ser movidos
    if (apptToMove.check_in) {
      return {
        success: false,
        error: "Agendamentos com check-in já realizado não podem ser movidos.",
      };
    }

    const isCancelled = apptToMove.status === AppointmentStatus.CANCELADO;
    const isRealizado = apptToMove.status === AppointmentStatus.REALIZADO;
    const isFalta = isCancelled && (
      apptToMove.observations?.includes("(Falta Registrada)") ||
      apptToMove.observations?.includes("Falta automática")
    );
    const isPendenteOuConfirmado = apptToMove.status === AppointmentStatus.PENDENTE ||
      apptToMove.status === AppointmentStatus.CONFIRMADO;

    // Regra: Agendamentos com status REALIZADO não podem ser movidos via drag and drop
    if (isRealizado) {
      return {
        success: false,
        error: "Agendamentos com status Realizado não podem ser movidos. Altere o status antes de reagendar.",
      };
    }

    // Regra: Os únicos agendamentos que podem ser movidos são os pendentes e o Rosa (Falta)
    if (!isPendenteOuConfirmado && !isFalta) {
      return {
        success: false,
        error: "Apenas agendamentos pendentes ou faltas podem ser movidos.",
      };
    }

    if (apptToMove.package && apptToMove.package.active === false) {
      return {
        success: false,
        error: "Não é possível reagendar. Este pacote foi arquivado.",
      };
    }

    const oldDate = new Date(apptToMove.date_time);
    const newDate = new Date(newDateIso);

    // Se o horário for idêntico, ignora a escrita
    if (oldDate.getTime() === newDate.getTime()) {
      return { success: true };
    }

    const now = new Date();

    const formatDateBr = (d: Date) =>
      new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);

    const oldDateFormatted = formatDateBr(oldDate);
    const newDateFormatted = formatDateBr(newDate);
    const nowFormatted = formatDateBr(now);
    const serviceName =
      apptToMove.snapshot_service_name ||
      apptToMove.service?.name ||
      "Serviço";
    const authorName = admin.name || "Administrador";

    const logText = `Ação: Reagendamento de ${serviceName}. Horário anterior: ${oldDateFormatted} -> Novo horário: ${newDateFormatted}. Alterado em ${nowFormatted} por: ${authorName}.`;

    await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id, organization_id: admin.organizationId },
        data: { date_time: newDate },
      });

      if (apptToMove.client_id) {
        // Consolidação Inteligente de Logs:
        // Se já houver um registro de reagendamento para este mesmo agendamento nos últimos 15 minutos,
        // apenas atualizamos o texto em vez de criar dezenas de linhas poluindo o banco.
        const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
        const recentNote = await tx.clientNote.findFirst({
          where: {
            client_id: apptToMove.client_id,
            organization_id: admin.organizationId,
            date: { gte: fifteenMinutesAgo },
            text: { startsWith: `Ação: Reagendamento de ${serviceName}` },
          },
          orderBy: { date: "desc" },
        });

        if (recentNote) {
          await tx.clientNote.update({
            where: { id: recentNote.id },
            data: {
              text: logText,
              date: now,
            },
          });
        } else {
          await tx.clientNote.create({
            data: {
              text: logText,
              client_id: apptToMove.client_id,
              organization_id: admin.organizationId,
              date: now,
            },
          });
        }
      }
    });

    // Registra a movimentação no monitor de segurança em memória
    recordAppointmentMove(admin.id, id);

    revalidatePath("/admin/agenda");
    revalidatePath("/admin/clients");
    if (apptToMove.client_id) {
      revalidatePath(`/admin/clients/${apptToMove.client_id}`);
    }

    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Falha ao reagendar." };
  }
}

// --- 5. PROCESSAMENTO AUTOMÁTICO DE FALTAS (AGORA 100% REATIVO NA AGENDA) ---
// Removido o antigo cron job diário (processDailyNoShows) para evitar duplicação.
// As faltas automáticas agora são processadas inteligentemente no momento em que a agenda é consultada.

// --- 6. DESFAZER FALTA (MANUAL OU AUTOMÁTICA) ---
export async function undoNoShow(appointmentId: string) {
  try {
    const admin = await requireAuth();
    const prisma = getTenantPrisma(admin.organizationId);

    const appt = await prisma.appointment.findUnique({
      where: { id: appointmentId, organization_id: admin.organizationId },
      include: { package: true },
    });

    if (!appt || appt.status !== AppointmentStatus.CANCELADO) {
      return {
        success: false,
        error: "Agendamento não encontrado ou não está cancelado.",
      };
    }

    await prisma.$transaction(async (tx) => {
      const cleanObs = appt.observations
        ? appt.observations
          .replace("\n(Falta automática)", "")
          .replace("\n(Falta Registrada)", "")
          .replace("(Falta Registrada)", "")
          .replace(
            "Falta não justificada. Baixa automática pelo sistema.",
            "",
          )
        : null;

      await tx.appointment.update({
        where: { id: appt.id },
        data: {
          status: AppointmentStatus.PENDENTE,
          observations: cleanObs?.trim() === "" ? null : cleanObs,
        },
      });

      if (appt.package_id && appt.package) {
        const isManuallyArchived = !appt.package.active && (appt.package.used_sessions < appt.package.total_sessions);
        const finalActive = isManuallyArchived ? false : true;

        await tx.package.update({
          where: { id: appt.package_id },
          data: {
            used_sessions: { decrement: 1 },
            active: finalActive,
          },
        });
      }

      // Limpa a nota de "Falta" do histórico da cliente (busca pela data exata da consulta)
      const dateStr = new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
      }).format(appt.date_time);

      await tx.clientNote.deleteMany({
        where: {
          client_id: appt.client_id,
          organization_id: admin.organizationId,
          text: { contains: dateStr },
        },
      });
    });

    revalidatePath("/admin/agenda");
    revalidatePath("/admin/packages");
    revalidatePath("/admin/clients");

    return { success: true };
  } catch (error) {
    console.error("Erro ao desfazer falta:", error);
    return { success: false, error: "Falha ao estornar a falta do cliente." };
  }
}

// --- 7. REGISTRAR FALTA MANUALMENTE ---
export async function registerManualNoShow(
  appointmentId: string,
  observation: string,
  deductSession: boolean = true
) {
  try {
    const admin = await requireAuth();
    const prisma = getTenantPrisma(admin.organizationId);

    const appt = await prisma.appointment.findUnique({
      where: { id: appointmentId, organization_id: admin.organizationId },
      include: { package: true },
    });

    if (!appt) return { success: false, error: "Agendamento não encontrado." };
    if (
      appt.status === AppointmentStatus.CANCELADO ||
      appt.status === AppointmentStatus.REALIZADO
    ) {
      return { success: false, error: "Este agendamento já está fechado." };
    }

    await prisma.$transaction(async (tx) => {
      const newObs = observation
        ? `${observation}\n(Falta Registrada)`
        : "(Falta Registrada)";

      await tx.appointment.update({
        where: { id: appt.id },
        data: {
          status: AppointmentStatus.CANCELADO,
          has_charge: false,
          payment_method: null,
          observations: newObs,
        },
      });

      if (deductSession && appt.package_id && appt.package) {
        // Trava atômica condicional no banco contra concorrência e race condition
        const pacoteUpdate = await tx.package.updateMany({
          where: {
            id: appt.package_id,
            organization_id: admin.organizationId,
            used_sessions: { lt: appt.package.total_sessions },
          },
          data: {
            used_sessions: { increment: 1 },
          },
        });

        if (pacoteUpdate.count === 0) {
          throw new Error(
            `Saldo de sessões esgotado no pacote "${appt.package.name}".`,
          );
        }

        const updatedPkg = await tx.package.findUnique({
          where: { id: appt.package_id },
          select: { used_sessions: true, total_sessions: true, active: true },
        });

        const currentUsedSessions = updatedPkg?.used_sessions ?? (appt.package.used_sessions + 1);
        const stillActive = currentUsedSessions < appt.package.total_sessions;
        const isManuallyArchived = !appt.package.active && (appt.package.used_sessions < appt.package.total_sessions);
        const finalActive = isManuallyArchived ? false : stillActive;

        await tx.package.update({
          where: { id: appt.package_id },
          data: {
            active: finalActive,
          },
        });

        if (!finalActive) {
          await PackageService.handleExhaustedPackageFutureAppointments({
            tx,
            packageId: appt.package_id,
            organizationId: admin.organizationId,
            packageName: appt.package.name,
            excludeAppointmentId: appt.id,
            adminName: admin.name || "Administrador",
          });
        }
      }

      // Cria nota no histórico da cliente
      const formattedDate = new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(appt.date_time);
      const noteText = appt.package_id
        ? deductSession
          ? `Falta Manual: A cliente não compareceu ao agendamento do dia ${formattedDate}. A sessão foi descontada do pacote.`
          : `Falta Manual (Abonada): A cliente não compareceu ao agendamento do dia ${formattedDate}, mas a sessão NÃO foi descontada do pacote.`
        : `Falta Manual: A cliente não compareceu ao agendamento do dia ${formattedDate} (Serviço Avulso).`;

      await tx.clientNote.create({
        data: {
          text: noteText,
          client_id: appt.client_id,
          organization_id: admin.organizationId,
          date: new Date(),
        },
      });
    });

    revalidatePath("/admin/agenda");
    revalidatePath("/admin/packages");
    revalidatePath("/admin/clients");

    return { success: true };
  } catch (error: any) {
    console.error("Erro ao registrar falta:", error);
    return {
      success: false,
      error: error?.message || "Falha ao registrar a falta.",
    };
  }
}

// --- 8. AUTO-AGENDAMENTO (PELO CLIENTE) ---
export type CreateClientAppointmentInput = {
  slug: string;
  firstName: string;
  phone: string;
  cpf?: string;
  email?: string;
  serviceId?: string;
  date: string; // ISO date or yyyy-MM-dd
  time: string; // HH:mm
  professionalId: string;
  notes?: string;
};

export async function createClientAppointmentAction(input: CreateClientAppointmentInput) {
  try {
    const org = await prisma.organization.findUnique({
      where: { slug: input.slug },
      include: {
        settings: true,
      }
    });

    if (!org) {
      return { success: false, error: "Organização não encontrada." };
    }

    const tenantPrisma = getTenantPrisma(org.id);

    // Encontrar ou criar cliente buscando por WhatsApp ou CPF (se fornecido)
    const clientSearchOr: any[] = [{ phone_whatsapp: input.phone }];
    if (input.cpf && input.cpf.trim() !== "") {
      const cleanCpf = input.cpf.replace(/\D/g, "");
      if (cleanCpf.length > 0) {
        clientSearchOr.push({ cpf: input.cpf });
        clientSearchOr.push({ cpf: cleanCpf });
      }
    }

    let client = await tenantPrisma.client.findFirst({
      where: {
        organization_id: org.id,
        OR: clientSearchOr,
      },
    });

    if (!client) {
      client = await tenantPrisma.client.create({
        data: {
          name: input.firstName,
          phone_whatsapp: input.phone,
          cpf: input.cpf && input.cpf.trim() !== "" ? input.cpf : null,
          email: input.email || null,
          organization_id: org.id,
          source: "SELF_SERVICE"
        },
      });
    } else {
      // Se o cliente já existia e preencheu CPF novo, atualiza apenas se ele não tinha CPF
      if (input.cpf && !client.cpf) {
        await tenantPrisma.client.update({
          where: { id: client.id },
          data: { cpf: input.cpf },
        });
      }
    }

    if (!input.serviceId) {
      return { success: false, error: "Serviço não informado." };
    }

    const service = await tenantPrisma.service.findUnique({
      where: { id: input.serviceId },
    });

    if (!service) {
      return { success: false, error: "Serviço não encontrado." };
    }

    // Date/Time parsing
    const [year, month, day] = input.date.split("-").map(Number);
    const [hours, minutes] = input.time.split(":").map(Number);
    const appointmentDateTime = new Date(year, month - 1, day, hours, minutes);

    // Se professionalId for "ANY", seleciona de forma inteligente:
    // 1. Apenas profissionais habilitados para o serviço
    // 2. Que realmente estejam livres no horário solicitado
    // 3. Balanceando a carga (prioriza quem tem menos agendamentos no dia)
    let finalProfessionalId = input.professionalId;
    if (finalProfessionalId === "ANY") {
      const startOfDayDate = new Date(year, month - 1, day, 0, 0, 0);
      const endOfDayDate = new Date(year, month - 1, day, 23, 59, 59);
      const apptEnd = new Date(appointmentDateTime.getTime() + (service.duration || 60) * 60000);

      const candidatePros = await tenantPrisma.admin.findMany({
        where: {
          organizations: { some: { id: org.id } },
          active: true,
          OR: [
            { role: "OWNER" },
            { services: { some: { id: service.id } } }
          ]
        },
        include: {
          appointments: {
            where: {
              date_time: {
                gte: startOfDayDate,
                lte: endOfDayDate,
              },
              status: { notIn: [AppointmentStatus.CANCELADO] }
            }
          }
        }
      });

      // Filtra os que não têm sobreposição de horário no momento
      const freePros = candidatePros.filter(pro => {
        const hasConflict = pro.appointments.some(appt => {
          const aStart = new Date(appt.date_time);
          const aDuration = appt.snapshot_service_duration || 60;
          const aEnd = new Date(aStart.getTime() + aDuration * 60000);
          return appointmentDateTime < aEnd && apptEnd > aStart;
        });
        return !hasConflict;
      });

      const pool = freePros.length > 0 ? freePros : candidatePros;
      if (pool.length > 0) {
        // Ordena por menor quantidade de agendamentos no dia (balanceamento de carga)
        pool.sort((a, b) => a.appointments.length - b.appointments.length);
        finalProfessionalId = pool[0].id;
      }
    }

    const autoConfirm = org.settings?.auto_confirm_appointments ?? true;
    const isMpPix = org.settings?.pix_payment_type === "MERCADO_PAGO" && !!org.settings?.mp_access_token;
    // Se exigir pré-pagamento com Mercado Pago, o status inicial fica PENDENTE_PAGAMENTO (ou SOLICITADO) até que o webhook aprove
    const initialStatus = isMpPix
      ? AppointmentStatus.SOLICITADO
      : (autoConfirm ? AppointmentStatus.CONFIRMADO : AppointmentStatus.SOLICITADO);

    const appointment = await tenantPrisma.appointment.create({
      data: {
        date_time: appointmentDateTime,
        observations: input.notes,
        status: initialStatus,
        client_id: client.id,
        service_id: service.id,
        package_id: null,
        organization_id: org.id,
        professional_id: finalProfessionalId,
        snapshot_service_name: service.name,
        snapshot_service_price: service.price,
        snapshot_service_duration: service.duration,
      },
    });

    let pixPaymentData: {
      paymentId?: string | number;
      qrCode?: string;
      qrCodeBase64?: string;
      ticketUrl?: string;
      expiresAt?: string;
    } | null = null;

    // Se a organização usar Mercado Pago para o sinal, gera a cobrança PIX imediata
    if (isMpPix) {
      try {
        const { MercadoPagoService } = await import("@/lib/server/services/payments/mercadopago.service");
        const depositAmount = Number(service.price) / 2;

        pixPaymentData = await MercadoPagoService.createPixPayment({
          organizationId: org.id,
          appointmentId: appointment.id,
          amount: depositAmount,
          description: `Sinal: ${service.name} - ${org.name || "Totten"}`,
          payer: {
            email: input.email || client.email || "cliente@totten.com.br",
            firstName: input.firstName || client.name,
            phone: input.phone,
          },
        });
      } catch (mpError: any) {
        console.error("[MERCADO_PAGO] Erro ao gerar PIX:", mpError);
        // Mesmo se houver erro ao gerar o PIX no MP, não quebramos a criação do agendamento,
        // apenas retornamos sem os dados dinâmicos do PIX
      }
    }

    revalidatePath("/admin/agenda");
    revalidatePath("/admin/auto/requests");

    // Return a plain object safely avoiding Prisma Decimal errors
    return {
      success: true,
      appointment: JSON.parse(JSON.stringify(appointment)),
      isPending: initialStatus === AppointmentStatus.SOLICITADO,
      pixPayment: pixPaymentData,
    };

  } catch (error) {
    console.error("Erro no autoagendamento:", error);
    return { success: false, error: "Falha ao criar o agendamento." };
  }
}

/**
 * Consulta se o agendamento foi aprovado/pago pelo cliente via Mercado Pago
 */
export async function checkClientAppointmentPaymentStatusAction(appointmentId: string) {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        status: true,
        mp_payment_status: true,
        has_charge: true,
      },
    });

    if (!appointment) {
      return { success: false, error: "Agendamento não encontrado." };
    }

    const isPaid = appointment.status === AppointmentStatus.CONFIRMADO ||
      appointment.mp_payment_status === "approved" ||
      appointment.has_charge;

    return {
      success: true,
      isPaid,
      status: appointment.status,
      mpStatus: appointment.mp_payment_status,
    };
  } catch (error) {
    console.error("Erro ao checar status do pagamento:", error);
    return { success: false, error: "Erro ao consultar status." };
  }
}


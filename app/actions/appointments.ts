// app/actions/appointments.ts
"use server";

import { prisma } from "@/lib/prisma";
import { Appointment, AppointmentStatus, PaymentMethod } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { generateRecurrentDates } from "@/lib/date-utils";
import { randomUUID } from "crypto";

// --- TIPOS ---
export type CreateAppointmentInput = {
  clientId: string;
  serviceId: string;
  dateTime: Date | string;
  observations?: string;
  packageId?: string;
  repeatCount?: number;
};

export type CreateAppointmentResult =
  | { success: true; appointments: Appointment[] }
  | { success: false; error: string };

// --- 1. CRIAR AGENDAMENTO (RECORRÊNCIA) ---
export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<CreateAppointmentResult> {
  try {
    const admin = await requireAuth();
    const {
      clientId,
      serviceId,
      dateTime,
      observations,
      packageId,
      repeatCount = 1,
    } = input;

    const firstDateTime =
      typeof dateTime === "string" ? new Date(dateTime) : dateTime;
    const totalSessionsToCreate = Math.max(1, repeatCount);
    const appointmentDates = generateRecurrentDates(
      firstDateTime,
      totalSessionsToCreate,
    );
    const recurrenceId = totalSessionsToCreate > 1 ? randomUUID() : null;

    let startSessionNumber = 0;

    if (packageId) {
      const pkg = await prisma.package.findUnique({ where: { id: packageId } });
      if (!pkg || pkg.organization_id !== admin.organizationId) {
        return { success: false, error: "Pacote não encontrado." };
      }

      // Bloqueia uso de pacotes arquivados na criação
      if (!pkg.active) {
        return {
          success: false,
          error:
            "Este pacote está arquivado e não pode receber novos agendamentos.",
        };
      }

      const sessionsAvailable = pkg.total_sessions - pkg.used_sessions;
      if (sessionsAvailable < totalSessionsToCreate) {
        return {
          success: false,
          error: `Saldo insuficiente. O pacote tem apenas ${sessionsAvailable} sessões disponíveis.`,
        };
      }
      startSessionNumber = pkg.used_sessions;
    }

    const appointments = await prisma.$transaction(async (tx) => {
      const created: Appointment[] = [];
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
            session_number: packageId ? startSessionNumber + i + 1 : null,
          },
        });
        created.push(appt);
      }
      return created;
    });

    revalidatePath("/admin/agenda");
    return { success: true, appointments };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao criar agendamento." };
  }
}

// --- 2. ATUALIZAR E GERAR DESPESA AUTOMÁTICA ---
export async function updateAppointment(
  id: string,
  data: {
    status: string;
    paymentMethod: string | null;
    observations: string;
    hasCharge: boolean;
  },
  updateAll: boolean = false,
  recurrenceId?: string | null,
) {
  try {
    const admin = await requireAuth();

    const statusMap: Record<string, AppointmentStatus> = {
      a_confirmar: AppointmentStatus.PENDENTE,
      confirmado: AppointmentStatus.CONFIRMADO,
      atrasou: AppointmentStatus.PENDENTE,
      nao_compareceu: AppointmentStatus.CANCELADO,
      cancelado: AppointmentStatus.CANCELADO,
      realizado: AppointmentStatus.REALIZADO,
    };

    const finalStatus = statusMap[data.status] || AppointmentStatus.PENDENTE;
    const finalPaymentMethod = data.paymentMethod
      ? (data.paymentMethod as PaymentMethod)
      : null;
    let finalHasCharge = data.hasCharge;

    if (
      finalStatus === AppointmentStatus.REALIZADO &&
      finalPaymentMethod !== null
    )
      finalHasCharge = false;
    if (finalStatus === AppointmentStatus.CANCELADO) finalHasCharge = false;

    // 🔥 BUSCA O AGENDAMENTO COM O SERVIÇO E SEUS INSUMOS (SE HOUVER)
    const currentAppt = await prisma.appointment.findUnique({
      where: { id, organization_id: admin.organizationId },
      include: {
        client: true,
        package: true,
        service: {
          include: {
            stock_items: {
              include: { stock_item: true },
            },
          },
        },
      },
    });

    if (!currentAppt)
      return { success: false, error: "Agendamento não encontrado." };

    const isMarkingAsDone =
      finalStatus === AppointmentStatus.REALIZADO &&
      currentAppt.status !== AppointmentStatus.REALIZADO;

    // 🔥 Travas de Segurança do Pacote
    if (isMarkingAsDone && currentAppt.package) {
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

    // 🔥 A GRANDE TRANSAÇÃO
    await prisma.$transaction(async (tx) => {
      // Lógica de Atualização em Lote ou Individual
      if (updateAll && recurrenceId) {
        await tx.appointment.updateMany({
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

        if (isMarkingAsDone && currentAppt.package_id) {
          const updateResult = await tx.appointment.count({
            where: {
              recurrence_id: recurrenceId,
              organization_id: admin.organizationId,
              status: finalStatus,
            },
          });
          await tx.package.update({
            where: { id: currentAppt.package_id },
            data: { used_sessions: { increment: updateResult } },
          });
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

        if (isMarkingAsDone && currentAppt.package_id) {
          await tx.package.update({
            where: { id: currentAppt.package_id },
            data: { used_sessions: { increment: 1 } },
          });
        }
      }

      // 🔥 --- O CORAÇÃO DO SISTEMA FINANCEIRO E DE ESTOQUE --- 🔥

      const service = currentAppt.service;

      // 1. GERAR RECEITA (Desacoplado da mudança de status)
      // Se está realizado, não é pacote, tem método de pagamento...
      const requiresRevenue =
        finalStatus === AppointmentStatus.REALIZADO &&
        !currentAppt.package_id &&
        finalPaymentMethod !== null;

      if (requiresRevenue) {
        // Verifica se já não foi gerada uma receita antes (ex: se a recepção só estiver editando a observação)
        const existingRevenue = await tx.transaction.findFirst({
          where: { appointment_id: currentAppt.id, type: "RECEITA" },
        });

        if (!existingRevenue) {
          await tx.transaction.create({
            data: {
              type: "RECEITA",
              description: `Serviço Realizado: ${service.name} (${currentAppt.client.name})`,
              amount: service.price,
              date: new Date(),
              status: "PAGO",
              organization_id: admin.organizationId,
              appointment_id: currentAppt.id,
            },
          });
        }
      }

      // 2. GERAR DESPESA E BAIXAR ESTOQUE (Matriz de Decisão)
      // Isso continua amarrado ao `isMarkingAsDone` para NUNCA baixar o estoque 2x
      if (isMarkingAsDone) {
        if (service.track_stock && service.stock_items.length > 0) {
          // FLUXO A e B: A Cliente Organizada / Híbrida (Tem Estoque)

          for (const item of service.stock_items) {
            const stockData = item.stock_item;
            const usedQty = item.quantity_used;

            // a) Baixa a quantidade física da prateleira (Sempre)
            await tx.stockItem.update({
              where: { id: stockData.id },
              data: { quantity: { decrement: usedQty } },
            });

            // b) Regra de Caixa: Só gera despesa se NÃO marcou "Lançar como Despesa" na compra
            if (!stockData.was_expensed) {
              const costOfUsedQty =
                Number(usedQty) * Number(stockData.unit_cost);

              if (costOfUsedQty > 0) {
                await tx.transaction.create({
                  data: {
                    type: "DESPESA",
                    description: `Custo de Insumo (Sessão): ${stockData.name}`,
                    amount: costOfUsedQty,
                    date: new Date(),
                    status: "PAGO",
                    organization_id: admin.organizationId,
                    appointment_id: currentAppt.id,
                  },
                });
              }
            }
          }
        } else if (
          !service.track_stock &&
          service.material_cost &&
          Number(service.material_cost) > 0
        ) {
          // FLUXO C: A Cliente Preguiçosa (O Chute Manual)

          await tx.transaction.create({
            data: {
              type: "DESPESA",
              description: `Custo Fixo de Material: ${service.name}`,
              amount: service.material_cost,
              date: new Date(),
              status: "PAGO",
              organization_id: admin.organizationId,
              appointment_id: currentAppt.id,
            },
          });
        }
      }
    }); // Fim da transaction

    revalidatePath("/admin/agenda");
    revalidatePath("/admin/packages");
    revalidatePath("/admin/stock");
    revalidatePath("/admin/finance/dashboard");

    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao atualizar agendamento." };
  }
}

// --- 3. DELETAR (INDIVIDUAL OU SÉRIE) ---
export async function deleteAppointment(
  id: string,
  deleteAll: boolean = false,
  recurrenceId?: string | null,
) {
  try {
    const admin = await requireAuth();

    if (deleteAll && recurrenceId) {
      await prisma.appointment.deleteMany({
        where: {
          recurrence_id: recurrenceId,
          organization_id: admin.organizationId,
        },
      });
    } else {
      await prisma.appointment.delete({
        where: { id, organization_id: admin.organizationId },
      });
    }

    revalidatePath("/admin/agenda");
    revalidatePath("/admin/finance/dashboard");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao excluir." };
  }
}

// --- 4. DRAG AND DROP ---
export async function updateAppointmentDateTime(
  id: string,
  newDateIso: string,
) {
  try {
    const admin = await requireAuth();
    await prisma.appointment.update({
      where: { id, organization_id: admin.organizationId },
      data: { date_time: new Date(newDateIso) },
    });
    revalidatePath("/admin/agenda");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Falha ao reagendar." };
  }
}

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

// --- 2. ATUALIZAR (INDIVIDUAL OU SÉRIE) ---
export async function updateAppointment(
  id: string,
  data: {
    status: string;
    paymentMethod: string;
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

    const paymentMap: Record<string, PaymentMethod> = {
      pix: PaymentMethod.PIX,
      dinheiro: PaymentMethod.DINHEIRO,
      cartao_credito: PaymentMethod.CARTAO_CREDITO,
      cartao_debito: PaymentMethod.CARTAO_DEBITO,
      transferencia: PaymentMethod.OUTRO,
    };

    const finalStatus = statusMap[data.status] || AppointmentStatus.PENDENTE;
    const finalPaymentMethod =
      data.paymentMethod === "nenhum"
        ? null
        : paymentMap[data.paymentMethod] || null;
    let finalHasCharge = data.hasCharge;

    if (
      finalStatus === AppointmentStatus.REALIZADO &&
      finalPaymentMethod !== null
    )
      finalHasCharge = false;
    if (finalStatus === AppointmentStatus.CANCELADO) finalHasCharge = false;

    const currentAppt = await prisma.appointment.findUnique({
      where: { id, organization_id: admin.organizationId },
      select: { package_id: true, status: true },
    });

    if (!currentAppt)
      return { success: false, error: "Agendamento não encontrado." };

    const isMarkingAsDone =
      finalStatus === AppointmentStatus.REALIZADO &&
      currentAppt.status !== AppointmentStatus.REALIZADO;

    await prisma.$transaction(async (tx) => {
      if (updateAll && recurrenceId) {
        // 1. Atualiza a série
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
            observations: data.observations, // ✅ Adicionado
          },
        });

        // 2. Se marcar a série como realizada, desconta o número exato de afetados
        if (isMarkingAsDone && currentAppt.package_id) {
          await tx.package.update({
            where: { id: currentAppt.package_id },
            data: { used_sessions: { increment: updateResult.count } }, // ✅ Desconto dinâmico
          });
        }
      } else {
        // Atualização individual (Mantida)
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
    });

    revalidatePath("/admin/agenda");
    revalidatePath("/admin/packages");
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

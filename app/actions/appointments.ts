// app/actions/appointments.ts
"use server";

import { prisma } from "@/lib/prisma";
import { Appointment, AppointmentStatus, PaymentMethod } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Tipos já existentes
export type CreateAppointmentInput = {
  clientId: string;
  serviceId: string;
  dateTime: Date | string;
  observations?: string;
  packageId?: string;
};

export type CreateAppointmentResult =
  | { success: true; appointments: Appointment[] }
  | { success: false; error: string };

// --- Ação de Criar (Mantida) ---
export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<CreateAppointmentResult> {
  try {
    const admin = await requireAuth();
    const { clientId, serviceId, dateTime, observations, packageId } = input;
    const firstDateTime =
      typeof dateTime === "string" ? new Date(dateTime) : dateTime;

    if (!packageId) {
      const appointment = await prisma.appointment.create({
        data: {
          date_time: firstDateTime,
          observations,
          client_id: clientId,
          service_id: serviceId,
          organization_id: admin.organizationId,
        },
      });
      revalidatePath("/admin/agenda");
      return { success: true, appointments: [appointment] };
    }

    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
    });

    if (!pkg || pkg.organization_id !== admin.organizationId) {
      return { success: false, error: "Pacote não encontrado." };
    }

    const sessionsToSchedule = pkg.total_sessions - pkg.used_sessions;
    if (sessionsToSchedule <= 0) {
      return { success: false, error: "Saldo de sessões insuficiente." };
    }

    const appointments = await prisma.$transaction(async (tx) => {
      const created: Appointment[] = [];
      for (let i = 0; i < sessionsToSchedule; i++) {
        const sessionDate = new Date(firstDateTime);
        sessionDate.setDate(sessionDate.getDate() + i * 7);
        const appt = await tx.appointment.create({
          data: {
            date_time: sessionDate,
            observations,
            client_id: clientId,
            service_id: serviceId,
            package_id: packageId,
            organization_id: admin.organizationId,
            session_number: pkg.used_sessions + i + 1,
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

// --- NOVO: Ação de Atualizar (Para o Modal de Detalhes) ---
export async function updateAppointment(
  id: string,
  data: {
    status: string;
    paymentMethod: string;
    observations: string;
    hasCharge: boolean;
  },
) {
  try {
    const admin = await requireAuth();

    // Mapeamento do Status do Modal para o Prisma Enum
    const statusMap: Record<string, AppointmentStatus> = {
      a_confirmar: AppointmentStatus.PENDENTE,
      confirmado: AppointmentStatus.CONFIRMADO,
      atrasou: AppointmentStatus.PENDENTE,
      não_comparecimento: AppointmentStatus.CANCELADO,
      cancelado: AppointmentStatus.CANCELADO,
      realizado: AppointmentStatus.REALIZADO,
    };

    // Mapeamento do Pagamento do Modal para o Prisma Enum
    const paymentMap: Record<string, PaymentMethod> = {
      pix: PaymentMethod.PIX,
      dinheiro: PaymentMethod.DINHEIRO,
      cartao_credito: PaymentMethod.CARTAO_CREDITO,
      cartao_debito: PaymentMethod.CARTAO_DEBITO,
      transferencia: PaymentMethod.OUTRO,
      nenhum: PaymentMethod.OUTRO,
    };

    await prisma.appointment.update({
      where: {
        id,
        organization_id: admin.organizationId, // Segurança
      },
      data: {
        status: statusMap[data.status] || AppointmentStatus.PENDENTE,
        payment_method:
          data.paymentMethod === "nenhum"
            ? null
            : paymentMap[data.paymentMethod] || null,
        observations: data.observations,
        has_charge: data.hasCharge,
      },
    });

    revalidatePath("/admin/agenda");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao salvar alterações." };
  }
}

// --- NOVO: Ação de Deletar (Lixeira) ---
export async function deleteAppointment(id: string) {
  try {
    const admin = await requireAuth();
    await prisma.appointment.delete({
      where: {
        id,
        organization_id: admin.organizationId,
      },
    });

    revalidatePath("/admin/agenda");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao excluir agendamento." };
  }
}

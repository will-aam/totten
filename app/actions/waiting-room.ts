"use server";

import { prisma as db } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createAppointment } from "./appointments";

export async function getWaitingRoomData() {
  try {
    const admin = await requireAuth();
    const organizationId = admin.organizationId;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const checkIns = await db.checkIn.findMany({
      where: {
        organization_id: organizationId,
        date_time: { gte: startOfToday },
        deleted_at: null,
        completed_at: null,
      },
      include: {
        client: true,
        appointment: {
          include: {
            service: true,
            professional: { select: { display_name: true } },
          },
        },
      },
      orderBy: { date_time: "asc" },
    });

    const mapped = checkIns.map((ci) => ({
      id: ci.id,
      date_time: ci.date_time.toISOString(),
      clientName: ci.client?.name || "Desconhecido",
      clientPhone: ci.client?.phone_whatsapp || "",
      serviceName: ci.appointment?.service?.name || "Sem Serviço",
      professionalName: ci.appointment?.professional?.display_name || "Livre",
      appointmentTime: ci.appointment?.date_time ? ci.appointment.date_time.toISOString() : null,
    }));

    return { success: true, data: mapped };
  } catch (error: any) {
    console.error("Erro ao buscar sala de espera:", error);
    return { success: false, error: error.message };
  }
}

export async function completeCheckIn(checkInId: string) {
  try {
    const admin = await requireAuth();
    const organizationId = admin.organizationId;

    await db.checkIn.update({
      where: {
        id: checkInId,
        organization_id: organizationId,
      },
      data: {
        completed_at: new Date(),
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Erro ao finalizar check-in:", error);
    return { success: false, error: error.message };
  }
}

export async function createManualCheckIn(data: {
  clientId: string;
  serviceId: string;
  professionalId: string;
  packageId?: string;
}) {
  try {
    const admin = await requireAuth();
    const organizationId = admin.organizationId;

    // 1. Criar agendamento instantâneo com data atual
    const now = new Date();
    
    // Vacina para fuso: precisamos alinhar a criação para que passe nas validações
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hourStr = String(now.getHours()).padStart(2, "0");
    const minuteStr = String(now.getMinutes()).padStart(2, "0");
    const dateTimeString = `${year}-${month}-${day}T${hourStr}:${minuteStr}:00.000-03:00`;

    const apptResult = await createAppointment({
      clientId: data.clientId,
      serviceId: data.serviceId,
      dateTime: dateTimeString,
      professionalId: data.professionalId,
      packageId: data.packageId,
    });

    if (!apptResult.success) {
      throw new Error(apptResult.error || "Erro ao criar agendamento de encaixe.");
    }

    if (!apptResult.appointments || apptResult.appointments.length === 0) {
      throw new Error("Agendamento não foi criado corretamente.");
    }

    const newAppointmentId = apptResult.appointments[0].id;

    // 2. Mudar status para CONFIRMADO (se já não estiver)
    await db.appointment.update({
      where: { id: newAppointmentId },
      data: { status: "CONFIRMADO" }
    });

    // 3. Gerar o Check-in
    const checkIn = await db.checkIn.create({
      data: {
        appointment_id: newAppointmentId,
        client_id: data.clientId,
        organization_id: organizationId,
      }
    });

    return { success: true, data: checkIn };
  } catch (error: any) {
    console.error("Erro no check-in manual:", error);
    return { success: false, error: error.message };
  }
}

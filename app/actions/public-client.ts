"use server";

import { prisma } from "@/lib/prisma";
import { TotemService } from "@/lib/server/services/totem/totem.service";

export async function getClientHistoryByPhone(slug: string, phone: string) {
  try {
    const valorLimpo = phone.replace(/\D/g, "");
    
    const org = await prisma.organization.findUnique({
      where: { slug }
    });

    if (!org) {
      return { success: false, error: "Organização não encontrada" };
    }

    let phoneFormatado = phone;
    if (valorLimpo.length === 11) {
      phoneFormatado = `(${valorLimpo.slice(0, 2)}) ${valorLimpo.slice(2, 7)}-${valorLimpo.slice(7)}`;
    } else if (valorLimpo.length === 10) {
      phoneFormatado = `(${valorLimpo.slice(0, 2)}) ${valorLimpo.slice(2, 6)}-${valorLimpo.slice(6)}`;
    }

    const phoneCandidates = Array.from(
      new Set([
        phone.trim(),
        valorLimpo,
        phoneFormatado,
        `+55${valorLimpo}`,
        `+55 ${phoneFormatado}`,
      ]),
    );

    const client = await prisma.client.findFirst({
      where: {
        organization_id: org.id,
        phone_whatsapp: { in: phoneCandidates }
      }
    });

    if (!client) {
      return { success: false, error: "Cliente não encontrado" };
    }

    const history = await TotemService.getClientHistory(client.id, slug);
    return { success: true, data: history, clientName: client.name };
  } catch (error: any) {
    console.error("Erro ao buscar histórico público:", error);
    return { success: false, error: "Erro ao buscar histórico" };
  }
}

export async function getClientHistoryById(slug: string, clientId: string) {
  try {
    const org = await prisma.organization.findUnique({
      where: { slug }
    });

    if (!org) {
      return { success: false, error: "Organização não encontrada" };
    }

    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        organization_id: org.id
      }
    });

    if (!client) {
      return { success: false, error: "Cliente não encontrado" };
    }

    const history = await TotemService.getClientHistory(client.id, slug);
    return { success: true, data: history, clientName: client.name };
  } catch (error: any) {
    console.error("Erro ao buscar histórico por id:", error);
    return { success: false, error: "Erro ao buscar histórico" };
  }
}

export async function getClientDashboardData(slug: string, clientId: string) {
  try {
    const org = await prisma.organization.findUnique({
      where: { slug },
      include: { settings: true }
    });

    if (!org) {
      return { success: false, error: "Organização não encontrada" };
    }

    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        organization_id: org.id
      },
      include: {
        appointments: {
          include: {
            service: { select: { name: true } },
            professional: { select: { display_name: true } },
            package: { select: { name: true } }
          },
          orderBy: { date_time: "asc" }
        },
        packages: {
          include: {
            appointments: {
              include: {
                service: { select: { name: true } },
                professional: { select: { display_name: true } }
              },
              orderBy: { date_time: "asc" }
            }
          },
          orderBy: { created_at: "desc" }
        }
      }
    });

    if (!client) {
      return { success: false, error: "Cliente não encontrado" };
    }

    const now = new Date();
    
    // Todos os appointments soltos
    const standaloneAppointments = client.appointments.filter((a: any) => !a.package_id);
    // Appointments dentro dos pacotes
    const packageAppointments = client.packages.flatMap((pkg: any) => 
      pkg.appointments.map((a: any) => ({ ...a, package: { name: pkg.name } }))
    );

    const allAppointments = [...standaloneAppointments, ...packageAppointments];

    // Upcoming: date >= now AND status NOT IN (REALIZADO, CANCELADO)
    const upcoming = allAppointments.filter((app: any) => {
      const isFuture = new Date(app.date_time) >= now;
      const isNotDone = app.status !== "REALIZADO" && app.status !== "CANCELADO";
      return isFuture && isNotDone;
    }).sort((a: any, b: any) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());

    // Histórico: pacotes
    const historyPackages = client.packages;
    // Histórico: agendamentos soltos (que já passaram ou foram cancelados/realizados)
    const historyStandalone = standaloneAppointments.filter((app: any) => {
      const isPast = new Date(app.date_time) < now;
      const isDone = app.status === "REALIZADO" || app.status === "CANCELADO";
      return isPast || isDone;
    }).sort((a: any, b: any) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime());

    // Config do whatsapp
    let clinicPhone = null;
    const orgSettings = Array.isArray(org.settings) ? org.settings[0] : org.settings;
    if (orgSettings) {
      clinicPhone = orgSettings.phone_whatsapp || orgSettings.phone_landline || null;
    }

    const payload = { 
      success: true, 
      client: {
        id: client.id,
        name: client.name,
        cpf: client.cpf,
        phone: client.phone_whatsapp,
      },
      upcoming, 
      historyPackages,
      historyStandalone,
      clinicName: org.name,
      clinicPhone
    };

    return JSON.parse(JSON.stringify(payload));
  } catch (error: any) {
    console.error("Erro ao buscar dashboard do cliente:", error);
    return { success: false, error: "Erro ao buscar dashboard" };
  }
}

export async function cancelPendingAppointment(slug: string, clientId: string, appointmentId: string) {
  try {
    const org = await prisma.organization.findUnique({
      where: { slug },
    });

    if (!org) {
      return { success: false, error: "Organização não encontrada" };
    }

    const appt = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        client_id: clientId,
        organization_id: org.id
      }
    });

    if (!appt) {
      return { success: false, error: "Agendamento não encontrado" };
    }

    if (appt.status !== "PENDENTE") {
      return { success: false, error: "Este agendamento já foi confirmado ou realizado e não pode ser cancelado por aqui." };
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "CANCELADO" }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Erro ao cancelar agendamento:", error);
    return { success: false, error: "Erro ao cancelar agendamento" };
  }
}

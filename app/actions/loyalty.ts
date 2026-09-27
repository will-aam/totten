"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getLoyaltySettings(organizationId: string) {
  try {
    let settings = await prisma.loyaltySettings.findUnique({
      where: { organization_id: organizationId },
      include: { rewards: true },
    });

    if (!settings) {
      settings = await prisma.loyaltySettings.create({
        data: {
          organization_id: organizationId,
          scope: "specific",
          max_points: 500,
          check_in_active: true,
          check_in_points: 10,
          schedule_active: true,
          schedule_points: 5,
          is_active: false,
        },
        include: { rewards: true },
      });

      // Criar recompensa padrão
      const defaultReward = await prisma.loyaltyReward.create({
        data: {
          settings_id: settings.id,
          title: "Desconto de 10% no pacote",
          points_cost: 100,
        },
      });

      settings.rewards = [defaultReward];
    }

    return { success: true, settings };
  } catch (error) {
    console.error("Erro ao buscar configurações de fidelidade:", error);
    return { success: false, error: "Erro ao buscar configurações" };
  }
}

export async function updateLoyaltySettings(
  organizationId: string,
  data: {
    is_active?: boolean;
    scope?: string;
    max_points?: number;
    points_per_checkin?: number;
    points_per_appointment?: number;
    rewards?: { title: string; points_cost: number; conditions?: string }[];
  }
) {
  try {
    const { rewards, points_per_checkin, points_per_appointment, ...otherData } = data;
    
    const mappedData: any = { ...otherData };
    if (points_per_checkin !== undefined) {
      mappedData.check_in_points = points_per_checkin;
      mappedData.check_in_active = points_per_checkin > 0;
    }
    if (points_per_appointment !== undefined) {
      mappedData.schedule_points = points_per_appointment;
      mappedData.schedule_active = points_per_appointment > 0;
    }

    const settings = await prisma.loyaltySettings.update({
      where: { organization_id: organizationId },
      data: mappedData,
    });

    if (rewards) {
      await prisma.loyaltyReward.deleteMany({
        where: { settings_id: settings.id }
      });
      
      if (rewards.length > 0) {
        await prisma.loyaltyReward.createMany({
          data: rewards.map(r => ({
            settings_id: settings.id,
            title: r.title,
            points_cost: r.points_cost,
            conditions: r.conditions
          }))
        });
      }
    }

    revalidatePath("/(private)/admin/loyalty", "page");
    return { success: true, settings };
  } catch (error) {
    console.error("Erro ao atualizar configurações de fidelidade:", error);
    return { success: false, error: "Erro ao atualizar configurações" };
  }
}

export async function saveLoyaltyReward(settingsId: string, data: { id?: string; title: string; points_cost: number; conditions?: string }) {
  try {
    if (data.id && typeof data.id === "string" && data.id.startsWith("cuid")) {
      // Editar
      const reward = await prisma.loyaltyReward.update({
        where: { id: data.id },
        data: {
          title: data.title,
          points_cost: data.points_cost,
          conditions: data.conditions,
        },
      });
      return { success: true, reward };
    } else {
      // Criar (ignoramos o ID mockado via Date.now() se houver)
      const reward = await prisma.loyaltyReward.create({
        data: {
          settings_id: settingsId,
          title: data.title,
          points_cost: data.points_cost,
          conditions: data.conditions,
        },
      });
      return { success: true, reward };
    }
  } catch (error) {
    console.error("Erro ao salvar recompensa:", error);
    return { success: false, error: "Erro ao salvar recompensa" };
  }
}

export async function calculateClientPoints(
  clientId: string,
  enrolledAt: Date | null,
  settings: any
) {
  if (!settings || !settings.is_active) return 0;
  
  const enrolled = settings.scope === "global" || enrolledAt !== null;
  if (!enrolled) return 0;

  const startDate = enrolledAt || new Date(0);

  let checkInPoints = 0;
  if (settings.check_in_active && settings.check_in_points > 0) {
    const checkInsCount = await prisma.checkIn.count({
      where: {
        client_id: clientId,
        date_time: { gte: startDate },
        deleted_at: null,
      }
    });
    checkInPoints = checkInsCount * settings.check_in_points;
  }

  let schedulePoints = 0;
  if (settings.schedule_active && settings.schedule_points > 0) {
    const appointmentsCount = await prisma.appointment.count({
      where: {
        client_id: clientId,
        date_time: { gte: startDate },
        status: { in: ["REALIZADO", "CONFIRMADO"] },
      }
    });
    schedulePoints = appointmentsCount * settings.schedule_points;
  }

  return Math.min(checkInPoints + schedulePoints, settings.max_points);
}

export async function getClientLoyaltyInfo(clientId: string) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        loyalty_points: true,
        loyalty_enrolled_at: true,
        organization: {
          select: {
            loyalty_settings: {
              include: {
                rewards: {
                  orderBy: { points_cost: 'asc' }
                }
              }
            }
          }
        }
      }
    });

    if (!client || !client.organization.loyalty_settings) {
      return { success: true, enrolled: false, active: false, points: 0, rewards: [] };
    }

    const settings = client.organization.loyalty_settings;
    if (!settings.is_active) {
      return { success: true, enrolled: false, active: false, points: 0, rewards: [] };
    }

    const enrolled = settings.scope === "global" || client.loyalty_enrolled_at !== null;
    const dynamicPoints = await calculateClientPoints(clientId, client.loyalty_enrolled_at, settings);

    // Opcionalmente atualizar o cache no banco (sincronização)
    if (dynamicPoints !== client.loyalty_points) {
      await prisma.client.update({
        where: { id: clientId },
        data: { loyalty_points: dynamicPoints }
      });
    }

    return {
      success: true,
      active: true,
      enrolled,
      points: dynamicPoints,
      rewards: settings.rewards,
      maxPoints: settings.max_points
    };
  } catch (error) {
    console.error("Erro ao buscar informações de fidelidade do cliente:", error);
    return { success: false, error: "Erro ao buscar informações" };
  }
}

export async function enrollClientInLoyalty(clientId: string, enroll: boolean) {
  try {
    await prisma.client.update({
      where: { id: clientId },
      data: { loyalty_enrolled_at: enroll ? new Date() : null }
    });
    revalidatePath("/(private)/admin/loyalty", "page");
    return { success: true };
  } catch (error) {
    console.error("Erro ao alterar matricula do cliente:", error);
    return { success: false, error: "Erro ao alterar matrícula do cliente" };
  }
}

export async function getClientLoyaltyHistory(clientId: string) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        loyalty_enrolled_at: true,
        organization: {
          select: {
            loyalty_settings: true
          }
        }
      }
    });

    if (!client || !client.organization.loyalty_settings) {
      return { success: false, error: "Cliente ou configurações não encontradas." };
    }

    const settings = client.organization.loyalty_settings;
    if (!settings.is_active) {
      return { success: false, error: "Programa de fidelidade inativo." };
    }

    const enrolled = settings.scope === "global" || client.loyalty_enrolled_at !== null;
    if (!enrolled) {
      return { success: true, history: [] };
    }

    const startDate = client.loyalty_enrolled_at || new Date(0);
    const history = [];

    // Busca check-ins
    if (settings.check_in_active && settings.check_in_points > 0) {
      const checkIns = await prisma.checkIn.findMany({
        where: {
          client_id: client.id,
          date_time: { gte: startDate },
          deleted_at: null,
        },
        orderBy: { date_time: 'desc' }
      });

      history.push(...checkIns.map(c => ({
        id: c.id,
        type: 'check-in',
        date: c.date_time,
        points: settings.check_in_points,
        description: 'Check-in realizado'
      })));
    }

    // Busca agendamentos
    if (settings.schedule_active && settings.schedule_points > 0) {
      const appointments = await prisma.appointment.findMany({
        where: {
          client_id: client.id,
          date_time: { gte: startDate },
          status: { in: ["REALIZADO", "CONFIRMADO"] },
        },
        include: {
          service: { select: { name: true } }
        },
        orderBy: { date_time: 'desc' }
      });

      history.push(...appointments.map(a => ({
        id: a.id,
        type: 'appointment',
        date: a.date_time,
        points: settings.schedule_points,
        description: `Agendamento: ${a.service.name}`
      })));
    }

    // Ordena por data (mais recente primeiro)
    history.sort((a, b) => b.date.getTime() - a.date.getTime());

    return { success: true, history };
  } catch (error) {
    console.error("Erro ao buscar histórico do cliente:", error);
    return { success: false, error: "Erro ao buscar histórico." };
  }
}

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

    return {
      success: true,
      active: true,
      enrolled,
      points: client.loyalty_points,
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

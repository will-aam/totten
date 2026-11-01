"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";

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

export async function getPaginatedLoyaltyClients({
  page = 1,
  limit = 8,
  search = "",
  scope = "specific",
}: {
  page?: number;
  limit?: number;
  search?: string;
  scope?: "global" | "specific";
} = {}) {
  try {
    const admin = await requireAuth();
    const organizationId = admin.organizationId;

    // Atualiza vouchers vencidos em background
    expireOverdueVouchers(organizationId).catch((err) =>
      console.error("[getPaginatedLoyaltyClients] Erro ao expirar vouchers:", err)
    );

    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, Math.min(100, limit));
    const skip = (safePage - 1) * safeLimit;

    const where: any = {
      organization_id: organizationId,
    };

    if (scope === "specific") {
      where.loyalty_enrolled_at = { not: null };
    }

    if (search && search.trim()) {
      where.name = {
        contains: search.trim(),
        mode: "insensitive",
      };
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        select: {
          id: true,
          name: true,
          loyalty_points: true,
          loyalty_enrolled_at: true,
          check_ins: {
            orderBy: { date_time: "desc" },
            take: 1,
            select: { date_time: true },
          },
        },
        orderBy: [{ loyalty_points: "desc" }, { name: "asc" }],
        skip,
        take: safeLimit,
      }),
      prisma.client.count({ where }),
    ]);

    const formattedClients = clients.map((c) => ({
      id: c.id,
      name: c.name,
      points: c.loyalty_points,
      tier: c.loyalty_points >= 500 ? "Ouro" : c.loyalty_points >= 200 ? "Prata" : "Bronze",
      lastCheckIn: c.check_ins[0]
        ? new Date(c.check_ins[0].date_time).toLocaleDateString("pt-BR")
        : "Nunca",
      enrolledAt: c.loyalty_enrolled_at,
    }));

    return {
      success: true,
      clients: formattedClients,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      page: safePage,
    };
  } catch (error) {
    console.error("Erro ao buscar clientes da fidelidade:", error);
    return {
      success: false,
      error: "Erro ao buscar clientes da fidelidade",
      clients: [],
      total: 0,
      totalPages: 1,
      page: 1,
    };
  }
}

export async function getUnenrolledClients(search = "", limit = 20) {
  try {
    const admin = await requireAuth();

    const where: any = {
      organization_id: admin.organizationId,
      loyalty_enrolled_at: null,
    };

    if (search && search.trim()) {
      where.name = {
        contains: search.trim(),
        mode: "insensitive",
      };
    }

    const clients = await prisma.client.findMany({
      where,
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
      take: Math.min(50, limit),
    });

    return { success: true, clients };
  } catch (error) {
    console.error("Erro ao buscar clientes não matriculados:", error);
    return { success: false, error: "Erro ao buscar clientes não cadastrados", clients: [] };
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
    rewards?: {
      id?: string | number;
      title: string;
      points_cost: number;
      conditions?: string;
      validity_days?: number | null;
    }[];
  }
) {
  try {
    const { rewards, points_per_checkin, points_per_appointment, ...otherData } = data;
    
    const mappedData: any = { ...otherData };
    if (data.is_active !== undefined) {
      mappedData.is_active = data.is_active;
      if (data.is_active) {
        const current = await prisma.loyaltySettings.findUnique({
          where: { organization_id: organizationId },
          select: { activated_at: true },
        });
        if (!current?.activated_at) {
          mappedData.activated_at = new Date();
        }
      }
    }
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

    if (rewards !== undefined) {
      const existingRewards = await prisma.loyaltyReward.findMany({
        where: { settings_id: settings.id },
      });
      const existingRewardMap = new Map(existingRewards.map(r => [r.id, r]));

      const keepRewardIds = new Set<string>();

      for (const r of rewards) {
        if (!r.title?.trim() || r.points_cost <= 0) continue;
        const rewardId = typeof r.id === "string" ? r.id : undefined;
        const validityDays = r.validity_days !== undefined ? r.validity_days : 30;

        if (rewardId && existingRewardMap.has(rewardId)) {
          // Atualiza recompensa existente mantendo o ID e sem deletar vouchers
          await prisma.loyaltyReward.update({
            where: { id: rewardId },
            data: {
              title: r.title,
              points_cost: r.points_cost,
              conditions: r.conditions,
              validity_days: validityDays,
            },
          });
          keepRewardIds.add(rewardId);
        } else {
          // Cria nova recompensa
          const created = await prisma.loyaltyReward.create({
            data: {
              settings_id: settings.id,
              title: r.title,
              points_cost: r.points_cost,
              conditions: r.conditions,
              validity_days: validityDays,
            },
          });
          keepRewardIds.add(created.id);
        }
      }

      // Recompensas excluídas pelo usuário
      const rewardsToDelete = existingRewards.filter(r => !keepRewardIds.has(r.id));
      if (rewardsToDelete.length > 0) {
        const deleteIds = rewardsToDelete.map(r => r.id);

        // Desvincula os vouchers existentes antes de deletar a recompensa,
        // garantindo que NENHUM voucher ou histórico do cliente seja perdido!
        await prisma.clientVoucher.updateMany({
          where: { reward_id: { in: deleteIds } },
          data: { reward_id: null },
        });

        await prisma.loyaltyReward.deleteMany({
          where: { id: { in: deleteIds } },
        });
      }
    }

    const updatedSettings = await prisma.loyaltySettings.findUnique({
      where: { organization_id: organizationId },
      include: {
        rewards: {
          orderBy: { points_cost: "asc" },
        },
      },
    });

    revalidatePath("/(private)/admin/loyalty", "page");
    return { success: true, settings: updatedSettings };
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

  // Pontos não são retroativos: o saldo real é o acumulado transacionalmente em client.loyalty_points
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { loyalty_points: true }
  });

  return Math.min(Math.max(0, client?.loyalty_points || 0), settings.max_points);
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
    if (!enrolled) {
      return { success: true, enrolled: false, active: true, points: 0, rewards: settings.rewards };
    }

    // Saldo real e não retroativo do cliente
    const currentPoints = Math.min(Math.max(0, client.loyalty_points || 0), settings.max_points);

    // Busca todos os vouchers do cliente para a carteira
    const vouchers = await prisma.clientVoucher.findMany({
      where: { client_id: clientId },
      orderBy: { created_at: "desc" }
    });

    return {
      success: true,
      active: true,
      enrolled,
      points: currentPoints,
      rewards: settings.rewards,
      maxPoints: settings.max_points,
      vouchers
    };
  } catch (error) {
    console.error("Erro ao buscar informações de fidelidade do cliente:", error);
    return { success: false, error: "Erro ao buscar informações" };
  }
}

export async function redeemLoyaltyReward(clientId: string, rewardId: string) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        organization_id: true,
        loyalty_points: true,
        loyalty_enrolled_at: true,
        organization: {
          select: {
            id: true,
            loyalty_settings: {
              include: {
                rewards: true
              }
            }
          }
        }
      }
    });

    if (!client || !client.organization.loyalty_settings) {
      return { success: false, error: "Cliente ou programa de fidelidade não encontrado." };
    }

    const settings = client.organization.loyalty_settings;
    if (!settings.is_active) {
      return { success: false, error: "O programa de fidelidade está inativo no momento." };
    }

    const enrolled = settings.scope === "global" || client.loyalty_enrolled_at !== null;
    if (!enrolled) {
      return { success: false, error: "Cliente não está cadastrado no programa de fidelidade." };
    }

    const reward = settings.rewards.find((r) => r.id === rewardId);
    if (!reward) {
      return { success: false, error: "Recompensa não encontrada." };
    }

    if (reward.points_cost <= 0) {
      return { success: false, error: "Custo de pontuação da recompensa inválido." };
    }

    let expiresAt: Date | null = null;
    if (reward.validity_days && reward.validity_days > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + reward.validity_days);
    }

    // Executa transação atômica com validação a nível de banco
    const transactionResult = await prisma.$transaction(async (tx) => {
      // 1. Decremento atômico condicional: bloqueia a linha e só debita se o saldo for suficiente
      const updateResult = await tx.client.updateMany({
        where: {
          id: clientId,
          loyalty_points: { gte: reward.points_cost },
        },
        data: {
          loyalty_points: { decrement: reward.points_cost },
        },
      });

      if (updateResult.count === 0) {
        throw new Error("SALDO_INSUFICIENTE");
      }

      // 2. Busca o saldo resultante real após o decremento atômico
      const updatedClient = await tx.client.findUnique({
        where: { id: clientId },
        select: { loyalty_points: true },
      });

      // 3. Emite o voucher de resgate
      const createdVoucher = await tx.clientVoucher.create({
        data: {
          client_id: clientId,
          reward_id: reward.id,
          points_spent: reward.points_cost,
          title: reward.title,
          expires_at: expiresAt,
          status: "DISPONIVEL",
        },
      });

      // 4. Registra no Ledger Imutável (Livro-Razão)
      await tx.loyaltyTransaction.create({
        data: {
          organization_id: client.organization_id,
          client_id: clientId,
          type: "REWARD_REDEEM",
          points: -reward.points_cost,
          balance_after: updatedClient?.loyalty_points ?? 0,
          description: `Resgate de Recompensa: ${reward.title}`,
          voucher_id: createdVoucher.id,
        },
      });

      return {
        voucher: createdVoucher,
        newPoints: updatedClient?.loyalty_points ?? 0,
      };
    });

    revalidatePath("/(private)/admin/loyalty", "page");

    return {
      success: true,
      voucher: transactionResult.voucher,
      newPoints: transactionResult.newPoints,
    };
  } catch (error: any) {
    if (error?.message === "SALDO_INSUFICIENTE") {
      return { success: false, error: "Pontos insuficientes para resgatar esta recompensa." };
    }
    console.error("Erro ao resgatar recompensa:", error);
    return { success: false, error: "Erro interno ao resgatar recompensa." };
  }
}

export async function enrollClientInLoyalty(clientId: string, enroll: boolean) {
  try {
    const admin = await requireAuth();

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { loyalty_points: true, organization_id: true, name: true },
    });

    await prisma.$transaction(async (tx) => {
      // Se estiver desmatriculando e o cliente tinha pontos acumulados, registra no Ledger o estorno/reset
      if (!enroll && client && (client.loyalty_points || 0) > 0) {
        await tx.loyaltyTransaction.create({
          data: {
            organization_id: client.organization_id,
            client_id: clientId,
            type: "MANUAL_ADJUST",
            points: -client.loyalty_points,
            balance_after: 0,
            description: `Remoção do programa de fidelidade (saldo de ${client.loyalty_points} pts zerado)`,
            created_by_id: admin.id,
            created_by_name: admin.name || "Administrador",
          },
        });
      }

      await tx.client.update({
        where: { id: clientId },
        data: { 
          loyalty_enrolled_at: enroll ? new Date() : null,
          loyalty_points: 0
        }
      });
    });

    revalidatePath("/(private)/admin/loyalty", "page");
    return { success: true };
  } catch (error) {
    console.error("Erro ao alterar matricula do cliente:", error);
    return { success: false, error: "Erro ao alterar matrícula do cliente" };
  }
}

export async function adjustClientLoyaltyPoints(data: {
  clientId: string;
  points: number;
  reason: string;
}) {
  try {
    const admin = await requireAuth();
    const { clientId, points, reason } = data;

    if (!points || points === 0) {
      return { success: false, error: "A quantidade de pontos deve ser diferente de zero." };
    }
    if (!reason || !reason.trim()) {
      return { success: false, error: "Informe o motivo ou justificativa do ajuste." };
    }

    const client = await prisma.client.findFirst({
      where: { id: clientId, organization_id: admin.organizationId },
      include: {
        organization: {
          include: { loyalty_settings: true },
        },
      },
    });

    if (!client) {
      return { success: false, error: "Cliente não encontrado nesta clínica." };
    }

    const settings = client.organization?.loyalty_settings;
    const maxPoints = settings?.max_points || 500;
    const currentPoints = client.loyalty_points || 0;

    let newPoints = currentPoints + points;
    if (newPoints < 0) newPoints = 0;
    if (points > 0 && newPoints > maxPoints) newPoints = maxPoints;

    const actualDiff = newPoints - currentPoints;
    if (actualDiff === 0) {
      return {
        success: false,
        error: points > 0
          ? `O cliente já atingiu o limite máximo de ${maxPoints} pontos.`
          : "O saldo do cliente já está zerado.",
      };
    }

    const transaction = await prisma.$transaction(async (tx) => {
      await tx.client.update({
        where: { id: clientId },
        data: { loyalty_points: newPoints },
      });

      const entry = await tx.loyaltyTransaction.create({
        data: {
          organization_id: admin.organizationId,
          client_id: clientId,
          type: actualDiff > 0 ? "MANUAL_BONUS" : "MANUAL_ADJUST",
          points: actualDiff,
          balance_after: newPoints,
          description: reason.trim(),
          created_by_id: admin.id,
          created_by_name: admin.name || "Administrador",
        },
      });

      return entry;
    });

    revalidatePath("/(private)/admin/loyalty", "page");

    return {
      success: true,
      newPoints,
      transaction,
    };
  } catch (error) {
    console.error("Erro ao ajustar pontos manualmente:", error);
    return { success: false, error: "Erro interno ao realizar ajuste de pontos." };
  }
}

export async function getPaginatedLoyaltyTransactions({
  page = 1,
  limit = 15,
  search = "",
  type = "ALL",
}: {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
} = {}) {
  try {
    const admin = await requireAuth();
    const organizationId = admin.organizationId;

    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, Math.min(100, limit));
    const skip = (safePage - 1) * safeLimit;

    const where: any = {
      organization_id: organizationId,
    };

    if (type && type !== "ALL") {
      where.type = type;
    }

    if (search && search.trim()) {
      where.OR = [
        { client: { name: { contains: search.trim(), mode: "insensitive" } } },
        { description: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const [transactions, total, statsCredit, statsDebit] = await Promise.all([
      prisma.loyaltyTransaction.findMany({
        where,
        include: {
          client: {
            select: { id: true, name: true, phone_whatsapp: true },
          },
        },
        orderBy: { created_at: "desc" },
        skip,
        take: safeLimit,
      }),
      prisma.loyaltyTransaction.count({ where }),
      prisma.loyaltyTransaction.aggregate({
        where: { organization_id: organizationId, points: { gt: 0 } },
        _sum: { points: true },
      }),
      prisma.loyaltyTransaction.aggregate({
        where: { organization_id: organizationId, points: { lt: 0 } },
        _sum: { points: true },
      }),
    ]);

    const formattedTransactions = transactions.map((t) => ({
      id: t.id,
      clientName: t.client?.name || "Cliente Desconhecido",
      clientId: t.client_id,
      clientPhone: t.client?.phone_whatsapp || "",
      type: t.type,
      points: t.points,
      balanceAfter: t.balance_after,
      description: t.description,
      createdAt: t.created_at,
      createdByName: t.created_by_name || "Sistema",
    }));

    return {
      success: true,
      transactions: formattedTransactions,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      page: safePage,
      stats: {
        totalGranted: statsCredit._sum.points || 0,
        totalSpent: Math.abs(statsDebit._sum.points || 0),
        totalTransactions: total,
      },
    };
  } catch (error) {
    console.error("Erro ao buscar extrato de transações de fidelidade:", error);
    return {
      success: false,
      error: "Erro ao buscar extrato de fidelidade",
      transactions: [],
      total: 0,
      totalPages: 1,
      page: 1,
      stats: { totalGranted: 0, totalSpent: 0, totalTransactions: 0 },
    };
  }
}

export async function getClientLoyaltyHistory(clientId: string) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        loyalty_points: true,
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

    // 1. Busca primeiro se existem transações no Ledger imutável
    const ledgerEntries = await prisma.loyaltyTransaction.findMany({
      where: { client_id: client.id },
      orderBy: { created_at: "desc" },
    });

    const vouchers = await prisma.clientVoucher.findMany({
      where: { client_id: client.id },
      orderBy: { created_at: "desc" },
    });

    // Se houver transações gravadas no Ledger, usamos diretamente com fidelidade máxima!
    if (ledgerEntries.length > 0) {
      const history = ledgerEntries.map((item) => ({
        id: item.id,
        type: item.type === "REWARD_REDEEM" ? "redeem" : item.type.toLowerCase(),
        date: item.created_at,
        points: item.points,
        description: item.description,
        balanceAfter: item.balance_after,
      }));

      return { success: true, history, vouchers, points: client.loyalty_points };
    }

    // Fallback retroativo para dados pré-ledger
    const programActivationDate = settings.activated_at 
      ? new Date(settings.activated_at) 
      : (settings.created_at ? new Date(settings.created_at) : new Date());

    const startDate = client.loyalty_enrolled_at 
      ? new Date(client.loyalty_enrolled_at) 
      : programActivationDate;
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
          status: "REALIZADO",
          ...(settings.check_in_active && settings.check_in_points > 0
            ? {
                OR: [
                  { check_in: null },
                  { check_in: { is: { deleted_at: { not: null } } } },
                ],
              }
            : {}),
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

    // Busca resgates de vouchers (débitos de pontos no histórico)
    history.push(...vouchers.map(v => ({
      id: v.id,
      type: 'redeem' as const,
      date: v.created_at,
      points: -v.points_spent,
      description: `Resgate: ${v.title}`,
      voucherId: v.id,
      voucherStatus: v.status
    })));

    // Ordena toda a linha do tempo (créditos e débitos) por data decrescente
    history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { success: true, history, vouchers, points: client.loyalty_points };
  } catch (error) {
    console.error("Erro ao buscar histórico do cliente:", error);
    return { success: false, error: "Erro ao buscar histórico." };
  }
}

export async function expireOverdueVouchers(organizationId?: string) {
  try {
    await prisma.clientVoucher.updateMany({
      where: {
        status: "DISPONIVEL",
        expires_at: { lt: new Date() },
        ...(organizationId ? { client: { organization_id: organizationId } } : {}),
      },
      data: {
        status: "EXPIRADO",
      },
    });
  } catch (err) {
    console.error("Erro ao expirar vouchers vencidos:", err);
  }
}

export async function findVoucherByPin(pin: string) {
  try {
    const admin = await requireAuth();
    if (!pin || !pin.trim()) {
      return { success: false, error: "Digite o código PIN do voucher." };
    }

    const cleanPin = pin.trim().replace(/^#?VCH-/i, "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (cleanPin.length < 3) {
      return { success: false, error: "Informe ao menos 3 caracteres do código do voucher." };
    }

    // Atualiza vouchers vencidos da organização em background
    await expireOverdueVouchers(admin.organizationId);

    const vouchers = await prisma.clientVoucher.findMany({
      where: {
        id: { endsWith: cleanPin, mode: "insensitive" },
        client: { organization_id: admin.organizationId },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone_whatsapp: true,
            loyalty_points: true,
          },
        },
        reward: true,
      },
      take: 5,
    });

    if (vouchers.length === 0) {
      return { success: false, error: `Nenhum voucher encontrado com o PIN "${pin}".` };
    }

    const formattedVouchers = vouchers.map((v) => {
      const isExpired = v.status === "EXPIRADO" || (!v.used_at && v.expires_at && new Date(v.expires_at) < new Date());
      const effectiveStatus = v.status === "UTILIZADO" ? "UTILIZADO" : isExpired ? "EXPIRADO" : "DISPONIVEL";

      return {
        id: v.id,
        pin: `#VCH-${v.id.slice(-6).toUpperCase()}`,
        title: v.title,
        pointsSpent: v.points_spent,
        status: effectiveStatus,
        createdAt: v.created_at,
        expiresAt: v.expires_at,
        usedAt: v.used_at,
        client: v.client,
        reward: v.reward,
      };
    });

    return { success: true, vouchers: formattedVouchers };
  } catch (error: any) {
    console.error("Erro ao buscar voucher por PIN:", error);
    return { success: false, error: "Erro ao localizar voucher." };
  }
}

export async function markVoucherAsUsed(voucherId: string, forceIfExpired: boolean = false) {
  try {
    const admin = await requireAuth();

    const voucher = await prisma.clientVoucher.findFirst({
      where: {
        id: voucherId,
        client: { organization_id: admin.organizationId },
      },
      include: {
        client: { select: { id: true, name: true } },
      },
    });

    if (!voucher) {
      return { success: false, error: "Voucher não encontrado nesta clínica." };
    }

    if (voucher.status === "UTILIZADO") {
      const usedDate = voucher.used_at
        ? new Date(voucher.used_at).toLocaleDateString("pt-BR")
        : "";
      return {
        success: false,
        error: `Este voucher já foi utilizado${usedDate ? ` em ${usedDate}` : ""}.`,
      };
    }

    const isExpired = voucher.expires_at && new Date(voucher.expires_at) < new Date();

    // Se estiver expirado e o admin não tiver forçado a autorização por cortesia
    if (isExpired && !forceIfExpired) {
      await prisma.clientVoucher.update({
        where: { id: voucherId },
        data: { status: "EXPIRADO" },
      });
      return {
        success: false,
        error: "Este voucher está expirado. Deseja reativá-lo ou autorizar o uso por cortesia?",
        isExpired: true,
      };
    }

    const updated = await prisma.clientVoucher.update({
      where: { id: voucherId },
      data: { status: "UTILIZADO", used_at: new Date() },
      include: {
        client: { select: { id: true, name: true } },
      },
    });

    revalidatePath("/(private)/admin/loyalty", "page");
    return { success: true, voucher: updated };
  } catch (error) {
    console.error("Erro ao utilizar voucher:", error);
    return { success: false, error: "Erro ao utilizar voucher." };
  }
}

export async function reactivateVoucher(voucherId: string, additionalDays: number = 30) {
  try {
    const admin = await requireAuth();

    const voucher = await prisma.clientVoucher.findFirst({
      where: {
        id: voucherId,
        client: { organization_id: admin.organizationId },
      },
      include: {
        client: { select: { id: true, name: true } },
      },
    });

    if (!voucher) {
      return { success: false, error: "Voucher não encontrado nesta clínica." };
    }

    if (voucher.status === "UTILIZADO") {
      return { success: false, error: "Vouchers já utilizados não podem ser reativados." };
    }

    // Calcula a nova data de validade a partir de hoje
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + additionalDays);

    const updated = await prisma.clientVoucher.update({
      where: { id: voucherId },
      data: {
        status: "DISPONIVEL",
        expires_at: newExpiresAt,
      },
      include: {
        client: { select: { id: true, name: true } },
      },
    });

    revalidatePath("/(private)/admin/loyalty", "page");
    return { success: true, voucher: updated };
  } catch (error) {
    console.error("Erro ao reativar voucher:", error);
    return { success: false, error: "Erro interno ao reativar voucher." };
  }
}

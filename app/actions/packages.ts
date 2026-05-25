// app/actions/packages.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { AppointmentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Busca todos os pacotes da organização e calcula os KPIs em tempo real.
 * 🔥 OTIMIZADO: Agora suporta Paginação Server-Side e Busca Inteligente.
 */
// app/actions/packages.ts (Trecho principal atualizado)

export async function getPackagesDashboardData(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  try {
    const admin = await requireAuth();
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    // ... (KPIs continuam iguais) ...

    const baseWhere: any = { organization_id: admin.organizationId };

    // 🔥 LÓGICA DO FILTRO SECRETO "..."
    const isEndingSoonFilter = params?.search === "...";

    // Se não for o filtro especial, faz a busca normal
    if (params?.search && !isEndingSoonFilter) {
      const searchLower = params.search.toLowerCase();
      baseWhere.OR = [
        { client: { name: { contains: searchLower, mode: "insensitive" } } },
        { service: { name: { contains: searchLower, mode: "insensitive" } } },
      ];
    }

    // Se for o filtro especial, buscamos apenas os ativos para processar o filtro de "terminando"
    // NOTA: Como você quer que funcione a paginação, vamos buscar todos os ativos
    // e filtrar em memória (funciona perfeitamente para clínicas de tamanho padrão)
    const allActivePackages = await prisma.package.findMany({
      where: { organization_id: admin.organizationId, active: true },
      include: {
        client: { select: { name: true } },
        service: { select: { name: true } },
      },
      orderBy: { created_at: "desc" },
    });

    let filteredPackages = allActivePackages;

    if (isEndingSoonFilter) {
      filteredPackages = allActivePackages.filter(
        (p) =>
          p.used_sessions >= p.total_sessions - 2 &&
          p.used_sessions < p.total_sessions,
      );
    } else if (params?.search) {
      const searchLower = params.search.toLowerCase();
      filteredPackages = allActivePackages.filter(
        (p) =>
          p.client.name.toLowerCase().includes(searchLower) ||
          p.service.name.toLowerCase().includes(searchLower),
      );
    }

    // Paginação manual baseada no resultado filtrado
    const totalPackages = filteredPackages.length;
    const paginatedPackages = filteredPackages.slice(skip, skip + limit);

    return {
      success: true,
      packages: paginatedPackages.map((p) => ({
        id: p.id,
        clientId: p.client_id,
        clientName: p.client.name,
        packageName: p.service.name,
        usedSessions: p.used_sessions,
        totalSessions: p.total_sessions,
        active: p.active,
      })),
      kpis: {
        active: allActivePackages.length,
        endingSoon: allActivePackages.filter(
          (p) => p.used_sessions >= p.total_sessions - 2,
        ).length,
        totalPending: allActivePackages.reduce(
          (acc, p) => acc + (p.total_sessions - p.used_sessions),
          0,
        ),
      },
      total: totalPackages,
      page,
      totalPages: Math.ceil(totalPackages / limit) || 1,
    };
  } catch (error) {
    console.error("Erro ao carregar dashboard:", error);
    return { success: false, error: "Falha ao carregar dados." };
  }
}

/**
 * Busca o histórico de agendamentos vinculados a um pacote específico.
 */
export async function getPackageHistory(packageId: string) {
  try {
    const admin = await requireAuth();

    const appointments = await prisma.appointment.findMany({
      where: {
        package_id: packageId,
        organization_id: admin.organizationId,
      },
      orderBy: {
        date_time: "asc",
      },
    });

    return {
      success: true,
      history: appointments.map((appt) => ({
        id: appt.id,
        session: appt.session_number,
        date: appt.date_time,
        status: appt.status,
        obs: appt.observations,
      })),
    };
  } catch (error) {
    console.error("Erro ao buscar histórico do pacote:", error);
    return { success: false, error: "Falha ao carregar histórico." };
  }
}

/**
 * Realiza uma baixa manual "robusta":
 * Cria um agendamento retroativo, marca como REALIZADO e desconta do pacote.
 * 🔥 NOVO: Recebe o `dateTimeString` do frontend para gravar a data/hora exata do check-in.
 */
export async function createManualPackageCheckIn(
  packageId: string,
  dateTimeString?: string,
) {
  try {
    const admin = await requireAuth();

    // 1. Busca os dados do pacote para saber quem é o cliente e o serviço
    const pkg = await prisma.package.findUnique({
      where: { id: packageId, organization_id: admin.organizationId },
      include: { service: true, client: true },
    });

    if (!pkg) return { success: false, error: "Pacote não encontrado." };
    if (pkg.used_sessions >= pkg.total_sessions) {
      return { success: false, error: "Este pacote não possui mais saldo." };
    }

    // Define a data do check-in. Se o front enviou uma data, usa ela, senão usa 'agora'
    const checkInDate = dateTimeString ? new Date(dateTimeString) : new Date();

    // 2. Executa a transação para garantir que o histórico e o saldo batam sempre
    await prisma.$transaction(async (tx) => {
      // Cria um agendamento com a data ESCOLHIDA, já marcado como REALIZADO
      const appt = await tx.appointment.create({
        data: {
          date_time: checkInDate, // 🔥 Usa a data informada no modal
          status: AppointmentStatus.REALIZADO,
          client_id: pkg.client_id,
          service_id: pkg.service_id,
          package_id: pkg.id,
          organization_id: admin.organizationId,
          observations: "Baixa manual realizada via Gestão de Pacotes.",
          session_number: pkg.used_sessions + 1,
        },
      });

      // Registra o Check-In com a mesma data para este agendamento
      await tx.checkIn.create({
        data: {
          date_time: checkInDate, // 🔥 Usa a data informada no modal no histórico de checkin também
          appointment_id: appt.id,
          client_id: pkg.client_id,
          package_id: pkg.id,
          organization_id: admin.organizationId,
          admin_id: admin.id, // 🔥 CORREÇÃO: Usando admin.id em vez de admin.userId
        },
      });

      // Calcula se esta baixa vai zerar o pacote
      const newUsedSessions = pkg.used_sessions + 1;
      const willRemainActive = newUsedSessions < pkg.total_sessions;

      // Desconta a sessão do pacote e já desativa caso tenha batido a cota
      await tx.package.update({
        where: { id: pkg.id },
        data: {
          used_sessions: { increment: 1 },
          active: willRemainActive,
        },
      });
    });

    // Revalida todas as telas envolvidas para atualizar os números na hora
    revalidatePath("/admin/packages");
    revalidatePath("/admin/agenda");
    revalidatePath("/admin/history");
    // Revalida também o perfil da cliente para a Timeline atualizar
    revalidatePath(`/admin/clients/${pkg.client_id}`);

    return { success: true };
  } catch (error) {
    console.error("Erro na baixa manual:", error);
    return { success: false, error: "Falha ao processar registro." };
  }
}

/**
 * Exclui um check-in e reverte o consumo no pacote do cliente.
 */
export async function deleteCheckIn(checkInId: string) {
  try {
    const admin = await requireAuth();

    // 1. Busca os detalhes do check-in para saber o que reverter
    const checkIn = await prisma.checkIn.findUnique({
      where: { id: checkInId, organization_id: admin.organizationId },
    });

    if (!checkIn) return { success: false, error: "Check-in não encontrado." };

    // 2. Executa a reversão em uma transação
    await prisma.$transaction(async (tx) => {
      // A. Se estava vinculado a um pacote, devolve a sessão
      if (checkIn.package_id) {
        await tx.package.update({
          where: { id: checkIn.package_id },
          data: {
            used_sessions: { decrement: 1 },
            active: true, // Garante que o pacote volte a ficar ativo caso estivesse zerado
          },
        });
      }

      // B. Se estava vinculado a um agendamento, volta o status para 'CONFIRMADO'
      if (checkIn.appointment_id) {
        await tx.appointment.update({
          where: { id: checkIn.appointment_id },
          data: { status: "CONFIRMADO" },
        });
      }

      // C. Deleta o registro de check-in
      await tx.checkIn.delete({
        where: { id: checkInId },
      });
    });

    // Revalida as páginas para atualizar os dados na tela
    revalidatePath("/admin/history");
    revalidatePath("/admin/packages");
    revalidatePath("/admin/dashboard");
    revalidatePath(`/admin/clients/${checkIn.client_id}`);

    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir check-in:", error);
    return { success: false, error: "Falha ao excluir o registro." };
  }
}

/**
 * Encerra/Arquiva um pacote manualmente antes da hora.
 */
export async function archivePackage(packageId: string) {
  try {
    const admin = await requireAuth();

    const pkg = await prisma.package.findUnique({
      where: { id: packageId, organization_id: admin.organizationId },
    });

    if (!pkg) {
      return { success: false, error: "Pacote não encontrado." };
    }

    if (!pkg.active) {
      return { success: false, error: "Este pacote já está encerrado." };
    }

    await prisma.package.update({
      where: { id: pkg.id },
      data: { active: false },
    });

    revalidatePath("/admin/packages");
    revalidatePath("/admin/dashboard");
    revalidatePath(`/admin/clients/${pkg.client_id}`);

    return { success: true };
  } catch (error) {
    console.error("Erro ao encerrar pacote:", error);
    return { success: false, error: "Falha ao encerrar o pacote." };
  }
}

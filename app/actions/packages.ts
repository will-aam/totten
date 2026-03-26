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
export async function getPackagesDashboardData(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  try {
    const admin = await requireAuth();

    // Default parameters if not provided
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    // 🔥 OTIMIZAÇÃO DE KPIs: Calculados DIRETAMENTE no banco de dados.
    // Em vez de baixar 5.000 pacotes pro Node.js para contar quantos estão ativos,
    // pedimos ao PostgreSQL que nos devolva apenas o número 5000. Super rápido!

    // 1. Total Ativos
    const activeCount = await prisma.package.count({
      where: {
        organization_id: admin.organizationId,
        active: true,
      },
    });

    // 2. Próximos do Fim (Faltam 2 ou menos sessões para acabar)
    // O Prisma não permite comparar duas colunas diretamente no 'where' simples (used_sessions >= total_sessions - 2)
    // Então puxamos apenas essas duas colunas e contamos na RAM, mas apenas dos pacotes ATIVOS (muito mais leve).
    const activePackagesForKpi = await prisma.package.findMany({
      where: { organization_id: admin.organizationId, active: true },
      select: { used_sessions: true, total_sessions: true },
    });

    let endingSoonCount = 0;
    let totalPendingSessions = 0;

    activePackagesForKpi.forEach((p) => {
      totalPendingSessions += p.total_sessions - p.used_sessions;
      if (
        p.used_sessions >= p.total_sessions - 2 &&
        p.used_sessions < p.total_sessions
      ) {
        endingSoonCount++;
      }
    });

    // 🔥 CONSTRUÇÃO DO FILTRO DA LISTAGEM
    const baseWhere: any = {
      organization_id: admin.organizationId,
    };

    if (params?.search) {
      // Busca pelo nome do cliente ou nome do pacote
      const searchLower = params.search.toLowerCase();
      baseWhere.OR = [
        { client: { name: { contains: searchLower, mode: "insensitive" } } },
        { service: { name: { contains: searchLower, mode: "insensitive" } } },
      ];
    }

    // Busca a quantidade total de pacotes que combinam com o filtro para montar a paginação (ex: Página 1 de 5)
    const totalPackages = await prisma.package.count({
      where: baseWhere,
    });

    // 🔥 OTIMIZAÇÃO: Busca Apenas os pacotes daquela página específica
    const packages = await prisma.package.findMany({
      where: baseWhere,
      skip,
      take: limit,
      include: {
        client: { select: { name: true } },
        service: { select: { name: true } },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return {
      success: true,
      packages: packages.map((p) => ({
        id: p.id,
        clientId: p.client_id,
        clientName: p.client.name,
        packageName: p.service.name,
        usedSessions: p.used_sessions,
        totalSessions: p.total_sessions,
        active: p.active,
      })),
      kpis: {
        active: activeCount,
        endingSoon: endingSoonCount,
        totalPending: totalPendingSessions,
      },
      // Dados para o Frontend montar os botões de "Anterior" e "Próxima"
      total: totalPackages,
      page,
      totalPages: Math.ceil(totalPackages / limit) || 1,
    };
  } catch (error) {
    console.error("Erro ao carregar dashboard de pacotes:", error);
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
 * Cria um agendamento retroativo (agora), marca como REALIZADO e desconta do pacote.
 */
export async function createManualPackageCheckIn(packageId: string) {
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

    // 2. Executa a transação para garantir que o histórico e o saldo batam sempre
    await prisma.$transaction(async (tx) => {
      // Cria um agendamento para AGORA já marcado como REALIZADO
      const appt = await tx.appointment.create({
        data: {
          date_time: new Date(),
          status: AppointmentStatus.REALIZADO,
          client_id: pkg.client_id,
          service_id: pkg.service_id,
          package_id: pkg.id,
          organization_id: admin.organizationId,
          observations: "Baixa manual realizada via Gestão de Pacotes.",
          session_number: pkg.used_sessions + 1,
        },
      });

      // Registra o Check-In para este agendamento (aparecerá no Histórico de Check-in)
      await tx.checkIn.create({
        data: {
          appointment_id: appt.id,
          client_id: pkg.client_id,
          package_id: pkg.id,
          organization_id: admin.organizationId,
        },
      });

      // Desconta a sessão do pacote
      await tx.package.update({
        where: { id: pkg.id },
        data: { used_sessions: { increment: 1 } },
      });
    });

    // Revalida todas as telas envolvidas para atualizar os números na hora
    revalidatePath("/admin/packages");
    revalidatePath("/admin/agenda");
    revalidatePath("/admin/history");

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

    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir check-in:", error);
    return { success: false, error: "Falha ao excluir o registro." };
  }
}

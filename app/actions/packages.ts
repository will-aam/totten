// app/actions/packages.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { AppointmentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Busca todos os pacotes da organização e calcula os KPIs em tempo real.
 * Agora inclui o clientId para permitir navegação precisa.
 */
export async function getPackagesDashboardData() {
  try {
    const admin = await requireAuth();

    const packages = await prisma.package.findMany({
      where: {
        organization_id: admin.organizationId,
      },
      include: {
        client: { select: { name: true } },
        service: { select: { name: true } },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const activeCount = packages.filter((p) => p.active).length;

    const endingSoonCount = packages.filter(
      (p) =>
        p.active &&
        p.used_sessions >= p.total_sessions - 2 &&
        p.used_sessions < p.total_sessions,
    ).length;

    const totalPendingSessions = packages.reduce(
      (acc, p) => acc + (p.total_sessions - p.used_sessions),
      0,
    );

    return {
      success: true,
      packages: packages.map((p) => ({
        id: p.id,
        clientId: p.client_id, // 🔥 Adicionado: Crucial para os botões "Agendar" e "Renovar"
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

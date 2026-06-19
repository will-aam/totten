// app/actions/packages.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { AppointmentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Busca todos os pacotes da organização e calcula os KPIs em tempo real.
 *  OTIMIZADO: Agora suporta Paginação Server-Side e Busca Inteligente.
 */
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

    const baseWhere: any = { organization_id: admin.organizationId };

    const isEndingSoonFilter = params?.search === "...";

    if (params?.search && !isEndingSoonFilter) {
      const searchLower = params.search.toLowerCase();
      baseWhere.OR = [
        { client: { name: { contains: searchLower, mode: "insensitive" } } },
        { service: { name: { contains: searchLower, mode: "insensitive" } } },
      ];
    }

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
 */
export async function createManualPackageCheckIn(
  packageId: string,
  dateTimeString?: string,
) {
  try {
    const admin = await requireAuth();

    const pkg = await prisma.package.findUnique({
      where: { id: packageId, organization_id: admin.organizationId },
      include: { service: true, client: true },
    });

    if (!pkg) return { success: false, error: "Pacote não encontrado." };
    if (pkg.used_sessions >= pkg.total_sessions) {
      return { success: false, error: "Este pacote não possui mais saldo." };
    }

    const checkInDate = dateTimeString ? new Date(dateTimeString) : new Date();

    await prisma.$transaction(async (tx) => {
      //  SNAPSHOT INJETADO: A sessão criada herda o snapshot do pacote!
      const appt = await tx.appointment.create({
        data: {
          date_time: checkInDate,
          status: AppointmentStatus.REALIZADO,
          client_id: pkg.client_id,
          service_id: pkg.service_id,
          package_id: pkg.id,
          organization_id: admin.organizationId,
          observations: "Baixa manual realizada via Gestão de Pacotes.",
          session_number: pkg.used_sessions + 1,
          // Pega o snapshot salvo no pacote ou cai pro fallback do serviço atual se for pacote antigo
          snapshot_service_name: pkg.snapshot_service_name ?? pkg.service.name,
          snapshot_service_price:
            pkg.snapshot_service_price ?? pkg.service.price,
          snapshot_service_duration:
            pkg.snapshot_service_duration ?? pkg.service.duration,
        },
      });

      await tx.checkIn.create({
        data: {
          date_time: checkInDate,
          appointment_id: appt.id,
          client_id: pkg.client_id,
          package_id: pkg.id,
          organization_id: admin.organizationId,
          admin_id: admin.id,
        },
      });

      const newUsedSessions = pkg.used_sessions + 1;
      const willRemainActive = newUsedSessions < pkg.total_sessions;

      await tx.package.update({
        where: { id: pkg.id },
        data: {
          used_sessions: { increment: 1 },
          active: willRemainActive,
        },
      });
    });

    revalidatePath("/admin/packages");
    revalidatePath("/admin/agenda");
    revalidatePath("/admin/history");
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

    const checkIn = await prisma.checkIn.findUnique({
      where: { id: checkInId, organization_id: admin.organizationId },
    });

    if (!checkIn) return { success: false, error: "Check-in não encontrado." };

    await prisma.$transaction(async (tx) => {
      if (checkIn.package_id) {
        await tx.package.update({
          where: { id: checkIn.package_id },
          data: {
            used_sessions: { decrement: 1 },
            active: true,
          },
        });
      }

      if (checkIn.appointment_id) {
        await tx.appointment.update({
          where: { id: checkIn.appointment_id },
          data: { status: "CONFIRMADO" },
        });
      }

      await tx.checkIn.delete({
        where: { id: checkInId },
      });
    });

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

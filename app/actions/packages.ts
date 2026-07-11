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
        package_template: { select: { name: true } }, // <--- ADICIONE ESTA LINHA
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
        // CORREÇÃO: Puxa do template primeiro, depois tenta do pacote
        packageName: p.package_template?.name || p.name,
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
      include: {
        check_in: true, // 🔥 NOVO: Traz o registro de check-in (se existir)
      },
      orderBy: {
        date_time: "asc",
      },
    });

    return {
      success: true,
      history: appointments.map((appt) => {
        // 🔥 NOVO: Lógica para decidir qual data mostrar
        // Se foi realizado e tem check-in, pega a hora real que bateu no totem
        const displayDate =
          appt.status === "REALIZADO" && appt.check_in
            ? appt.check_in.date_time
            : appt.date_time;

        return {
          id: appt.id,
          session: appt.session_number,
          date: displayDate,
          status: appt.status,
          obs: appt.observations,
        };
      }),
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

    // 🔥 TRAVA DE INTEGRIDADE: Não permitir baixa em pacote arquivado
    if (!pkg.active) {
      return {
        success: false,
        error: "Este pacote foi encerrado e não permite novos check-ins.",
      };
    }

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
 * Remove um check-in (soft delete) e reverte o consumo no pacote do cliente.
 * O registro original é preservado para a Jornada do Cliente,
 * apenas marcado como removido.
 */
export async function deleteCheckIn(checkInId: string) {
  try {
    const admin = await requireAuth();

    const checkIn = await prisma.checkIn.findUnique({
      where: { id: checkInId, organization_id: admin.organizationId },
      include: {
        appointment: {
          include: {
            service: {
              include: { stock_items: { include: { stock_item: true } } },
            },
          },
        },
        package: { include: { service: true } },
      },
    });

    if (!checkIn) return { success: false, error: "Check-in não encontrado." };
    if (checkIn.deleted_at) {
      return { success: false, error: "Este check-in já foi removido." };
    }

    await prisma.$transaction(async (tx) => {
      const adminName = admin.name || "Administrador";

      // A. Auditoria
      if (checkIn.client_id) {
        const dateStr = new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "short",
          timeStyle: "short",
        }).format(checkIn.date_time);

        const serviceName =
          checkIn.appointment?.snapshot_service_name ||
          checkIn.package?.snapshot_service_name ||
          checkIn.package?.service?.name ||
          "Serviço";

        await tx.clientNote.create({
          data: {
            text: `Check-in de ${serviceName} do dia ${dateStr} foi removido por ${adminName}.`,
            client_id: checkIn.client_id,
            organization_id: admin.organizationId,
            date: new Date(),
          },
        });
      }

      // B. Estorno do pacote
      if (checkIn.package_id) {
        await tx.package.update({
          where: { id: checkIn.package_id },
          data: { used_sessions: { decrement: 1 }, active: true },
        });
      }

      // C. Agendamento volta ao estado anterior
      if (checkIn.appointment_id) {
        await tx.appointment.update({
          where: { id: checkIn.appointment_id },
          data: { status: "CONFIRMADO", has_charge: false },
        });
      }

      // D. Desfaz estoque e financeiro SÓ se a automação do totem gerou isso
      if (checkIn.auto_processed && checkIn.appointment?.service) {
        const service = checkIn.appointment.service;

        if (service.track_stock && service.stock_items.length > 0) {
          for (const item of service.stock_items) {
            await tx.stockItem.update({
              where: { id: item.stock_item_id },
              data: { quantity: { increment: item.quantity_used } },
            });
          }
        }

        // Remove a(s) despesa(s) automáticas geradas na criação
        await tx.transaction.deleteMany({
          where: { appointment_id: checkIn.appointment_id, type: "DESPESA" },
        });
      }

      // E. Soft delete do check-in
      await tx.checkIn.update({
        where: { id: checkInId },
        data: {
          deleted_at: new Date(),
          deleted_by_admin_id: admin.id,
          deleted_by_name: adminName,
        },
      });
    });

    revalidatePath("/admin/history");
    revalidatePath("/admin/packages");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/stock");
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
      include: { client: true, service: true },
    });

    if (!pkg) {
      return { success: false, error: "Pacote não encontrado." };
    }

    if (!pkg.active) {
      return { success: false, error: "Este pacote já está encerrado." };
    }

    await prisma.$transaction(async (tx) => {
      // A. Auditoria: registra o encerramento manual no histórico do cliente
      const packageName = pkg.package_template_id
        ? pkg.name
        : pkg.snapshot_service_name || pkg.service?.name || "Pacote";

      await tx.clientNote.create({
        data: {
          text: `Ação: Pacote "${packageName}" (${pkg.used_sessions}/${pkg.total_sessions} sessões usadas) foi ENCERRADO manualmente pelo admin ID: ${admin.id}`,
          client_id: pkg.client_id,
          organization_id: admin.organizationId,
          date: new Date(),
        },
      });

      // B. Encerramento de fato (lógica original mantida)
      await tx.package.update({
        where: { id: pkg.id },
        data: { active: false },
      });
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

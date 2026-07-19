// lib/server/services/history/history.service.ts
import { getTenantPrisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class HistoryService {
  /**
   * Retorna o histórico de check-ins com paginação, busca e filtros de data.
   */
  static async getCheckInHistory(
    organizationId: string,
    params: {
      page: number;
      limit: number;
      search: string;
      from: string | null;
      to: string | null;
    },
  ) {
    const prisma = getTenantPrisma(organizationId);
    const { page, limit, search, from, to } = params;
    const skip = (page - 1) * limit;

    // Construção robusta e segura da query com isolamento de tenant
    const whereClause: Prisma.CheckInWhereInput = {
      organization_id: organizationId,
      deleted_at: null,
    };

    const andConditions: Prisma.CheckInWhereInput[] = [];

    // Busca por Nome ou CPF
    if (search) {
      andConditions.push({
        client: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { cpf: { contains: search } },
          ],
        },
      });
    }

    // Filtro de Data Inicial
    if (from) {
      const fromDate = new Date(from);
      fromDate.setHours(0, 0, 0, 0);
      andConditions.push({ date_time: { gte: fromDate } });
    }

    // Filtro de Data Final
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      andConditions.push({ date_time: { lte: toDate } });
    }

    if (andConditions.length > 0) {
      whereClause.AND = andConditions;
    }

    // Execução em paralelo para performance
    const [totalCount, checkIns] = await Promise.all([
      prisma.checkIn.count({ where: whereClause }),
      prisma.checkIn.findMany({
        where: whereClause,
        include: {
          client: {
            select: {
              name: true,
              cpf: true,
            },
          },
          appointment: {
            select: {
              snapshot_service_name: true,
              service: { select: { name: true } },
            },
          },
          package: {
            select: {
              snapshot_service_name: true,
              service: { select: { name: true } },
            },
          },
        },
        orderBy: {
          date_time: "desc",
        },
        skip: skip,
        take: limit,
      }),
    ]);

    const enriched = checkIns.map((ci) => {
      // Lógica do snapshot: Prioriza dados imutáveis da época, fallback para atual
      const serviceName =
        ci.appointment?.snapshot_service_name ||
        ci.appointment?.service?.name ||
        ci.package?.snapshot_service_name ||
        ci.package?.service?.name ||
        "Serviço não identificado";

      return {
        id: ci.id,
        client_id: ci.client_id || "",
        package_id: ci.package_id || "",
        date_time: ci.date_time.toISOString(),
        client_name: ci.client?.name || "Cliente Excluído/Avulso",
        client_cpf: ci.client?.cpf || "---",
        service_name: serviceName,
      };
    });

    return {
      data: enriched,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit) || 1,
    };
  }
}

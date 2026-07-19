// lib/server/services/vouchers/voucher.service.ts
import { getTenantPrisma } from "@/lib/prisma";

export class VoucherService {
  /**
   * Lista pacotes concluídos com paginação e busca.
   */
  static async getCompletedPackages(
    organizationId: string,
    page: number,
    limit: number,
    search: string,
  ) {
    const prisma = getTenantPrisma(organizationId);
    const skip = (page - 1) * limit;

    const whereClause: any = {
      organization_id: organizationId,
      active: true,
      used_sessions: {
        gte: prisma.package.fields.total_sessions,
      },
    };

    if (search) {
      whereClause.OR = [
        { client: { name: { contains: search, mode: "insensitive" } } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    const [totalCount, completedPackages] = await Promise.all([
      prisma.package.count({ where: whereClause }),
      prisma.package.findMany({
        where: whereClause,
        include: {
          client: {
            select: { id: true, name: true },
          },
          service: {
            select: { name: true },
          },
          vouchers: {
            orderBy: { issue_date: "desc" },
            take: 1,
          },
          check_ins: {
            select: { date_time: true },
            orderBy: { date_time: "asc" },
          },
          appointments: {
            where: { status: "REALIZADO" },
            select: { date_time: true },
            orderBy: { date_time: "asc" },
          },
        },
        orderBy: {
          updated_at: "desc",
        },
        skip,
        take: limit,
      }),
    ]);

    const formatted = completedPackages.map((pkg) => {
      const rawDates = [
        ...pkg.check_ins.map((c) => c.date_time),
        ...pkg.appointments.map((a) => a.date_time),
      ].sort((a, b) => a.getTime() - b.getTime());

      const uniqueDates = Array.from(
        new Set(rawDates.map((d) => d.toISOString().split("T")[0])),
      ).map((dateStr) => new Date(dateStr).toISOString());

      return {
        id: pkg.id,
        clientId: pkg.client.id,
        clientName: pkg.client.name,
        packageName: pkg.name,
        serviceName: pkg.service.name,
        totalSessions: pkg.total_sessions,
        completionDate: pkg.updated_at.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        hasVoucher: pkg.vouchers.length > 0,
        lastVoucherDate: pkg.vouchers[0]?.issue_date,
        sessionDates: uniqueDates,
      };
    });

    return {
      data: formatted,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit) || 1,
    };
  }

  /**
   * Registra que um voucher foi emitido
   */
  static async createVoucher(
    organizationId: string,
    packageId: string,
    imageUrl?: string,
  ) {
    const prisma = getTenantPrisma(organizationId);

    // Validação de segurança: garante que o pacote pertence à org do admin antes de criar
    const pkg = await prisma.package.findFirst({
      where: { id: packageId, organization_id: organizationId },
    });

    if (!pkg) {
      throw new Error("PACKAGE_NOT_FOUND");
    }

    const voucher = await prisma.voucher.create({
      data: {
        package_id: packageId,
        image_url: imageUrl || null,
      },
    });

    return voucher;
  }
}

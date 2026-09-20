// lib/server/services/clients/client-packages.service.ts
import { getTenantPrisma } from "@/lib/prisma";

export class ClientPackagesService {
  /**
   * Busca e formata a lista de pacotes de um cliente específico.
   */
  static async getClientPackages(organizationId: string, clientId: string) {
    const prisma = getTenantPrisma(organizationId);

    // Valida se o cliente pertence à organização do admin
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        organization_id: organizationId,
      },
      select: { id: true },
    });

    if (!client) {
      throw new Error("CLIENT_NOT_FOUND");
    }

    const packages = await prisma.package.findMany({
      where: {
        client_id: clientId,
        organization_id: organizationId,
      },
      select: {
        id: true,
        name: true,
        total_sessions: true,
        used_sessions: true,
        price: true,
        active: true,
        service_id: true,
        created_at: true,
        package_template: {
          select: {
            name: true,
            validity_days: true,
          },
        },
        check_ins: {
          select: {
            date_time: true,
          },
          orderBy: {
            date_time: "asc",
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const formattedPackages = packages.map((pkg) => {
      // Cálculo visual da validade mockado (igual ao dashboard)
      const validityDays = pkg.package_template?.validity_days || 365;
      const createdDate = new Date(pkg.created_at);
      const expiresAt = new Date(createdDate.getTime());
      expiresAt.setDate(expiresAt.getDate() + validityDays);
      const isExpired = new Date() > expiresAt;

      return {
        id: pkg.id,
        name: pkg.package_template?.name || pkg.name,
        total_sessions: pkg.total_sessions,
        used_sessions: pkg.used_sessions,
        price: pkg.price,
        active: pkg.active,
        service_id: pkg.service_id,
        created_at: pkg.created_at.toISOString(),
        expiresAt: expiresAt.toISOString(),
        isExpired: isExpired,
        sessionDates: pkg.check_ins.map((checkin) =>
          checkin.date_time.toISOString(),
        ),
      };
    });

    return formattedPackages;
  }
}

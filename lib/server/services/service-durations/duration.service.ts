// lib/server/services/service-durations/duration.service.ts
import { getTenantPrisma } from "@/lib/prisma";

export class ServiceDurationService {
  /**
   * Retorna todas as durações ativas da organização ordenadas por minutos.
   */
  static async getDurations(organizationId: string) {
    const prisma = getTenantPrisma(organizationId);

    return await prisma.serviceDuration.findMany({
      where: {
        organization_id: organizationId,
        is_active: true,
      },
      orderBy: {
        minutes: "asc",
      },
    });
  }

  /**
   * Cria uma nova duração de serviço, validando duplicidades.
   */
  static async createDuration(
    organizationId: string,
    label: string,
    minutes: number,
  ) {
    const prisma = getTenantPrisma(organizationId);

    if (Number(minutes) < 1) {
      throw new Error("INVALID_DURATION");
    }

    // Verifica se já existe uma duração com os mesmos minutos para esta organização
    const existing = await prisma.serviceDuration.findFirst({
      where: {
        minutes: Number(minutes),
        organization_id: organizationId,
      },
    });

    if (existing) {
      throw new Error("DURATION_ALREADY_EXISTS");
    }

    const duration = await prisma.serviceDuration.create({
      data: {
        label,
        minutes: Number(minutes),
        organization_id: organizationId,
      },
    });

    return duration;
  }

  /**
   * Remove uma duração de serviço pelo ID.
   */
  static async deleteDuration(organizationId: string, id: string) {
    const prisma = getTenantPrisma(organizationId);

    await prisma.serviceDuration.delete({
      where: {
        id,
        organization_id: organizationId,
      },
    });

    return true;
  }
}

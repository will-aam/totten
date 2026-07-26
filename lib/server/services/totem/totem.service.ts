// lib/server/services/totem/totem.service.ts
import { prisma } from "@/lib/prisma";

export class TotemService {
  /**
   * Busca o histórico dos últimos 10 check-ins de um cliente no totem,
   * validando a organização através do slug (já que o totem não tem sessão de usuário).
   */
  static async getClientHistory(clientId: string, orgSlug: string) {
    // 1. Busca e valida a organização
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
    });

    if (!organization) {
      throw new Error("ORGANIZATION_NOT_FOUND");
    }

    // 2. Busca últimos 10 check-ins
    const checkIns = await prisma.checkIn.findMany({
      where: {
        client_id: clientId,
        organization_id: organization.id,
      },
      include: {
        package: {
          include: {
            service: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        date_time: "desc",
      },
      take: 10,
    });

    // 3. Formata os dados para o frontend (tratando check-ins avulsos de forma segura)
    return checkIns.map((checkIn) => ({
      id: checkIn.id,
      dateTime: checkIn.date_time,
      packageName: checkIn.package?.name || "Check-in Avulso",
      serviceName: checkIn.package?.service?.name || "Serviço Avulso",
    }));
  }
}

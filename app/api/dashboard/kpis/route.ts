// app/api/dashboard/kpis/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Data de hoje (início e fim do dia)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Check-ins de hoje
    const todayCheckInsCount = await prisma.checkIn.count({
      where: {
        organization_id: admin.organizationId,
        date_time: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // 2. Clientes com pacotes ativos
    const activeClientsCount = await prisma.client.count({
      where: {
        organization_id: admin.organizationId,
        packages: {
          some: {
            active: true,
            used_sessions: {
              lt: prisma.package.fields.total_sessions,
            },
          },
        },
      },
    });

    // 3. Pacotes finalizando (2 ou menos sessões restantes)
    // 🔥 OTIMIZAÇÃO: Trazemos para a memória APENAS os 2 números necessários
    // em vez do objeto inteiro do pacote, mantendo a performance alta.
    const packagesEndingSoon = await prisma.package.findMany({
      where: {
        organization_id: admin.organizationId,
        active: true,
      },
      select: {
        total_sessions: true,
        used_sessions: true,
      },
    });

    const packagesEndingSoonCount = packagesEndingSoon.filter(
      (pkg) =>
        pkg.total_sessions - pkg.used_sessions <= 2 &&
        pkg.total_sessions - pkg.used_sessions > 0,
    ).length;

    return NextResponse.json({
      organizationId: admin.organizationId,
      todayCheckInsCount,
      activeClientsCount,
      packagesEndingSoonCount,
    });
  } catch (error) {
    console.error("Erro ao buscar KPIs do dashboard:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

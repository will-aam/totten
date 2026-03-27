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

    // 🔥 CORREÇÃO DO FUSO HORÁRIO (Forçando o fuso do Brasil UTC-3)
    const now = new Date();
    // Pega a data atual EXATAMENTE como é no Brasil (MM/DD/YYYY)
    const todayStr = now.toLocaleDateString("en-US", {
      timeZone: "America/Sao_Paulo",
    });

    // Início do dia no Brasil (00:00:00) convertido para o timestamp real
    const startOfDay = new Date(`${todayStr} 00:00:00 GMT-0300`);

    // Fim do dia no Brasil (Início do próximo dia)
    const tomorrow = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // 1. Check-ins de hoje
    const todayCheckInsCount = await prisma.checkIn.count({
      where: {
        organization_id: admin.organizationId,
        date_time: {
          gte: startOfDay,
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

// app/api/admin/reminders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAuth();

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");

    let year: number, month: number, day: number;

    if (dateParam) {
      [year, month, day] = dateParam.split("-").map(Number);
    } else {
      // Fallback de segurança para amanhã forçando o fuso do Brasil
      const tomorrow = new Date(
        new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }),
      );
      tomorrow.setDate(tomorrow.getDate() + 1);
      year = tomorrow.getFullYear();
      month = tomorrow.getMonth() + 1;
      day = tomorrow.getDate();
    }

    // 🔥 CORREÇÃO DE FUSO HORÁRIO (UTC-3 BRASÍLIA)
    // Servidores Node (Vercel/Docker) rodam em UTC. Precisamos buscar a janela exata do Brasil
    // 00:00 no Brasil = 03:00 UTC
    const from = new Date(Date.UTC(year, month - 1, day, 3, 0, 0, 0));
    // 23:59:59 no Brasil = 02:59:59 UTC do dia seguinte
    const to = new Date(Date.UTC(year, month - 1, day + 1, 2, 59, 59, 999));

    // 🔥 OTIMIZAÇÃO DE BANCO DE DADOS: Select para trazer apenas o necessário
    const appointments = await prisma.appointment.findMany({
      where: {
        organization_id: admin.organizationId,
        date_time: {
          gte: from,
          lte: to,
        },
        status: {
          in: ["PENDENTE", "CONFIRMADO"],
        },
      },
      select: {
        id: true,
        date_time: true,
        status: true,
        client: { select: { name: true, phone_whatsapp: true } },
        service: { select: { name: true } },
      },
      orderBy: {
        date_time: "asc",
      },
    });

    // 🔥 CORREÇÃO VISUAL: Formatador fixado no horário de São Paulo
    // Ignora completamente a hora física do servidor host
    const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });

    const mapped = appointments.map((appt) => ({
      id: appt.id,
      time: timeFormatter.format(new Date(appt.date_time)),
      clientName: appt.client.name,
      phone: appt.client.phone_whatsapp,
      serviceName: appt.service.name,
      status: appt.status,
    }));

    return NextResponse.json({ appointments: mapped });
  } catch (error) {
    console.error("[GET /api/admin/reminders] ERRO:", error);
    return NextResponse.json(
      { error: "Erro ao buscar lembretes de amanhã." },
      { status: 500 },
    );
  }
}

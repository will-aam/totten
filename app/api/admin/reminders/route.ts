// app/api/admin/reminders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { startOfDay, endOfDay, addDays } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAuth();

    // Pega a data exata que o frontend mandou na URL (Calculada no fuso do cliente)
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");

    let targetDate: Date;

    if (dateParam) {
      const [year, month, day] = dateParam.split("-").map(Number);
      targetDate = new Date(year, month - 1, day);
    } else {
      // Fallback de segurança para o dia seguinte
      targetDate = addDays(new Date(), 1);
    }

    const from = startOfDay(targetDate);
    const to = endOfDay(targetDate);

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
      include: {
        client: { select: { name: true, phone_whatsapp: true } },
        service: { select: { name: true } },
      },
      orderBy: {
        date_time: "asc",
      },
    });

    const mapped = appointments.map((appt) => {
      const date = new Date(appt.date_time);
      const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

      return {
        id: appt.id,
        time,
        clientName: appt.client.name,
        phone: appt.client.phone_whatsapp,
        serviceName: appt.service.name,
        status: appt.status,
      };
    });

    return NextResponse.json({ appointments: mapped });
  } catch (error) {
    console.error("[GET /api/admin/reminders] ERRO:", error);
    return NextResponse.json(
      { error: "Erro ao buscar lembretes de amanhã." },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import { requireAuth } from "@/lib/auth";

/**
 * Lista agendamentos de um dia específico para a organização do admin logado.
 *
 * GET /api/admin/agenda/day?date=2026-03-04
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAuth();

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");

    if (!dateParam) {
      return NextResponse.json(
        { error: "Parâmetro date é obrigatório (YYYY-MM-DD)." },
        { status: 400 },
      );
    }

    const [year, month, day] = dateParam.split("-").map(Number);
    const target = new Date(year, month - 1, day);

    const from = startOfDay(target);
    const to = endOfDay(target);

    const appointments = await prisma.appointment.findMany({
      where: {
        organization_id: admin.organizationId,
        date_time: {
          gte: from,
          lte: to,
        },
        status: {
          in: ["PENDENTE", "CONFIRMADO", "REALIZADO"],
        },
      },
      include: {
        client: true,
        service: true,
        package: true,
        check_in: true,
      },
      orderBy: {
        date_time: "asc",
      },
    });

    const mapped = appointments.map((appt) => {
      const date = new Date(appt.date_time);
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const time = `${hours}:${minutes}`;

      const duration = Number(appt.service.duration ?? 60);

      let sessionInfo = "Avulsa";
      if (appt.package) {
        const current = appt.session_number ?? 1;
        sessionInfo = `Sessão ${current} de ${appt.package.total_sessions}`;
      }

      const hasCharge = appt.has_charge;

      let color = "bg-blue-100 border-blue-300 text-blue-900";
      if (appt.package_id) {
        color = "bg-emerald-100 border-emerald-300 text-emerald-900";
      }
      if (appt.status === "REALIZADO") {
        color = "bg-slate-100 border-slate-300 text-slate-900";
      }

      return {
        id: appt.id,
        time,
        duration,
        clientName: appt.client.name,
        service: appt.service.name,
        sessionInfo,
        isRecurring: Boolean(appt.package_id),
        phone: appt.client.phone_whatsapp,
        color,
        hasCharge,
        status: appt.status,
        checkInTime: appt.check_in?.date_time ?? null,
      };
    });

    return NextResponse.json({ appointments: mapped });
  } catch (error) {
    console.error("[GET /api/admin/agenda/day] ERRO:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erro ao carregar agenda do dia." },
      { status: 500 },
    );
  }
}

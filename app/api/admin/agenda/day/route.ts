// app/api/admin/agenda/day/route.ts
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

    // FORÇANDO OS LIMITES DO DIA PARA O FUSO DO BRASIL (UTC-3)
    const from = new Date(`${dateParam}T00:00:00.000-03:00`);
    const to = new Date(`${dateParam}T23:59:59.999-03:00`);

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

      // FORÇANDO O FUSO HORÁRIO DO BRASIL PARA EXIBIR A HORA CORRETA
      const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
      });
      const time = timeFormatter.format(date);

      const duration = Number(appt.service.duration ?? 60);

      // Info de sessão base (o frontend agora faz um override visual mais bonito)
      let sessionInfo = "Avulsa";
      if (appt.package) {
        const current = appt.session_number ?? 1;
        sessionInfo = `Sessão ${current} de ${appt.package.total_sessions}`;
      }

      // Pegando o preço real (Pacote ou Serviço)
      const rawPrice = appt.package?.price ?? appt.service.price ?? 0;

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
        hasCharge: appt.has_charge,
        status: appt.status,
        checkInTime: appt.check_in?.date_time ?? null,
        observations: appt.observations ?? "",
        paymentMethod: appt.payment_method ?? "nenhum",
        price: Number(rawPrice),
        date_time: appt.date_time.toISOString(),
        package_id: appt.package_id,
        session_number: appt.session_number,
        recurrence_id: appt.recurrence_id,
        package: appt.package
          ? {
              total_sessions: appt.package.total_sessions,
              used_sessions: appt.package.used_sessions,
              active: appt.package.active, // 🔥 O SEGREDO ESTÁ AQUI: Enviando a flag para o frontend
            }
          : null,
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

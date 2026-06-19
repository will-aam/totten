// app/api/admin/agenda/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/**
 * ROTA UNIFICADA DA AGENDA
 * GET /api/admin/agenda?from=2026-06-01T00:00:00.000Z&to=2026-06-30T23:59:59.999Z
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAuth();
    const role = (admin as any).role || "OWNER";

    const { searchParams } = new URL(req.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    if (!fromParam || !toParam) {
      return NextResponse.json(
        {
          error: "Os parâmetros 'from' e 'to' são obrigatórios em formato ISO.",
        },
        { status: 400 },
      );
    }

    const from = new Date(fromParam);
    const to = new Date(toParam);

    const whereClause: any = {
      organization_id: admin.organizationId,
      date_time: {
        gte: from,
        lte: to,
      },
      status: {
        in: ["PENDENTE", "CONFIRMADO", "REALIZADO", "CANCELADO"],
      },
    };

    // Trava de visibilidade para colaboradores
    if (role === "COLLABORATOR") {
      whereClause.professional_id = admin.id;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        client: true,
        service: true,
        package: true,
        check_in: true,
        professional: { select: { display_name: true } },
      },
      orderBy: {
        date_time: "asc",
      },
    });

    const mapped = appointments.map((appt) => {
      const date = new Date(appt.date_time);

      const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
      });
      const time = timeFormatter.format(date);

      // 🔥 SNAPSHOT: Prioriza os dados congelados no momento do agendamento
      const duration = Number(
        appt.snapshot_service_duration ?? appt.service.duration ?? 60,
      );
      const serviceName = appt.snapshot_service_name ?? appt.service.name;
      const snapshotPrice = appt.snapshot_service_price
        ? Number(appt.snapshot_service_price)
        : null;
      const rawPrice =
        snapshotPrice ?? appt.package?.price ?? appt.service.price ?? 0;

      let sessionInfo = "Avulsa";
      if (appt.package) {
        const current = appt.session_number ?? 1;
        sessionInfo = `Sessão ${current} de ${appt.package.total_sessions}`;
      }

      let color = "";
      const serviceNameLower = serviceName.toLowerCase();

      // 🔥 REGRAS DE CORES CENTRALIZADAS AQUI!
      if (appt.status === "CANCELADO") {
        color =
          "bg-slate-100 border-slate-300 text-slate-600 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400";
      } else if (appt.status === "REALIZADO") {
        color =
          "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/40 dark:border-blue-800 dark:text-blue-300";
      } else if (serviceNameLower.includes("contenção")) {
        color =
          "bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900/40 dark:border-emerald-800 dark:text-emerald-300";
      } else if (
        appt.check_in &&
        (appt.status === "PENDENTE" || appt.status === "CONFIRMADO")
      ) {
        color =
          "bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/40 dark:border-purple-800 dark:text-purple-300";
      } else if (appt.recurrence_id || appt.package_id) {
        color =
          "bg-teal-100 border-teal-300 text-teal-800 dark:bg-teal-900/40 dark:border-teal-800 dark:text-teal-300";
      } else {
        color =
          "bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/40 dark:border-amber-800 dark:text-amber-300";
      }

      return {
        id: appt.id,
        time,
        duration,
        clientName: appt.client.name,
        service: serviceName, // 🔥 Nome histórico
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
        professionalName: appt.professional?.display_name ?? null,
        // Mandamos os snapshots explícitos pro Modal se ele precisar
        snapshot_service_name: appt.snapshot_service_name,
        snapshot_service_duration: appt.snapshot_service_duration,
        snapshot_service_price: snapshotPrice,
        package: appt.package
          ? {
              total_sessions: appt.package.total_sessions,
              used_sessions: appt.package.used_sessions,
              active: appt.package.active,
            }
          : null,
      };
    });

    return NextResponse.json({ appointments: mapped });
  } catch (error) {
    console.error("[GET /api/admin/agenda] ERRO:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erro ao carregar agenda." },
      { status: 500 },
    );
  }
}

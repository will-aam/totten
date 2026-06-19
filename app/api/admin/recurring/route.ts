// app/api/admin/recurring/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const admin = await requireAuth();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const search = searchParams.get("q") || "";
    const skip = (page - 1) * limit;

    const baseWhere: any = {
      organization_id: admin.organizationId,
      recurrence_id: { not: null },
    };

    if (search) {
      baseWhere.OR = [
        { client: { name: { contains: search, mode: "insensitive" } } },
        { service: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const distinctRecurrences = await prisma.appointment.findMany({
      where: baseWhere,
      distinct: ["recurrence_id"],
      select: { recurrence_id: true },
    });

    const totalSeries = distinctRecurrences.length;

    const paginatedRecurrenceIds = distinctRecurrences
      .slice(skip, skip + limit)
      .map((r) => r.recurrence_id as string);

    if (paginatedRecurrenceIds.length === 0) {
      return NextResponse.json({
        data: [],
        total: totalSeries,
        page,
        totalPages: Math.ceil(totalSeries / limit) || 1,
      });
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        organization_id: admin.organizationId,
        recurrence_id: { in: paginatedRecurrenceIds },
      },
      include: {
        client: { select: { id: true, name: true, phone_whatsapp: true } },
        service: { select: { name: true } },
        package: {
          select: {
            id: true,
            name: true,
            total_sessions: true,
            used_sessions: true,
          },
        },
      },
      orderBy: {
        date_time: "asc",
      },
    });

    const grouped: Record<string, typeof appointments> = {};
    for (const appt of appointments) {
      const rid = appt.recurrence_id as string;
      if (!grouped[rid]) grouped[rid] = [];
      grouped[rid].push(appt);
    }

    const now = new Date();

    const recurringSeries = Object.entries(grouped).map(
      ([recurrenceId, series]) => {
        const firstAppt = series[0];
        const lastAppt = series[series.length - 1];

        const nextSession = series.find(
          (a) =>
            new Date(a.date_time) >= now &&
            a.status !== "CANCELADO" &&
            a.status !== "REALIZADO",
        );

        const remainingInSeries = series.filter(
          (a) =>
            new Date(a.date_time) >= now &&
            a.status !== "CANCELADO" &&
            a.status !== "REALIZADO",
        ).length;

        const startDate = new Date(firstAppt.date_time);
        const dayOfWeek = startDate
          .toLocaleDateString("pt-BR", { weekday: "long" })
          .split("-")[0];
        const timeStr = startDate.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const pattern = `Toda ${dayOfWeek} às ${timeStr}`;

        const warnings: string[] = [];
        let packageBalance = null;

        if (firstAppt.package) {
          packageBalance =
            firstAppt.package.total_sessions - firstAppt.package.used_sessions;

          if (packageBalance < remainingInSeries && remainingInSeries > 0) {
            warnings.push(
              `O pacote tem saldo de ${packageBalance} sessões, mas há ${remainingInSeries} sessões futuras na agenda.`,
            );
          }
        }

        return {
          recurrenceId,
          client: firstAppt.client,
          // 🔥 SNAPSHOT: Tenta ler o nome salvo no momento da criação, se não tiver cai pro atual
          serviceName:
            firstAppt.snapshot_service_name ?? firstAppt.service.name,
          package: firstAppt.package,
          startDate: firstAppt.date_time,
          endDate: lastAppt.date_time,
          pattern,
          totalSessions: series.length,
          completedSessions: series.filter((a) => a.status === "REALIZADO")
            .length,
          remainingInSeries,
          packageBalance,
          nextSession: nextSession ? nextSession.date_time : null,
          warnings,
          status:
            remainingInSeries === 0
              ? "FINALIZADA"
              : ("ATIVA" as "ATIVA" | "FINALIZADA"),
        };
      },
    );

    recurringSeries.sort((a, b) => {
      if (a.status !== b.status) return a.status === "ATIVA" ? -1 : 1;
      if (a.warnings.length !== b.warnings.length)
        return b.warnings.length - a.warnings.length;
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });

    return NextResponse.json({
      data: recurringSeries,
      total: totalSeries,
      page,
      totalPages: Math.ceil(totalSeries / limit) || 1,
    });
  } catch (error) {
    console.error("[GET /api/admin/recurring] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao buscar séries recorrentes" },
      { status: 500 },
    );
  }
}

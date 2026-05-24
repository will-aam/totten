// app/api/vouchers/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

// GET - Lista pacotes concluídos com Paginação e Busca Server-Side
export async function GET(request: Request) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const search = searchParams.get("q") || "";
    const skip = (page - 1) * limit;

    const whereClause: any = {
      organization_id: admin.organizationId,
      active: true,
      used_sessions: {
        gte: prisma.package.fields.total_sessions,
      },
    };

    if (search) {
      whereClause.OR = [
        { client: { name: { contains: search, mode: "insensitive" } } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    const [totalCount, completedPackages] = await Promise.all([
      prisma.package.count({ where: whereClause }),
      prisma.package.findMany({
        where: whereClause,
        include: {
          client: {
            select: { id: true, name: true },
          },
          service: {
            select: { name: true },
          },
          vouchers: {
            orderBy: { issue_date: "desc" },
            take: 1,
          },
          // Busca os check-ins vinculados ao pacote
          check_ins: {
            select: { date_time: true },
            orderBy: { date_time: "asc" },
          },
          // Busca também os agendamentos realizados caso falte um check-in
          appointments: {
            where: { status: "REALIZADO" },
            select: { date_time: true },
            orderBy: { date_time: "asc" },
          },
        },
        orderBy: {
          updated_at: "desc",
        },
        skip,
        take: limit,
      }),
    ]);

    const formatted = completedPackages.map((pkg) => {
      // Junta e ordena cronologicamente as datas de check-in e de agendamentos
      const rawDates = [
        ...pkg.check_ins.map((c) => c.date_time),
        ...pkg.appointments.map((a) => a.date_time),
      ].sort((a, b) => a.getTime() - b.getTime());

      // Filtra datas duplicadas (ex: agendamento e check-in feitos no mesmo dia)
      const uniqueDates = Array.from(
        new Set(rawDates.map((d) => d.toISOString().split("T")[0])),
      ).map((dateStr) => new Date(dateStr).toISOString());

      return {
        id: pkg.id,
        clientId: pkg.client.id,
        clientName: pkg.client.name,
        packageName: pkg.name,
        serviceName: pkg.service.name,
        totalSessions: pkg.total_sessions,
        completionDate: pkg.updated_at.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        hasVoucher: pkg.vouchers.length > 0,
        lastVoucherDate: pkg.vouchers[0]?.issue_date,
        sessionDates: uniqueDates, // Envia as datas consolidadas
      };
    });

    return NextResponse.json({
      data: formatted,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit) || 1,
    });
  } catch (error) {
    console.error("Erro ao buscar vouchers:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

// POST - Registra que um voucher foi emitido
export async function POST(request: Request) {
  // ... Código do POST continua idêntico (não alterado)
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { package_id, image_url } = body;

    if (!package_id) {
      return NextResponse.json(
        { error: "ID do pacote é obrigatório" },
        { status: 400 },
      );
    }

    const voucher = await prisma.voucher.create({
      data: {
        package_id,
        image_url: image_url || null,
      },
    });

    return NextResponse.json({
      success: true,
      voucher,
    });
  } catch (error) {
    console.error("Erro ao registrar voucher:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

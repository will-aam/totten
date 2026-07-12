// app/api/vouchers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";

// GET - Lista pacotes concluídos com Paginação e Busca Server-Side
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAuth();

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
          check_ins: {
            select: { date_time: true },
            orderBy: { date_time: "asc" },
          },
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
      const rawDates = [
        ...pkg.check_ins.map((c) => c.date_time),
        ...pkg.appointments.map((a) => a.date_time),
      ].sort((a, b) => a.getTime() - b.getTime());

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
        sessionDates: uniqueDates,
      };
    });

    return NextResponse.json({
      data: formatted,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit) || 1,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[VOUCHERS_GET]", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

// POST - Registra que um voucher foi emitido
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAuth();

    const body = await request.json();
    const { package_id, image_url } = body;

    if (!package_id) {
      return NextResponse.json(
        { error: "ID do pacote é obrigatório" },
        { status: 400 },
      );
    }

    // Validação de segurança: garante que o pacote pertence à org do admin antes de criar
    const pkg = await prisma.package.findFirst({
      where: { id: package_id, organization_id: admin.organizationId },
    });

    if (!pkg) {
      return NextResponse.json(
        { error: "Pacote não encontrado ou não pertence a esta empresa" },
        { status: 404 },
      );
    }

    // TODO: pendente decisão — voucher.create leva organization_id no data? (ver pergunta acima)
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
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[VOUCHERS_POST]", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

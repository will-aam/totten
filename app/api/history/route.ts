// app/api/history/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    // 🛡️ Validação unificada de sessão e tenant
    const admin = await requireAuth();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const search = searchParams.get("q") || "";
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const skip = (page - 1) * limit;

    // Construção robusta e segura da query
    const whereClause: Prisma.CheckInWhereInput = {
      organization_id: admin.organizationId,
      deleted_at: null,
    };

    const andConditions: Prisma.CheckInWhereInput[] = [];

    // Busca por Nome ou CPF
    if (search) {
      andConditions.push({
        client: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { cpf: { contains: search } },
          ],
        },
      });
    }

    // Filtro de Data Inicial
    if (from) {
      const fromDate = new Date(from);
      fromDate.setHours(0, 0, 0, 0);
      andConditions.push({ date_time: { gte: fromDate } });
    }

    // Filtro de Data Final
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      andConditions.push({ date_time: { lte: toDate } });
    }

    if (andConditions.length > 0) {
      whereClause.AND = andConditions;
    }

    // Execução em paralelo para performance
    const [totalCount, checkIns] = await Promise.all([
      prisma.checkIn.count({ where: whereClause }),
      prisma.checkIn.findMany({
        where: whereClause,
        include: {
          client: {
            select: {
              name: true,
              cpf: true,
            },
          },
          appointment: {
            select: {
              snapshot_service_name: true,
              service: { select: { name: true } },
            },
          },
          package: {
            select: {
              snapshot_service_name: true,
              service: { select: { name: true } },
            },
          },
        },
        orderBy: {
          date_time: "desc",
        },
        skip: skip,
        take: limit,
      }),
    ]);

    const enriched = checkIns.map((ci) => {
      // Lógica do snapshot: Prioriza dados imutáveis da época, fallback para atual
      const serviceName =
        ci.appointment?.snapshot_service_name ||
        ci.appointment?.service?.name ||
        ci.package?.snapshot_service_name ||
        ci.package?.service?.name ||
        "Serviço não identificado";

      return {
        id: ci.id,
        client_id: ci.client_id || "",
        package_id: ci.package_id || "",
        date_time: ci.date_time.toISOString(),
        client_name: ci.client?.name || "Cliente Excluído/Avulso",
        client_cpf: ci.client?.cpf || "---",
        service_name: serviceName,
      };
    });

    return NextResponse.json({
      data: enriched,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit) || 1,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[HISTORY_GET]", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

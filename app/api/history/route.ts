// app/api/history/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

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
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const skip = (page - 1) * limit;

    // Construção robusta e segura da query
    const whereClause: any = {
      organization_id: admin.organizationId,
    };

    const andConditions: any[] = [];

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

    // Fazemos a contagem total e a busca paginada em paralelo para ser muito mais rápido!
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
        },
        orderBy: {
          date_time: "desc",
        },
        skip,
        take: limit,
      }),
    ]);

    const enriched = checkIns.map((ci) => ({
      id: ci.id,
      client_id: ci.client_id || "",
      package_id: ci.package_id || "",
      date_time: ci.date_time.toISOString(),
      client_name: ci.client?.name || "Cliente Excluído/Avulso",
      client_cpf: ci.client?.cpf || "---",
    }));

    return NextResponse.json({
      data: enriched,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit) || 1,
    });
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

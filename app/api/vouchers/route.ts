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

    // 🔥 Captura parâmetros de paginação e busca da URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const search = searchParams.get("q") || "";
    const skip = (page - 1) * limit;

    // 🔥 Constrói a regra de busca base (Pacotes concluídos)
    const whereClause: any = {
      organization_id: admin.organizationId,
      active: true,
      used_sessions: {
        gte: prisma.package.fields.total_sessions, // Sessões usadas >= total
      },
    };

    // 🔥 Adiciona o filtro de texto SE o usuário estiver buscando algo
    if (search) {
      whereClause.OR = [
        { client: { name: { contains: search, mode: "insensitive" } } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    // 🔥 Executa a contagem e a busca em paralelo para máxima performance
    const [totalCount, completedPackages] = await Promise.all([
      prisma.package.count({ where: whereClause }),
      prisma.package.findMany({
        where: whereClause,
        include: {
          client: {
            select: {
              id: true,
              name: true,
            },
          },
          service: {
            select: {
              name: true,
            },
          },
          vouchers: {
            orderBy: {
              issue_date: "desc",
            },
            take: 1,
          },
        },
        orderBy: {
          updated_at: "desc",
        },
        skip, // Pula os registros das páginas anteriores
        take: limit, // Pega apenas os 15 da página atual
      }),
    ]);

    // Formata os dados para o frontend
    const formatted = completedPackages.map((pkg) => ({
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
    }));

    // 🔥 Retorna os dados envelopados com os metadados de paginação
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

    // Cria o registro de voucher
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

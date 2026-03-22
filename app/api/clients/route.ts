// app/api/clients/route.ts
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
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("q") || "";
    const activeParam = searchParams.get("active");
    const skip = (page - 1) * limit;

    // 🔥 ESTRUTURA BLINDADA: Usamos um array de AND para garantir que todos os filtros sejam respeitados
    const whereClause: any = {
      AND: [{ organization_id: admin.organizationId }],
    };

    // Se o parâmetro active=true for enviado, forçamos o filtro no banco
    if (activeParam === "true") {
      whereClause.AND.push({ active: true });
    }

    // Se houver busca, ela entra como um critério extra dentro do AND
    if (search) {
      whereClause.AND.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { cpf: { contains: search } },
          { phone_whatsapp: { contains: search } },
        ],
      });
    }

    const [totalCount, clients] = await Promise.all([
      prisma.client.count({ where: whereClause }),
      prisma.client.findMany({
        where: whereClause,
        orderBy: {
          name: "asc",
        },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          cpf: true,
          phone_whatsapp: true,
          email: true,
          active: true,
          packages: {
            where: { active: true },
            select: {
              id: true,
              name: true,
              used_sessions: true,
              total_sessions: true,
            },
          },
          _count: {
            select: {
              appointments: true,
              check_ins: true,
              packages: true,
              anamnesis_responses: true,
            },
          },
        },
      }),
    ]);

    const formattedClients = clients.map((client) => {
      // Busca o pacote ativo (com saldo)
      const activePkg = client.packages.find(
        (pkg) => pkg.used_sessions < pkg.total_sessions,
      );

      // Verifica se o cliente tem algum histórico para impedir exclusão acidental
      const hasHistory =
        client._count.appointments > 0 ||
        client._count.check_ins > 0 ||
        client._count.packages > 0;

      return {
        id: client.id,
        name: client.name,
        cpf: client.cpf,
        phone_whatsapp: client.phone_whatsapp,
        email: client.email,
        active: client.active,
        activePackageName: activePkg ? activePkg.name : null,
        hasHistory,
        hasAnamnesis: client._count.anamnesis_responses > 0,
      };
    });

    return NextResponse.json({
      data: formattedClients,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit) || 1,
    });
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

// POST - Cria um novo cliente
export async function POST(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await request.json();
    const {
      name,
      cpf,
      phone_whatsapp,
      email,
      birth_date,
      zip_code,
      city,
      street,
      number,
    } = body;

    if (!name || !cpf || !phone_whatsapp) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 },
      );
    }

    // Verifica duplicidade no CPF dentro da mesma organização
    const existingClient = await prisma.client.findUnique({
      where: {
        cpf_organization_id: {
          cpf: cpf,
          organization_id: admin.organizationId,
        },
      },
    });

    if (existingClient) {
      return NextResponse.json(
        { error: "CPF já cadastrado nesta organização" },
        { status: 409 },
      );
    }

    const client = await prisma.client.create({
      data: {
        name,
        cpf,
        phone_whatsapp,
        email: email || null,
        birth_date: birth_date ? new Date(birth_date) : null,
        zip_code: zip_code || null,
        city: city || null,
        street: street || null,
        number: number || null,
        organization_id: admin.organizationId,
        active: true,
      },
    });

    return NextResponse.json({
      success: true,
      client: { id: client.id, name: client.name },
    });
  } catch (error) {
    console.error("Erro ao criar cliente:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

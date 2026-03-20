// app/api/clients/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

// GET - Lista clientes com Paginação Server-Side, Busca e Clientes Inativos
export async function GET(request: Request) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 🔥 Puxando parâmetros de paginação e busca da URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("q") || "";
    const skip = (page - 1) * limit;

    // Construindo a query de forma dinâmica
    const whereClause: any = {
      organization_id: admin.organizationId,
      // 🔥 Removido o active: true para trazer os inativos também
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { cpf: { contains: search } },
        { phone_whatsapp: { contains: search } },
      ];
    }

    // 🔥 Faz as duas requisições em paralelo (contagem total e os dados) para alta performance
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
          birth_date: true,
          created_at: true,
          active: true, // Precisamos saber se está ativo para pintar de cinza no front
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
              anamnesis_responses: true, // 🔥 Conta as respostas de anamnese
            },
          },
        },
      }),
    ]);

    const formattedClients = clients.map((client) => {
      const activePkg = client.packages.find(
        (pkg) => pkg.used_sessions < pkg.total_sessions,
      );

      const hasHistory =
        client._count.appointments > 0 ||
        client._count.check_ins > 0 ||
        client._count.packages > 0;

      const hasAnamnesis = client._count.anamnesis_responses > 0;

      return {
        id: client.id,
        name: client.name,
        cpf: client.cpf,
        phone_whatsapp: client.phone_whatsapp,
        email: client.email,
        birth_date: client.birth_date,
        created_at: client.created_at,
        active: client.active,
        activePackageName: activePkg ? activePkg.name : null,
        hasHistory,
        hasAnamnesis, // 🔥 Enviando para a tabela exibir o ícone
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

// POST - Cria um novo cliente (Inalterado)
export async function POST(request: Request) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

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
        { error: "Nome, CPF e WhatsApp são obrigatórios" },
        { status: 400 },
      );
    }

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
        { error: "Este CPF já está cadastrado na organização" },
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
      client: {
        id: client.id,
        name: client.name,
        cpf: client.cpf,
      },
    });
  } catch (error) {
    console.error("Erro ao criar cliente:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

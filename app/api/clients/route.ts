import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

// Função auxiliar para tentar prever formatações de CPF e Telefone se o usuário digitar só números
function getSearchVariations(searchQuery: string) {
  const variations = [searchQuery];
  const onlyNumbers = searchQuery.replace(/\D/g, "");

  if (onlyNumbers.length > 0) {
    // Adiciona a versão "só números" na busca
    variations.push(onlyNumbers);

    // Se parecer um pedaço de CPF (ex: digitou 123456)
    if (onlyNumbers.length >= 3 && onlyNumbers.length <= 11) {
      let cpfFormatted = onlyNumbers.replace(/(\d{3})(\d)/, "$1.$2");
      cpfFormatted = cpfFormatted.replace(/(\d{3})(\d)/, "$1.$2");
      cpfFormatted = cpfFormatted.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      variations.push(cpfFormatted);
    }

    // Se parecer um telefone (ex: digitou 7999)
    if (onlyNumbers.length >= 2) {
      let phoneFormatted = onlyNumbers.replace(/^(\d{2})(\d)/g, "($1) $2");
      phoneFormatted = phoneFormatted.replace(/(\d)(\d{4})$/, "$1-$2");
      variations.push(phoneFormatted);
    }
  }

  return variations;
}

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

    if (activeParam === "true") {
      whereClause.AND.push({ active: true });
    }

    if (search) {
      // Pega as possíveis variações do que o usuário digitou
      const searchVariations = getSearchVariations(search);

      whereClause.AND.push({
        OR: [
          // Busca parcial no Nome (ignorando caixa alta/baixa)
          { name: { contains: search, mode: "insensitive" } },
          // Busca em CPF combinando a busca pura e as formatações estimadas
          ...searchVariations.map((val) => ({ cpf: { contains: val } })),
          // Busca em WhatsApp combinando a busca pura e as formatações estimadas
          ...searchVariations.map((val) => ({
            phone_whatsapp: { contains: val },
          })),
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
      const activePkg = client.packages.find(
        (pkg) => pkg.used_sessions < pkg.total_sessions,
      );

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

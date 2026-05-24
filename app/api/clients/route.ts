// app/api/clients/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";
import { Prisma } from "@prisma/client"; // 🔥 Importamos a tipagem do Prisma

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

    // 🔥 Refatoração Sênior: Tipagem estrita criando um array de condições
    const andConditions: Prisma.ClientWhereInput[] = [
      { organization_id: admin.organizationId },
    ];

    if (activeParam === "true") {
      andConditions.push({ active: true });
    }

    if (search) {
      const searchVariations = getSearchVariations(search);

      andConditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          ...searchVariations.map((val) => ({ cpf: { contains: val } })),
          ...searchVariations.map((val) => ({
            phone_whatsapp: { contains: val },
          })),
        ],
      });
    }

    // Passamos o array para a cláusula principal
    const whereClause: Prisma.ClientWhereInput = {
      AND: andConditions,
    };

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
            // Traz apenas os registros não arquivados/inativos
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
      // 🔥 Pega tudos os pacotes que estão ativos e que AINDA TÊM sessão sobrando
      const activePackages = client.packages.filter(
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

        // Define o nome de exibição como o principal e extrai a contagem correta:
        activePackageName:
          activePackages.length > 0 ? activePackages[0].name : null,
        activePackagesCount: activePackages.length,

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

    // 🔥 Proteção contra bug de fuso horário
    const formattedBirthDate = birth_date
      ? new Date(`${birth_date}T12:00:00Z`)
      : null;

    const client = await prisma.client.create({
      data: {
        name,
        cpf,
        phone_whatsapp,
        email: email || null,
        birth_date: formattedBirthDate,
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

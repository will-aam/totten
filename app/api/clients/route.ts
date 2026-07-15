// app/api/clients/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";
import { Prisma } from "@prisma/client";

function getSearchVariations(searchQuery: string) {
  const variations = [searchQuery];
  const onlyNumbers = searchQuery.replace(/\D/g, "");

  if (onlyNumbers.length > 0) {
    variations.push(onlyNumbers);

    if (onlyNumbers.length >= 3 && onlyNumbers.length <= 11) {
      let cpfFormatted = onlyNumbers.replace(/(\d{3})(\d)/, "$1.$2");
      cpfFormatted = cpfFormatted.replace(/(\d{3})(\d)/, "$1.$2");
      cpfFormatted = cpfFormatted.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      variations.push(cpfFormatted);
    }

    if (onlyNumbers.length >= 2) {
      let phoneFormatted = onlyNumbers.replace(/^(\d{2})(\d)/g, "($1) $2");
      phoneFormatted = phoneFormatted.replace(/(\d)(\d{4})$/, "$1-$2");
      variations.push(phoneFormatted);
    }
  }

  return variations;
}

export async function GET(request: NextRequest) {
  try {
    // 🛡️ Validação unificada de sessão e tenant
    const admin = await requireAuth();

    // Utilizando request.nextUrl (padrão NextRequest)
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("q") || "";
    const activeParam = searchParams.get("active");
    const multiplePackages = searchParams.get("multiple_packages") === "true";

    const skip = (page - 1) * limit;

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

    const whereClause: Prisma.ClientWhereInput = {
      AND: andConditions,
    };

    let totalCount = 0;
    let finalClientsList = [];

    const clientSelect = {
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
          package_template: {
            select: {
              name: true,
            },
          },
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
    };

    if (multiplePackages) {
      const allClients = await prisma.client.findMany({
        where: whereClause,
        orderBy: { name: "asc" },
        select: clientSelect,
      });

      const filteredClients = allClients.filter((client) => {
        const activePackages = client.packages.filter(
          (pkg) => pkg.used_sessions < pkg.total_sessions,
        );
        return activePackages.length > 1;
      });

      totalCount = filteredClients.length;
      finalClientsList = filteredClients.slice(skip, skip + limit);
    } else {
      const [count, paginatedClients] = await Promise.all([
        prisma.client.count({ where: whereClause }),
        prisma.client.findMany({
          where: whereClause,
          orderBy: { name: "asc" },
          skip,
          take: limit,
          select: clientSelect,
        }),
      ]);
      totalCount = count;
      finalClientsList = paginatedClients;
    }

    const formattedClients = finalClientsList.map((client) => {
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
        activePackageName:
          activePackages.length > 0
            ? activePackages[0].package_template?.name || activePackages[0].name
            : null,
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
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[GET /api/clients] Erro ao buscar clientes:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 🛡️ Garante autenticação
    const admin = await requireAuth();

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

    if (!name || !phone_whatsapp) {
      return NextResponse.json(
        { error: "Nome e WhatsApp são obrigatórios." },
        { status: 400 },
      );
    }

    // Validação de duplicidade estrita ao tenant
    if (cpf && cpf.trim() !== "") {
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
    }

    const formattedBirthDate = birth_date
      ? new Date(`${birth_date}T12:00:00Z`)
      : null;

    const client = await prisma.client.create({
      data: {
        name,
        cpf: cpf && cpf.trim() !== "" ? cpf : null,
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
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[POST /api/clients] Erro ao criar cliente:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

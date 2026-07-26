// lib/server/services/clients/client.service.ts
import { getTenantPrisma } from "@/lib/prisma";
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

function formatCpfInput(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatPhoneInput(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export class ClientService {
  static async getClients(organizationId: string) {
    const prisma = getTenantPrisma(organizationId);

    const clients = await prisma.client.findMany({
      where: {
        organization_id: organizationId,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return clients;
  }

  static async getBirthdayClients(organizationId: string) {
    const prisma = getTenantPrisma(organizationId);

    const clients = await prisma.client.findMany({
      where: {
        organization_id: organizationId,
        active: true,
        birth_date: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        phone_whatsapp: true,
        birth_date: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return clients;
  }

  static async getPaginatedClients(
    organizationId: string,
    page: number,
    limit: number,
    search: string,
    activeParam: string | null,
    multiplePackages: boolean,
  ) {
    const prisma = getTenantPrisma(organizationId);
    const skip = (page - 1) * limit;

    const andConditions: Prisma.ClientWhereInput[] = [
      { organization_id: organizationId },
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

    return {
      data: formattedClients,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit) || 1,
    };
  }

  static async createClient(
    organizationId: string,
    data: {
      name: string;
      cpf?: string;
      phone_whatsapp: string;
      email?: string;
      birth_date?: string;
      zip_code?: string;
      city?: string;
      street?: string;
      number?: string;
    },
  ) {
    const prisma = getTenantPrisma(organizationId);

    if (data.cpf && data.cpf.trim() !== "") {
      const existingClient = await prisma.client.findUnique({
        where: {
          cpf_organization_id: {
            cpf: data.cpf,
            organization_id: organizationId,
          },
        },
      });

      if (existingClient) {
        throw new Error("CPF já cadastrado nesta organização");
      }
    }

    const formattedBirthDate = data.birth_date
      ? new Date(`${data.birth_date}T12:00:00Z`)
      : null;

    return await prisma.client.create({
      data: {
        name: data.name,
        cpf: data.cpf && data.cpf.trim() !== "" ? data.cpf : null,
        phone_whatsapp: data.phone_whatsapp,
        email: data.email || null,
        birth_date: formattedBirthDate,
        zip_code: data.zip_code || null,
        city: data.city || null,
        street: data.street || null,
        number: data.number || null,
        organization_id: organizationId,
        active: true,
      },
    });
  }

  static async getClientById(id: string, organizationId: string) {
    const prisma = getTenantPrisma(organizationId);

    const client = await prisma.client.findFirst({
      where: {
        id: id,
        organization_id: organizationId,
      },
      include: {
        packages: {
          where: {
            active: true,
          },
        },
      },
    });

    if (!client) {
      throw new Error("CLIENT_NOT_FOUND");
    }

    const activePkg = client.packages.find(
      (pkg) => pkg.used_sessions < pkg.total_sessions,
    );

    return {
      client: {
        id: client.id,
        name: client.name,
        cpf: client.cpf,
        phone_whatsapp: client.phone_whatsapp,
        email: client.email,
        birth_date: client.birth_date,
        zip_code: client.zip_code,
        city: client.city,
        street: client.street,
        number: client.number,
        created_at: client.created_at,
        active: client.active,
      },
      activePackage: activePkg
        ? {
            id: activePkg.id,
            name: activePkg.name,
            total_sessions: activePkg.total_sessions,
            used_sessions: activePkg.used_sessions,
            service_id: activePkg.service_id,
          }
        : null,
    };
  }

  static async updateClient(id: string, organizationId: string, data: any) {
    const prisma = getTenantPrisma(organizationId);

    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient || existingClient.organization_id !== organizationId) {
      throw new Error("CLIENT_NOT_FOUND");
    }

    const updateData: Prisma.ClientUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone_whatsapp !== undefined)
      updateData.phone_whatsapp = data.phone_whatsapp;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.zip_code !== undefined) updateData.zip_code = data.zip_code;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.street !== undefined) updateData.street = data.street;
    if (data.number !== undefined) updateData.number = data.number;
    if (data.active !== undefined) updateData.active = data.active;

    if (data.cpf !== undefined) {
      const cpfLimpo = data.cpf && data.cpf.trim() !== "" ? data.cpf : null;

      if (cpfLimpo) {
        const cpfEmUso = await prisma.client.findFirst({
          where: {
            cpf: cpfLimpo,
            organization_id: organizationId,
            id: { not: id },
          },
        });

        if (cpfEmUso) {
          throw new Error("CPF_DUPLICATED");
        }
      }
      updateData.cpf = cpfLimpo;
    }

    if (data.birth_date !== undefined) {
      updateData.birth_date = data.birth_date
        ? new Date(`${data.birth_date}T12:00:00Z`)
        : null;
    }

    return await prisma.client.update({
      where: { id },
      data: updateData,
    });
  }

  static async deleteClient(id: string, organizationId: string) {
    const prisma = getTenantPrisma(organizationId);

    const client = await prisma.client.findFirst({
      where: { id: id, organization_id: organizationId },
      include: {
        appointments: true,
        check_ins: true,
        packages: true,
        transactions: true,
        anamnesis_responses: true,
      },
    });

    if (!client) {
      throw new Error("CLIENT_NOT_FOUND");
    }

    const hasHistory =
      client.appointments.length > 0 ||
      client.check_ins.length > 0 ||
      client.packages.length > 0 ||
      client.transactions.length > 0 ||
      client.anamnesis_responses.length > 0;

    if (hasHistory) {
      await prisma.client.update({
        where: { id: client.id },
        data: { active: false },
      });
      return { message: "Cliente desativado com sucesso", type: "SOFT_DELETE" };
    } else {
      await prisma.client.delete({
        where: { id: client.id },
      });
      return { message: "Cliente excluído com sucesso", type: "HARD_DELETE" };
    }
  }

  static async importClients(organizationId: string, clientsData: any[]) {
    if (!Array.isArray(clientsData) || clientsData.length === 0) {
      throw new Error("INVALID_DATA");
    }

    const prisma = getTenantPrisma(organizationId);

    const dataToInsert = clientsData.map((client: any) => {
      let formattedDate = null;
      if (client.birth_date) {
        const dateStr = String(client.birth_date).replace(/\D/g, "");
        if (dateStr.length === 8) {
          const day = dateStr.slice(0, 2);
          const month = dateStr.slice(2, 4);
          const year = dateStr.slice(4, 8);
          formattedDate = new Date(`${year}-${month}-${day}T12:00:00Z`);
        }
      }

      return {
        organization_id: organizationId,
        active: true,
        name: client.name || "Cliente Sem Nome",
        cpf: formatCpfInput(client.cpf || ""),
        phone_whatsapp: formatPhoneInput(client.phone_whatsapp || ""),
        email: client.email || null,
        zip_code: client.zip_code || null,
        city: client.city || null,
        street: client.street || null,
        number: client.number || null,
        birth_date: formattedDate,
      };
    });

    const validData = dataToInsert.filter((c) => c.cpf.length >= 14 && c.name);

    const result = await prisma.client.createMany({
      data: validData,
      skipDuplicates: true,
    });

    return {
      imported: result.count,
      skipped: validData.length - result.count,
    };
  }
}

// app/api/clients/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";
import type { Client, Package, CheckIn } from "@prisma/client";

type ClientWithRelations = Client & {
  packages: Package[];
  check_ins: CheckIn[];
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const client = (await prisma.client.findFirst({
      where: {
        id: id,
        organization_id: admin.organizationId,
      },
      include: {
        packages: {
          orderBy: {
            created_at: "desc",
          },
        },
        check_ins: {
          orderBy: {
            date_time: "desc",
          },
          take: 10,
        },
      },
    })) as ClientWithRelations | null;

    if (!client) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 },
      );
    }

    const activePackage = client.packages.find(
      (pkg: Package) => pkg.used_sessions < pkg.total_sessions,
    );

    return NextResponse.json({
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
        active: client.active, // 🔥 O front precisa saber se ele está inativo
      },
      packages: client.packages,
      checkIns: client.check_ins,
      activePackage: activePackage || null,
    });
  } catch (error) {
    console.error("Erro ao buscar cliente:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const client = await prisma.client.findFirst({
      where: {
        id: id,
        organization_id: admin.organizationId,
      },
      include: {
        _count: {
          select: {
            appointments: true,
            check_ins: true,
            packages: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 },
      );
    }

    // Lógica de Exclusão Inteligente
    const hasHistory =
      client._count.appointments > 0 ||
      client._count.check_ins > 0 ||
      client._count.packages > 0;

    if (hasHistory) {
      // Tem histórico: Fazemos o SOFT DELETE (Desativar)
      await prisma.client.update({
        where: { id: id },
        data: { active: false },
      });
      return NextResponse.json({ success: true, action: "deactivated" });
    } else {
      // Não tem histórico: Fazemos o HARD DELETE (Apagar do banco)
      await prisma.client.delete({
        where: { id: id },
      });
      return NextResponse.json({ success: true, action: "deleted" });
    }
  } catch (error) {
    console.error("Erro ao deletar cliente:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const { template_id, total_sessions, service_id, price } =
      await request.json();

    if (!service_id) {
      return NextResponse.json(
        { error: "service_id é obrigatório" },
        { status: 400 },
      );
    }

    const client = await prisma.client.findFirst({
      where: {
        id: id,
        organization_id: admin.organizationId,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 },
      );
    }

    let nameValue = "";
    let totalSessionsValue = 0;
    let priceValue = 0;

    if (template_id) {
      const template = await prisma.packageTemplate.findFirst({
        where: {
          id: template_id,
          organization_id: admin.organizationId,
        },
      });

      if (!template) {
        return NextResponse.json(
          { error: "Template de pacote não encontrado" },
          { status: 404 },
        );
      }

      nameValue = template.name;
      totalSessionsValue = template.total_sessions;
      priceValue = Number(template.price);
    } else {
      if (!total_sessions) {
        return NextResponse.json(
          { error: "Total de sessões é obrigatório" },
          { status: 400 },
        );
      }

      nameValue = `Pacote de ${total_sessions} sessões`;
      totalSessionsValue = Number(total_sessions);
      priceValue = Number(price || 0);
    }

    const pkg = await prisma.package.create({
      data: {
        name: nameValue,
        total_sessions: totalSessionsValue,
        used_sessions: 0,
        price: priceValue,
        client_id: id,
        organization_id: admin.organizationId,
        service_id,
      },
    });

    return NextResponse.json(pkg, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar pacote:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const client = await prisma.client.findFirst({
      where: {
        id: id,
        organization_id: admin.organizationId,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 },
      );
    }

    if (body.cpf && body.cpf !== client.cpf) {
      const existing = await prisma.client.findFirst({
        where: {
          cpf: body.cpf,
          organization_id: admin.organizationId,
          NOT: { id },
        },
        select: { id: true },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Já existe outro cliente com este CPF." },
          { status: 400 },
        );
      }
    }

    const updated = await prisma.client.update({
      where: { id },
      data: {
        name: body.name ?? client.name,
        cpf: body.cpf ?? client.cpf,
        phone_whatsapp: body.phone_whatsapp ?? client.phone_whatsapp,
        email: body.email ?? client.email,
        birth_date: body.birth_date ?? client.birth_date,
        zip_code: body.zip_code ?? client.zip_code,
        city: body.city ?? client.city,
        street: body.street ?? client.street,
        number: body.number ?? client.number,
        active: body.active !== undefined ? body.active : client.active, // 🔥 Permite reativar ou inativar o cliente via API de edição
      },
    });

    return NextResponse.json({ client: updated });
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

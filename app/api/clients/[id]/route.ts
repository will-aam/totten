// app/api/clients/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

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

    // 🔥 FASE 4: OTIMIZAÇÃO MAX!
    // Removemos os 'includes' pesados. A página agora carrega instantaneamente,
    // e os componentes filhos (Histórico, Pacotes) buscam os dados deles separadamente.
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
        active: client.active, // 🔥 Essencial para o frontend saber se bloqueia a edição
      },
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

    const hasHistory =
      client._count.appointments > 0 ||
      client._count.check_ins > 0 ||
      client._count.packages > 0;

    if (hasHistory) {
      await prisma.client.update({
        where: { id: id },
        data: { active: false },
      });
      return NextResponse.json({ success: true, action: "deactivated" });
    } else {
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

    // 🔥 CORREÇÃO DO BUG: Convertendo a string para um DateTime válido antes de salvar!
    let formattedBirthDate = client.birth_date;
    if (body.birth_date !== undefined) {
      if (body.birth_date === null) {
        formattedBirthDate = null;
      } else {
        // O front envia "YYYY-MM-DD". Concatenamos "T12:00:00Z" para criar o ISO exato.
        formattedBirthDate = new Date(`${body.birth_date}T12:00:00Z`);
      }
    }

    // Usamos '!== undefined' para permitir salvar campos vazios/null intencionalmente
    const updated = await prisma.client.update({
      where: { id },
      data: {
        name: body.name ?? client.name,
        cpf: body.cpf ?? client.cpf,
        phone_whatsapp: body.phone_whatsapp ?? client.phone_whatsapp,
        email: body.email !== undefined ? body.email : client.email,
        birth_date: formattedBirthDate,
        zip_code: body.zip_code !== undefined ? body.zip_code : client.zip_code,
        city: body.city !== undefined ? body.city : client.city,
        street: body.street !== undefined ? body.street : client.street,
        number: body.number !== undefined ? body.number : client.number,
        active: body.active !== undefined ? body.active : client.active,
      },
    });

    return NextResponse.json({ client: updated });
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

// app/api/packages/templates/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

// GET - Lista todos os templates de pacotes disponíveis
export async function GET() {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Busca todos os serviços que podem virar pacotes
    const services = await prisma.service.findMany({
      where: {
        organization_id: admin.organizationId,
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Retorna os serviços como templates de pacotes
    // (cada serviço pode ser vendido em pacotes de N sessões)
    const templates = services.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      duration: service.duration,
      price_per_session: service.price,
      category: service.category.name,
      // Sugestões de pacotes comuns
      suggested_packages: [
        { sessions: 5, total_price: Number(service.price) * 5 * 0.95 }, // 5% desc
        { sessions: 10, total_price: Number(service.price) * 10 * 0.9 }, // 10% desc
        { sessions: 20, total_price: Number(service.price) * 20 * 0.85 }, // 15% desc
      ],
    }));

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Erro ao buscar templates:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

// POST - Cria um pacote personalizado para um cliente
export async function POST(request: Request) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { client_id, service_id, total_sessions, price } = body;

    if (!client_id || !service_id || !total_sessions || !price) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 },
      );
    }

    // Verifica se o cliente pertence à organização
    const client = await prisma.client.findFirst({
      where: {
        id: client_id,
        organization_id: admin.organizationId,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 },
      );
    }

    // Busca o serviço para pegar o nome
    const service = await prisma.service.findFirst({
      where: {
        id: service_id,
        organization_id: admin.organizationId,
      },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Serviço não encontrado" },
        { status: 404 },
      );
    }

    // Cria o pacote vinculado ao cliente
    const pkg = await prisma.package.create({
      data: {
        name: `Pacote ${total_sessions}x - ${service.name}`,
        total_sessions: Number(total_sessions),
        used_sessions: 0,
        price: Number(price),
        client_id: client_id,
        service_id: service_id,
        organization_id: admin.organizationId,
      },
      include: {
        service: {
          select: {
            name: true,
            duration: true,
          },
        },
        client: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      package: pkg,
    });
  } catch (error) {
    console.error("Erro ao criar pacote:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

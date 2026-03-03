import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Busca cliente pelo CPF
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cpf = searchParams.get("cpf");

    if (!cpf) {
      return NextResponse.json({ error: "CPF é obrigatório" }, { status: 400 });
    }

    // Remove pontuação do CPF
    const cleanCpf = cpf.replace(/\D/g, "");

    // 🔥 Busca a primeira (e única) organização do sistema
    const organization = await prisma.organization.findFirst();

    if (!organization) {
      return NextResponse.json(
        { error: "Sistema não configurado" },
        { status: 500 },
      );
    }

    // Busca o cliente
    const client = await prisma.client.findFirst({
      where: {
        cpf: cleanCpf,
        organization_id: organization.id,
      },
      include: {
        packages: {
          where: {
            active: true,
            used_sessions: {
              lt: prisma.package.fields.total_sessions,
            },
          },
          include: {
            service: {
              select: {
                name: true,
              },
            },
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

    // Formata resposta
    const response = {
      id: client.id,
      name: client.name,
      phone: client.phone_whatsapp,
      packages: client.packages.map((pkg) => ({
        id: pkg.id,
        name: pkg.name,
        serviceName: pkg.service.name,
        totalSessions: pkg.total_sessions,
        usedSessions: pkg.used_sessions,
        remainingSessions: pkg.total_sessions - pkg.used_sessions,
        price: pkg.price,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro ao buscar cliente:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

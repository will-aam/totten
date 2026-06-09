import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    // 🔥 Usando a sua função utilitária que já resolve tudo!
    const admin = await getCurrentAdmin();

    if (!admin || !admin.organizationId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Busca apenas clientes ativos e que possuem data de nascimento preenchida
    const clients = await prisma.client.findMany({
      where: {
        organization_id: admin.organizationId, // Pega direto do admin logado
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
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error("Erro ao buscar aniversariantes:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar aniversariantes" },
      { status: 500 },
    );
  }
}

// app/api/birthdays/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    // 🛡️ O requireAuth garante a sessão ativa e lança o AuthError se falhar
    const admin = await requireAuth();

    // Busca apenas clientes ativos e que possuem data de nascimento preenchida
    const clients = await prisma.client.findMany({
      where: {
        organization_id: admin.organizationId, // Pega direto do admin garantido
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
    // 🛡️ Tratamento centralizado para o 401
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error("[BIRTHDAYS_GET]", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar aniversariantes" },
      { status: 500 },
    );
  }
}

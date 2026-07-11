// app/api/totem/search-client/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";

// GET - Busca cliente pelo CPF + organização (via sessão do admin do totem)
export async function GET(request: Request) {
  try {
    // 🛡️ Validação unificada de tenant
    const admin = await requireAuth();

    const { searchParams } = new URL(request.url);
    const cpf = searchParams.get("cpf");

    if (!cpf) {
      return NextResponse.json({ error: "CPF é obrigatório" }, { status: 400 });
    }

    const cleanCpf = cpf.replace(/\D/g, "");

    const cpfFormatado =
      cleanCpf.length === 11
        ? cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
        : cpf;

    const cpfCandidates = Array.from(
      new Set([cpf.trim(), cleanCpf, cpfFormatado]),
    );

    // Busca o cliente dentro do escopo da organização do totem
    const client = await prisma.client.findFirst({
      where: {
        cpf: { in: cpfCandidates },
        organization_id: admin.organizationId,
      },
      include: {
        packages: {
          where: {
            active: true,
            used_sessions: {
              lt: prisma.package.fields.total_sessions, // Verifica saldo de sessões
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
    // 🛡️ Tratamento de erro centralizado
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: "Não autorizado. Totem não está autenticado." },
        { status: 401 },
      );
    }
    console.error("[TOTEM_SEARCH_CLIENT]", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

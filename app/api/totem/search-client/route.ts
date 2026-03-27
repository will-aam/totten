// app/api/totem/search-client/route.ts
// rota importada no arquivo app/totem/check-in/totem-check-in-content.tsx, a função dela é buscar os dados do cliente e seus pacotes ativos (se houver) a partir do CPF, para exibir no resumo do check-in e também validar se o cliente tem pacotes ativos com sessões restantes antes de permitir o check-in pelo totem.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth"; // 🔥 Import adicionado

// GET - Busca cliente pelo CPF + organização (via sessão)
export async function GET(request: Request) {
  try {
    // 🔒 1. Valida a sessão do totem
    const admin = await getCurrentAdmin();

    if (!admin || !admin.organizationId) {
      return NextResponse.json(
        { error: "Não autorizado. Totem não está autenticado." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const cpf = searchParams.get("cpf");

    // 🔥 2. Removida a validação de slug
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

    // 🔥 3. Busca o cliente usando diretamente o ID da sessão
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

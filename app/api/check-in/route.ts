// app/api/check-in/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // 🔒 PASSO 1: Extrai o organization_id da sessão do Admin logado
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          error: "UNAUTHORIZED",
          message: "Sessão expirada. Faça login novamente.",
        },
        { status: 401 },
      );
    }

    const { cpf } = await request.json();

    if (!cpf) {
      return NextResponse.json(
        { error: "CPF_REQUIRED", message: "CPF é obrigatório" },
        { status: 400 },
      );
    }

    // 🔒 PASSO 2: Busca o cliente APENAS dentro da organização da sessão
    const client = await prisma.client.findFirst({
      where: {
        cpf: cpf,
        organization_id: admin.organizationId, // 🎯 ISOLAMENTO TOTAL
      },
      include: {
        packages: {
          where: {
            active: true,
          },
          orderBy: {
            created_at: "desc",
          },
          take: 1,
        },
      },
    });

    // Cliente não existe nessa organização
    if (!client) {
      return NextResponse.json(
        {
          error: "CLIENT_NOT_FOUND",
          message: "CPF não cadastrado nesta empresa",
        },
        { status: 404 },
      );
    }

    // Cliente existe mas não tem pacote ativo
    if (!client.packages || client.packages.length === 0) {
      return NextResponse.json(
        { error: "NO_ACTIVE_PACKAGE", message: "Você não possui pacote ativo" },
        { status: 404 },
      );
    }

    const activePackage = client.packages[0];

    // Pacote já foi totalmente usado
    if (activePackage.used_sessions >= activePackage.total_sessions) {
      return NextResponse.json(
        {
          error: "PACKAGE_COMPLETED",
          message: "Todas as sessões já foram utilizadas",
        },
        { status: 400 },
      );
    }

    // 🔒 PASSO 3: Registra o check-in DENTRO da organização
    const checkIn = await prisma.checkIn.create({
      data: {
        client_id: client.id,
        package_id: activePackage.id,
        organization_id: admin.organizationId, // 🎯 REGISTRA NA ORGANIZAÇÃO CERTA
      },
    });

    // 🔥 CALCULA SE O PACOTE DEVE SER ARQUIVADO
    const newUsedSessions = activePackage.used_sessions + 1;
    const willRemainActive = newUsedSessions < activePackage.total_sessions;

    // Atualiza o contador de sessões usadas e inativa se bateu o limite
    await prisma.package.update({
      where: { id: activePackage.id },
      data: {
        used_sessions: newUsedSessions,
        active: willRemainActive, // 🎯 A mágica acontece aqui
      },
    });

    return NextResponse.json({
      success: true,
      client: {
        id: client.id,
        name: client.name,
      },
      package_info: {
        used_sessions: newUsedSessions,
        total_sessions: activePackage.total_sessions,
      },
      check_in: {
        id: checkIn.id,
        date_time: checkIn.date_time,
      },
    });
  } catch (error) {
    console.error("Erro no check-in:", error);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Erro ao processar check-in" },
      { status: 500 },
    );
  }
}

// app/api/check-in/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // 🛡️ Validação unificada: se falhar, cai direto no catch como AuthError
    const admin = await requireAuth();

    const { cpf } = await request.json();

    if (!cpf) {
      return NextResponse.json(
        { error: "CPF_REQUIRED", message: "CPF é obrigatório" },
        { status: 400 },
      );
    }

    // Busca o cliente dentro do escopo da organização
    const client = await prisma.client.findFirst({
      where: {
        cpf: cpf,
        organization_id: admin.organizationId,
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

    if (!client) {
      return NextResponse.json(
        {
          error: "CLIENT_NOT_FOUND",
          message: "CPF não cadastrado nesta empresa",
        },
        { status: 404 },
      );
    }

    if (!client.packages || client.packages.length === 0) {
      return NextResponse.json(
        { error: "NO_ACTIVE_PACKAGE", message: "Você não possui pacote ativo" },
        { status: 404 },
      );
    }

    const activePackage = client.packages[0];

    if (activePackage.used_sessions >= activePackage.total_sessions) {
      return NextResponse.json(
        {
          error: "PACKAGE_COMPLETED",
          message: "Todas as sessões já foram utilizadas",
        },
        { status: 400 },
      );
    }

    // Registra o check-in na organização correta
    const checkIn = await prisma.checkIn.create({
      data: {
        client_id: client.id,
        package_id: activePackage.id,
        organization_id: admin.organizationId,
      },
    });

    const newUsedSessions = activePackage.used_sessions + 1;
    const willRemainActive = newUsedSessions < activePackage.total_sessions;

    // organization_id embutido no where: blinda a mutação mesmo que o
    // vínculo via client deixe de garantir o escopo em uma refatoração futura
    await prisma.package.update({
      where: { id: activePackage.id, organization_id: admin.organizationId },
      data: {
        used_sessions: newUsedSessions,
        active: willRemainActive,
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
    // 🛡️ Intercepta o erro de autenticação e mantém o contrato da API
    if (error instanceof AuthError) {
      return NextResponse.json(
        {
          error: "UNAUTHORIZED",
          message: "Sessão expirada. Faça login novamente.",
        },
        { status: 401 },
      );
    }

    console.error("Erro no check-in:", error);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Erro ao processar check-in" },
      { status: 500 },
    );
  }
}

// app/api/check-in/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { TotemCheckInService } from "@/lib/server/services/totem/checkin.service";

export async function POST(request: NextRequest) {
  try {
    // 🛡️ Validação unificada: garante que o dispositivo Totem tem uma sessão válida
    const admin = await requireAuth();

    const { cpf } = await request.json();

    if (!cpf) {
      return NextResponse.json(
        { error: "CPF_REQUIRED", message: "CPF é obrigatório" },
        { status: 400 },
      );
    }

    // Delega toda a complexidade de transação, busca e validação de pacotes para o Service
    const result = await TotemCheckInService.processCheckInByCpf(
      cpf,
      admin.organizationId,
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
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

    // Mapeia os erros de negócio lançados pelo Service para as respostas HTTP esperadas pelo Totem
    if (error.message === "CLIENT_NOT_FOUND") {
      return NextResponse.json(
        {
          error: "CLIENT_NOT_FOUND",
          message: "CPF não cadastrado nesta empresa",
        },
        { status: 404 },
      );
    }

    if (error.message === "NO_ACTIVE_PACKAGE") {
      return NextResponse.json(
        { error: "NO_ACTIVE_PACKAGE", message: "Você não possui pacote ativo" },
        { status: 404 },
      );
    }

    if (error.message === "PACKAGE_COMPLETED") {
      return NextResponse.json(
        {
          error: "PACKAGE_COMPLETED",
          message: "Todas as sessões já foram utilizadas",
        },
        { status: 400 },
      );
    }

    console.error("[POST /api/check-in] Erro no check-in:", error);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Erro ao processar check-in" },
      { status: 500 },
    );
  }
}

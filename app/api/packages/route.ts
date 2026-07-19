// app/api/packages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { PackageService } from "@/lib/server/services/packages/package.service";

export async function POST(request: NextRequest) {
  try {
    // 🛡️ Validação unificada de sessão e extração do tenant
    const admin = await requireAuth();
    const body = await request.json();

    // Delega toda a validação de regras de negócio, travas de pacote ativo
    // e transações financeiras para a camada de serviço.
    const result = await PackageService.createPackage(
      admin.organizationId,
      body,
    );

    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Mapeamento de erros de domínio para respostas HTTP amigáveis
    const domainErrors: Record<string, { message: string; status: number }> = {
      INVALID_DATA: { message: "Dados inválidos", status: 400 },
      UPFRONT_PAYMENT_METHOD_REQUIRED: {
        message: "Selecione a forma de pagamento para venda à vista.",
        status: 400,
      },
      INVALID_INSTALLMENTS_COUNT: {
        message: "O número de parcelas deve ser entre 2 e 48.",
        status: 400,
      },
      CLIENT_NOT_FOUND: { message: "Cliente não encontrado", status: 404 },
      ACTIVE_PACKAGE_EXISTS: {
        message:
          "Este cliente já possui um Pacote ativo. Encerre o atual antes de vender um novo pacote.",
        status: 400,
      },
      SERVICE_NOT_FOUND: { message: "Serviço não encontrado", status: 404 },
    };

    if (error.message && domainErrors[error.message]) {
      const mappedError = domainErrors[error.message];
      return NextResponse.json(
        { error: mappedError.message },
        { status: mappedError.status },
      );
    }

    console.error("[PACKAGES_POST]", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

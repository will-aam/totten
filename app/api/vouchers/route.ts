// app/api/vouchers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { VoucherService } from "@/lib/server/services/vouchers/voucher.service";

// GET - Lista pacotes concluídos com Paginação e Busca Server-Side
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAuth();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const search = searchParams.get("q") || "";

    // Delega a busca e paginação para a camada de serviço
    const result = await VoucherService.getCompletedPackages(
      admin.organizationId,
      page,
      limit,
      search,
    );

    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[VOUCHERS_GET]", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

// POST - Registra que um voucher foi emitido
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAuth();
    const body = await request.json();
    const { package_id, image_url } = body;

    if (!package_id) {
      return NextResponse.json(
        { error: "ID do pacote é obrigatório" },
        { status: 400 },
      );
    }

    // Delega a validação de segurança e criação para a camada de serviço
    const voucher = await VoucherService.createVoucher(
      admin.organizationId,
      package_id,
      image_url,
    );

    return NextResponse.json({
      success: true,
      voucher,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Intercepta o erro de negócio lançado pelo Service
    if (error.message === "PACKAGE_NOT_FOUND") {
      return NextResponse.json(
        { error: "Pacote não encontrado ou não pertence a esta empresa" },
        { status: 404 },
      );
    }

    console.error("[VOUCHERS_POST]", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

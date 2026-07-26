// app/api/categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { CategoryService } from "@/lib/server/services/categories/category.service";

// GET - Lista todas as categorias da organização
export async function GET(request: NextRequest) {
  try {
    // 🛡️ Validação unificada de tenant/sessão
    const admin = await requireAuth();

    // 🔍 Captura query param para filtragem condicional
    const { searchParams } = new URL(request.url);
    const onlyActive = searchParams.get("active") === "true";

    // Delega a busca no banco (com isolamento de tenant) para a camada de serviço
    const categories = await CategoryService.getCategories(
      admin.organizationId,
      onlyActive,
    );

    return NextResponse.json(categories);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[CATEGORIES_GET]", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

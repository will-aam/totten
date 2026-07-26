// app/actions/categories.ts
"use server";

import { requireAuth } from "@/lib/auth";
import { CategoryService } from "@/lib/server/services/categories/category.service";

export async function createCategoryAction(name: string) {
  try {
    // 🛡️ Garante escopo de tenant antes de processar o payload
    const admin = await requireAuth();

    if (!name || !name.trim()) {
      return { error: "Nome da categoria é obrigatório" };
    }

    // Delega a criação (e a validação de duplicidade) para a camada de serviço
    const category = await CategoryService.createCategory(
      admin.organizationId,
      name,
    );

    return { success: true, category };
  } catch (error: any) {
    if (error.name === "AuthError" || error.message === "Não autorizado") {
      return { error: "Sessão expirada ou não autorizado" };
    }

    // Tratamento amigável para o erro de colisão que lançamos no Service
    if (error.message === "Categoria já existe") {
      return { error: error.message };
    }

    console.error("[ACTION createCategory] ERRO:", error);
    return { error: "Erro interno do servidor" };
  }
}

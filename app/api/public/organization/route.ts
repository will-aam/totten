export const dynamic = "force-dynamic";
// app/api/public/organization/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { PublicOrganizationService } from "@/lib/server/services/public/organization.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    // 1) Tenta pegar o ID da organizaÃ§Ã£o pela sessÃ£o do NextAuth (caso seja o Totem logado)
    const session = await getServerSession(authOptions);
    const organizationId = session?.user?.organizationId;

    // 2) FLEXIBILIDADE: Se nÃ£o tem sessÃ£o nem slug, retornamos 200 vazio
    // para nÃ£o quebrar o carregamento do frontend (estado Idle).
    if (!organizationId && !slug) {
      return NextResponse.json(
        { message: "IdentificaÃ§Ã£o da clÃ­nica pendente..." },
        { status: 200 },
      );
    }

    // 3) Delega toda a busca e resoluÃ§Ã£o de ID/Slug para a camada de ServiÃ§o
    const publicInfo = await PublicOrganizationService.getPublicInfo(
      organizationId,
      slug,
    );

    // Se o serviÃ§o nÃ£o encontrou a organizaÃ§Ã£o (ID invÃ¡lido ou Slug inexistente)
    if (!publicInfo) {
      return NextResponse.json(
        { message: "IdentificaÃ§Ã£o da clÃ­nica pendente..." },
        { status: 200 },
      );
    }

    // Retorna os dados mapeados perfeitamente para o frontend
    return NextResponse.json(publicInfo);
  } catch (error: any) {
    if (error.message === "SETTINGS_NOT_FOUND") {
      return NextResponse.json(
        { error: "ConfiguraÃ§Ãµes nÃ£o encontradas." },
        { status: 404 },
      );
    }

    console.error("[PUBLIC_ORGANIZATION_GET] ERRO:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor." },
      { status: 500 },
    );
  }
}



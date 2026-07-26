// app/api/public/organization/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PublicOrganizationService } from "@/lib/server/services/public/organization.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    // 1) Tenta pegar o ID da organização pela sessão do NextAuth (caso seja o Totem logado)
    const session = await getServerSession(authOptions);
    const organizationId = session?.user?.organizationId;

    // 2) FLEXIBILIDADE: Se não tem sessão nem slug, retornamos 200 vazio
    // para não quebrar o carregamento do frontend (estado Idle).
    if (!organizationId && !slug) {
      return NextResponse.json(
        { message: "Identificação da clínica pendente..." },
        { status: 200 },
      );
    }

    // 3) Delega toda a busca e resolução de ID/Slug para a camada de Serviço
    const publicInfo = await PublicOrganizationService.getPublicInfo(
      organizationId,
      slug,
    );

    // Se o serviço não encontrou a organização (ID inválido ou Slug inexistente)
    if (!publicInfo) {
      return NextResponse.json(
        { message: "Identificação da clínica pendente..." },
        { status: 200 },
      );
    }

    // Retorna os dados mapeados perfeitamente para o frontend
    return NextResponse.json(publicInfo);
  } catch (error: any) {
    if (error.message === "SETTINGS_NOT_FOUND") {
      return NextResponse.json(
        { error: "Configurações não encontradas." },
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

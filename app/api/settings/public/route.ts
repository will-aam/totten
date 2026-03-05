import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/**
 * Retorna configurações públicas da clínica (Settings),
 * incluindo nome fantasia e horários de funcionamento.
 *
 * GET /api/settings/public
 * GET /api/settings/public?slug=clinica-x
 */
export async function GET(req: NextRequest) {
  try {
    let organizationId: string | null = null;

    // 1) Tenta sessão do admin (quando logado)
    try {
      const admin = await requireAuth();
      organizationId = admin.organizationId;
    } catch (err) {
      // Sem sessão → continua e tenta via slug
    }

    // 2) Se não tem sessão, tenta slug
    if (!organizationId) {
      const { searchParams } = new URL(req.url);
      const slug = searchParams.get("slug");

      if (!slug) {
        return NextResponse.json(
          { error: "organizationSlug (slug) é obrigatório." },
          { status: 400 },
        );
      }

      const org = await prisma.organization.findUnique({
        where: { slug },
      });

      if (!org) {
        return NextResponse.json(
          { error: "Organização não encontrada." },
          { status: 404 },
        );
      }

      organizationId = org.id;
    }

    const settings = await prisma.settings.findUnique({
      where: {
        organization_id: organizationId,
      },
      select: {
        company_name: true,
        trade_name: true,
        opening_time: true,
        closing_time: true,
      },
    });

    if (!settings) {
      return NextResponse.json(
        { error: "Configurações não encontradas para essa organização." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      companyName: settings.company_name,
      tradeName: settings.trade_name,
      openingTime: settings.opening_time,
      closingTime: settings.closing_time,
    });
  } catch (error) {
    console.error("[GET /api/settings/public] ERRO:", error);
    return NextResponse.json(
      { error: "Erro ao carregar configurações públicas." },
      { status: 500 },
    );
  }
}

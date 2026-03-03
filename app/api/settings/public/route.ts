import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Busca configurações públicas (sem autenticação)
export async function GET() {
  try {
    // 🔥 Busca a primeira organização do sistema
    const organization = await prisma.organization.findFirst({
      include: {
        settings: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Sistema não configurado" },
        { status: 500 },
      );
    }

    // Retorna apenas dados públicos (não sensíveis)
    const publicData = {
      tradeName:
        organization.settings?.trade_name || organization.name || "Totten",
      companyName: organization.settings?.company_name || organization.name,
      phone: organization.settings?.phone_whatsapp || "",
    };

    return NextResponse.json(publicData);
  } catch (error) {
    console.error("Erro ao buscar configurações públicas:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

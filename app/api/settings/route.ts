import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

// GET - Busca as configurações da organização
export async function GET() {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Busca as configurações da organização do admin
    const settings = await prisma.settings.findUnique({
      where: {
        organization_id: admin.organizationId,
      },
    });

    if (!settings) {
      return NextResponse.json(
        { error: "Configurações não encontradas" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      companyName: settings.company_name,
      tradeName: settings.trade_name || "", // 🔥 ADICIONADO
      document: settings.document || "",
      contactPhone: settings.phone_landline || "",
      whatsapp: settings.phone_whatsapp || "",
      email: settings.email_admin || "",
      openingTime: settings.opening_time,
      closingTime: settings.closing_time,
    });
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

// PUT - Atualiza as configurações
export async function PUT(request: Request) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { companyName, tradeName, document, contactPhone } = body;

    // 🔥 ATUALIZA APENAS O SETTINGS (NÃO mexe mais na Organization)
    await prisma.settings.update({
      where: {
        organization_id: admin.organizationId,
      },
      data: {
        company_name: companyName,
        trade_name: tradeName, // 🔥 ADICIONADO
        document: document,
        phone_landline: contactPhone,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Configurações atualizadas com sucesso",
    });
  } catch (error) {
    console.error("Erro ao atualizar configurações:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

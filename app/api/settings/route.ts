import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const settings = await prisma.settings.findUnique({
      where: { organization_id: admin.organizationId },
    });

    if (!settings)
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    return NextResponse.json({
      companyName: settings.company_name,
      tradeName: settings.trade_name || "",
      document: settings.document || "",
      contactPhone: settings.phone_landline || "",
      whatsapp: settings.phone_whatsapp || "", // Retorna como está no banco
      email: settings.email_admin || "",
      openingTime: settings.opening_time,
      closingTime: settings.closing_time,
    });
  } catch (error) {
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await request.json();
    const {
      companyName,
      tradeName,
      document,
      contactPhone,
      whatsapp, // 🔥 Agora extraímos o whatsapp do body
      openingTime,
      closingTime,
    } = body;

    const existingSettings = await prisma.settings.findUnique({
      where: { organization_id: admin.organizationId },
      include: { organization: true },
    });

    const updateData: any = {};
    if (companyName !== undefined) updateData.company_name = companyName;
    if (tradeName !== undefined) updateData.trade_name = tradeName;
    if (document !== undefined) updateData.document = document;
    if (contactPhone !== undefined) updateData.phone_landline = contactPhone;
    if (whatsapp !== undefined) updateData.phone_whatsapp = whatsapp; // 🔥 Corrigido: Agora atualiza no banco!
    if (openingTime !== undefined) updateData.opening_time = openingTime;
    if (closingTime !== undefined) updateData.closing_time = closingTime;

    await prisma.settings.upsert({
      where: { organization_id: admin.organizationId },
      update: updateData,
      create: {
        organization_id: admin.organizationId,
        company_name:
          companyName || existingSettings?.organization.name || "Minha Empresa",
        trade_name: tradeName || "",
        document: document || "",
        phone_landline: contactPhone || "",
        phone_whatsapp: whatsapp || "", // 🔥 Usa a variável correta
        opening_time: openingTime || "08:00",
        closing_time: closingTime || "19:00",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar settings:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

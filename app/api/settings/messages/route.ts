import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

// GET - Busca templates de mensagem
export async function GET() {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Busca configurações (para pegar o WhatsApp remetente, caso algum outro lugar ainda use)
    const settings = await prisma.settings.findUnique({
      where: { organization_id: admin.organizationId },
    });

    // Busca templates de mensagem
    const templates = await prisma.messageTemplate.findMany({
      where: { organization_id: admin.organizationId },
    });

    const templatesMap: Record<string, string> = {};
    templates.forEach((t) => {
      templatesMap[t.type] = t.content;
    });

    return NextResponse.json({
      phone: settings?.phone_whatsapp || "",
      msgUpdate: templatesMap["CHECK_IN"] || "",
      msgWelcome: templatesMap["WELCOME"] || "",
      msgRenewal: templatesMap["RENEWAL"] || "",
      msgReminder: templatesMap["REMINDER"] || "",
    });
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

// PUT - Atualiza APENAS os templates (O WhatsApp agora fica na aba Geral)
export async function PUT(request: Request) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { msgUpdate, msgWelcome, msgRenewal, msgReminder } = body;

    await prisma.$transaction(async (tx) => {
      const templates = [
        { type: "CHECK_IN", content: msgUpdate },
        { type: "WELCOME", content: msgWelcome },
        { type: "RENEWAL", content: msgRenewal },
        { type: "REMINDER", content: msgReminder },
      ];

      for (const template of templates) {
        // Ignora se a mensagem não foi enviada no payload
        if (template.content === undefined) continue;

        await tx.messageTemplate.upsert({
          where: {
            type_organization_id: {
              type: template.type,
              organization_id: admin.organizationId,
            },
          },
          update: {
            content: template.content,
          },
          create: {
            type: template.type,
            content: template.content,
            organization_id: admin.organizationId,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Mensagens atualizadas com sucesso",
    });
  } catch (error) {
    console.error("Erro ao atualizar mensagens:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

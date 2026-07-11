// app/api/settings/messages/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";

// GET - Busca templates de mensagem formatados para a organização
export async function GET() {
  try {
    const admin = await requireAuth();

    const settings = await prisma.settings.findUnique({
      where: { organization_id: admin.organizationId },
    });

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
      msgManualConfirmation: templatesMap["MANUAL_CONFIRMATION"] || "",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[MESSAGES_GET]", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

// PUT - Atualiza templates utilizando upsert via transação
export async function PUT(request: Request) {
  try {
    const admin = await requireAuth();

    const body = await request.json();
    const {
      msgUpdate,
      msgWelcome,
      msgRenewal,
      msgReminder,
      msgManualConfirmation,
    } = body;

    await prisma.$transaction(async (tx) => {
      const templates = [
        { type: "CHECK_IN", content: msgUpdate },
        { type: "WELCOME", content: msgWelcome },
        { type: "RENEWAL", content: msgRenewal },
        { type: "REMINDER", content: msgReminder },
        { type: "MANUAL_CONFIRMATION", content: msgManualConfirmation },
      ];

      for (const template of templates) {
        // Ignora campos não fornecidos no request
        if (template.content === undefined) continue;

        await tx.messageTemplate.upsert({
          where: {
            type_organization_id: {
              type: template.type,
              organization_id: admin.organizationId,
            },
          },
          update: { content: template.content },
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
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[MESSAGES_PUT]", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

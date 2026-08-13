"use server";

import { prisma } from "@/lib/prisma";
import { TotemService } from "@/lib/server/services/totem/totem.service";

export async function getClientHistoryByPhone(slug: string, phone: string) {
  try {
    const valorLimpo = phone.replace(/\D/g, "");
    
    const org = await prisma.organization.findUnique({
      where: { slug }
    });

    if (!org) {
      return { success: false, error: "Organização não encontrada" };
    }

    let phoneFormatado = phone;
    if (valorLimpo.length === 11) {
      phoneFormatado = `(${valorLimpo.slice(0, 2)}) ${valorLimpo.slice(2, 7)}-${valorLimpo.slice(7)}`;
    } else if (valorLimpo.length === 10) {
      phoneFormatado = `(${valorLimpo.slice(0, 2)}) ${valorLimpo.slice(2, 6)}-${valorLimpo.slice(6)}`;
    }

    const phoneCandidates = Array.from(
      new Set([
        phone.trim(),
        valorLimpo,
        phoneFormatado,
        `+55${valorLimpo}`,
        `+55 ${phoneFormatado}`,
      ]),
    );

    const client = await prisma.client.findFirst({
      where: {
        organization_id: org.id,
        phone_whatsapp: { in: phoneCandidates }
      }
    });

    if (!client) {
      return { success: false, error: "Cliente não encontrado" };
    }

    const history = await TotemService.getClientHistory(client.id, slug);
    return { success: true, data: history, clientName: client.name };
  } catch (error: any) {
    console.error("Erro ao buscar histórico público:", error);
    return { success: false, error: "Erro ao buscar histórico" };
  }
}

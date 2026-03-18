// app/actions/anamnesis.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ==========================================
// TEMPLATES (Modelos de Fichas)
// ==========================================

// Busca APENAS os templates ATIVOS (para usar no select da ficha da cliente)
export async function getAnamnesisTemplates(organizationId: string) {
  try {
    const templates = await prisma.anamnesisTemplate.findMany({
      where: {
        organization_id: organizationId,
        active: true,
      },
      orderBy: { created_at: "desc" },
    });
    return { success: true, data: templates };
  } catch (error) {
    console.error("Erro ao buscar templates:", error);
    return { success: false, error: "Erro ao carregar os modelos de ficha." };
  }
}

// 🔥 NOVA: Busca TODOS os templates (Ativos e Inativos) para a tela de listagem/gerenciamento
export async function getAllAnamnesisTemplates(organizationId: string) {
  try {
    const templates = await prisma.anamnesisTemplate.findMany({
      where: { organization_id: organizationId },
      orderBy: { created_at: "desc" },
    });
    return { success: true, data: templates };
  } catch (error) {
    console.error("Erro ao buscar todos os templates:", error);
    return { success: false, error: "Erro ao carregar os modelos de ficha." };
  }
}

// 🔥 NOVA: Busca um template específico pelo ID (para carregar na tela de edição)
export async function getAnamnesisTemplateById(templateId: string) {
  try {
    const template = await prisma.anamnesisTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template) return { success: false, error: "Modelo não encontrado." };
    return { success: true, data: template };
  } catch (error) {
    console.error("Erro ao buscar template:", error);
    return { success: false, error: "Erro ao carregar o modelo." };
  }
}

export async function createAnamnesisTemplate(data: {
  name: string;
  fields: any; // O JSON com a estrutura das perguntas
  organizationId: string;
}) {
  try {
    const template = await prisma.anamnesisTemplate.create({
      data: {
        name: data.name,
        fields: data.fields,
        organization_id: data.organizationId,
      },
    });

    // Atualiza o cache da rota onde os templates são listados
    revalidatePath("/admin/anamnesis");
    return { success: true, data: template };
  } catch (error) {
    console.error("Erro ao criar template:", error);
    return { success: false, error: "Erro ao salvar o modelo de ficha." };
  }
}

// 🔥 NOVA: Atualiza os dados do template (Nome e Campos)
export async function updateAnamnesisTemplate(
  templateId: string,
  data: { name: string; fields: any },
) {
  try {
    const template = await prisma.anamnesisTemplate.update({
      where: { id: templateId },
      data: {
        name: data.name,
        fields: data.fields,
      },
    });
    revalidatePath("/admin/anamnesis");
    return { success: true, data: template };
  } catch (error) {
    console.error("Erro ao atualizar template:", error);
    return { success: false, error: "Erro ao atualizar o modelo." };
  }
}

// 🔥 NOVA: Alterna o status entre Ativo e Inativo (Desativar/Reativar)
export async function toggleAnamnesisTemplateStatus(
  templateId: string,
  currentStatus: boolean,
) {
  try {
    await prisma.anamnesisTemplate.update({
      where: { id: templateId },
      data: { active: !currentStatus },
    });
    revalidatePath("/admin/anamnesis");
    return { success: true };
  } catch (error) {
    console.error("Erro ao alterar status:", error);
    return { success: false, error: "Erro ao alterar o status do modelo." };
  }
}

// ==========================================
// RESPOSTAS (Fichas Preenchidas das Clientes)
// ==========================================

export async function getClientAnamnesisResponses(clientId: string) {
  try {
    const responses = await prisma.anamnesisResponse.findMany({
      where: { client_id: clientId },
      include: {
        template: {
          select: { name: true }, // Trazemos o nome do template para a UI
        },
      },
      orderBy: { created_at: "desc" },
    });
    return { success: true, data: responses };
  } catch (error) {
    console.error("Erro ao buscar fichas da cliente:", error);
    return { success: false, error: "Erro ao carregar o histórico de fichas." };
  }
}

export async function saveAnamnesisResponse(data: {
  templateId: string;
  clientId: string;
  organizationId: string;
  content: any; // As respostas
}) {
  try {
    const response = await prisma.anamnesisResponse.create({
      data: {
        template_id: data.templateId,
        client_id: data.clientId,
        organization_id: data.organizationId,
        content: data.content,
        // Nasce sem assinatura e sem data de assinatura
      },
    });

    revalidatePath(`/admin/clients/${data.clientId}`);
    return { success: true, data: response };
  } catch (error) {
    console.error("Erro ao salvar ficha:", error);
    return { success: false, error: "Erro ao salvar a ficha." };
  }
}

// 🔥 A MÁGICA DA IMUTABILIDADE ACONTECE AQUI
export async function signAnamnesisResponse(
  responseId: string,
  signatureBase64: string,
) {
  try {
    // 1. Verificamos se a ficha existe e SE JÁ FOI ASSINADA
    const existingResponse = await prisma.anamnesisResponse.findUnique({
      where: { id: responseId },
    });

    if (!existingResponse) {
      return { success: false, error: "Ficha não encontrada." };
    }

    if (existingResponse.signed_at) {
      return {
        success: false,
        error: "Esta ficha já foi assinada e não pode ser alterada.",
      };
    }

    // 2. Registramos a assinatura e a data/hora exata do "lock" (bloqueio)
    const signedResponse = await prisma.anamnesisResponse.update({
      where: { id: responseId },
      data: {
        signature: signatureBase64,
        signed_at: new Date(), // Isso bloqueia futuras edições
      },
    });

    revalidatePath(`/admin/clients/${existingResponse.client_id}`);
    return { success: true, data: signedResponse };
  } catch (error) {
    console.error("Erro ao assinar ficha:", error);
    return { success: false, error: "Erro ao registrar a assinatura." };
  }
}
// Adicione no final do ficheiro app/actions/anamnesis.ts

export async function getAnamnesisResponseById(responseId: string) {
  try {
    const response = await prisma.anamnesisResponse.findUnique({
      where: { id: responseId },
      include: {
        template: {
          select: { name: true },
        },
        // 🔥 Removemos o select limitador. Agora traz a ficha completa do cliente!
        client: true,
      },
    });

    if (!response) {
      return { success: false, error: "Ficha não encontrada." };
    }

    return { success: true, data: response };
  } catch (error) {
    console.error("Erro ao buscar detalhes da ficha:", error);
    return { success: false, error: "Erro ao carregar os dados da ficha." };
  }
}

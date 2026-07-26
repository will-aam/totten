// app/actions/clients.ts
"use server";

import { requireAuth } from "@/lib/auth";
import { ClientService } from "@/lib/server/services/clients/client.service";

export async function createClientAction(data: {
  name: string;
  cpf?: string;
  phone_whatsapp: string;
  email?: string;
  birth_date?: string;
  zip_code?: string;
  city?: string;
  street?: string;
  number?: string;
}) {
  try {
    // 🛡️ Garante autenticação e extrai o escopo do tenant
    const admin = await requireAuth();

    if (!data.name || !data.phone_whatsapp) {
      return { error: "Nome e WhatsApp são obrigatórios." };
    }

    // Delega a criação para a camada de serviço (que já trata a duplicidade de CPF)
    const client = await ClientService.createClient(admin.organizationId, data);

    return {
      success: true,
      client: { id: client.id, name: client.name },
    };
  } catch (error: any) {
    if (error.name === "AuthError" || error.message === "Não autorizado") {
      return { error: "Sessão expirada ou não autorizado" };
    }

    // Tratamento amigável para o erro de CPF duplicado que lançamos no Service
    if (error.message === "CPF já cadastrado nesta organização") {
      return { error: error.message };
    }

    console.error("[ACTION createClient] Erro ao criar cliente:", error);
    return { error: "Erro interno do servidor" };
  }
}
// Adicione no final do arquivo app/actions/clients.ts

export async function updateClientAction(id: string, data: any) {
  try {
    const admin = await requireAuth();

    const client = await ClientService.updateClient(
      id,
      admin.organizationId,
      data,
    );

    return { success: true, client };
  } catch (error: any) {
    if (error.name === "AuthError" || error.message === "Não autorizado") {
      return { error: "Sessão expirada ou não autorizado" };
    }
    if (error.message === "CLIENT_NOT_FOUND") {
      return { error: "Cliente não encontrado ou acesso negado" };
    }
    if (error.message === "CPF_DUPLICATED") {
      return { error: "Este CPF já está cadastrado em outro cliente." };
    }

    console.error("[ACTION updateClient] Erro:", error);
    return { error: "Erro interno do servidor" };
  }
}

export async function deleteClientAction(id: string) {
  try {
    const admin = await requireAuth();

    const result = await ClientService.deleteClient(id, admin.organizationId);

    return { success: true, message: result.message, type: result.type };
  } catch (error: any) {
    if (error.name === "AuthError" || error.message === "Não autorizado") {
      return { error: "Sessão expirada ou não autorizado" };
    }
    if (error.message === "CLIENT_NOT_FOUND") {
      return { error: "Cliente não encontrado ou acesso negado" };
    }

    console.error("[ACTION deleteClient] Erro:", error);
    return { error: "Erro interno do servidor" };
  }
}
// Adicione no final do arquivo app/actions/clients.ts

export async function importClientsAction(clientsData: any[]) {
  try {
    // 🛡️ Garante autenticação e extrai o escopo do tenant
    const admin = await requireAuth();

    // Delega a importação e formatação para a camada de serviço
    const result = await ClientService.importClients(
      admin.organizationId,
      clientsData,
    );

    return {
      success: true,
      imported: result.imported,
      skipped: result.skipped,
    };
  } catch (error: any) {
    if (error.name === "AuthError" || error.message === "Não autorizado") {
      return { error: "Sessão expirada ou não autorizado" };
    }
    if (error.message === "INVALID_DATA") {
      return { error: "Nenhum dado válido enviado." };
    }

    console.error("[ACTION importClients] Erro na importação:", error);
    return { error: "Erro interno do servidor ao importar." };
  }
}

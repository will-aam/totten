// app/actions/notes.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function createNote(clientId: string, text: string) {
  try {
    // 🛡️ Validação unificada de sessão e tenant
    const admin = await requireAuth();

    if (!clientId || !text) {
      return { error: "Dados incompletos" };
    }

    const newNote = await prisma.clientNote.create({
      data: {
        client_id: clientId,
        organization_id: admin.organizationId,
        text,
      },
    });

    return { success: true, data: newNote };
  } catch (error: any) {
    if (error.message === "Unauthorized") return { error: "Não autorizado" };
    console.error("[ACTION createNote] ERRO:", error);
    return { error: "Erro interno do servidor" };
  }
}

export async function updateNote(noteId: string, text: string) {
  try {
    const admin = await requireAuth();

    if (!noteId || !text) {
      return { error: "Dados incompletos" };
    }

    // Camada 1: confere posse do registro antes de qualquer escrita
    const existingNote = await prisma.clientNote.findUnique({
      where: { id: noteId },
    });

    if (
      !existingNote ||
      existingNote.organization_id !== admin.organizationId
    ) {
      return { error: "Nota não encontrada ou acesso negado" };
    }

    // Camada 2: organization_id embutido no where da própria mutação,
    // blindando a query mesmo que a checagem acima seja removida no futuro
    const updatedNote = await prisma.clientNote.update({
      where: { id: noteId, organization_id: admin.organizationId },
      data: { text },
    });

    return { success: true, data: updatedNote };
  } catch (error: any) {
    if (error.message === "Unauthorized") return { error: "Não autorizado" };

    // Fallback de segurança do Prisma
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return { error: "Nota não encontrada ou acesso negado" };
    }

    console.error("[ACTION updateNote] ERRO:", error);
    return { error: "Erro interno do servidor" };
  }
}

export async function deleteNote(noteId: string) {
  try {
    const admin = await requireAuth();

    if (!noteId) {
      return { error: "O ID da nota é obrigatório" };
    }

    // Camada 1: confere posse do registro antes de qualquer escrita
    const existingNote = await prisma.clientNote.findUnique({
      where: { id: noteId },
    });

    if (
      !existingNote ||
      existingNote.organization_id !== admin.organizationId
    ) {
      return { error: "Nota não encontrada ou acesso negado" };
    }

    // Camada 2: organization_id embutido no where da própria mutação
    await prisma.clientNote.delete({
      where: { id: noteId, organization_id: admin.organizationId },
    });

    return { success: true };
  } catch (error: any) {
    if (error.message === "Unauthorized") return { error: "Não autorizado" };

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return { error: "Nota não encontrada ou acesso negado" };
    }

    console.error("[ACTION deleteNote] ERRO:", error);
    return { error: "Erro interno do servidor" };
  }
}

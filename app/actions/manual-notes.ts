// app/actions/manual-notes.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function createManualNote(clientId: string, text: string) {
  try {
    const admin = await requireAuth();

    if (!clientId || !text) {
      return { error: "Dados incompletos" };
    }

    const newNote = await prisma.clientManualNote.create({
      data: {
        client_id: clientId,
        organization_id: admin.organizationId,
        text,
      },
    });

    return { success: true, data: newNote };
  } catch (error: any) {
    if (error.message === "Unauthorized") return { error: "Não autorizado" };
    console.error("[ACTION createManualNote] ERRO:", error);
    return { error: "Erro interno do servidor" };
  }
}

export async function updateManualNote(noteId: string, text: string) {
  try {
    const admin = await requireAuth();

    if (!noteId || !text) {
      return { error: "Dados incompletos" };
    }

    const existingNote = await prisma.clientManualNote.findUnique({
      where: { id: noteId },
    });

    if (
      !existingNote ||
      existingNote.organization_id !== admin.organizationId
    ) {
      return { error: "Nota não encontrada ou acesso negado" };
    }

    const updatedNote = await prisma.clientManualNote.update({
      where: { id: noteId, organization_id: admin.organizationId },
      data: { text },
    });

    return { success: true, data: updatedNote };
  } catch (error: any) {
    if (error.message === "Unauthorized") return { error: "Não autorizado" };

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return { error: "Nota não encontrada ou acesso negado" };
    }

    console.error("[ACTION updateManualNote] ERRO:", error);
    return { error: "Erro interno do servidor" };
  }
}

export async function deleteManualNote(noteId: string) {
  try {
    const admin = await requireAuth();

    if (!noteId) {
      return { error: "O ID da nota é obrigatório" };
    }

    const existingNote = await prisma.clientManualNote.findUnique({
      where: { id: noteId },
    });

    if (
      !existingNote ||
      existingNote.organization_id !== admin.organizationId
    ) {
      return { error: "Nota não encontrada ou acesso negado" };
    }

    await prisma.clientManualNote.delete({
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

    console.error("[ACTION deleteManualNote] ERRO:", error);
    return { error: "Erro interno do servidor" };
  }
}

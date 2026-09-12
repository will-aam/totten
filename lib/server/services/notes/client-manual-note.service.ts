// lib/server/services/notes/client-manual-note.service.ts
import { getTenantPrisma } from "@/lib/prisma";

export class ClientManualNoteService {
  /**
   * Busca apenas os clientes da organização que possuam pelo menos 1 anotação manual.
   */
  static async getClientsWithManualNotes(organizationId: string) {
    const prisma = getTenantPrisma(organizationId);

    const clientsWithNotes = await prisma.client.findMany({
      where: {
        organization_id: organizationId,
        manual_notes: {
          some: {}, // O Prisma exige que a relação "manual_notes" não esteja vazia
        },
      },
      orderBy: {
        name: "asc", // Ordena alfabeticamente
      },
      select: {
        id: true,
        name: true,
        cpf: true,
      },
    });

    return clientsWithNotes;
  }

  /**
   * Busca todas as anotações manuais de um cliente específico, ordenadas cronologicamente.
   */
  static async getClientManualNotes(organizationId: string, clientId: string, page: number = 1, limit: number = 20) {
    const prisma = getTenantPrisma(organizationId);

    const skip = (page - 1) * limit;

    const [notes, total] = await Promise.all([
      prisma.clientManualNote.findMany({
        where: {
          client_id: clientId,
          organization_id: organizationId,
        },
        orderBy: {
          date: "asc", // Para visualização de chat, geralmente é asc (antigas em cima, novas embaixo)
        },
        skip,
        take: limit,
      }),
      prisma.clientManualNote.count({
        where: {
          client_id: clientId,
          organization_id: organizationId,
        },
      }),
    ]);

    return { data: notes, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Adiciona uma anotação manual para um cliente.
   */
  static async addManualNote(organizationId: string, clientId: string, text: string) {
    const prisma = getTenantPrisma(organizationId);
    
    return prisma.clientManualNote.create({
      data: {
        text,
        client_id: clientId,
        organization_id: organizationId,
      }
    });
  }

  /**
   * Exclui uma anotação manual.
   */
  static async deleteManualNote(organizationId: string, noteId: string) {
    const prisma = getTenantPrisma(organizationId);
    
    return prisma.clientManualNote.delete({
      where: {
        id: noteId,
        organization_id: organizationId, // Segurança extra para garantir que pertence a org atual
      }
    });
  }
}

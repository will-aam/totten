// lib/server/services/notes/client-note.service.ts
import { getTenantPrisma } from "@/lib/prisma";

export class ClientNoteService {
  /**
   * Busca apenas os clientes da organização que possuam pelo menos 1 anotação.
   */
  static async getClientsWithNotes(organizationId: string) {
    const prisma = getTenantPrisma(organizationId);

    const clientsWithNotes = await prisma.client.findMany({
      where: {
        organization_id: organizationId,
        notes: {
          some: {}, // O Prisma exige que a relação "notes" não esteja vazia
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
   * Busca todas as anotações de um cliente específico, ordenadas cronologicamente.
   */
  static async getClientNotes(organizationId: string, clientId: string) {
    const prisma = getTenantPrisma(organizationId);

    const notes = await prisma.clientNote.findMany({
      where: {
        client_id: clientId,
        organization_id: organizationId,
      },
      orderBy: {
        date: "asc",
      },
    });

    return notes;
  }
}

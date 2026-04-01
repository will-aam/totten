import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin?.organizationId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Busca APENAS os clientes da organização que possuam pelo menos 1 anotação
    const clientsWithNotes = await prisma.client.findMany({
      where: {
        organization_id: admin.organizationId,
        notes: {
          some: {}, // O Prisma exige que a relação "notes" não esteja vazia
        },
      },
      orderBy: {
        name: "asc", // Ordena alfabeticamente para ficar organizado
      },
      select: {
        id: true,
        name: true,
        cpf: true,
      },
    });

    return NextResponse.json({ data: clientsWithNotes });
  } catch (error) {
    console.error("[NOTES_CLIENTS_GET]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

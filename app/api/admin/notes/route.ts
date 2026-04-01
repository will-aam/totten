import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth"; // Usando a sua função auxiliar
import { prisma } from "@/lib/prisma"; // Importação com chaves {}

// GET: Busca todas as anotações de um cliente específico
export async function GET(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin?.organizationId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json(
        { error: "O ID do cliente é obrigatório" },
        { status: 400 },
      );
    }

    const notes = await prisma.clientNote.findMany({
      where: {
        client_id: clientId,
        organization_id: admin.organizationId,
      },
      orderBy: {
        date: "asc", // Traz da mais antiga para a mais nova (ideal para formato de chat)
      },
    });

    return NextResponse.json({ data: notes });
  } catch (error) {
    console.error("[NOTES_GET]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// POST: Cria uma nova anotação
export async function POST(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin?.organizationId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { clientId, text } = body;

    if (!clientId || !text) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const newNote = await prisma.clientNote.create({
      data: {
        client_id: clientId,
        organization_id: admin.organizationId,
        text,
      },
    });

    return NextResponse.json({ data: newNote }, { status: 201 });
  } catch (error) {
    console.error("[NOTES_POST]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// PUT: Atualiza o texto de uma anotação existente
export async function PUT(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin?.organizationId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { noteId, text } = body;

    if (!noteId || !text) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    // Segurança: Verifica se a nota existe e se pertence à organização do admin logado
    const existingNote = await prisma.clientNote.findUnique({
      where: { id: noteId },
    });

    if (
      !existingNote ||
      existingNote.organization_id !== admin.organizationId
    ) {
      return NextResponse.json(
        { error: "Nota não encontrada ou acesso negado" },
        { status: 404 },
      );
    }

    const updatedNote = await prisma.clientNote.update({
      where: { id: noteId },
      data: { text },
    });

    return NextResponse.json({ data: updatedNote });
  } catch (error) {
    console.error("[NOTES_PUT]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// DELETE: Exclui uma anotação
export async function DELETE(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin?.organizationId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get("noteId");

    if (!noteId) {
      return NextResponse.json(
        { error: "O ID da nota é obrigatório" },
        { status: 400 },
      );
    }

    // Mesma validação de segurança
    const existingNote = await prisma.clientNote.findUnique({
      where: { id: noteId },
    });

    if (
      !existingNote ||
      existingNote.organization_id !== admin.organizationId
    ) {
      return NextResponse.json(
        { error: "Nota não encontrada ou acesso negado" },
        { status: 404 },
      );
    }

    await prisma.clientNote.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[NOTES_DELETE]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

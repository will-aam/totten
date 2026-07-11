// app/api/admin/notes/route.ts
import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Recupera anotações ordenadas cronologicamente
export async function GET(request: Request) {
  try {
    const admin = await requireAuth();

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
        date: "asc",
      },
    });

    return NextResponse.json({ data: notes });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[NOTES_GET]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// POST: Insere nova anotação
export async function POST(request: Request) {
  try {
    const admin = await requireAuth();
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
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[NOTES_POST]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// PUT: Altera conteúdo de anotação existente com verificação de tenant
export async function PUT(request: Request) {
  try {
    const admin = await requireAuth();
    const body = await request.json();
    const { noteId, text } = body;

    if (!noteId || !text) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

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
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[NOTES_PUT]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// DELETE: Remove anotação com verificação de tenant
export async function DELETE(request: Request) {
  try {
    const admin = await requireAuth();

    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get("noteId");

    if (!noteId) {
      return NextResponse.json(
        { error: "O ID da nota é obrigatório" },
        { status: 400 },
      );
    }

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
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[NOTES_DELETE]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

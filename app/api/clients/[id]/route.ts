// app/api/clients/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAuth();
    const { id } = await params;

    const client = await prisma.client.findFirst({
      where: {
        id: id,
        organization_id: admin.organizationId,
      },
      include: {
        packages: {
          where: {
            active: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 },
      );
    }

    // Busca o primeiro pacote com sessões disponíveis
    const activePkg = client.packages.find(
      (pkg) => pkg.used_sessions < pkg.total_sessions,
    );

    return NextResponse.json({
      client: {
        id: client.id,
        name: client.name,
        cpf: client.cpf,
        phone_whatsapp: client.phone_whatsapp,
        email: client.email,
        birth_date: client.birth_date,
        zip_code: client.zip_code,
        city: client.city,
        street: client.street,
        number: client.number,
        created_at: client.created_at,
        active: client.active,
      },
      activePackage: activePkg
        ? {
            id: activePkg.id,
            name: activePkg.name,
            total_sessions: activePkg.total_sessions,
            used_sessions: activePkg.used_sessions,
            service_id: activePkg.service_id,
          }
        : null,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[CLIENT_GET]", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const updateData: Prisma.ClientUpdateInput = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone_whatsapp !== undefined)
      updateData.phone_whatsapp = body.phone_whatsapp;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.zip_code !== undefined) updateData.zip_code = body.zip_code;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.street !== undefined) updateData.street = body.street;
    if (body.number !== undefined) updateData.number = body.number;
    if (body.active !== undefined) updateData.active = body.active;

    if (body.cpf !== undefined) {
      const cpfLimpo = body.cpf && body.cpf.trim() !== "" ? body.cpf : null;

      if (cpfLimpo) {
        const existingClient = await prisma.client.findFirst({
          where: {
            cpf: cpfLimpo,
            organization_id: admin.organizationId,
            id: { not: id },
          },
        });

        if (existingClient) {
          return NextResponse.json(
            { error: "Este CPF já está cadastrado em outro cliente." },
            { status: 409 },
          );
        }
      }
      updateData.cpf = cpfLimpo;
    }

    if (body.birth_date !== undefined) {
      updateData.birth_date = body.birth_date
        ? new Date(`${body.birth_date}T12:00:00Z`)
        : null;
    }

    const client = await prisma.client.update({
      where: {
        id: id,
        organization_id: admin.organizationId,
      },
      data: updateData,
    });

    return NextResponse.json(client);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[CLIENT_PUT]", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAuth();
    const { id } = await params;

    const client = await prisma.client.findFirst({
      where: { id: id, organization_id: admin.organizationId },
      include: {
        appointments: true,
        check_ins: true,
        packages: true,
        transactions: true,
        anamnesis_responses: true,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 },
      );
    }

    const hasHistory =
      client.appointments.length > 0 ||
      client.check_ins.length > 0 ||
      client.packages.length > 0 ||
      client.transactions.length > 0 ||
      client.anamnesis_responses.length > 0;

    if (hasHistory) {
      await prisma.client.update({
        where: { id: client.id },
        data: { active: false },
      });
      return NextResponse.json({ message: "Cliente desativado com sucesso" });
    } else {
      await prisma.client.delete({
        where: { id: client.id },
      });
      return NextResponse.json({ message: "Cliente excluído com sucesso" });
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[CLIENT_DELETE]", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

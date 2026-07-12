// app/api/totem/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Busca histórico de check-ins do cliente
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const client_id = searchParams.get("client_id");
    const org_slug = searchParams.get("org");

    if (!client_id || !org_slug) {
      return NextResponse.json(
        { error: "Cliente e organização são obrigatórios" },
        { status: 400 },
      );
    }

    // Busca a organização
    const organization = await prisma.organization.findUnique({
      where: { slug: org_slug },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organização não encontrada" },
        { status: 404 },
      );
    }

    // Busca últimos 10 check-ins
    const checkIns = await prisma.checkIn.findMany({
      where: {
        client_id: client_id,
        organization_id: organization.id,
      },
      include: {
        package: {
          include: {
            service: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        date_time: "desc",
      },
      take: 10,
    });

    //  Adicionado o "?." para prevenir erro se o check-in for avulso (sem pacote)
    const formatted = checkIns.map((checkIn) => ({
      id: checkIn.id,
      dateTime: checkIn.date_time,
      packageName: checkIn.package?.name || "Check-in Avulso",
      serviceName: checkIn.package?.service?.name || "Serviço Avulso",
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

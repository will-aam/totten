// app/api/admin/clients/[clientId]/packages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  try {
    const admin = await requireAuth();

    // Next.js 15+: params precisa ser aguardado
    const { clientId } = await params;

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId é obrigatório." },
        { status: 400 },
      );
    }

    // Valida se o cliente pertence à organização do admin
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        organization_id: admin.organizationId,
      },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente não encontrado." },
        { status: 404 },
      );
    }

    const packages = await prisma.package.findMany({
      where: {
        client_id: clientId,
        organization_id: admin.organizationId,
      },
      select: {
        id: true,
        name: true,
        total_sessions: true,
        used_sessions: true,
        price: true,
        active: true,
        service_id: true,
        created_at: true,
        package_template: {
          select: {
            name: true,
          },
        },
        check_ins: {
          select: {
            date_time: true,
          },
          orderBy: {
            date_time: "asc",
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const formattedPackages = packages.map((pkg) => {
      return {
        id: pkg.id,
        name: pkg.package_template?.name || pkg.name,
        total_sessions: pkg.total_sessions,
        used_sessions: pkg.used_sessions,
        price: pkg.price,
        active: pkg.active,
        service_id: pkg.service_id,
        created_at: pkg.created_at.toISOString(),
        sessionDates: pkg.check_ins.map((checkin) =>
          checkin.date_time.toISOString(),
        ),
      };
    });

    // Retorna o array direto para bater perfeitamente com a tipagem do SWR no Front
    return NextResponse.json(formattedPackages);
  } catch (error) {
    console.error("[GET /api/admin/clients/[clientId]/packages] ERRO:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erro ao listar pacotes do cliente." },
      { status: 500 },
    );
  }
}

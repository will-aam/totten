// app/api/admin/clients/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/**
 * Lista clientes da organização do admin logado.
 *
 * GET /api/admin/clients
 */
export async function GET() {
  try {
    const admin = await requireAuth();

    const clients = await prisma.client.findMany({
      where: {
        organization_id: admin.organizationId,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ clients });
  } catch (error) {
    console.error("[GET /api/admin/clients] ERRO:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erro ao listar clientes." },
      { status: 500 },
    );
  }
}

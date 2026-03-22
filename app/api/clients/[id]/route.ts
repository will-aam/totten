// app/api/clients/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // 🔥 O SEGREDO ESTÁ AQUI: Precisamos trazer os pacotes ativos do cliente!
    const client = await prisma.client.findFirst({
      where: {
        id: id,
        organization_id: admin.organizationId,
      },
      include: {
        packages: {
          where: {
            active: true, // Traz apenas pacotes que não foram desativados
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

    // 🔥 LÓGICA DE NEGÓCIO: Acha o primeiro pacote que ainda tem saldo
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
      // 🔥 MANDAMOS O PACOTE PARA O FRONT-END AQUI:
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
    console.error("Erro ao buscar cliente:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

// app/api/dashboard/checkins/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // 🛡️ Validação unificada de sessão e tenant
    const admin = await requireAuth();

    // Pega os parâmetros da URL para a paginação usando o NextRequest nativo
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "8", 10);
    const skip = (page - 1) * limit;

    // CORREÇÃO DO FUSO HORÁRIO (Forçando o fuso do Brasil UTC-3)
    const now = new Date();
    const todayStr = now.toLocaleDateString("en-US", {
      timeZone: "America/Sao_Paulo",
    });

    const startOfDay = new Date(`${todayStr} 00:00:00 GMT-0300`);
    const tomorrow = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Busca apenas os check-ins daquela página
    const recentCheckIns = await prisma.checkIn.findMany({
      where: {
        organization_id: admin.organizationId,
        date_time: {
          gte: startOfDay,
          lt: tomorrow,
        },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        // RASTREABILIDADE: Trazendo o nome de quem atendeu
        admin: {
          select: {
            display_name: true,
          },
        },
      },
      orderBy: {
        date_time: "desc",
      },
      skip: skip,
      take: limit + 1, // Truque: Pede 1 a mais para saber se tem próxima página
    });

    // Verifica se pegou aquele "1 a mais"
    const hasMore = recentCheckIns.length > limit;

    // Remove aquele "1 a mais" se ele existir para devolver apenas o limite exato
    const checkInsToReturn = hasMore
      ? recentCheckIns.slice(0, -1)
      : recentCheckIns;

    const formattedCheckIns = checkInsToReturn.map((checkIn) => ({
      id: checkIn.id,
      client_id: checkIn.client?.id ?? "",
      client_name: checkIn.client?.name ?? "Cliente Avulso",
      date_time: checkIn.date_time,
      professional_name: checkIn.admin?.display_name ?? null,
    }));

    return NextResponse.json({
      data: formattedCheckIns,
      hasMore: hasMore,
      page: page,
    });
  } catch (error) {
    // 🛡️ Tratamento centralizado para o 401
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[DASHBOARD_CHECKINS_GET]", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

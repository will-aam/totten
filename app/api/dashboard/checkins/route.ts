// app/api/dashboard/checkins/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Pega os parâmetros da URL para a paginação
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "8", 10);
    const skip = (page - 1) * limit;

    // 🔥 CORREÇÃO DO FUSO HORÁRIO (Forçando o fuso do Brasil UTC-3)
    const now = new Date();
    // Pega a data atual EXATAMENTE como é no Brasil (MM/DD/YYYY)
    const todayStr = now.toLocaleDateString("en-US", {
      timeZone: "America/Sao_Paulo",
    });

    // Início do dia no Brasil (00:00:00) convertido para o timestamp real
    const startOfDay = new Date(`${todayStr} 00:00:00 GMT-0300`);

    // Fim do dia no Brasil (Início do próximo dia)
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
      },
      orderBy: {
        date_time: "desc",
      },
      skip: skip,
      take: limit + 1, // 🔥 Truque: Pede 1 a mais para saber se tem próxima página
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
    }));

    return NextResponse.json({
      data: formattedCheckIns,
      hasMore: hasMore, // Frontend usa isso para parar de pedir páginas
      page: page,
    });
  } catch (error) {
    console.error("Erro ao buscar check-ins do dashboard:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

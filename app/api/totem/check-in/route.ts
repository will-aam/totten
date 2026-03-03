import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Registra check-in
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { client_id, package_id } = body;

    if (!client_id || !package_id) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    // 🔥 Busca a primeira (e única) organização do sistema
    const organization = await prisma.organization.findFirst();

    if (!organization) {
      return NextResponse.json(
        { error: "Sistema não configurado" },
        { status: 500 },
      );
    }

    // Busca o pacote e valida
    const packageData = await prisma.package.findFirst({
      where: {
        id: package_id,
        client_id: client_id,
        organization_id: organization.id,
        active: true,
      },
      include: {
        client: true,
        service: true,
      },
    });

    if (!packageData) {
      return NextResponse.json(
        { error: "Pacote não encontrado ou inativo" },
        { status: 404 },
      );
    }

    // Verifica se ainda há sessões disponíveis
    if (packageData.used_sessions >= packageData.total_sessions) {
      return NextResponse.json(
        { error: "Pacote já foi totalmente utilizado" },
        { status: 400 },
      );
    }

    // Verifica se já fez check-in hoje neste pacote
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkInToday = await prisma.checkIn.findFirst({
      where: {
        client_id: client_id,
        package_id: package_id,
        organization_id: organization.id,
        date_time: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (checkInToday) {
      return NextResponse.json(
        { error: "Você já fez check-in hoje neste pacote" },
        { status: 400 },
      );
    }

    // Inicia transação: registra check-in e incrementa sessões usadas
    const result = await prisma.$transaction(async (tx) => {
      // Cria o check-in
      const checkIn = await tx.checkIn.create({
        data: {
          client_id: client_id,
          package_id: package_id,
          organization_id: organization.id,
        },
      });

      // Incrementa sessões usadas
      const updatedPackage = await tx.package.update({
        where: { id: package_id },
        data: {
          used_sessions: {
            increment: 1,
          },
        },
      });

      return { checkIn, updatedPackage };
    });

    // Calcula sessões restantes
    const remainingSessions =
      result.updatedPackage.total_sessions -
      result.updatedPackage.used_sessions;

    return NextResponse.json({
      success: true,
      message: "Check-in realizado com sucesso!",
      checkIn: {
        id: result.checkIn.id,
        dateTime: result.checkIn.date_time,
      },
      package: {
        name: packageData.name,
        serviceName: packageData.service.name,
        usedSessions: result.updatedPackage.used_sessions,
        totalSessions: result.updatedPackage.total_sessions,
        remainingSessions: remainingSessions,
      },
      client: {
        name: packageData.client.name,
      },
    });
  } catch (error) {
    console.error("Erro ao fazer check-in:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

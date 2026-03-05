import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Registra check-in pelo appointment_id
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { appointment_id } = body;

    if (!appointment_id) {
      return NextResponse.json(
        { error: "appointment_id é obrigatório" },
        { status: 400 },
      );
    }

    // Busca o agendamento + cliente + serviço + pacote
    const appt = await prisma.appointment.findUnique({
      where: { id: appointment_id },
      include: {
        client: true,
        service: true,
        package: true,
        organization: true,
      },
    });

    if (!appt) {
      return NextResponse.json(
        { error: "Agendamento não encontrado" },
        { status: 404 },
      );
    }

    if (appt.status === "REALIZADO") {
      return NextResponse.json(
        { error: "Este agendamento já foi realizado." },
        { status: 400 },
      );
    }

    // Verifica se já existe check-in para esse agendamento
    const existingCheckIn = await prisma.checkIn.findFirst({
      where: {
        appointment_id: appt.id,
      },
    });

    if (existingCheckIn) {
      return NextResponse.json(
        { error: "Check-in já registrado para este agendamento." },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Cria o check-in
      const checkIn = await tx.checkIn.create({
        data: {
          appointment_id: appt.id,
          client_id: appt.client_id,
          package_id: appt.package_id ?? null,
          organization_id: appt.organization_id,
        },
      });

      if (appt.package_id) {
        const pacote = await tx.package.findUnique({
          where: { id: appt.package_id },
        });

        if (pacote && pacote.used_sessions < pacote.total_sessions) {
          await tx.package.update({
            where: { id: appt.package_id },
            data: { used_sessions: { increment: 1 } },
          });
        }

        await tx.appointment.update({
          where: { id: appt.id },
          data: { status: "REALIZADO" },
        });
      } else {
        await tx.appointment.update({
          where: { id: appt.id },
          data: { status: "REALIZADO", has_charge: true },
        });
      }

      return checkIn;
    });

    return NextResponse.json({
      success: true,
      clientName: appt.client.name,
      serviceName: appt.service.name,
      time: new Date(appt.date_time).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      checkInId: result.id,
    });
  } catch (error) {
    console.error("Erro ao fazer check-in:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

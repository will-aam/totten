// Rota da API do Totem: POST /api/totem/search
//
// Esta rota é chamada pelo Totem de autoatendimento quando o cliente digita o CPF.
//
// Contrato:
//   - Frontend envia: { cpf: string, organizationSlug: string }
//   - Se existir agendamento hoje: realiza check-in e responde { status: "FOUND", appointment: { ... } }
//   - Se não existir: responde { status: "NOT_FOUND" }
//   - Se existir mais de um: responde { status: "MULTIPLE_FOUND", appointments: [...] }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cpf, organizationSlug } = body as {
      cpf?: string;
      organizationSlug?: string;
    };

    // Validação básica dos campos obrigatórios
    if (!cpf || !organizationSlug) {
      return NextResponse.json(
        { error: "CPF e organizationSlug são obrigatórios." },
        { status: 400 },
      );
    }

    // Remove pontuação do CPF para padronizar a busca
    const cpfLimpo = cpf.replace(/\D/g, "");

    // 1. Identifica a organização pelo slug
    const organizacao = await prisma.organization.findUnique({
      where: { slug: organizationSlug },
    });

    if (!organizacao) {
      return NextResponse.json(
        { error: "Organização não encontrada." },
        { status: 404 },
      );
    }

    // 2. Localiza o cliente pelo CPF dentro da organização
    const cliente = await prisma.client.findFirst({
      where: {
        cpf: cpfLimpo,
        organization_id: organizacao.id,
      },
    });

    if (!cliente) {
      return NextResponse.json({ status: "NOT_FOUND" });
    }

    // 3. Define a janela de tempo "hoje"
    const inicioDoDia = new Date();
    inicioDoDia.setHours(0, 0, 0, 0);
    const fimDoDia = new Date();
    fimDoDia.setHours(23, 59, 59, 999);

    // 4. Busca TODOS os agendamentos de hoje com status PENDENTE ou CONFIRMADO
    const agendamentos = await prisma.appointment.findMany({
      where: {
        client_id: cliente.id,
        organization_id: organizacao.id,
        date_time: {
          gte: inicioDoDia,
          lte: fimDoDia,
        },
        status: { in: ["PENDENTE", "CONFIRMADO"] },
      },
      include: {
        service: { select: { name: true } },
      },
      orderBy: {
        date_time: "asc",
      },
    });

    // 5. Se não houver agendamento hoje, retorna NOT_FOUND
    if (!agendamentos.length) {
      return NextResponse.json({ status: "NOT_FOUND" });
    }

    // 6. Se houver mais de um, retorna lista para o frontend decidir
    if (agendamentos.length > 1) {
      return NextResponse.json({
        status: "MULTIPLE_FOUND",
        clientName: cliente.name,
        appointments: agendamentos.map((appt) => ({
          id: appt.id,
          date_time: appt.date_time,
          service_name: appt.service.name,
        })),
      });
    }

    // 7. Se houver apenas um, segue fluxo atual
    const agendamento = agendamentos[0];

    await prisma.$transaction(async (tx) => {
      await tx.checkIn.create({
        data: {
          appointment_id: agendamento.id,
          client_id: cliente.id,
          package_id: agendamento.package_id ?? null,
          organization_id: organizacao.id,
        },
      });

      if (agendamento.package_id) {
        const pacote = await tx.package.findUnique({
          where: { id: agendamento.package_id },
        });

        if (pacote && pacote.used_sessions < pacote.total_sessions) {
          await tx.package.update({
            where: { id: agendamento.package_id },
            data: { used_sessions: { increment: 1 } },
          });
        }

        await tx.appointment.update({
          where: { id: agendamento.id },
          data: { status: "REALIZADO" },
        });
      } else {
        await tx.appointment.update({
          where: { id: agendamento.id },
          data: { status: "REALIZADO", has_charge: true },
        });
      }
    });

    return NextResponse.json({
      status: "FOUND",
      appointment: {
        id: agendamento.id,
        date_time: agendamento.date_time,
        service_name: agendamento.service.name,
        client_name: cliente.name,
        package_id: agendamento.package_id ?? null,
      },
    });
  } catch (error) {
    console.error("Erro na busca do Totem:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 },
    );
  }
}

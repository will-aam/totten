// app/api/totem/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth"; // 🔥 Import da autenticação da sessão

export async function POST(req: NextRequest) {
  try {
    // 🔒 1. Valida a sessão do totem (o tablet precisa estar logado na clínica)
    const admin = await getCurrentAdmin();

    if (!admin || !admin.organizationId) {
      return NextResponse.json(
        { error: "Não autorizado. Totem não está autenticado." },
        { status: 401 },
      );
    }

    const body = await req.json();

    // 🔥 2. Não recebemos mais o organizationSlug do front-end
    const { cpf } = body as { cpf?: string };

    if (!cpf) {
      return NextResponse.json(
        { error: "CPF é obrigatório." },
        { status: 400 },
      );
    }

    const cpfLimpo = cpf.replace(/\D/g, "");

    const cpfFormatado =
      cpfLimpo.length === 11
        ? cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
        : cpf;

    const cpfCandidates = Array.from(
      new Set([cpf.trim(), cpfLimpo, cpfFormatado]),
    );

    // 🔥 3. Busca o cliente usando DIRETAMENTE o ID da organização da sessão
    const cliente = await prisma.client.findFirst({
      where: {
        cpf: { in: cpfCandidates },
        organization_id: admin.organizationId,
      },
    });

    if (!cliente) {
      return NextResponse.json({ status: "NOT_FOUND" });
    }

    // 🔥 CORREÇÃO DE FUSO HORÁRIO (Timezone UTC-3)
    const now = new Date();

    // Força a extração do ano, mês e dia com base no fuso de Brasília
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });

    const parts = formatter.formatToParts(now);
    const brYear = Number(parts.find((p) => p.type === "year")?.value);
    const brMonth = Number(parts.find((p) => p.type === "month")?.value) - 1; // Mês no JS começa em 0
    const brDay = Number(parts.find((p) => p.type === "day")?.value);

    // Cria os limites já convertidos para UTC para o Prisma buscar com precisão
    // 00:00 BRT = 03:00 UTC
    const inicioDoDia = new Date(Date.UTC(brYear, brMonth, brDay, 3, 0, 0, 0));

    // 23:59 BRT = 02:59 UTC do dia seguinte (o Date.UTC entende 26 horas e vira o dia automaticamente)
    const fimDoDia = new Date(
      Date.UTC(brYear, brMonth, brDay, 26, 59, 59, 999),
    );

    const agendamentos = await prisma.appointment.findMany({
      where: {
        client_id: cliente.id,
        organization_id: admin.organizationId, // 🔥 Usa o ID da sessão
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

    if (!agendamentos.length) {
      return NextResponse.json({ status: "NOT_FOUND" });
    }

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

    const agendamento = agendamentos[0];
    let packageInfo = null;

    // Se só tem 1 agendamento, já faz o check-in automático
    await prisma.$transaction(async (tx) => {
      // Cria o registro de CheckIn
      await tx.checkIn.create({
        data: {
          appointment_id: agendamento.id,
          client_id: cliente.id,
          package_id: agendamento.package_id ?? null,
          organization_id: admin.organizationId, // 🔥 Usa o ID da sessão
        },
      });

      // LÓGICA DE PACOTE
      if (agendamento.package_id) {
        const pacote = await tx.package.update({
          where: { id: agendamento.package_id },
          data: { used_sessions: { increment: 1 } },
        });

        packageInfo = {
          used: pacote.used_sessions,
          total: pacote.total_sessions,
        };

        await tx.appointment.update({
          where: { id: agendamento.id },
          data: { status: "REALIZADO" },
        });
      }
      // LÓGICA DE ATENDIMENTO AVULSO
      else {
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
        package_info: packageInfo, // Agora o frontend recebe dados reais ou null
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

// app/api/totem/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // 🔒 1. Valida a sessão do totem
    const admin = await getCurrentAdmin();

    if (!admin || !admin.organizationId) {
      return NextResponse.json(
        { error: "Não autorizado. Totem não está autenticado." },
        { status: 401 },
      );
    }

    const body = await req.json();
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

    const cliente = await prisma.client.findFirst({
      where: {
        cpf: { in: cpfCandidates },
        organization_id: admin.organizationId,
      },
    });

    if (!cliente) {
      return NextResponse.json({ status: "NOT_FOUND" });
    }

    // 🔥 CORREÇÃO DE FUSO HORÁRIO
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });

    const parts = formatter.formatToParts(now);
    const brYear = Number(parts.find((p) => p.type === "year")?.value);
    const brMonth = Number(parts.find((p) => p.type === "month")?.value) - 1;
    const brDay = Number(parts.find((p) => p.type === "day")?.value);

    const inicioDoDia = new Date(Date.UTC(brYear, brMonth, brDay, 3, 0, 0, 0));
    const fimDoDia = new Date(
      Date.UTC(brYear, brMonth, brDay, 26, 59, 59, 999),
    );

    const agendamentos = await prisma.appointment.findMany({
      where: {
        client_id: cliente.id,
        organization_id: admin.organizationId,
        date_time: {
          gte: inicioDoDia,
          lte: fimDoDia,
        },
        status: { in: ["PENDENTE", "CONFIRMADO"] },
        OR: [{ package_id: null }, { package: { active: true } }],
      },
      // 🔥 AQUI: Pedimos pro Prisma trazer o estoque junto com o serviço
      include: {
        service: {
          include: {
            stock_items: {
              include: { stock_item: true },
            },
          },
        },
      },
      orderBy: {
        date_time: "asc",
      },
    });

    if (!agendamentos.length) {
      return NextResponse.json({ status: "NOT_FOUND" });
    }

    // Se tiver mais de um, manda pro front-end escolher e chamar a rota oficial
    if (agendamentos.length > 1) {
      return NextResponse.json({
        status: "MULTIPLE_FOUND",
        clientName: cliente.name,
        appointments: agendamentos.map((appt) => ({
          id: appt.id,
          date_time: appt.date_time,
          service_name: appt.service.name, // Acessa normalmente
        })),
      });
    }

    // ==========================================================
    // SE CHEGOU AQUI: O Cliente tem apenas 1 agendamento.
    // Vamos fazer o AUTO CHECK-IN!
    // ==========================================================
    const agendamento = agendamentos[0];
    let packageInfo = null;

    await prisma.$transaction(async (tx) => {
      // 1. Cria o registro de CheckIn
      await tx.checkIn.create({
        data: {
          appointment_id: agendamento.id,
          client_id: cliente.id,
          package_id: agendamento.package_id ?? null,
          organization_id: admin.organizationId,
        },
      });

      // 2. LÓGICA DE PACOTE OU AVULSO
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
      } else {
        await tx.appointment.update({
          where: { id: agendamento.id },
          data: { status: "REALIZADO", has_charge: true },
        });
      }

      // 🔥 --- O CORAÇÃO DO SISTEMA FINANCEIRO E DE ESTOQUE (AUTO CHECK-IN) --- 🔥
      const service = agendamento.service;

      if (
        service.track_stock &&
        service.stock_items &&
        service.stock_items.length > 0
      ) {
        // FLUXO A e B (Baixa Inteligente)
        for (const item of service.stock_items) {
          const stockData = item.stock_item;
          const usedQty = item.quantity_used;

          // a) Baixa a quantidade física
          await tx.stockItem.update({
            where: { id: stockData.id },
            data: { quantity: { decrement: usedQty } },
          });

          // b) Regra de Caixa
          if (!stockData.was_expensed) {
            const costOfUsedQty = Number(usedQty) * Number(stockData.unit_cost);
            if (costOfUsedQty > 0) {
              await tx.transaction.create({
                data: {
                  type: "DESPESA",
                  description: `Custo de Insumo (Totem): ${stockData.name}`,
                  amount: costOfUsedQty,
                  date: new Date(),
                  status: "PAGO",
                  organization_id: admin.organizationId,
                  appointment_id: agendamento.id,
                },
              });
            }
          }
        }
      } else if (
        !service.track_stock &&
        service.material_cost &&
        Number(service.material_cost) > 0
      ) {
        // FLUXO C (Chute Manual)
        await tx.transaction.create({
          data: {
            type: "DESPESA",
            description: `Custo Fixo de Material (Totem): ${service.name}`,
            amount: service.material_cost,
            date: new Date(),
            status: "PAGO",
            organization_id: admin.organizationId,
            appointment_id: agendamento.id,
          },
        });
      }
    }); // Fim da transação

    return NextResponse.json({
      status: "FOUND",
      appointment: {
        id: agendamento.id,
        date_time: agendamento.date_time,
        service_name: agendamento.service.name,
        client_name: cliente.name,
        package_id: agendamento.package_id ?? null,
        package_info: packageInfo,
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

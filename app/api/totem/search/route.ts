// app/api/totem/search/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // 🛡️ Validação unificada de sessão e tenant
    const admin = await requireAuth();

    const body = await request.json();
    const { value, mode } = body as { value?: string; mode?: "CPF" | "PHONE" };

    if (!value || !mode) {
      return NextResponse.json(
        { error: "Valor e modo de busca são obrigatórios." },
        { status: 400 },
      );
    }

    const valorLimpo = value.replace(/\D/g, "");
    let whereClause: any = {
      organization_id: admin.organizationId,
    };

    // 🔍 PREPARAÇÃO DA BUSCA (CPF OU TELEFONE)
    if (mode === "CPF") {
      const cpfFormatado =
        valorLimpo.length === 11
          ? valorLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
          : value;

      const cpfCandidates = Array.from(
        new Set([value.trim(), valorLimpo, cpfFormatado]),
      );
      whereClause.cpf = { in: cpfCandidates };
    } else if (mode === "PHONE") {
      let phoneFormatado = value;
      // Formata como (11) 99999-9999 ou (11) 9999-9999
      if (valorLimpo.length === 11) {
        phoneFormatado = `(${valorLimpo.slice(0, 2)}) ${valorLimpo.slice(2, 7)}-${valorLimpo.slice(7)}`;
      } else if (valorLimpo.length === 10) {
        phoneFormatado = `(${valorLimpo.slice(0, 2)}) ${valorLimpo.slice(2, 6)}-${valorLimpo.slice(6)}`;
      }

      const phoneCandidates = Array.from(
        new Set([
          value.trim(),
          valorLimpo,
          phoneFormatado,
          `+55${valorLimpo}`,
          `+55 ${phoneFormatado}`,
        ]),
      );
      whereClause.phone_whatsapp = { in: phoneCandidates };
    }

    // 🔍 BUSCA O CLIENTE NO BANCO
    const cliente = await prisma.client.findFirst({
      where: whereClause,
    });

    if (!cliente) {
      return NextResponse.json({ status: "NOT_FOUND" });
    }

    // CORREÇÃO DE FUSO HORÁRIO
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

    // Se tiver mais de um, manda pro front-end escolher
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

    // ==========================================================
    // SE CHEGOU AQUI: O Cliente tem apenas 1 agendamento.
    // Fazemos o AUTO CHECK-IN!
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
          auto_processed: true,
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

      // --- O CORAÇÃO DO SISTEMA FINANCEIRO E DE ESTOQUE (AUTO CHECK-IN) ---
      const service = agendamento.service;

      if (
        service.track_stock &&
        service.stock_items &&
        service.stock_items.length > 0
      ) {
        let totalCost = 0;
        let detailsArray: string[] = [];

        for (const item of service.stock_items) {
          const stockData = item.stock_item;
          const usedQty = item.quantity_used;

          await tx.stockItem.update({
            where: { id: stockData.id },
            data: { quantity: { decrement: usedQty } },
          });

          if (!stockData.was_expensed) {
            const itemCost = Number(usedQty) * Number(stockData.unit_cost);
            if (itemCost > 0) {
              totalCost += itemCost;
              detailsArray.push(
                `${usedQty}x ${stockData.name} (R$ ${itemCost.toFixed(2).replace(".", ",")})`,
              );
            }
          }
        }

        if (totalCost > 0) {
          await tx.transaction.create({
            data: {
              type: "DESPESA",
              description: `Custo Insumos (Totem) | Agend: ${agendamento.id} | Detalhes: ${detailsArray.join(" | ")}`,
              amount: totalCost,
              date: new Date(),
              status: "PAGO",
              organization_id: admin.organizationId,
              appointment_id: agendamento.id,
            },
          });
        }
      } else if (
        !service.track_stock &&
        service.material_cost &&
        Number(service.material_cost) > 0
      ) {
        await tx.transaction.create({
          data: {
            type: "DESPESA",
            description: `Custo Fixo de Material (Totem - Agend: ${agendamento.id}): ${service.name}`,
            amount: service.material_cost,
            date: new Date(),
            status: "PAGO",
            organization_id: admin.organizationId,
            appointment_id: agendamento.id,
          },
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
        package_info: packageInfo,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[TOTEM_SEARCH_POST]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 },
    );
  }
}

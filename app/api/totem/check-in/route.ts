// app/api/totem/check-in/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // 🔒 1. Valida a sessão do totem
    const admin = await getCurrentAdmin();

    if (!admin || !admin.organizationId) {
      return NextResponse.json(
        { error: "Não autorizado. Totem não está autenticado." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { appointment_id } = body;

    if (!appointment_id) {
      return NextResponse.json(
        { error: "Dados obrigatórios ausentes" },
        { status: 400 },
      );
    }

    // 🔥 BUSCA O AGENDAMENTO COM O SERVIÇO E INSUMOS
    const appt = await prisma.appointment.findUnique({
      where: { id: appointment_id },
      include: {
        client: true,
        package: true,
        service: {
          include: {
            stock_items: {
              include: { stock_item: true },
            },
          },
        },
      },
    });

    if (!appt || appt.organization_id !== admin.organizationId) {
      return NextResponse.json(
        { error: "Agendamento inválido" },
        { status: 404 },
      );
    }

    if (appt.status === "REALIZADO") {
      return NextResponse.json(
        { error: "Este agendamento já foi realizado." },
        { status: 400 },
      );
    }

    // 🔥 NOVO: Trava de segurança para pacotes inativos no Totem
    if (appt.package && appt.package.active === false) {
      return NextResponse.json(
        {
          error:
            "Pacote encerrado ou inválido. Por favor, dirija-se à recepção.",
        },
        { status: 400 },
      );
    }

    const existingCheckIn = await prisma.checkIn.findFirst({
      where: { appointment_id: appt.id },
    });

    if (existingCheckIn) {
      return NextResponse.json(
        { error: "Check-in já registrado." },
        { status: 400 },
      );
    }

    let packageInfo = null;

    // 🔥 A GRANDE TRANSAÇÃO DO TOTEM
    const result = await prisma.$transaction(async (tx) => {
      // 1. Cria o registro de Check-in
      const checkIn = await tx.checkIn.create({
        data: {
          appointment_id: appt.id,
          client_id: appt.client_id,
          package_id: appt.package_id ?? null,
          organization_id: appt.organization_id,
        },
      });

      // 2. Atualiza Pacote e Agendamento
      if (appt.package_id) {
        const pacote = await tx.package.update({
          where: { id: appt.package_id },
          data: { used_sessions: { increment: 1 } },
        });

        packageInfo = {
          used: pacote.used_sessions,
          total: pacote.total_sessions,
        };

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

      // 🔥 --- O CORAÇÃO DO SISTEMA FINANCEIRO E DE ESTOQUE --- 🔥
      const service = appt.service;

      if (service.track_stock && service.stock_items.length > 0) {
        // FLUXO A e B: A Cliente Organizada / Híbrida (Tem Estoque)
        for (const item of service.stock_items) {
          const stockData = item.stock_item;
          const usedQty = item.quantity_used;

          // a) Baixa a quantidade física da prateleira (Sempre)
          await tx.stockItem.update({
            where: { id: stockData.id },
            data: { quantity: { decrement: usedQty } },
          });

          // b) Regra de Caixa: Só gera despesa se NÃO marcou "Lançar como Despesa" na compra
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
                  organization_id: appt.organization_id,
                  appointment_id: appt.id,
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
        // FLUXO C: A Cliente Preguiçosa (O Chute Manual)
        await tx.transaction.create({
          data: {
            type: "DESPESA",
            description: `Custo Fixo de Material (Totem): ${service.name}`,
            amount: service.material_cost,
            date: new Date(),
            status: "PAGO",
            organization_id: appt.organization_id,
            appointment_id: appt.id,
          },
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
      package_info: packageInfo,
    });
  } catch (error) {
    console.error("Erro ao fazer check-in no Totem:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

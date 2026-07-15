// app/api/totem/check-in/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // 🛡️ Validação unificada de sessão e tenant
    const admin = await requireAuth();

    const body = await request.json();
    const { appointment_id } = body;

    if (!appointment_id) {
      return NextResponse.json(
        { error: "Dados obrigatórios ausentes" },
        { status: 400 },
      );
    }

    // BUSCA O AGENDAMENTO COM O SERVIÇO E INSUMOS
    // organization_id embutido no where: escopo de tenant garantido já na leitura
    const appt = await prisma.appointment.findUnique({
      where: { id: appointment_id, organization_id: admin.organizationId },
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

    if (!appt) {
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

    // Trava de segurança para pacotes inativos
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
      where: { appointment_id: appt.id, organization_id: admin.organizationId },
    });

    if (existingCheckIn) {
      return NextResponse.json(
        { error: "Check-in já registrado." },
        { status: 400 },
      );
    }

    let packageInfo = null;

    // A GRANDE TRANSAÇÃO DO TOTEM
    const result = await prisma.$transaction(async (tx) => {
      // 1. Cria o registro de Check-in
      const checkIn = await tx.checkIn.create({
        data: {
          appointment_id: appt.id,
          client_id: appt.client_id,
          package_id: appt.package_id ?? null,
          organization_id: admin.organizationId,
          auto_processed: true, // dispara reversão de estoque/financeiro
        },
      });

      // 2. Atualiza Pacote e Agendamento
      if (appt.package_id) {
        const pacote = await tx.package.update({
          where: { id: appt.package_id, organization_id: admin.organizationId },
          data: { used_sessions: { increment: 1 } },
        });

        packageInfo = {
          used: pacote.used_sessions,
          total: pacote.total_sessions,
        };

        await tx.appointment.update({
          where: { id: appt.id, organization_id: admin.organizationId },
          data: { status: "REALIZADO" },
        });
      } else {
        await tx.appointment.update({
          where: { id: appt.id, organization_id: admin.organizationId },
          data: { status: "REALIZADO", has_charge: true },
        });
      }

      // --- O CORAÇÃO DO SISTEMA FINANCEIRO E DE ESTOQUE ---
      const service = appt.service;

      if (service.track_stock && service.stock_items.length > 0) {
        for (const item of service.stock_items) {
          const stockData = item.stock_item;
          const usedQty = item.quantity_used;

          // a) Baixa a quantidade física da prateleira (Sempre)
          await tx.stockItem.update({
            where: { id: stockData.id, organization_id: admin.organizationId },
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
        // Fluxo de Custo Fixo de Material
        await tx.transaction.create({
          data: {
            type: "DESPESA",
            description: `Custo Fixo de Material (Totem): ${service.name}`,
            amount: service.material_cost,
            date: new Date(),
            status: "PAGO",
            organization_id: admin.organizationId,
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
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[TOTEM_CHECKIN_POST]", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

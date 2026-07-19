// app/api/totem/check-in/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getTenantPrisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // 🛡️ Validação unificada de sessão e tenant
    const admin = await requireAuth();
    // Instancia o Prisma blindado para a organização atual
    const prisma = getTenantPrisma(admin.organizationId);

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

    if (appt.status === "REALIZADO" || appt.status === "CANCELADO") {
      return NextResponse.json(
        { error: "Este agendamento já foi realizado ou está cancelado." },
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

    // O getTenantPrisma garante a injeção do organization_id por baixo dos panos aqui
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
      if (appt.package) {
        // 👈 Mudança chave aqui: validamos o objeto inteiro
        // Utilizamos updateMany para poder injetar a condição de saldo no banco
        const pacoteUpdate = await tx.package.updateMany({
          where: {
            id: appt.package.id, // Usamos o ID do objeto garantido pelo TS
            organization_id: admin.organizationId,
            used_sessions: { lt: appt.package.total_sessions }, // Trava atômica livre de erros
          },
          data: { used_sessions: { increment: 1 } },
        });

        // Se count for 0, significa que o update falhou (ou não achou, ou falhou na trava de saldo)
        if (pacoteUpdate.count === 0) {
          throw new Error(
            "Saldo de sessões esgotado devido a requisições simultâneas.",
          );
        }

        packageInfo = {
          used: appt.package.used_sessions + 1, // TS agora sabe que não é null
          total: appt.package.total_sessions, // TS agora sabe que não é null
        };

        await tx.appointment.update({
          where: { id: appt.id, organization_id: admin.organizationId },
          data: { status: "REALIZADO" },
        });
      } else {
        // Fluxo para agendamento avulso (sem pacote)
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

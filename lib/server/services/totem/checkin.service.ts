// lib/server/services/totem/checkin.service.ts
import { getTenantPrisma } from "@/lib/prisma";

export class TotemCheckInService {
  /**
   * Processa o check-in de um agendamento no Totem, realizando a baixa de pacote,
   * dedução de estoque e registro financeiro.
   */
  static async processCheckIn(appointmentId: string, organizationId: string) {
    const prisma = getTenantPrisma(organizationId);

    // BUSCA O AGENDAMENTO COM O SERVIÇO E INSUMOS
    const appt = await prisma.appointment.findUnique({
      where: { id: appointmentId, organization_id: organizationId },
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
      throw new Error("AGENDAMENTO_INVALIDO");
    }

    if (appt.status === "REALIZADO" || appt.status === "CANCELADO") {
      throw new Error("AGENDAMENTO_JA_PROCESSADO");
    }

    // Trava de segurança para pacotes inativos
    if (appt.package && appt.package.active === false) {
      throw new Error("PACOTE_INATIVO");
    }

    const existingCheckIn = await prisma.checkIn.findFirst({
      where: { appointment_id: appt.id, organization_id: organizationId },
    });

    if (existingCheckIn) {
      throw new Error("CHECKIN_JA_REGISTRADO");
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
          organization_id: organizationId,
          auto_processed: true, // dispara reversão de estoque/financeiro
        },
      });

      // 2. Atualiza Pacote e Agendamento
      if (appt.package) {
        // Utilizamos updateMany para injetar a condição de saldo no banco
        const pacoteUpdate = await tx.package.updateMany({
          where: {
            id: appt.package.id,
            organization_id: organizationId,
            used_sessions: { lt: appt.package.total_sessions },
          },
          data: { used_sessions: { increment: 1 } },
        });

        if (pacoteUpdate.count === 0) {
          throw new Error("SALDO_ESGOTADO");
        }

        packageInfo = {
          used: appt.package.used_sessions + 1,
          total: appt.package.total_sessions,
        };

        await tx.appointment.update({
          where: { id: appt.id, organization_id: organizationId },
          data: { status: "REALIZADO" },
        });
      } else {
        // Fluxo para agendamento avulso (sem pacote)
        await tx.appointment.update({
          where: { id: appt.id, organization_id: organizationId },
          data: { status: "REALIZADO", has_charge: true },
        });
      }

      // --- O CORAÇÃO DO SISTEMA FINANCEIRO E DE ESTOQUE ---
      const service = appt.service;

      if (service.track_stock && service.stock_items.length > 0) {
        for (const item of service.stock_items) {
          const stockData = item.stock_item;
          const usedQty = item.quantity_used;

          // a) Baixa a quantidade física da prateleira
          await tx.stockItem.update({
            where: { id: stockData.id, organization_id: organizationId },
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
                  organization_id: organizationId,
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
            organization_id: organizationId,
            appointment_id: appt.id,
          },
        });
      }

      return checkIn;
    });

    return {
      clientName: appt.client.name,
      serviceName: appt.service.name,
      time: new Date(appt.date_time).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      checkInId: result.id,
      package_info: packageInfo,
    };
  }
}

"use server";

import { prisma as db } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createAppointment } from "./appointments";
import { triggerZibeeSyncById } from "@/lib/server/integrations/zibee.service";

export async function getWaitingRoomData() {
  try {
    const admin = await requireAuth();
    const organizationId = admin.organizationId;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const checkIns = await db.checkIn.findMany({
      where: {
        organization_id: organizationId,
        date_time: { gte: startOfToday },
        deleted_at: null,
        completed_at: null,
      },
      include: {
        client: true,
        appointment: {
          include: {
            service: true,
            professional: { select: { display_name: true } },
          },
        },
      },
      orderBy: { date_time: "asc" },
    });

    const mapped = checkIns.map((ci) => ({
      id: ci.id,
      date_time: ci.date_time.toISOString(),
      clientName: ci.client?.name || "Desconhecido",
      clientPhone: ci.client?.phone_whatsapp || "",
      serviceName: ci.appointment?.service?.name || "Sem Serviço",
      professionalName: ci.appointment?.professional?.display_name || "Livre",
      appointmentTime: ci.appointment?.date_time ? ci.appointment.date_time.toISOString() : null,
    }));

    return { success: true, data: mapped };
  } catch (error: any) {
    console.error("Erro ao buscar sala de espera:", error);
    return { success: false, error: error.message };
  }
}

export async function completeCheckIn(checkInId: string) {
  try {
    const admin = await requireAuth();
    const organizationId = admin.organizationId;

    await db.checkIn.update({
      where: {
        id: checkInId,
        organization_id: organizationId,
      },
      data: {
        completed_at: new Date(),
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Erro ao finalizar check-in:", error);
    return { success: false, error: error.message };
  }
}

export async function createManualCheckIn(data: {
  clientId: string;
  serviceId: string;
  professionalId: string;
  packageId?: string;
  isPaid?: boolean;
  paymentMethod?: string | null;
}) {
  try {
    const admin = await requireAuth();
    const organizationId = admin.organizationId;

    // 1. Criar agendamento instantâneo com data atual
    const now = new Date();
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hourStr = String(now.getHours()).padStart(2, "0");
    const minuteStr = String(now.getMinutes()).padStart(2, "0");
    const dateTimeString = `${year}-${month}-${day}T${hourStr}:${minuteStr}:00.000-03:00`;

    const apptResult = await createAppointment({
      clientId: data.clientId,
      serviceId: data.serviceId,
      dateTime: dateTimeString,
      professionalId: data.professionalId,
      packageId: data.packageId,
      isPaid: data.isPaid,
      paymentMethod: data.paymentMethod,
    });

    if (!apptResult.success) {
      throw new Error(apptResult.error || "Erro ao criar agendamento de encaixe.");
    }

    if (!apptResult.appointments || apptResult.appointments.length === 0) {
      throw new Error("Agendamento não foi criado corretamente.");
    }

    const newAppointment = apptResult.appointments[0];
    const newAppointmentId = newAppointment.id;

    // 2. Buscar configurações da organização para saber se completa automaticamente
    const orgSettings = await db.settings.findUnique({
      where: { organization_id: organizationId },
      select: {
        auto_complete_on_checkin: true,
      },
    });
    const autoComplete = orgSettings?.auto_complete_on_checkin ?? true;

    // 3. Buscar serviço com insumos para estoque
    const service = await db.service.findUnique({
      where: { id: data.serviceId, organization_id: organizationId },
      include: {
        stock_items: {
          include: { stock_item: true },
        },
      },
    });

    const targetStatus = autoComplete ? "REALIZADO" : "CONFIRMADO";
    const createdTxIds: string[] = [];

    const checkIn = await db.$transaction(async (tx) => {
      // a) Atualiza status do agendamento
      await tx.appointment.update({
        where: { id: newAppointmentId },
        data: {
          status: targetStatus,
          payment_method: data.paymentMethod ? (data.paymentMethod as any) : null,
          has_charge: !data.packageId && !data.isPaid,
        },
      });

      // b) Se estiver associado a pacote e for autoComplete, incrementa sessões usadas
      if (autoComplete && data.packageId) {
        const pkg = await tx.package.findUnique({
          where: { id: data.packageId, organization_id: organizationId },
        });

        if (pkg) {
          const newUsed = pkg.used_sessions + 1;
          const willRemainActive = newUsed < pkg.total_sessions;
          await tx.package.update({
            where: { id: pkg.id },
            data: {
              used_sessions: { increment: 1 },
              active: willRemainActive,
            },
          });
        }
      }

      // c) Processar baixa de estoque e despesas de insumo se autoComplete estiver ativo
      if (autoComplete && service) {
        if (service.track_stock && service.stock_items.length > 0) {
          for (const item of service.stock_items) {
            const stockData = item.stock_item;
            const usedQty = item.quantity_used;

            await tx.stockItem.update({
              where: { id: stockData.id, organization_id: organizationId },
              data: { quantity: { decrement: usedQty } },
            });

            if (!stockData.was_expensed) {
              const costOfUsedQty = Number(usedQty) * Number(stockData.unit_cost);
              if (costOfUsedQty > 0) {
                const expTx = await tx.transaction.create({
                  data: {
                    type: "DESPESA",
                    description: `Custo Insumo (Check-in Rápido): ${stockData.name}`,
                    amount: costOfUsedQty,
                    date: new Date(),
                    status: "PAGO",
                    organization_id: organizationId,
                    appointment_id: newAppointmentId,
                  },
                });
                createdTxIds.push(expTx.id);
              }
            }
          }
        } else if (!service.track_stock && service.material_cost && Number(service.material_cost) > 0) {
          const expTx = await tx.transaction.create({
            data: {
              type: "DESPESA",
              description: `Custo Fixo de Material (Check-in Rápido): ${service.name}`,
              amount: service.material_cost,
              date: new Date(),
              status: "PAGO",
              organization_id: organizationId,
              appointment_id: newAppointmentId,
            },
          });
          createdTxIds.push(expTx.id);
        }
      }

      // d) Gerar o Check-in
      const ci = await tx.checkIn.create({
        data: {
          appointment_id: newAppointmentId,
          client_id: data.clientId,
          package_id: data.packageId || null,
          organization_id: organizationId,
          auto_processed: autoComplete,
        },
      });

      // e) Adicionar pontos de fidelidade
      const loyaltySettings = await tx.loyaltySettings.findUnique({
        where: { organization_id: organizationId },
      });

      if (loyaltySettings?.is_active && loyaltySettings?.check_in_active) {
        const clientCurrent = await tx.client.findUnique({
          where: { id: data.clientId },
          select: { loyalty_points: true },
        });
        const newPoints = Math.min(
          (clientCurrent?.loyalty_points || 0) + loyaltySettings.check_in_points,
          loyaltySettings.max_points,
        );
        await tx.client.update({
          where: { id: data.clientId },
          data: { loyalty_points: newPoints },
        });
      }

      return ci;
    });

    for (const txId of createdTxIds) {
      triggerZibeeSyncById(txId);
    }

    return { success: true, data: checkIn };
  } catch (error: any) {
    console.error("Erro no check-in manual:", error);
    return { success: false, error: error.message };
  }
}

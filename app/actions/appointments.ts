// app/actions/appointments.ts
"use server";

import { prisma } from "@/lib/prisma";
import { AppointmentStatus, PaymentMethod } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { generateRecurrentDates } from "@/lib/date-utils";
import { randomUUID } from "crypto";

// --- TIPOS ---
export type CreateAppointmentInput = {
  clientId: string;
  serviceId: string;
  dateTime: Date | string;
  observations?: string;
  packageId?: string;
  repeatCount?: number;
  professionalId?: string;
};

export type CreateAppointmentResult =
  | { success: true; appointments: any[] }
  | { success: false; error: string };

// 🔥 FUNÇÃO hasScheduleConflict FOI REMOVIDA DAQUI!
// A clínica agora tem liberdade total para sobrepor agendamentos (overbooking/assistentes).
// Ninguém mais será bloqueado de agendar o horário que desejar.

// --- 1. CRIAR AGENDAMENTO (RECORRÊNCIA) ---
export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<CreateAppointmentResult> {
  try {
    const admin = await requireAuth();
    const {
      clientId,
      serviceId,
      dateTime,
      observations,
      packageId,
      repeatCount = 1,
      professionalId,
    } = input;

    const firstDateTime =
      typeof dateTime === "string" ? new Date(dateTime) : dateTime;
    const totalSessionsToCreate = Math.max(1, repeatCount);
    const appointmentDates = generateRecurrentDates(
      firstDateTime,
      totalSessionsToCreate,
    );
    const recurrenceId = totalSessionsToCreate > 1 ? randomUUID() : null;

    const service = await prisma.service.findUnique({
      where: { id: serviceId, organization_id: admin.organizationId },
    });

    if (!service) {
      return { success: false, error: "Serviço não encontrado." };
    }

    const targetProfessional = professionalId || admin.id;

    // 🔥 O BLOQUEIO DE HORÁRIOS FOI REMOVIDO DAQUI
    // Os agendamentos agora passam direto para o banco de dados sem restrições.

    let startSessionNumber = 0;

    if (packageId) {
      const pkg = await prisma.package.findUnique({ where: { id: packageId } });
      if (!pkg || pkg.organization_id !== admin.organizationId) {
        return { success: false, error: "Pacote não encontrado." };
      }

      if (!pkg.active) {
        return {
          success: false,
          error:
            "Este pacote está arquivado e não pode receber novos agendamentos.",
        };
      }

      const sessionsAvailable = pkg.total_sessions - pkg.used_sessions;
      if (sessionsAvailable < totalSessionsToCreate) {
        return {
          success: false,
          error: `Saldo insuficiente. O pacote tem apenas ${sessionsAvailable} sessões disponíveis.`,
        };
      }
      startSessionNumber = pkg.used_sessions;
    }

    const appointments = await prisma.$transaction(async (tx) => {
      const created: any[] = [];
      for (let i = 0; i < appointmentDates.length; i++) {
        const appt = await tx.appointment.create({
          data: {
            date_time: appointmentDates[i],
            observations,
            client_id: clientId,
            service_id: serviceId,
            package_id: packageId || null,
            organization_id: admin.organizationId,
            recurrence_id: recurrenceId,
            session_number: packageId ? startSessionNumber + i + 1 : null,
            professional_id: targetProfessional,
            snapshot_service_name: service.name,
            snapshot_service_price: service.price,
            snapshot_service_duration: service.duration,
          },
        });
        created.push(appt);
      }
      return created;
    });

    revalidatePath("/admin/agenda");

    // CONVERSÃO DE DECIMAL PARA NUMBER AQUI PARA O NEXT.JS NÃO RECLAMAR
    const sanitizedAppointments = appointments.map((appt) => ({
      ...appt,
      snapshot_service_price: appt.snapshot_service_price
        ? Number(appt.snapshot_service_price)
        : null,
    }));

    return { success: true, appointments: sanitizedAppointments };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao criar agendamento." };
  }
}

// --- 2. ATUALIZAR E GERAR DESPESA AUTOMÁTICA ---
export async function updateAppointment(
  id: string,
  data: {
    status: string;
    paymentMethod: string | null;
    observations: string;
    hasCharge: boolean;
  },
  updateAll: boolean = false,
  recurrenceId?: string | null,
) {
  try {
    const admin = await requireAuth();

    const statusMap: Record<string, AppointmentStatus> = {
      a_confirmar: AppointmentStatus.PENDENTE,
      confirmado: AppointmentStatus.CONFIRMADO,
      atrasou: AppointmentStatus.PENDENTE,
      nao_compareceu: AppointmentStatus.CANCELADO,
      cancelado: AppointmentStatus.CANCELADO,
      realizado: AppointmentStatus.REALIZADO,
    };

    const finalStatus = statusMap[data.status] || AppointmentStatus.PENDENTE;
    const finalPaymentMethod = data.paymentMethod
      ? (data.paymentMethod as PaymentMethod)
      : null;
    let finalHasCharge = data.hasCharge;

    if (
      finalStatus === AppointmentStatus.REALIZADO &&
      finalPaymentMethod !== null
    )
      finalHasCharge = false;
    if (finalStatus === AppointmentStatus.CANCELADO) finalHasCharge = false;

    const currentAppt = await prisma.appointment.findUnique({
      where: { id, organization_id: admin.organizationId },
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

    if (!currentAppt)
      return { success: false, error: "Agendamento não encontrado." };

    const isMarkingAsDone =
      finalStatus === AppointmentStatus.REALIZADO &&
      currentAppt.status !== AppointmentStatus.REALIZADO;

    if (isMarkingAsDone && currentAppt.package) {
      if (!currentAppt.package.active) {
        return {
          success: false,
          error:
            "Este pacote foi arquivado. Esta sessão foi invalidada e não pode receber baixa.",
        };
      }
      if (
        currentAppt.package.used_sessions >= currentAppt.package.total_sessions
      ) {
        return {
          success: false,
          error: "Este pacote já atingiu o limite total de sessões permitidas.",
        };
      }
    }

    await prisma.$transaction(async (tx) => {
      if (updateAll && recurrenceId) {
        await tx.appointment.updateMany({
          where: {
            recurrence_id: recurrenceId,
            organization_id: admin.organizationId,
            status: { not: AppointmentStatus.REALIZADO },
          },
          data: {
            status: finalStatus,
            payment_method: finalPaymentMethod,
            has_charge: finalHasCharge,
            observations: data.observations,
          },
        });

        if (isMarkingAsDone && currentAppt.package_id && currentAppt.package) {
          const updateResult = await tx.appointment.count({
            where: {
              recurrence_id: recurrenceId,
              organization_id: admin.organizationId,
              status: finalStatus,
            },
          });

          // 🔥 AUTO-ENCERRAMENTO DE PACOTE (Recorrente)
          const newUsedSessions =
            currentAppt.package.used_sessions + updateResult;

          await tx.package.update({
            where: { id: currentAppt.package_id },
            data: {
              used_sessions: { increment: updateResult },
              active: newUsedSessions < currentAppt.package.total_sessions,
            },
          });
        }
      } else {
        await tx.appointment.update({
          where: { id, organization_id: admin.organizationId },
          data: {
            status: finalStatus,
            observations: data.observations,
            payment_method: finalPaymentMethod,
            has_charge: finalHasCharge,
          },
        });

        if (isMarkingAsDone && currentAppt.package_id && currentAppt.package) {
          // 🔥 AUTO-ENCERRAMENTO DE PACOTE (Individual)
          const newUsedSessions = currentAppt.package.used_sessions + 1;

          await tx.package.update({
            where: { id: currentAppt.package_id },
            data: {
              used_sessions: { increment: 1 },
              active: newUsedSessions < currentAppt.package.total_sessions,
            },
          });
        }
      }

      const service = currentAppt.service;
      const requiresRevenue =
        finalStatus === AppointmentStatus.REALIZADO &&
        !currentAppt.package_id &&
        finalPaymentMethod !== null;

      if (requiresRevenue) {
        const existingRevenue = await tx.transaction.findFirst({
          where: { appointment_id: currentAppt.id, type: "RECEITA" },
        });

        if (!existingRevenue) {
          const apptPrice = currentAppt.snapshot_service_price ?? service.price;
          const apptName = currentAppt.snapshot_service_name ?? service.name;

          await tx.transaction.create({
            data: {
              type: "RECEITA",
              description: `Serviço Realizado: ${apptName} (${currentAppt.client.name})`,
              amount: apptPrice,
              date: new Date(),
              status: "PAGO",
              organization_id: admin.organizationId,
              appointment_id: currentAppt.id,
            },
          });
        }
      }

      if (isMarkingAsDone) {
        if (service.track_stock && service.stock_items.length > 0) {
          for (const item of service.stock_items) {
            const stockData = item.stock_item;
            const usedQty = item.quantity_used;

            await tx.stockItem.update({
              where: { id: stockData.id },
              data: { quantity: { decrement: usedQty } },
            });

            if (!stockData.was_expensed) {
              const costOfUsedQty =
                Number(usedQty) * Number(stockData.unit_cost);

              if (costOfUsedQty > 0) {
                await tx.transaction.create({
                  data: {
                    type: "DESPESA",
                    description: `Custo de Insumo (Sessão): ${stockData.name}`,
                    amount: costOfUsedQty,
                    date: new Date(),
                    status: "PAGO",
                    organization_id: admin.organizationId,
                    appointment_id: currentAppt.id,
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
          await tx.transaction.create({
            data: {
              type: "DESPESA",
              description: `Custo Fixo de Material: ${service.name}`,
              amount: service.material_cost,
              date: new Date(),
              status: "PAGO",
              organization_id: admin.organizationId,
              appointment_id: currentAppt.id,
            },
          });
        }
      }
    });

    revalidatePath("/admin/agenda");
    revalidatePath("/admin/packages");
    revalidatePath("/admin/stock");
    revalidatePath("/admin/finance/dashboard");

    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao atualizar agendamento." };
  }
}

// --- 3. DELETAR (INDIVIDUAL OU SÉRIE) COM SEGURANÇA ---
export async function deleteAppointment(
  id: string,
  deleteAll: boolean = false,
  recurrenceId?: string | null,
) {
  try {
    const admin = await requireAuth();

    const appointmentsToDelete = await prisma.appointment.findMany({
      where: {
        ...(deleteAll && recurrenceId
          ? { recurrence_id: recurrenceId }
          : { id }),
        organization_id: admin.organizationId,
      },
      include: { package: true },
    });

    if (appointmentsToDelete.length === 0)
      return { success: false, error: "Agendamento não encontrado." };

    await prisma.$transaction(async (tx) => {
      for (const appt of appointmentsToDelete) {
        // 🔥 Se o pacote estava ativo ou arquivado, ao deletar uma sessão realizada ele sempre volta a ficar ativo para ser usado!
        if (appt.status === AppointmentStatus.REALIZADO && appt.package_id) {
          await tx.package.update({
            where: { id: appt.package_id },
            data: {
              used_sessions: { decrement: 1 },
              active: true,
            },
          });
        }

        await tx.checkIn.deleteMany({
          where: { appointment_id: appt.id },
        });
      }

      if (deleteAll && recurrenceId) {
        await tx.appointment.deleteMany({
          where: {
            recurrence_id: recurrenceId,
            organization_id: admin.organizationId,
          },
        });
      } else {
        await tx.appointment.delete({
          where: { id, organization_id: admin.organizationId },
        });
      }
    });

    revalidatePath("/admin/agenda");
    revalidatePath("/admin/packages");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/history");

    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir agendamento:", error);
    return { success: false, error: "Erro ao excluir agendamento." };
  }
}

// --- 4. DRAG AND DROP ---
export async function updateAppointmentDateTime(
  id: string,
  newDateIso: string,
) {
  try {
    const admin = await requireAuth();

    const apptToMove = await prisma.appointment.findUnique({
      where: { id, organization_id: admin.organizationId },
    });

    if (!apptToMove) {
      return { success: false, error: "Agendamento não encontrado." };
    }

    const newDate = new Date(newDateIso);

    // 🔥 BLOQUEIO DE DRAG AND DROP REMOVIDO!
    // Você pode arrastar um agendamento para cima do outro livremente agora.

    await prisma.appointment.update({
      where: { id, organization_id: admin.organizationId },
      data: { date_time: newDate },
    });

    revalidatePath("/admin/agenda");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Falha ao reagendar." };
  }
}
// --- 5. PROCESSAMENTO AUTOMÁTICO DE FALTAS (CRON JOB) ---
export async function processDailyNoShows(secretKey?: string) {
  try {
    if (secretKey !== process.env.CRON_SECRET) {
      return { success: false, error: "Acesso não autorizado." };
    }

    const now = new Date();

    const overdueAppointments = await prisma.appointment.findMany({
      where: {
        date_time: { lt: now },
        status: {
          in: [AppointmentStatus.PENDENTE, AppointmentStatus.CONFIRMADO],
        },
        check_in: { is: null },
      },
      include: {
        package: true,
        client: true,
      },
    });

    if (overdueAppointments.length === 0) {
      return {
        success: true,
        processed: 0,
        message: "Nenhuma falta pendente.",
      };
    }

    let processedCount = 0;

    // 🔥 MUDANÇA AQUI: O Loop agora fica por FORA da transação.
    for (const appt of overdueAppointments) {
      try {
        // 🔥 Cada agendamento tem sua própria "mini-transação" super rápida
        await prisma.$transaction(async (tx) => {
          // A. Altera o status para CANCELADO
          await tx.appointment.update({
            where: { id: appt.id },
            data: {
              status: AppointmentStatus.CANCELADO,
              has_charge: false,
              observations: appt.observations
                ? `${appt.observations}\n(Falta automática)`
                : "Falta não justificada. Baixa automática pelo sistema.",
            },
          });

          // B. Desconta a sessão do Pacote
          if (appt.package_id && appt.package) {
            const newUsedSessions = appt.package.used_sessions + 1;
            const stillActive = newUsedSessions < appt.package.total_sessions;

            await tx.package.update({
              where: { id: appt.package_id },
              data: {
                used_sessions: newUsedSessions,
                active: stillActive,
              },
            });
          }

          // C. Cria uma nota no histórico da cliente com texto dinâmico
          const formattedDate = new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
          }).format(appt.date_time);

          // Aqui é a inteligência: Verifica se era pacote ou avulso para gerar o texto certo
          const noteText = appt.package_id
            ? `Falta Automática: A cliente não compareceu ao agendamento do dia ${formattedDate}. A sessão foi descontada do pacote conforme a política de faltas.`
            : `Falta Automática: A cliente não compareceu ao agendamento do dia ${formattedDate} (Serviço Avulso). A consulta foi cancelada automaticamente.`;

          await tx.clientNote.create({
            data: {
              text: noteText,
              client_id: appt.client_id,
              organization_id: appt.organization_id,
              date: now,
            },
          });
        });

        // Se a mini-transação deu certo, conta +1
        processedCount++;
      } catch (itemError) {
        // Se um agendamento falhar, loga o erro e CONTINUA para o próximo!
        console.error(
          `Erro ao processar falta do agendamento ${appt.id}:`,
          itemError,
        );
      }
    }

    // Atualiza os painéis do sistema
    revalidatePath("/admin/agenda");
    revalidatePath("/admin/packages");
    revalidatePath("/admin/clients");

    return { success: true, processed: processedCount };
  } catch (error) {
    console.error("Erro no processDailyNoShows:", error);
    return {
      success: false,
      error: "Falha ao processar faltas automaticamente.",
    };
  }
}

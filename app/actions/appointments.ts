// app/actions/appointments.ts
"use server";

import { getTenantPrisma } from "@/lib/prisma";
import { AppointmentStatus, PaymentMethod } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { generateRecurrentDates } from "@/lib/date-utils";
import { randomUUID } from "crypto";

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

// --- 1. CRIAR AGENDAMENTO (RECORRÊNCIA) ---
export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<CreateAppointmentResult> {
  try {
    const admin = await requireAuth();
    const prisma = getTenantPrisma(admin.organizationId);

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
    const prisma = getTenantPrisma(admin.organizationId);

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

// --- 3. DELETAR (INDIVIDUAL OU SÉRIE) COM LOG DE AUDITORIA ---
export async function deleteAppointment(
  id: string,
  deleteAll: boolean = false,
  recurrenceId?: string | null,
) {
  try {
    const admin = await requireAuth();
    const prisma = getTenantPrisma(admin.organizationId);

    // 1. Busca os registros ANTES de deletar para termos os dados para o log
    const appointmentsToDelete = await prisma.appointment.findMany({
      where: {
        ...(deleteAll && recurrenceId
          ? { recurrence_id: recurrenceId }
          : { id }),
        organization_id: admin.organizationId,
      },
      include: { package: true, client: true, check_in: true },
    });

    if (appointmentsToDelete.length === 0)
      return { success: false, error: "Agendamento não encontrado." };

    // 2. Trava de segurança para agendamentos realizados (opcional, mas recomendado)
    const hasFinishedAppointments = appointmentsToDelete.some(
      (appt) => appt.status === AppointmentStatus.REALIZADO,
    );

    if (hasFinishedAppointments) {
      return {
        success: false,
        error: "Não é permitido excluir agendamentos já realizados.",
      };
    }

    await prisma.$transaction(async (tx) => {
      for (const appt of appointmentsToDelete) {
        // A. Auditoria: Registra a exclusão no histórico do cliente
        const dateStr = new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "short",
          timeStyle: "short",
        }).format(appt.date_time);

        const checkInText = appt.check_in
          ? "e seu Check-in correspondente foram EXCLUÍDOS"
          : "foi EXCLUÍDO";

        await tx.clientNote.create({
          data: {
            text: `Ação: Agendamento de ${appt.snapshot_service_name || "Serviço"} no dia ${dateStr} ${checkInText} por: ${admin.name || "Administrador"}`,
            client_id: appt.client_id,
            organization_id: admin.organizationId,
            date: new Date(),
          },
        });

        // B. Lógica de estorno de sessão de pacote (se necessário)
        if (appt.status === AppointmentStatus.REALIZADO && appt.package_id) {
          await tx.package.update({
            where: { id: appt.package_id },
            data: {
              used_sessions: { decrement: 1 },
              active: true,
            },
          });
        }

        // C. Deleta o Check-in se existir
        await tx.checkIn.deleteMany({
          where: { appointment_id: appt.id },
        });
      }

      // 3. Executa a exclusão propriamente dita
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
    const prisma = getTenantPrisma(admin.organizationId);

    const apptToMove = await prisma.appointment.findUnique({
      where: { id, organization_id: admin.organizationId },
    });

    if (!apptToMove) {
      return { success: false, error: "Agendamento não encontrado." };
    }

    const newDate = new Date(newDateIso);

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

// --- 5. PROCESSAMENTO AUTOMÁTICO DE FALTAS (NEUTRALIZADO) ---
export async function processDailyNoShows(secretKey?: string) {
  // 🔥 Automação desativada a pedido da clínica.
  // A falta agora deve ser tratada manualmente pela UI (Admin).
  return {
    success: true,
    processed: 0,
    message: "Automação de faltas desativada. O controle agora é 100% manual.",
  };
}

// --- 6. DESFAZER FALTA (MANUAL OU AUTOMÁTICA) ---
export async function undoNoShow(appointmentId: string) {
  try {
    const admin = await requireAuth();
    const prisma = getTenantPrisma(admin.organizationId);

    const appt = await prisma.appointment.findUnique({
      where: { id: appointmentId, organization_id: admin.organizationId },
      include: { package: true },
    });

    if (!appt || appt.status !== AppointmentStatus.CANCELADO) {
      return {
        success: false,
        error: "Agendamento não encontrado ou não está cancelado.",
      };
    }

    await prisma.$transaction(async (tx) => {
      const cleanObs = appt.observations
        ? appt.observations
            .replace("\n(Falta automática)", "")
            .replace("\n(Falta Registrada)", "")
            .replace("(Falta Registrada)", "")
            .replace(
              "Falta não justificada. Baixa automática pelo sistema.",
              "",
            )
        : null;

      await tx.appointment.update({
        where: { id: appt.id },
        data: {
          status: AppointmentStatus.PENDENTE,
          observations: cleanObs?.trim() === "" ? null : cleanObs,
        },
      });

      if (appt.package_id && appt.package) {
        await tx.package.update({
          where: { id: appt.package_id },
          data: {
            used_sessions: { decrement: 1 },
            active: true, // Garante que o pacote volta a ficar ativo caso tenha sido encerrado por essa falta
          },
        });
      }

      // Limpa a nota de "Falta" do histórico da cliente (busca pela data exata da consulta)
      const dateStr = new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
      }).format(appt.date_time);

      await tx.clientNote.deleteMany({
        where: {
          client_id: appt.client_id,
          organization_id: admin.organizationId,
          text: { contains: dateStr },
        },
      });
    });

    revalidatePath("/admin/agenda");
    revalidatePath("/admin/packages");
    revalidatePath("/admin/clients");

    return { success: true };
  } catch (error) {
    console.error("Erro ao desfazer falta:", error);
    return { success: false, error: "Falha ao estornar a falta do cliente." };
  }
}

// --- 7. REGISTRAR FALTA MANUALMENTE ---
export async function registerManualNoShow(
  appointmentId: string,
  observation: string,
) {
  try {
    const admin = await requireAuth();
    const prisma = getTenantPrisma(admin.organizationId);

    const appt = await prisma.appointment.findUnique({
      where: { id: appointmentId, organization_id: admin.organizationId },
      include: { package: true },
    });

    if (!appt) return { success: false, error: "Agendamento não encontrado." };
    if (
      appt.status === AppointmentStatus.CANCELADO ||
      appt.status === AppointmentStatus.REALIZADO
    ) {
      return { success: false, error: "Este agendamento já está fechado." };
    }

    await prisma.$transaction(async (tx) => {
      const newObs = observation
        ? `${observation}\n(Falta Registrada)`
        : "(Falta Registrada)";

      await tx.appointment.update({
        where: { id: appt.id },
        data: {
          status: AppointmentStatus.CANCELADO,
          has_charge: false,
          payment_method: null,
          observations: newObs,
        },
      });

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

      // Cria nota no histórico da cliente
      const formattedDate = new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(appt.date_time);
      const noteText = appt.package_id
        ? `Falta Manual: A cliente não compareceu ao agendamento do dia ${formattedDate}. A sessão foi descontada do pacote.`
        : `Falta Manual: A cliente não compareceu ao agendamento do dia ${formattedDate} (Serviço Avulso).`;

      await tx.clientNote.create({
        data: {
          text: noteText,
          client_id: appt.client_id,
          organization_id: admin.organizationId,
          date: new Date(),
        },
      });
    });

    revalidatePath("/admin/agenda");
    revalidatePath("/admin/packages");
    revalidatePath("/admin/clients");

    return { success: true };
  } catch (error) {
    console.error("Erro ao registrar falta:", error);
    return { success: false, error: "Falha ao registrar a falta." };
  }
}

// app/actions/packages.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { AppointmentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { PackageService } from "@/lib/server/services/packages/package.service";
import { validateScheduleAppointment } from "@/lib/schedule-validation";
import { triggerZibeeSyncById, deleteTransactionFromZibee } from "@/lib/server/integrations/zibee.service";

/**
 * Busca todos os pacotes da organização e calcula os KPIs em tempo real.
 *  OTIMIZADO: Agora suporta Paginação Server-Side e Busca Inteligente.
 */
export async function getPackagesDashboardData(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  try {
    const admin = await requireAuth();
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const baseWhere: any = { organization_id: admin.organizationId };

    // Sincroniza pacotes expirados criando agendamentos fantasmas "VENCIDO"
    await PackageService.processExpiredPackages(admin.organizationId);

    const isEndingSoonFilter = params?.search === "...";
    const isExpiringFilter = params?.search === "expiring";

    let totalPackages = 0;
    let paginatedPackages: any[] = [];

    if (isEndingSoonFilter) {
      const matchingIdsRaw = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM packages
        WHERE organization_id = ${admin.organizationId}
          AND active = true
          AND used_sessions >= total_sessions - 2
          AND used_sessions < total_sessions
        ORDER BY created_at DESC
      `;
      totalPackages = matchingIdsRaw.length;
      const pagedIds = matchingIdsRaw.slice(skip, skip + limit).map((r) => r.id);

      paginatedPackages =
        pagedIds.length > 0
          ? await prisma.package.findMany({
              where: { id: { in: pagedIds } },
              include: {
                client: { select: { name: true } },
                service: { select: { name: true } },
                package_template: { select: { name: true, validity_days: true } },
              },
              orderBy: { created_at: "desc" },
            })
          : [];
    } else {
      const where: any = {
        organization_id: admin.organizationId,
        active: true,
      };

      if (isExpiringFilter) {
        const now = new Date();
        const in7Days = new Date();
        in7Days.setDate(now.getDate() + 7);
        where.expires_at = {
          gt: now,
          lte: in7Days,
        };
      } else if (params?.search) {
        const searchLower = params.search.toLowerCase();
        where.OR = [
          { client: { name: { contains: searchLower, mode: "insensitive" } } },
          { service: { name: { contains: searchLower, mode: "insensitive" } } },
        ];
      }

      const [count, items] = await Promise.all([
        prisma.package.count({ where }),
        prisma.package.findMany({
          where,
          include: {
            client: { select: { name: true } },
            service: { select: { name: true } },
            package_template: { select: { name: true, validity_days: true } },
          },
          orderBy: { created_at: "desc" },
          skip,
          take: limit,
        }),
      ]);

      totalPackages = count;
      paginatedPackages = items;
    }

    // KPIs calculados nativamente no Postgres
    const [kpiActive, kpiEndingSoonRaw, kpiExpiringSoon, kpiTotalPendingRaw] =
      await Promise.all([
        prisma.package.count({
          where: { organization_id: admin.organizationId, active: true },
        }),
        prisma.$queryRaw<Array<{ count: number }>>`
          SELECT COUNT(id)::int AS count FROM packages
          WHERE organization_id = ${admin.organizationId}
            AND active = true
            AND used_sessions >= total_sessions - 2
            AND used_sessions < total_sessions
        `,
        (() => {
          const now = new Date();
          const in7Days = new Date();
          in7Days.setDate(now.getDate() + 7);
          return prisma.package.count({
            where: {
              organization_id: admin.organizationId,
              active: true,
              expires_at: {
                gt: now,
                lte: in7Days,
              },
            },
          });
        })(),
        prisma.$queryRaw<Array<{ pending: number }>>`
          SELECT COALESCE(SUM(total_sessions - used_sessions), 0)::int AS pending
          FROM packages
          WHERE organization_id = ${admin.organizationId}
            AND active = true
        `,
      ]);

    const kpiEndingSoon = Number(kpiEndingSoonRaw[0]?.count || 0);
    const kpiTotalPending = Number(kpiTotalPendingRaw[0]?.pending || 0);

    return {
      success: true,
      packages: paginatedPackages.map((p) => {
        let expiresAt = null;
        let isExpired = false;

        if (p.expires_at) {
          expiresAt = p.expires_at.toISOString();
          isExpired = new Date() > p.expires_at;
        }

        return {
          id: p.id,
          clientId: p.client_id,
          clientName: p.client.name,
          // CORREÇÃO: Puxa do template primeiro, depois tenta do pacote
          packageName: p.package_template?.name || p.name,
          usedSessions: p.used_sessions,
          totalSessions: p.total_sessions,
          active: p.active,
          createdAt: p.created_at.toISOString(),
          expiresAt,
          isExpired,
        };
      }),
      kpis: {
        active: kpiActive,
        endingSoon: kpiEndingSoon,
        expiringSoon: kpiExpiringSoon,
        totalPending: kpiTotalPending,
      },
      total: totalPackages,
      page,
      totalPages: Math.ceil(totalPackages / limit) || 1,
    };
  } catch (error) {
    console.error("Erro ao carregar dashboard:", error);
    return { success: false, error: "Falha ao carregar dados." };
  }
}

/**
 * Sincroniza o saldo de um pacote realizando uma auditoria completa:
 * Conta todos os agendamentos realizados vinculados ao pacote (atendimentos concluídos na agenda, totem ou baixa manual)
 * somados aos check-ins avulsos ativos (feitos diretamente por CPF no totem sem agendamento prévio).
 */
export async function syncPackageBalance(packageId: string) {
  try {
    // 🛡️ Validação unificada de sessão e tenant
    const admin = await requireAuth();

    if (!packageId) {
      return { error: "ID do pacote é obrigatório." };
    }

    const pkg = await prisma.package.findUnique({
      where: {
        id: packageId,
        organization_id: admin.organizationId,
      },
      select: {
        id: true,
        total_sessions: true,
        used_sessions: true,
        expires_at: true,
        active: true,
        client_id: true,
      },
    });

    if (!pkg) {
      return { error: "Pacote não encontrado." };
    }

    // 1. Busca todos os agendamentos concluídos (REALIZADO) vinculados ao pacote
    // (abrange tanto atendimentos realizados na Agenda tradicional quanto via Totem e Baixa Manual)
    const completedAppointments = await prisma.appointment.findMany({
      where: {
        package_id: packageId,
        organization_id: admin.organizationId,
        status: "REALIZADO",
      },
      select: { id: true },
    });
    const completedApptIds = new Set(completedAppointments.map((a) => a.id));

    // 2. Busca check-ins ativos (não deletados) vinculados a este pacote
    const validCheckIns = await prisma.checkIn.findMany({
      where: {
        package_id: packageId,
        organization_id: admin.organizationId,
        deleted_at: null,
      },
      select: { id: true, appointment_id: true },
    });

    // Check-ins que NÃO estão vinculados aos agendamentos REALIZADOS já contados acima
    // (ex: check-ins diretos por CPF no totem sem agendamento prévio)
    const standaloneCheckIns = validCheckIns.filter(
      (ci) => !ci.appointment_id || !completedApptIds.has(ci.appointment_id)
    );

    const realCount = completedAppointments.length + standaloneCheckIns.length;

    // Preserva o status de arquivamento caso o pacote tenha sido encerrado manualmente pelo estabelecimento
    const isManuallyArchived = !pkg.active && (pkg.used_sessions < pkg.total_sessions);
    const isExpired = pkg.expires_at ? new Date() > pkg.expires_at : false;
    const willBeActive = isManuallyArchived ? false : (realCount < pkg.total_sessions && !isExpired);

    // 3. Atualiza o saldo do pacote para esse valor real apurado
    await prisma.package.update({
      where: {
        id: packageId,
        organization_id: admin.organizationId,
      },
      data: {
        used_sessions: realCount,
        active: willBeActive,
      },
    });

    revalidatePath("/admin/packages");
    revalidatePath("/admin/dashboard");
    if (pkg.client_id) {
      revalidatePath(`/admin/clients/${pkg.client_id}`);
    }

    return { success: true, count: realCount };
  } catch (error: any) {
    console.error("[ACTION syncPackageBalance] ERRO:", error);

    if (error.message === "Unauthorized") {
      return { error: "Não autorizado" };
    }

    return { error: "Erro ao sincronizar saldo" };
  }
}

/**
 * Busca o histórico de sessões vinculadas a um pacote específico.
 * Traz todos os agendamentos do pacote e eventuais check-ins avulsos via CPF.
 */
export async function getPackageHistory(packageId: string) {
  try {
    const admin = await requireAuth();

    const appointments = await prisma.appointment.findMany({
      where: {
        package_id: packageId,
        organization_id: admin.organizationId,
      },
      include: {
        check_in: true, // Traz o registro de check-in (se existir)
      },
      orderBy: {
        date_time: "asc",
      },
    });

    // Busca também check-ins avulsos realizados sem agendamento prévio (ex: totem por CPF)
    const standaloneCheckIns = await prisma.checkIn.findMany({
      where: {
        package_id: packageId,
        organization_id: admin.organizationId,
        deleted_at: null,
        appointment_id: null,
      },
      orderBy: {
        date_time: "asc",
      },
    });

    const appointmentItems = appointments.map((appt) => {
      // Lógica para decidir qual data mostrar:
      // Se foi realizado e tem check-in ativo (sem soft delete), pega a hora real que bateu no totem
      const hasValidCheckIn = appt.check_in && !appt.check_in.deleted_at;
      const displayDate =
        appt.status === "REALIZADO" && hasValidCheckIn
          ? appt.check_in!.date_time
          : appt.date_time;

      return {
        id: appt.id,
        session: appt.session_number,
        date: displayDate,
        status: appt.status,
        obs: appt.observations,
      };
    });

    const standaloneItems = standaloneCheckIns.map((ci) => ({
      id: ci.id,
      session: null,
      date: ci.date_time,
      status: "REALIZADO",
      obs: "Check-in avulso via Totem (CPF)",
    }));

    const allHistory = [...appointmentItems, ...standaloneItems].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return {
      success: true,
      history: allHistory,
    };
  } catch (error) {
    console.error("Erro ao buscar histórico do pacote:", error);
    return { success: false, error: "Falha ao carregar histórico." };
  }
}

/**
 * Realiza uma baixa manual "robusta":
 * Cria um agendamento retroativo, marca como REALIZADO e desconta do pacote.
 */
export async function createManualPackageCheckIn(
  packageId: string,
  dateTimeString?: string,
  professionalId?: string,
  markAsCompleted: boolean = true,
) {
  try {
    const admin = await requireAuth();

    const pkg = await prisma.package.findUnique({
      where: { id: packageId, organization_id: admin.organizationId },
      include: {
        service: {
          include: { stock_items: { include: { stock_item: true } } },
        },
        client: true,
      },
    });

    if (!pkg) return { success: false, error: "Pacote não encontrado." };
    if (!pkg.active) {
      return {
        success: false,
        error: "Este pacote foi encerrado e não permite novos check-ins.",
      };
    }
    if (pkg.expires_at && new Date() > new Date(pkg.expires_at)) {
      return {
        success: false,
        error: "Este pacote já está vencido e não permite novos check-ins.",
      };
    }
    if (pkg.used_sessions >= pkg.total_sessions) {
      return { success: false, error: "Este pacote não possui mais saldo." };
    }

    const checkInDate = dateTimeString ? new Date(dateTimeString) : new Date();

    // Validação Inteligente da Grade de Horários e Expediente do Profissional
    if (professionalId) {
      const professional = await prisma.admin.findFirst({
        where: {
          id: professionalId,
          organizations: { some: { id: admin.organizationId } },
        },
        include: {
          schedule_rule: {
            include: {
              working_hours: { orderBy: { day_of_week: "asc" } },
              schedule_exceptions: { orderBy: { date: "asc" } },
            },
          },
        },
      });

      if (!professional) {
        return { success: false, error: "Profissional selecionado não encontrado." };
      }

      let scheduleRule = professional.schedule_rule;
      if (!scheduleRule) {
        scheduleRule = await prisma.scheduleRule.findFirst({
          where: { organization_id: admin.organizationId, is_default: true },
          include: {
            working_hours: { orderBy: { day_of_week: "asc" } },
            schedule_exceptions: { orderBy: { date: "asc" } },
          },
        });
      }

      const orgSettings = await prisma.settings.findUnique({
        where: { organization_id: admin.organizationId },
        select: {
          opening_time: true,
          closing_time: true,
          allow_over_limit_appointments: true,
        },
      });

      let dateStr: string;
      let timeStr: string;

      if (dateTimeString && dateTimeString.includes("T")) {
        const [dPart, tPart] = dateTimeString.split("T");
        dateStr = dPart;
        timeStr = tPart.slice(0, 5);
      } else {
        const year = checkInDate.getFullYear();
        const month = String(checkInDate.getMonth() + 1).padStart(2, "0");
        const day = String(checkInDate.getDate()).padStart(2, "0");
        const hours = String(checkInDate.getHours()).padStart(2, "0");
        const minutes = String(checkInDate.getMinutes()).padStart(2, "0");
        dateStr = `${year}-${month}-${day}`;
        timeStr = `${hours}:${minutes}`;
      }

      const validation = validateScheduleAppointment({
        professionalName: professional.display_name,
        scheduleRule,
        dateStr,
        timeStr,
        orgSettings,
      });

      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errorMessage || "Profissional ou horário indisponível conforme a grade de horários.",
        };
      }
    }

    const createdTxIds: string[] = [];

    await prisma.$transaction(async (tx) => {
      // 1. Etapa 4: Detecção de agendamento existente pendente/confirmado do mesmo pacote no mesmo dia
      const dayStart = new Date(checkInDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(checkInDate);
      dayEnd.setHours(23, 59, 59, 999);

      const existingAppointment = await tx.appointment.findFirst({
        where: {
          organization_id: admin.organizationId,
          package_id: pkg.id,
          date_time: {
            gte: dayStart,
            lte: dayEnd,
          },
          status: {
            in: [AppointmentStatus.PENDENTE, AppointmentStatus.CONFIRMADO, AppointmentStatus.SOLICITADO],
          },
        },
        orderBy: {
          date_time: "asc",
        },
      });

      let appt: any;
      const targetStatus = markAsCompleted ? AppointmentStatus.REALIZADO : AppointmentStatus.CONFIRMADO;

      if (existingAppointment) {
        appt = await tx.appointment.update({
          where: { id: existingAppointment.id },
          data: {
            date_time: checkInDate,
            status: targetStatus,
            professional_id: professionalId || existingAppointment.professional_id || null,
            observations: existingAppointment.observations
              ? `${existingAppointment.observations} | Baixa manual via Gestão de Pacotes.`
              : "Baixa manual realizada via Gestão de Pacotes.",
            session_number: pkg.used_sessions + 1,
          },
        });
      } else {
        appt = await tx.appointment.create({
          data: {
            date_time: checkInDate,
            status: targetStatus,
            client_id: pkg.client_id,
            service_id: pkg.service_id,
            package_id: pkg.id,
            professional_id: professionalId || null,
            organization_id: admin.organizationId,
            observations: "Baixa manual realizada via Gestão de Pacotes.",
            session_number: pkg.used_sessions + 1,
            snapshot_service_name: pkg.snapshot_service_name ?? pkg.service.name,
            snapshot_service_price:
              pkg.snapshot_service_price ?? pkg.service.price,
            snapshot_service_duration:
              pkg.snapshot_service_duration ?? pkg.service.duration,
          },
        });
      }

      // 2. Processamento de estoque e financeiro (Apenas se for marcar como REALIZADO)
      let stockProcessed = false;
      const service = pkg.service;

      if (markAsCompleted) {
        if (service.track_stock && service.stock_items.length > 0) {
          let totalCost = 0;
          const detailsArray: string[] = [];

          for (const item of service.stock_items) {
            const stockData = item.stock_item;
            const usedQty = item.quantity_used;

            await tx.stockItem.update({
              where: { id: stockData.id },
              data: { quantity: { decrement: usedQty } },
            });
            stockProcessed = true;

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
            const expTx = await tx.transaction.create({
              data: {
                type: "DESPESA",
                description: `Custo de Insumos: ${service.name}${detailsArray.length > 0 ? ` (${detailsArray.join(", ")})` : ""}`,
                amount: totalCost,
                date: checkInDate,
                status: "PAGO",
                organization_id: admin.organizationId,
                appointment_id: appt.id,
              },
            });
            createdTxIds.push(expTx.id);
          }
        } else if (
          !service.track_stock &&
          service.material_cost &&
          Number(service.material_cost) > 0
        ) {
          const expTx = await tx.transaction.create({
            data: {
              type: "DESPESA",
              description: `Custo de Material: ${service.name}`,
              amount: service.material_cost,
              date: checkInDate,
              status: "PAGO",
              organization_id: admin.organizationId,
              appointment_id: appt.id,
            },
          });
          createdTxIds.push(expTx.id);
          stockProcessed = true;
        }
      }

      // 3. Registro do Check-in
      await tx.checkIn.create({
        data: {
          date_time: checkInDate,
          appointment_id: appt.id,
          client_id: pkg.client_id,
          package_id: pkg.id,
          organization_id: admin.organizationId,
          admin_id: admin.id,
          auto_processed: markAsCompleted ? stockProcessed : false,
        },
      });

      // 4. Fidelidade
      const loyaltySettings = await tx.loyaltySettings.findUnique({
        where: { organization_id: admin.organizationId },
      });

      if (loyaltySettings?.is_active && loyaltySettings?.check_in_active) {
        const clientCurrent = await tx.client.findUnique({
          where: { id: pkg.client_id },
          select: { loyalty_points: true },
        });
        const newPoints = Math.min(
          (clientCurrent?.loyalty_points || 0) + loyaltySettings.check_in_points,
          loyaltySettings.max_points,
        );
        await tx.client.update({
          where: { id: pkg.client_id },
          data: { loyalty_points: newPoints },
        });
      }

      // 5. Desconto de pacote (SOMENTE SE markAsCompleted for TRUE)
      // Se for apenas check-in / em espera, o pacote NÃO é descontado agora para evitar duplo desconto!
      if (markAsCompleted) {
        const pacoteUpdate = await tx.package.updateMany({
          where: {
            id: pkg.id,
            organization_id: admin.organizationId,
            used_sessions: { lt: pkg.total_sessions },
          },
          data: {
            used_sessions: { increment: 1 },
          },
        });

        if (pacoteUpdate.count === 0) {
          throw new Error(
            `Saldo de sessões esgotado no pacote "${pkg.name}".`,
          );
        }

        const updatedPkg = await tx.package.findUnique({
          where: { id: pkg.id },
          select: { used_sessions: true, total_sessions: true },
        });

        const currentUsedSessions =
          updatedPkg?.used_sessions ?? (pkg.used_sessions + 1);
        const willRemainActive = currentUsedSessions < pkg.total_sessions;

        await tx.package.update({
          where: { id: pkg.id },
          data: { active: willRemainActive },
        });

        // Se encerrou o pacote, limpa agendamentos futuros não realizados
        if (!willRemainActive) {
          await tx.appointment.deleteMany({
            where: {
              package_id: pkg.id,
              organization_id: admin.organizationId,
              status: { not: "REALIZADO" },
            },
          });
        }
      }
    });

    for (const txId of createdTxIds) {
      triggerZibeeSyncById(txId, admin.organizationId).catch(console.error);
    }

    revalidatePath("/admin/packages");
    revalidatePath("/admin/agenda");
    revalidatePath("/admin/history");
    revalidatePath("/admin/stock");
    revalidatePath(`/admin/clients/${pkg.client_id}`);

    return { success: true };
  } catch (error: any) {
    console.error("Erro na baixa manual:", error);
    return {
      success: false,
      error: error?.message || "Falha ao processar registro.",
    };
  }
}

/**
 * Remove um check-in (soft delete) e reverte o consumo no pacote do cliente.
 * O registro original é preservado para a Jornada do Cliente,
 * apenas marcado como removido.
 */
export async function deleteCheckIn(checkInId: string) {
  try {
    const admin = await requireAuth();

    const checkIn = await prisma.checkIn.findUnique({
      where: { id: checkInId, organization_id: admin.organizationId },
      include: {
        appointment: {
          include: {
            service: {
              include: { stock_items: { include: { stock_item: true } } },
            },
          },
        },
        package: { include: { service: true } },
      },
    });

    if (!checkIn) return { success: false, error: "Check-in não encontrado." };
    if (checkIn.deleted_at) {
      return { success: false, error: "Este check-in já foi removido." };
    }

    const txsToDelete = checkIn.appointment_id
      ? await prisma.transaction.findMany({
          where: { appointment_id: checkIn.appointment_id, organization_id: admin.organizationId },
          select: { id: true },
        })
      : [];

    await prisma.$transaction(async (tx) => {
      const adminName = admin.name || "Administrador";

      const wasRealizado = checkIn.appointment?.status === "REALIZADO";
      const serviceName =
        checkIn.appointment?.snapshot_service_name ||
        checkIn.package?.snapshot_service_name ||
        checkIn.package?.service?.name ||
        "Serviço";

      const dateStr = new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(checkIn.date_time);

      // A. Auditoria Detalhada (Histórico de Ações e Jornada do Cliente)
      if (checkIn.client_id) {
        const pacoteText = checkIn.package_id && wasRealizado
          ? " (1 sessão estornada ao pacote)"
          : "";
        const agendaText = checkIn.appointment_id
          ? " e o agendamento correspondente foi removido da agenda"
          : "";

        await tx.clientNote.create({
          data: {
            text: `Ação: Check-in de ${serviceName} do dia ${dateStr} foi removido por ${adminName}${pacoteText}${agendaText}.`,
            client_id: checkIn.client_id,
            organization_id: admin.organizationId,
            date: new Date(),
          },
        });
      }

      // B. Estorno do pacote (SOMENTE SE a sessão foi realmente consumida / REALIZADO)
      // Se era apenas check-in / em espera, o pacote NÃO foi descontado, então não pode subtrair!
      if (checkIn.package_id && wasRealizado) {
        await tx.package.update({
          where: { id: checkIn.package_id },
          data: {
            used_sessions: { decrement: 1 },
            active: true,
          },
        });
      }

      // C. Desfaz estoque e financeiro (se houve movimentação automática ou atendimento foi REALIZADO)
      const hasMovedStock = Boolean(
        checkIn.auto_processed ||
          (wasRealizado && (
            checkIn.appointment?.service?.track_stock ||
            (checkIn.appointment?.service?.material_cost && Number(checkIn.appointment.service.material_cost) > 0)
          ))
      );

      if (hasMovedStock && checkIn.appointment?.service) {
        const service = checkIn.appointment.service;

        if (service.track_stock && service.stock_items.length > 0) {
          for (const item of service.stock_items) {
            await tx.stockItem.update({
              where: { id: item.stock_item_id },
              data: { quantity: { increment: item.quantity_used } },
            });
          }
        }

        // Remove a(s) despesa(s) automáticas de insumos/materiais
        if (checkIn.appointment_id) {
          await tx.transaction.deleteMany({
            where: { appointment_id: checkIn.appointment_id, type: "DESPESA" },
          });
        }
      }

      // D. Reverter pontos de fidelidade concedidos no check-in
      const loyaltySettings = await tx.loyaltySettings.findUnique({
        where: { organization_id: admin.organizationId },
      });

      if (loyaltySettings?.is_active && loyaltySettings?.check_in_active && checkIn.client_id) {
        const clientCurrent = await tx.client.findUnique({
          where: { id: checkIn.client_id },
          select: { loyalty_points: true },
        });
        const newPoints = Math.max(
          (clientCurrent?.loyalty_points || 0) - loyaltySettings.check_in_points,
          0,
        );
        await tx.client.update({
          where: { id: checkIn.client_id },
          data: { loyalty_points: newPoints },
        });
      }

      // E. Soft delete do check-in (desvincula appointment_id para evitar cascade hard delete do Postgres)
      await tx.checkIn.update({
        where: { id: checkInId },
        data: {
          deleted_at: new Date(),
          deleted_by_admin_id: admin.id,
          deleted_by_name: adminName,
          appointment_id: null,
        },
      });

      // F. Remoção completa do Agendamento da Agenda (Opção 2 - O cartão não aparece mais na agenda)
      if (checkIn.appointment_id) {
        // Remove quaisquer transações residuais vinculadas ao appointment antes de deletá-lo
        await tx.transaction.deleteMany({
          where: { appointment_id: checkIn.appointment_id },
        });

        await tx.appointment.delete({
          where: { id: checkIn.appointment_id },
        });
      }
    });

    for (const t of txsToDelete) {
      deleteTransactionFromZibee(t.id, admin.organizationId);
    }

    revalidatePath("/admin/history");
    revalidatePath("/admin/packages");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/stock");
    revalidatePath("/admin/agenda");
    revalidatePath(`/admin/clients/${checkIn.client_id}`);

    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir check-in:", error);
    return { success: false, error: "Falha ao excluir o registro." };
  }
}
/**
 * Encerra/Arquiva um pacote manualmente antes da hora.
 * Remove quaisquer parcelas pendentes (Transaction com status != 'PAGO') e agendamentos futuros não realizados.
 */
export async function archivePackage(packageId: string) {
  try {
    const admin = await requireAuth();

    const pkg = await prisma.package.findUnique({
      where: { id: packageId, organization_id: admin.organizationId },
      include: { client: true, service: true },
    });

    if (!pkg) {
      return { success: false, error: "Pacote não encontrado." };
    }

    if (!pkg.active) {
      return { success: false, error: "Este pacote já está encerrado." };
    }

    const deletedTxIds: string[] = [];

    await prisma.$transaction(async (tx) => {
      const packageName = pkg.package_template_id
        ? pkg.name
        : pkg.snapshot_service_name || pkg.service?.name || "Pacote";

      // 1. Exclui parcelas pendentes ou futuras do pacote para não gerar "parcelas fantasmas" no Contas a Receber
      const pendingPackageTxs = await tx.transaction.findMany({
        where: {
          package_id: pkg.id,
          organization_id: admin.organizationId,
          status: { not: "PAGO" },
        },
        select: { id: true },
      });

      if (pendingPackageTxs.length > 0) {
        deletedTxIds.push(...pendingPackageTxs.map((t) => t.id));
        await tx.transaction.deleteMany({
          where: {
            id: { in: pendingPackageTxs.map((t) => t.id) },
          },
        });
      }

      // 2. Auditoria: registra o encerramento manual no histórico do cliente
      const noteDetails =
        pendingPackageTxs.length > 0
          ? ` (${pendingPackageTxs.length} parcela(s) pendente(s) cancelada(s))`
          : "";

      await tx.clientNote.create({
        data: {
          text: `Ação: Pacote "${packageName}" (${pkg.used_sessions}/${pkg.total_sessions} sessões usadas) foi ENCERRADO manualmente pelo admin ID: ${admin.id}${noteDetails}`,
          client_id: pkg.client_id,
          organization_id: admin.organizationId,
          date: new Date(),
        },
      });

      // 3. Encerramento de fato
      await tx.package.update({
        where: { id: pkg.id },
        data: { active: false },
      });

      // 4. OTIMIZAÇÃO DE AGENDA: Exclui todos os agendamentos pendentes deste pacote (já que ele não pode mais ser usado)
      const pendingAppointments = await tx.appointment.findMany({
        where: {
          package_id: pkg.id,
          organization_id: admin.organizationId,
          status: { not: "REALIZADO" },
        },
        select: { id: true },
      });

      if (pendingAppointments.length > 0) {
        const apptIds = pendingAppointments.map((a) => a.id);

        // Remove transações não pagas residuais vinculadas a estes agendamentos
        const apptTxs = await tx.transaction.findMany({
          where: {
            appointment_id: { in: apptIds },
            status: { not: "PAGO" },
          },
          select: { id: true },
        });

        if (apptTxs.length > 0) {
          deletedTxIds.push(...apptTxs.map((t) => t.id));
          await tx.transaction.deleteMany({
            where: { id: { in: apptTxs.map((t) => t.id) } },
          });
        }

        await tx.appointment.deleteMany({
          where: {
            id: { in: apptIds },
          },
        });
      }
    });

    for (const txId of deletedTxIds) {
      deleteTransactionFromZibee(txId, admin.organizationId);
    }

    revalidatePath("/admin/packages");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/transactions");
    revalidatePath("/admin/financial");
    revalidatePath(`/admin/clients/${pkg.client_id}`);

    return { success: true };
  } catch (error) {
    console.error("Erro ao encerrar pacote:", error);
    return { success: false, error: "Falha ao encerrar o pacote." };
  }
}
// Adicione no final do arquivo app/actions/packages.ts

export async function createPackageAction(data: any) {
  try {
    // 🛡️ Validação unificada de sessão e extração do tenant
    const admin = await requireAuth();

    // Delega toda a validação de regras de negócio, travas de pacote ativo
    // e transações financeiras para a camada de serviço.
    const result = await PackageService.createPackage(
      admin.organizationId,
      data,
    );

    revalidatePath("/admin/packages");
    revalidatePath("/admin/finance/dashboard");
    revalidatePath("/admin/finance/transactions");
    revalidatePath("/admin/finance/receivables");
    if (data?.client_id) {
      revalidatePath(`/admin/clients/${data.client_id}`);
    }

    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error: any) {
    if (error.name === "AuthError" || error.message === "Não autorizado") {
      return {
        success: false,
        error: "Sessão expirada. Faça login novamente.",
      };
    }

    // Mapeamento de erros de domínio para mensagens amigáveis no frontend
    const domainErrors: Record<string, string> = {
      INVALID_DATA: "Dados inválidos",
      UPFRONT_PAYMENT_METHOD_REQUIRED:
        "Selecione a forma de pagamento para venda à vista.",
      INVALID_INSTALLMENTS_COUNT: "O número de parcelas deve ser entre 2 e 48.",
      CLIENT_NOT_FOUND: "Cliente não encontrado",
      ACTIVE_PACKAGE_EXISTS:
        "Este cliente já possui um Pacote ativo. Encerre o atual antes de vender um novo pacote.",
      SERVICE_NOT_FOUND: "Serviço não encontrado",
    };

    if (error.message && domainErrors[error.message]) {
      return { success: false, error: domainErrors[error.message] };
    }

    console.error("[ACTION createPackage]", error);
    return {
      success: false,
      error: "Erro interno do servidor ao criar pacote.",
    };
  }
}

export async function extendPackageAction(packageId: string, newDate: string | null) {
  try {
    const admin = await requireAuth();

    if (!packageId) {
      return { success: false, error: "ID do pacote é obrigatório." };
    }

    const pkg = await prisma.package.findUnique({
      where: { id: packageId, organization_id: admin.organizationId },
    });

    if (!pkg) {
      return { success: false, error: "Pacote não encontrado." };
    }

    const updated = await prisma.$transaction(async (tx) => {
      let dataToUpdate: any = { expires_at: newDate ? new Date(newDate) : null };

      // Se a nova data é no futuro ou sem validade, precisamos limpar as sessões VENCIDAS
      const isFutureOrNoLimit = !newDate || new Date(newDate) > new Date();
      let ghostSessionsRemoved = 0;

      if (isFutureOrNoLimit) {
        // Encontra as sessões VENCIDAS
        const vencidoAppointments = await tx.appointment.findMany({
          where: { package_id: packageId, status: "VENCIDO" as any }
        });

        if (vencidoAppointments.length > 0) {
          ghostSessionsRemoved = vencidoAppointments.length;
          await tx.appointment.deleteMany({
            where: { package_id: packageId, status: "VENCIDO" as any }
          });
          
          dataToUpdate.used_sessions = pkg.used_sessions - ghostSessionsRemoved;
          dataToUpdate.active = true; // Reativa o pacote
        }
      }

      const p = await tx.package.update({
        where: { id: packageId },
        data: dataToUpdate,
      });

      const oldDateStr = pkg.expires_at ? new Date(pkg.expires_at).toLocaleDateString("pt-BR") : "Sem validade";
      const newDateStr = newDate ? new Date(newDate).toLocaleDateString("pt-BR") : "Sem validade";
      
      let noteText = `A validade do pacote "${pkg.name}" foi alterada de ${oldDateStr} para ${newDateStr} pelo usuário ${admin.name}.`;
      if (ghostSessionsRemoved > 0) {
        noteText += ` ${ghostSessionsRemoved} sessões expiradas foram restauradas.`;
      }

      await tx.clientNote.create({
        data: {
          client_id: pkg.client_id,
          organization_id: admin.organizationId,
          text: noteText,
          date: new Date(),
        }
      });
      
      return p;
    });

    revalidatePath("/admin/packages");
    revalidatePath("/admin/dashboard");
    revalidatePath(`/admin/clients/${pkg.client_id}`);

    return { success: true, package: updated };
  } catch (error) {
    console.error("Erro ao prorrogar pacote:", error);
    return { success: false, error: "Falha ao prorrogar o pacote." };
  }
}

/**
 * Exclui um agendamento fantasma/avulso e estorna o saldo do pacote caso necessário.
 * Migrado da antiga rota /api/admin/packages/fix-appointment.
 */
export async function fixAppointmentAction(appointmentId: string) {
  try {
    const admin = await requireAuth();

    if (!appointmentId) {
      return { success: false, error: "ID é obrigatório" };
    }

    let result: any;
    try {
      result = await PackageService.fixAppointment(
        appointmentId,
        admin.organizationId,
        { id: admin.id, name: admin.name || "Administrador" }
      );
    } catch (err: any) {
      if (err?.message === "NOT_FOUND") {
        // Se não for um agendamento, verifica se é um Check-in avulso (sem agendamento)
        const checkIn = await prisma.checkIn.findUnique({
          where: { id: appointmentId, organization_id: admin.organizationId },
        });
        if (checkIn) {
          const deleteResult = await deleteCheckIn(checkIn.id);
          if (deleteResult.success) {
            return { success: true };
          }
          return { success: false, error: deleteResult.error || "Erro ao estornar check-in." };
        }
      }
      throw err;
    }

    revalidatePath("/admin/packages");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/history");
    revalidatePath("/admin/stock");
    revalidatePath("/admin/agenda");
    if (result?.clientId) {
      revalidatePath(`/admin/clients/${result.clientId}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("[fixAppointmentAction] Erro:", error);
    if (error?.message === "NOT_FOUND") {
      return { success: false, error: "Registro não encontrado" };
    }
    return { success: false, error: "Erro ao deletar registro" };
  }
}

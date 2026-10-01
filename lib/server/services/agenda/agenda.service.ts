// lib/server/services/agenda/agenda.service.ts
import { getTenantPrisma } from "@/lib/prisma";
import { AppointmentStatus } from "@prisma/client";

export class AgendaService {
  /**
   * Busca e formata os agendamentos de uma organização dentro de um período,
   * aplicando travas de visibilidade baseadas no cargo do usuário (Role).
   */
  static async getAgenda(
    organizationId: string,
    userId: string,
    role: string,
    fromParam: string | null,
    toParam: string | null,
  ) {
    if (!fromParam || !toParam) {
      throw new Error("MISSING_DATES");
    }

    const prisma = getTenantPrisma(organizationId);
    const from = new Date(fromParam);
    const to = new Date(toParam);

    // 1. AUTO NO-SHOW LOGIC
    try {
      const orgSettings = await prisma.settings.findUnique({
        where: { organization_id: organizationId },
        select: { auto_no_show_mode: true },
      });

      const autoNoShowMode = orgSettings?.auto_no_show_mode || "off";

      if (autoNoShowMode !== "off") {
        const deductSession = autoNoShowMode === "auto_deduct";
        const now = new Date();

        // Buscar possíveis agendamentos atrasados (hoje ou no passado)
        const overdueCandidates = await prisma.appointment.findMany({
          where: {
            organization_id: organizationId,
            status: { in: [AppointmentStatus.PENDENTE, AppointmentStatus.CONFIRMADO] },
            date_time: { lte: now }, // Já começou
          },
          include: { package: true, service: true },
        });

        const toCancel: any[] = [];
        for (const appt of overdueCandidates) {
          const duration = Number(appt.snapshot_service_duration ?? appt.service.duration ?? 60);
          const endTime = new Date(appt.date_time.getTime() + duration * 60000);
          
          // Adicionamos uma pequena "gordura" de 5 minutos antes de bater o martelo
          const gracePeriodEnd = new Date(endTime.getTime() + 5 * 60000);

          if (now > gracePeriodEnd) {
            toCancel.push(appt);
          }
        }

        if (toCancel.length > 0) {
          await prisma.$transaction(async (tx) => {
            for (const appt of toCancel) {
              const obsText = deductSession 
                ? "Falta automática. A sessão foi descontada do pacote."
                : "Falta automática (Abonada). A sessão não foi descontada.";
              
              const newObs = appt.observations
                ? `${appt.observations}\n(Falta automática)`
                : "(Falta automática)";

              // 1. Atualiza o agendamento para CANCELADO
              await tx.appointment.update({
                where: { id: appt.id },
                data: {
                  status: AppointmentStatus.CANCELADO,
                  has_charge: false,
                  payment_method: null,
                  observations: newObs,
                },
              });

              // 2. Desconta do pacote se aplicável
              if (deductSession && appt.package_id && appt.package) {
                const newUsedSessions = appt.package.used_sessions + 1;
                const stillActive = newUsedSessions < appt.package.total_sessions;
                const isManuallyArchived = !appt.package.active && (appt.package.used_sessions < appt.package.total_sessions);
                const finalActive = isManuallyArchived ? false : stillActive;

                await tx.package.update({
                  where: { id: appt.package_id },
                  data: {
                    used_sessions: newUsedSessions,
                    active: finalActive,
                  },
                });

                if (!finalActive) {
                  await tx.appointment.deleteMany({
                    where: {
                      package_id: appt.package_id,
                      organization_id: organizationId,
                      status: { not: AppointmentStatus.REALIZADO },
                    },
                  });
                }
              }

              // 3. Registra no histórico do cliente
              const formattedDate = new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
              }).format(appt.date_time);

              const noteText = appt.package_id
                ? deductSession
                  ? `Falta Automática: A cliente não compareceu ao agendamento do dia ${formattedDate}. A sessão foi descontada do pacote.`
                  : `Falta Automática (Abonada): A cliente não compareceu ao agendamento do dia ${formattedDate}, mas a sessão NÃO foi descontada.`
                : `Falta Automática: A cliente não compareceu ao agendamento do dia ${formattedDate} (Serviço Avulso).`;

              await tx.clientNote.create({
                data: {
                  text: noteText,
                  client_id: appt.client_id,
                  organization_id: organizationId,
                  date: new Date(),
                },
              });
            }
          });
        }
      }
    } catch (err) {
      console.error("Erro ao processar faltas automáticas:", err);
      // Fail silently to not break agenda fetching
    }

    // 2. BUSCA NORMAL DA AGENDA

    const whereClause: any = {
      organization_id: organizationId,
      date_time: {
        gte: from,
        lte: to,
      },
      status: {
        in: ["CONFIRMADO", "REALIZADO", "CANCELADO", "PENDENTE"],
      },
    };

    // Trava de visibilidade para colaboradores
    if (role === "COLLABORATOR") {
      whereClause.professional_id = userId;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        client: true,
        service: true,
        package: true,
        check_in: true,
        professional: { select: { display_name: true } },
      },
      orderBy: {
        date_time: "asc",
      },
    });

    const mapped = appointments.map((appt) => {
      const date = new Date(appt.date_time);

      const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
      });
      const time = timeFormatter.format(date);

      // SNAPSHOT: Prioriza os dados congelados no momento do agendamento
      const duration = Number(
        appt.snapshot_service_duration ?? appt.service.duration ?? 60,
      );
      const serviceName = appt.snapshot_service_name ?? appt.service.name;
      const snapshotPrice = appt.snapshot_service_price
        ? Number(appt.snapshot_service_price)
        : null;
      const rawPrice =
        snapshotPrice ?? appt.package?.price ?? appt.service.price ?? 0;

      let sessionInfo = "Avulsa";
      if (appt.package) {
        const current = appt.session_number ?? 1;
        sessionInfo = `${current}/${appt.package.total_sessions}`;
      }

      let color = "";
      const serviceNameLower = serviceName.toLowerCase();

      // REGRAS DE CORES CENTRALIZADAS
      if (appt.status === "CANCELADO") {
        color =
          "bg-slate-100 border-slate-300 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400";
      } else if (appt.status === "REALIZADO") {
        color =
          "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900 dark:border-blue-800 dark:text-blue-300";
      } else if (serviceNameLower.includes("contenção")) {
        color =
          "bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900 dark:border-emerald-800 dark:text-emerald-300";
      } else if (
        appt.check_in &&
        (appt.status === "PENDENTE" || appt.status === "CONFIRMADO")
      ) {
        color =
          "bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900 dark:border-purple-800 dark:text-purple-300";
      } else if (appt.recurrence_id || appt.package_id) {
        color =
          "bg-teal-100 border-teal-300 text-teal-800 dark:bg-teal-900 dark:border-teal-800 dark:text-teal-300";
      } else {
        color =
          "bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900 dark:border-amber-800 dark:text-amber-300";
      }

      return {
        id: appt.id,
        time,
        duration,
        clientId: appt.client_id,
        clientName: appt.client.name,
        service: serviceName,
        sessionInfo,
        isRecurring: Boolean(appt.package_id),
        phone: appt.client.phone_whatsapp,
        color,
        hasCharge: appt.has_charge,
        status: appt.status,
        checkInTime: appt.check_in?.date_time ?? null,
        observations: appt.observations ?? "",
        paymentMethod: appt.payment_method ?? "nenhum",
        price: Number(rawPrice),
        date_time: appt.date_time.toISOString(),
        package_id: appt.package_id,
        session_number: appt.session_number,
        recurrence_id: appt.recurrence_id,
        professionalName: appt.professional?.display_name ?? null,
        professionalId: appt.professional_id ?? null,
        serviceId: appt.service_id ?? null,
        snapshot_service_name: appt.snapshot_service_name,
        snapshot_service_duration: appt.snapshot_service_duration,
        snapshot_service_price: snapshotPrice,
        package: appt.package
          ? {
              total_sessions: appt.package.total_sessions,
              used_sessions: appt.package.used_sessions,
              active: appt.package.active,
            }
          : null,
      };
    });

    // Buscar Bloqueios de Horário
    const blocksWhereClause: any = {
      organization_id: organizationId,
      start_time: { lte: to },
      end_time: { gte: from },
    };
    if (role === "COLLABORATOR") {
      blocksWhereClause.professional_id = userId;
    }

    const scheduleBlocks = await prisma.scheduleBlock.findMany({
      where: blocksWhereClause,
      include: {
        professional: { select: { display_name: true } },
      },
    });

    const mappedBlocks = scheduleBlocks.map((b) => ({
      id: b.id,
      title: b.title,
      start_time: b.start_time.toISOString(),
      end_time: b.end_time.toISOString(),
      professional_id: b.professional_id,
      professionalName: b.professional?.display_name,
    }));

    return { appointments: mapped, scheduleBlocks: mappedBlocks };
  }
}

"use server";

import { prisma } from "@/lib/prisma";
import { format, addMinutes, parse, isBefore, isEqual, isAfter, startOfDay, endOfDay } from "date-fns";

export async function getAvailableTimesAndProfessionals(
  organizationSlug: string,
  serviceId: string,
  dateStr: string // "YYYY-MM-DD"
) {
  try {
    const org = await prisma.organization.findUnique({
      where: { slug: organizationSlug },
      include: { settings: true }
    });

    if (!org) return { success: false, error: "Organização não encontrada" };

    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) return { success: false, error: "Serviço não encontrado" };

    const serviceDuration = service.duration || 60; // default 60 min
    const date = new Date(dateStr + "T12:00:00Z"); // fix timezone issues by forcing midday UTC
    const dayOfWeek = date.getUTCDay(); // 0 = Sunday, 1 = Monday...

    // Busca profissionais ativos que realizam este serviço e têm uma schedule_rule
    const professionals = await prisma.admin.findMany({
      where: {
        organizations: { some: { id: org.id } },
        active: true,
        services: { some: { id: serviceId } },
        schedule_rule_id: { not: null }
      },
      include: {
        schedule_rule: {
          include: {
            working_hours: {
              where: { day_of_week: dayOfWeek }
            },
            schedule_exceptions: {
              where: { date: dateStr }
            }
          }
        },
        appointments: {
          where: {
            date_time: {
              gte: startOfDay(date),
              lte: endOfDay(date)
            },
            status: { notIn: ["CANCELADO"] }
          }
        }
      }
    });

    // Map time to available professionals
    // e.g. "09:00" -> [{id, name, image_url}]
    const availableSlots: Record<string, any[]> = {};

    const baseOpening = org.settings?.opening_time || "08:00";
    const baseClosing = org.settings?.closing_time || "19:00";

    // Generate intervals for the day (e.g. every 30 mins from org opening to closing)
    // We check each slot for each professional
    const generateSlots = (start: string, end: string, interval: number) => {
        const slots = [];
        let current = parse(start, 'HH:mm', new Date());
        const endTime = parse(end, 'HH:mm', new Date());
        
        while (isBefore(current, endTime)) {
            slots.push(format(current, 'HH:mm'));
            current = addMinutes(current, interval);
        }
        return slots;
    };

    const allDaySlots = generateSlots(baseOpening, baseClosing, 30); // 30 min intervals

    for (const timeStr of allDaySlots) {
      const slotStart = parse(timeStr, 'HH:mm', date);
      const slotEnd = addMinutes(slotStart, serviceDuration);

      const slotTimeStr = format(slotStart, 'HH:mm');
      availableSlots[slotTimeStr] = [];

      for (const pro of professionals) {
        if (!pro.schedule_rule) continue;

        // Check Exception first
        const exception = pro.schedule_rule.schedule_exceptions[0];
        let isOpen = false;
        let openTime = "";
        let closeTime = "";
        let breakStart = "";
        let breakEnd = "";

        if (exception) {
          isOpen = exception.is_open;
          openTime = exception.open_time || "";
          closeTime = exception.close_time || "";
          breakStart = exception.break_start || "";
          breakEnd = exception.break_end || "";
        } else {
          const workingHour = pro.schedule_rule.working_hours[0];
          if (workingHour) {
            isOpen = workingHour.is_open;
            openTime = workingHour.open_time || "";
            closeTime = workingHour.close_time || "";
            breakStart = workingHour.break_start || "";
            breakEnd = workingHour.break_end || "";
          }
        }

        if (!isOpen || !openTime || !closeTime) continue;

        const proStart = parse(openTime, 'HH:mm', date);
        const proEnd = parse(closeTime, 'HH:mm', date);

        // Se o slot estiver fora do expediente do profissional
        if (isBefore(slotStart, proStart) || isAfter(slotEnd, proEnd)) continue;

        // Verifica conflito com intervalo (break)
        let conflictWithBreak = false;
        if (breakStart && breakEnd) {
          const bStart = parse(breakStart, 'HH:mm', date);
          const bEnd = parse(breakEnd, 'HH:mm', date);
          // O serviço não pode se sobrepor ao intervalo
          if (
            (isBefore(slotStart, bEnd) || isEqual(slotStart, bEnd)) &&
            (isAfter(slotEnd, bStart) || isEqual(slotEnd, bStart)) &&
            !(isEqual(slotEnd, bStart)) && !(isEqual(slotStart, bEnd)) // touches are fine
          ) {
            conflictWithBreak = true;
          }
        }
        if (conflictWithBreak) continue;

        // Verifica conflito com agendamentos existentes
        let conflictWithAppointment = false;
        for (const appt of pro.appointments) {
          const apptStart = appt.date_time;
          // Assume service duration is what we booked, but how to know exact?
          // We can use snapshot_service_duration if available, or fallback to 60.
          const apptDuration = appt.snapshot_service_duration || 60;
          const apptEnd = addMinutes(apptStart, apptDuration);

          if (
            (isBefore(slotStart, apptEnd) || isEqual(slotStart, apptEnd)) &&
            (isAfter(slotEnd, apptStart) || isEqual(slotEnd, apptStart)) &&
            !(isEqual(slotEnd, apptStart)) && !(isEqual(slotStart, apptEnd))
          ) {
            conflictWithAppointment = true;
            break;
          }
        }
        if (conflictWithAppointment) continue;

        // Profissional está disponível!
        availableSlots[slotTimeStr].push({
          id: pro.id,
          name: pro.display_name || "Profissional",
          image_url: pro.profile_image_url
        });
      }

      // Se nenhum profissional ficou disponível, remove o horário
      if (availableSlots[slotTimeStr].length === 0) {
        delete availableSlots[slotTimeStr];
      }
    }

    return {
      success: true,
      availableSlots
    };

  } catch (error) {
    console.error("Error in getAvailableTimesAndProfessionals:", error);
    return { success: false, error: "Erro ao calcular disponibilidade" };
  }
}

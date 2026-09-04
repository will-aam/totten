import { getTenantPrisma } from "@/lib/prisma";

export class SettingsService {
  /**
   * Busca as configurações gerais da organização.
   */
  static async getSettings(organizationId: string) {
    const prisma = getTenantPrisma(organizationId);

    const settings = await prisma.settings.findUnique({
      where: { organization_id: organizationId },
    });

    if (!settings) {
      throw new Error("SETTINGS_NOT_FOUND");
    }

    return {
      companyName: settings.company_name,
      responsibleName: settings.responsible_name || "",
      document: settings.document || "",
      contactPhone: settings.phone_landline || "",
      whatsapp: settings.phone_whatsapp || "",
      address: settings.address || "",
      email: settings.email_admin || "",
      openingTime: settings.opening_time,
      closingTime: settings.closing_time,
      autoConfirmAppointments: settings.auto_confirm_appointments,
      scheduleGenerationType: settings.schedule_generation_type,
      allowOverLimitAppointments: settings.allow_over_limit_appointments,
      defaultScheduleView: settings.default_schedule_view,
    };
  }

  /**
   * Atualiza as configurações gerais da organização via upsert.
   */
  static async updateSettings(organizationId: string, data: any) {
    const prisma = getTenantPrisma(organizationId);

    const existingSettings = await prisma.settings.findUnique({
      where: { organization_id: organizationId },
      include: { organization: true },
    });

    const updateData: any = {};
    if (data.companyName !== undefined) {
      updateData.company_name = data.companyName;
      // Also update Organization name if company name is changed
      await prisma.organization.update({
        where: { id: organizationId },
        data: { name: data.companyName }
      });
    }
    if (data.responsibleName !== undefined) updateData.responsible_name = data.responsibleName;
    if (data.document !== undefined) updateData.document = data.document;
    if (data.contactPhone !== undefined)
      updateData.phone_landline = data.contactPhone;
    if (data.whatsapp !== undefined) updateData.phone_whatsapp = data.whatsapp;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.openingTime !== undefined)
      updateData.opening_time = data.openingTime;
    if (data.closingTime !== undefined)
      updateData.closing_time = data.closingTime;
    if (data.autoConfirmAppointments !== undefined)
      updateData.auto_confirm_appointments = data.autoConfirmAppointments;
    if (data.scheduleGenerationType !== undefined)
      updateData.schedule_generation_type = data.scheduleGenerationType;
    if (data.allowOverLimitAppointments !== undefined)
      updateData.allow_over_limit_appointments = data.allowOverLimitAppointments;
    if (data.defaultScheduleView !== undefined)
      updateData.default_schedule_view = data.defaultScheduleView;

    return await prisma.settings.upsert({
      where: { organization_id: organizationId },
      update: updateData,
      create: {
        organization_id: organizationId,
        company_name:
          data.companyName ||
          existingSettings?.organization.name ||
          "Minha Empresa",
        responsible_name: data.responsibleName || "",
        document: data.document || "",
        phone_landline: data.contactPhone || "",
        phone_whatsapp: data.whatsapp || "",
        opening_time: data.openingTime || "08:00",
        closing_time: data.closingTime || "19:00",
        auto_confirm_appointments: data.autoConfirmAppointments ?? true,
        schedule_generation_type: data.scheduleGenerationType || "automatic",
        allow_over_limit_appointments: data.allowOverLimitAppointments ?? false,
        default_schedule_view: data.defaultScheduleView || "day",
      },
    });
  }

  // ---------------------------------------------------------------------------
  // AUTOATENDIMENTO (Regras e Horários)
  // ---------------------------------------------------------------------------

  /**
   * Busca as regras, horários de expediente e exceções do autoatendimento.
   */
  static async getSelfServiceSettings(organizationId: string) {
    const prisma = getTenantPrisma(organizationId);

    const [settings, scheduleRules] = await Promise.all([
      prisma.settings.findUnique({
        where: { organization_id: organizationId },
        select: { 
          terms_of_use: true, 
          future_booking_limit_days: true,
          opening_time: true,
          closing_time: true,
          schedule_generation_type: true,
          booking_theme: true,
          booking_primary_color: true,
          allow_over_limit_appointments: true,
          require_prepayment: true,
          pix_key: true,
          payment_instructions: true,
          show_packages: true,
          show_most_booked: true,
          show_team: true,
          show_team_likes: true,
        },
      }),
      prisma.scheduleRule.findMany({
        where: { organization_id: organizationId },
        include: {
          working_hours: { orderBy: { day_of_week: "asc" } },
          schedule_exceptions: { orderBy: { date: "asc" } }
        },
        orderBy: { is_default: "desc" },
      }),
    ]);

    return {
      termsOfUse: settings?.terms_of_use || "",
      futureBookingLimitDays: settings?.future_booking_limit_days ?? 30,
      openingTime: settings?.opening_time || "08:00",
      closingTime: settings?.closing_time || "19:00",
      scheduleGenerationType: settings?.schedule_generation_type || "fixed_30",
      bookingTheme: settings?.booking_theme || "light",
      bookingPrimaryColor: settings?.booking_primary_color || "#0f172a",
      allowOverLimitAppointments: settings?.allow_over_limit_appointments ?? false,
      requirePrepayment: settings?.require_prepayment ?? true,
      pixKey: settings?.pix_key || "",
      paymentInstructions: settings?.payment_instructions || "",
      showPackages: settings?.show_packages ?? true,
      showMostBooked: settings?.show_most_booked ?? true,
      showTeam: settings?.show_team ?? true,
      showTeamLikes: settings?.show_team_likes ?? true,

      scheduleRules: scheduleRules.map((rule) => ({
        id: rule.id,
        name: rule.name,
        isDefault: rule.is_default,
        schedule: rule.working_hours.map((s) => ({
          dayOfWeek: s.day_of_week,
          isOpen: s.is_open,
          openTime: s.open_time || "",
          closeTime: s.close_time || "",
          breakStart: s.break_start || "",
          breakEnd: s.break_end || "",
          breakReason: s.break_reason || "",
          breakVisibleToClient: s.break_visible_to_client,
        })),
        exceptions: rule.schedule_exceptions.map((e) => ({
          date: e.date,
          isOpen: e.is_open,
          openTime: e.open_time || "",
          closeTime: e.close_time || "",
          breakStart: e.break_start || "",
          breakEnd: e.break_end || "",
          breakReason: e.break_reason || "",
          breakVisibleToClient: e.break_visible_to_client,
        })),
      })),
    };
  }

  static async updateSelfServiceSettings(organizationId: string, data: any) {
    const prisma = getTenantPrisma(organizationId);

    return await prisma.$transaction(async (tx) => {
      // 1. Atualizar Configurações no Settings
      if (
        data.termsOfUse !== undefined ||
        data.futureBookingLimitDays !== undefined ||
        data.openingTime !== undefined ||
        data.closingTime !== undefined ||
        data.scheduleGenerationType !== undefined ||
        data.bookingTheme !== undefined ||
        data.bookingPrimaryColor !== undefined ||
        data.allowOverLimitAppointments !== undefined ||
        data.requirePrepayment !== undefined ||
        data.pixKey !== undefined ||
        data.paymentInstructions !== undefined ||
        data.showPackages !== undefined ||
        data.showMostBooked !== undefined ||
        data.showTeam !== undefined ||
        data.showTeamLikes !== undefined
      ) {
        const updateData: any = {};
        if (data.termsOfUse !== undefined) updateData.terms_of_use = data.termsOfUse;
        if (data.futureBookingLimitDays !== undefined) updateData.future_booking_limit_days = data.futureBookingLimitDays;
        if (data.openingTime !== undefined) updateData.opening_time = data.openingTime;
        if (data.closingTime !== undefined) updateData.closing_time = data.closingTime;
        if (data.scheduleGenerationType !== undefined) updateData.schedule_generation_type = data.scheduleGenerationType;
        
        if (data.bookingTheme !== undefined) updateData.booking_theme = data.bookingTheme;
        if (data.bookingPrimaryColor !== undefined) updateData.booking_primary_color = data.bookingPrimaryColor;
        if (data.allowOverLimitAppointments !== undefined) updateData.allow_over_limit_appointments = data.allowOverLimitAppointments;
        if (data.requirePrepayment !== undefined) updateData.require_prepayment = data.requirePrepayment;
        if (data.pixKey !== undefined) updateData.pix_key = data.pixKey;
        if (data.paymentInstructions !== undefined) updateData.payment_instructions = data.paymentInstructions;
        if (data.showPackages !== undefined) updateData.show_packages = data.showPackages;
        if (data.showMostBooked !== undefined) updateData.show_most_booked = data.showMostBooked;
        if (data.showTeam !== undefined) updateData.show_team = data.showTeam;
        if (data.showTeamLikes !== undefined) updateData.show_team_likes = data.showTeamLikes;

        await tx.settings.update({
          where: { organization_id: organizationId },
          data: updateData,
        });
      }
    });
  }


  // ---------------------------------------------------------------------------
  // GERENCIAMENTO DE REGRAS DE HORÁRIOS
  // ---------------------------------------------------------------------------

  static async createScheduleRule(organizationId: string, name: string, isDefault: boolean) {
    const prisma = getTenantPrisma(organizationId);
    
    // Se for default, remove o default das outras
    if (isDefault) {
      await prisma.scheduleRule.updateMany({
        where: { organization_id: organizationId, is_default: true },
        data: { is_default: false },
      });
    }

    return await prisma.scheduleRule.create({
      data: {
        organization_id: organizationId,
        name,
        is_default: isDefault,
        // Cria grade vazia 7 dias
        working_hours: {
          create: Array.from({ length: 7 }).map((_, i) => ({
            organization_id: organizationId,
            day_of_week: i,
            is_open: i >= 1 && i <= 5, // Seg a Sex aberto
            open_time: "08:00",
            close_time: "18:00",
          })),
        },
      },
    });
  }

  static async updateScheduleRule(
    organizationId: string, 
    ruleId: string, 
    data: any
  ) {
    const prisma = getTenantPrisma(organizationId);

    return await prisma.$transaction(async (tx) => {
      if (data.name !== undefined || data.isDefault !== undefined) {
        if (data.isDefault) {
          await tx.scheduleRule.updateMany({
            where: { organization_id: organizationId, is_default: true, id: { not: ruleId } },
            data: { is_default: false },
          });
        }
        await tx.scheduleRule.update({
          where: { id: ruleId, organization_id: organizationId },
          data: {
            name: data.name,
            is_default: data.isDefault,
          },
        });
      }

      // Substituir grade semanal da regra
      if (data.schedule && Array.isArray(data.schedule)) {
        await tx.workingHour.deleteMany({
          where: { organization_id: organizationId, schedule_rule_id: ruleId },
        });

        await tx.workingHour.createMany({
          data: data.schedule.map((s: any) => ({
            organization_id: organizationId,
            schedule_rule_id: ruleId,
            day_of_week: s.dayOfWeek,
            is_open: s.isOpen,
            open_time: s.openTime || null,
            close_time: s.closeTime || null,
            break_start: s.breakStart || null,
            break_end: s.breakEnd || null,
            break_reason: s.breakReason || null,
            break_visible_to_client: s.breakVisibleToClient ?? false,
          })),
        });
      }

      // Substituir exceções
      if (data.exceptions && Array.isArray(data.exceptions)) {
        await tx.scheduleException.deleteMany({
          where: { organization_id: organizationId, schedule_rule_id: ruleId },
        });

        if (data.exceptions.length > 0) {
          await tx.scheduleException.createMany({
            data: data.exceptions.map((e: any) => ({
              organization_id: organizationId,
              schedule_rule_id: ruleId,
              date: e.date,
              is_open: e.isOpen,
              open_time: e.openTime || null,
              close_time: e.closeTime || null,
              break_start: e.breakStart || null,
              break_end: e.breakEnd || null,
              break_reason: e.breakReason || null,
              break_visible_to_client: e.breakVisibleToClient ?? false,
            })),
          });
        }
      }
    });
  }

  static async deleteScheduleRule(organizationId: string, ruleId: string) {
    const prisma = getTenantPrisma(organizationId);
    
    // Verifica se é a default
    const rule = await prisma.scheduleRule.findUnique({
      where: { id: ruleId, organization_id: organizationId },
    });
    
    if (rule?.is_default) {
      throw new Error("Não é possível excluir a regra de horário padrão.");
    }
    
    return await prisma.scheduleRule.delete({
      where: { id: ruleId, organization_id: organizationId },
    });
  }
}

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
      tradeName: settings.trade_name || "",
      document: settings.document || "",
      contactPhone: settings.phone_landline || "",
      whatsapp: settings.phone_whatsapp || "",
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
    if (data.companyName !== undefined)
      updateData.company_name = data.companyName;
    if (data.tradeName !== undefined) updateData.trade_name = data.tradeName;
    if (data.document !== undefined) updateData.document = data.document;
    if (data.contactPhone !== undefined)
      updateData.phone_landline = data.contactPhone;
    if (data.whatsapp !== undefined) updateData.phone_whatsapp = data.whatsapp;
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
        trade_name: data.tradeName || "",
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

    const [settings, schedule, exceptions] = await Promise.all([
      prisma.settings.findUnique({
        where: { organization_id: organizationId },
        select: { 
          terms_of_use: true, 
          future_booking_limit_days: true,
          welcome_message: true,
          payment_confirmation_title: true,
          payment_pix_instructions: true,
          payment_pix_key_type: true,
          payment_pix_key: true,
          payment_security_warning: true,
          payment_friction_message: true
        },
      }),
      prisma.workingHour.findMany({
        where: { organization_id: organizationId },
        orderBy: { day_of_week: "asc" },
      }),
      prisma.scheduleException.findMany({
        where: { organization_id: organizationId },
        orderBy: { date: "asc" },
      }),
    ]);

    return {
      termsOfUse: settings?.terms_of_use || "",
      futureBookingLimitDays: settings?.future_booking_limit_days ?? 30,
      welcomeMessage: settings?.welcome_message || "Bem-vindo, aqui você pode agendar seu horário de forma rápida e fácil.",
      paymentRules: {
        confirmationTitle: settings?.payment_confirmation_title || "",
        pixInstructions: settings?.payment_pix_instructions || "",
        pixKeyType: settings?.payment_pix_key_type || "Celular",
        pixKey: settings?.payment_pix_key || "",
        securityWarning: settings?.payment_security_warning || "",
        frictionMessage: settings?.payment_friction_message || "",
      },
      schedule: schedule.map((s) => ({
        dayOfWeek: s.day_of_week,
        isOpen: s.is_open,
        openTime: s.open_time || "",
        closeTime: s.close_time || "",
        breakStart: s.break_start || "",
        breakEnd: s.break_end || "",
        breakReason: s.break_reason || "",
        breakVisibleToClient: s.break_visible_to_client,
      })),
      exceptions: exceptions.map((e) => ({
        date: e.date,
        isOpen: e.is_open,
        openTime: e.open_time || "",
        closeTime: e.close_time || "",
        breakStart: e.break_start || "",
        breakEnd: e.break_end || "",
        breakReason: e.break_reason || "",
        breakVisibleToClient: e.break_visible_to_client,
      })),
    };
  }

  /**
   * Atualiza as regras, recriando as tabelas de horários e exceções em uma transação.
   */
  static async updateSelfServiceSettings(organizationId: string, data: any) {
    const prisma = getTenantPrisma(organizationId);

    return await prisma.$transaction(async (tx) => {
      // 1. Atualizar Configurações no Settings
      if (
        data.termsOfUse !== undefined ||
        data.futureBookingLimitDays !== undefined ||
        data.welcomeMessage !== undefined ||
        data.paymentRules !== undefined
      ) {
        const updateData: any = {};
        if (data.termsOfUse !== undefined) updateData.terms_of_use = data.termsOfUse;
        if (data.futureBookingLimitDays !== undefined) updateData.future_booking_limit_days = data.futureBookingLimitDays;
        if (data.welcomeMessage !== undefined) updateData.welcome_message = data.welcomeMessage;
        
        if (data.paymentRules !== undefined) {
          if (data.paymentRules.confirmationTitle !== undefined) updateData.payment_confirmation_title = data.paymentRules.confirmationTitle;
          if (data.paymentRules.pixInstructions !== undefined) updateData.payment_pix_instructions = data.paymentRules.pixInstructions;
          if (data.paymentRules.pixKeyType !== undefined) updateData.payment_pix_key_type = data.paymentRules.pixKeyType;
          if (data.paymentRules.pixKey !== undefined) updateData.payment_pix_key = data.paymentRules.pixKey;
          if (data.paymentRules.securityWarning !== undefined) updateData.payment_security_warning = data.paymentRules.securityWarning;
          if (data.paymentRules.frictionMessage !== undefined) updateData.payment_friction_message = data.paymentRules.frictionMessage;
        }

        await tx.settings.update({
          where: { organization_id: organizationId },
          data: updateData,
        });
      }

      // 2. Substituir grade semanal
      if (data.schedule && Array.isArray(data.schedule)) {
        await tx.workingHour.deleteMany({
          where: { organization_id: organizationId },
        });

        await tx.workingHour.createMany({
          data: data.schedule.map((s: any) => ({
            organization_id: organizationId,
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

      // 3. Substituir exceções
      if (data.exceptions && Array.isArray(data.exceptions)) {
        await tx.scheduleException.deleteMany({
          where: { organization_id: organizationId },
        });

        if (data.exceptions.length > 0) {
          await tx.scheduleException.createMany({
            data: data.exceptions.map((e: any) => ({
              organization_id: organizationId,
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
}

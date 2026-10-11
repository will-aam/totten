// lib/schedule-validation.ts

export interface ScheduleWorkingHour {
  day_of_week: number;
  is_open: boolean;
  open_time?: string | null;
  close_time?: string | null;
  break_start?: string | null;
  break_end?: string | null;
  break_reason?: string | null;
}

export interface ScheduleExceptionItem {
  date: string; // "YYYY-MM-DD"
  is_open: boolean;
  open_time?: string | null;
  close_time?: string | null;
  break_start?: string | null;
  break_end?: string | null;
  break_reason?: string | null;
}

export interface ScheduleRuleData {
  id?: string;
  name?: string;
  is_default?: boolean;
  working_hours?: ScheduleWorkingHour[];
  schedule_exceptions?: ScheduleExceptionItem[];
}

export interface OrgSettingsData {
  openingTime?: string;
  opening_time?: string;
  closingTime?: string;
  closing_time?: string;
  allowOverLimitAppointments?: boolean;
  allow_over_limit_appointments?: boolean;
}

export interface DayScheduleResult {
  isOpen: boolean;
  dayOfWeek: number;
  dayName: string;
  isException: boolean;
  openTime: string;
  closeTime: string;
  breakStart: string | null;
  breakEnd: string | null;
  breakReason: string | null;
}

export interface ScheduleValidationResult {
  isValid: boolean;
  errorType: "CLOSED_DAY" | "OUTSIDE_GRID" | "OUTSIDE_EXPEDIENTE" | "DURING_BREAK" | null;
  errorMessage: string | null;
  scheduleDetails: DayScheduleResult & {
    establishmentOpen: string;
    establishmentClose: string;
  };
}

export const DAY_NAMES = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export function getDayOfWeekFromDateStr(dateStr: string): number {
  if (!dateStr || !dateStr.includes("-")) return 0;
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return d.getUTCDay();
}

export function getProfessionalScheduleForDate(
  scheduleRule?: ScheduleRuleData | null,
  dateStr?: string,
  orgSettings?: OrgSettingsData | null
): DayScheduleResult {
  const estOpen = orgSettings?.openingTime || orgSettings?.opening_time || "08:00";
  const estClose = orgSettings?.closingTime || orgSettings?.closing_time || "19:00";

  if (!dateStr) {
    return {
      isOpen: true,
      dayOfWeek: 0,
      dayName: DAY_NAMES[0],
      isException: false,
      openTime: estOpen,
      closeTime: estClose,
      breakStart: null,
      breakEnd: null,
      breakReason: null,
    };
  }

  const dayOfWeek = getDayOfWeekFromDateStr(dateStr);
  const dayName = DAY_NAMES[dayOfWeek];

  // 1. Prioridade para exceções pontuais da data ("YYYY-MM-DD")
  const exception = scheduleRule?.schedule_exceptions?.find((e) => e.date === dateStr);
  if (exception) {
    return {
      isOpen: exception.is_open,
      dayOfWeek,
      dayName,
      isException: true,
      openTime: exception.open_time || estOpen,
      closeTime: exception.close_time || estClose,
      breakStart: exception.break_start || null,
      breakEnd: exception.break_end || null,
      breakReason: exception.break_reason || null,
    };
  }

  // 2. Grade semanal padrão do dia da semana
  const wh = scheduleRule?.working_hours?.find((w) => w.day_of_week === dayOfWeek);
  if (wh) {
    return {
      isOpen: wh.is_open,
      dayOfWeek,
      dayName,
      isException: false,
      openTime: wh.open_time || estOpen,
      closeTime: wh.close_time || estClose,
      breakStart: wh.break_start || null,
      breakEnd: wh.break_end || null,
      breakReason: wh.break_reason || null,
    };
  }

  // 3. Fallback: Se não houver regra definida, assume a grade global da empresa
  return {
    isOpen: true,
    dayOfWeek,
    dayName,
    isException: false,
    openTime: estOpen,
    closeTime: estClose,
    breakStart: null,
    breakEnd: null,
    breakReason: null,
  };
}

export function validateScheduleAppointment(params: {
  professionalName?: string | null;
  scheduleRule?: ScheduleRuleData | null;
  dateStr: string;
  timeStr?: string;
  orgSettings?: OrgSettingsData | null;
}): ScheduleValidationResult {
  const { professionalName, scheduleRule, dateStr, timeStr, orgSettings } = params;

  const proSchedule = getProfessionalScheduleForDate(scheduleRule, dateStr, orgSettings);
  const proName = professionalName || "O profissional";
  const estOpen = orgSettings?.openingTime || orgSettings?.opening_time || "08:00";
  const estClose = orgSettings?.closingTime || orgSettings?.closing_time || "19:00";
  const allowOverLimit =
    orgSettings?.allowOverLimitAppointments ??
    orgSettings?.allow_over_limit_appointments ??
    false;

  const scheduleDetails = {
    ...proSchedule,
    establishmentOpen: estOpen,
    establishmentClose: estClose,
  };

  // Se o profissional não abre/trabalha neste dia
  if (!proSchedule.isOpen) {
    const errorMsg = proSchedule.isException
      ? `${proName} possui folga/exceção cadastrada para esta data (${dateStr}) e não tem expediente previsto.`
      : `${proName} não atende aos/às ${proSchedule.dayName}s conforme a grade de horários configurada.`;

    return {
      isValid: false,
      errorType: "CLOSED_DAY",
      errorMessage: errorMsg,
      scheduleDetails,
    };
  }

  // Se tiver timeStr preenchido e com 5 caracteres ("HH:mm")
  if (timeStr && timeStr.length === 5) {
    // 1. Grade do Estabelecimento
    if (timeStr < estOpen) {
      return {
        isValid: false,
        errorType: "OUTSIDE_GRID",
        errorMessage: `O horário informado (${timeStr}) é anterior ao início da grade da empresa (${estOpen}).`,
        scheduleDetails,
      };
    }

    if (!allowOverLimit && timeStr >= estClose) {
      return {
        isValid: false,
        errorType: "OUTSIDE_GRID",
        errorMessage: `O horário informado (${timeStr}) ultrapassa o encerramento da grade da empresa (${estClose}).`,
        scheduleDetails,
      };
    }

    // 2. Expediente do Profissional
    if (timeStr < proSchedule.openTime) {
      return {
        isValid: false,
        errorType: "OUTSIDE_EXPEDIENTE",
        errorMessage: `O horário informado (${timeStr}) é anterior ao expediente de ${proName} (${proSchedule.openTime} às ${proSchedule.closeTime}).`,
        scheduleDetails,
      };
    }

    if (!allowOverLimit && timeStr >= proSchedule.closeTime) {
      return {
        isValid: false,
        errorType: "OUTSIDE_EXPEDIENTE",
        errorMessage: `O horário informado (${timeStr}) ultrapassa o fim do expediente de ${proName} (${proSchedule.closeTime}).`,
        scheduleDetails,
      };
    }

    // 3. Intervalo de Descanso / Almoço
    if (
      proSchedule.breakStart &&
      proSchedule.breakEnd &&
      timeStr >= proSchedule.breakStart &&
      timeStr < proSchedule.breakEnd
    ) {
      const reasonText = proSchedule.breakReason ? ` (${proSchedule.breakReason})` : "";
      return {
        isValid: false,
        errorType: "DURING_BREAK",
        errorMessage: `O horário informado (${timeStr}) coincide com o intervalo de descanso de ${proName} (${proSchedule.breakStart} às ${proSchedule.breakEnd}${reasonText}).`,
        scheduleDetails,
      };
    }
  }

  return {
    isValid: true,
    errorType: null,
    errorMessage: null,
    scheduleDetails,
  };
}

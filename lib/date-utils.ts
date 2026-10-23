// lib/date-utils.ts
import { addWeeks } from "date-fns";

export const BRAZIL_TIMEZONE = "America/Sao_Paulo";
export const BRAZIL_OFFSET = "-03:00";

/**
 * Retorna as partes de uma data (ano, mês 1-12, dia, hora, minuto, segundo)
 * calculadas explicitamente no fuso horário oficial de Brasília (America/Sao_Paulo),
 * independentemente de o servidor estar rodando em UTC ou qualquer outro fuso.
 */
export function getBrasiliaDateParts(date: Date | string | number = new Date()): {
  year: number;
  month: number; // 1 a 12
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: BRAZIL_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  const partMap: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      partMap[part.type] = Number(part.value);
    }
  }

  return {
    year: partMap.year || d.getUTCFullYear(),
    month: partMap.month || d.getUTCMonth() + 1,
    day: partMap.day || d.getUTCDate(),
    hour: partMap.hour !== undefined ? partMap.hour : d.getUTCHours(),
    minute: partMap.minute !== undefined ? partMap.minute : d.getUTCMinutes(),
    second: partMap.second !== undefined ? partMap.second : d.getUTCSeconds(),
  };
}

/**
 * Converte uma data (string "YYYY-MM-DD" ou Date) para um objeto Date seguro
 * posicionado no meio-dia de Brasília (12:00:00-03:00 / 15:00:00 UTC).
 * Impede deslocamento de dia ao salvar transações e agendamentos.
 */
export function parseDateToBrasilia(dateInput: string | Date): Date {
  if (dateInput instanceof Date) {
    return new Date(dateInput);
  }

  const str = String(dateInput).trim();
  if (!str) return new Date();

  // Se for "YYYY-MM-DD" puro
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return new Date(`${str}T12:00:00-03:00`);
  }

  return new Date(str);
}

/**
 * Retorna os limites exatos de início (00:00:00.000) e fim (23:59:59.999)
 * para um dia no fuso horário de Brasília (America/Sao_Paulo).
 * Em UTC, 23:59:59.999 de Brasília corresponde a 02:59:59.999Z do dia seguinte,
 * garantindo que atendimentos noturnos (após 21h) NUNCA sejam excluídos ou deslocados.
 */
export function getBrasiliaDayRange(dateInput: string | Date = new Date()): {
  startOfDay: Date;
  endOfDay: Date;
} {
  let y: number;
  let m: number;
  let d: number;

  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    const [yearStr, monthStr, dayStr] = dateInput.trim().split("-");
    y = Number(yearStr);
    m = Number(monthStr);
    d = Number(dayStr);
  } else {
    const parts = getBrasiliaDateParts(dateInput);
    y = parts.year;
    m = parts.month;
    d = parts.day;
  }

  const yStr = String(y);
  const mStr = String(m).padStart(2, "0");
  const dStr = String(d).padStart(2, "0");

  const startOfDay = new Date(`${yStr}-${mStr}-${dStr}T00:00:00.000-03:00`);
  const endOfDay = new Date(`${yStr}-${mStr}-${dStr}T23:59:59.999-03:00`);

  return { startOfDay, endOfDay };
}

/**
 * Retorna os limites exatos de início (01 00:00:00.000) e fim (último dia 23:59:59.999)
 * para um mês no fuso horário de Brasília.
 * Em UTC, o fechamento do mês vai até 02:59:59.999Z do dia 1 do mês seguinte,
 * assegurando que fechamentos contábeis englobem 100% dos atendimentos noturnos do último dia.
 */
export function getBrasiliaMonthRange(year: number, month: number): {
  monthStart: Date;
  monthEnd: Date;
} {
  const yStr = String(year);
  const mStr = String(month).padStart(2, "0");

  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const lastDayStr = String(lastDay).padStart(2, "0");

  const monthStart = new Date(`${yStr}-${mStr}-01T00:00:00.000-03:00`);
  const monthEnd = new Date(`${yStr}-${mStr}-${lastDayStr}T23:59:59.999-03:00`);

  return { monthStart, monthEnd };
}

/**
 * Adiciona meses a uma data mantendo o horário seguro de meio-dia no fuso de Brasília.
 */
export function addBrasiliaMonths(baseDate: Date, monthsToAdd: number): Date {
  const parts = getBrasiliaDateParts(baseDate);
  const targetYear = parts.year + Math.floor((parts.month - 1 + monthsToAdd) / 12);
  const targetMonth = ((parts.month - 1 + monthsToAdd) % 12 + 12) % 12 + 1;

  const daysInTargetMonth = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  const targetDay = Math.min(parts.day, daysInTargetMonth);

  const yStr = String(targetYear);
  const mStr = String(targetMonth).padStart(2, "0");
  const dStr = String(targetDay).padStart(2, "0");

  return new Date(`${yStr}-${mStr}-${dStr}T12:00:00-03:00`);
}

/**
 * Adiciona semanas a uma data mantendo o horário seguro de meio-dia no fuso de Brasília.
 */
export function addBrasiliaWeeks(baseDate: Date, weeksToAdd: number): Date {
  const d = new Date(baseDate.getTime() + weeksToAdd * 7 * 24 * 60 * 60 * 1000);
  const parts = getBrasiliaDateParts(d);
  const yStr = String(parts.year);
  const mStr = String(parts.month).padStart(2, "0");
  const dStr = String(parts.day).padStart(2, "0");

  return new Date(`${yStr}-${mStr}-${dStr}T12:00:00-03:00`);
}

/**
 * Retorna os limites de início (domingo 00:00:00.000) e fim (sábado 23:59:59.999)
 * para a semana da data fornecida no fuso horário de Brasília.
 */
export function getBrasiliaWeekRange(dateInput: string | Date = new Date()): {
  weekStart: Date;
  weekEnd: Date;
} {
  const parts = getBrasiliaDateParts(dateInput);
  const mStr = String(parts.month).padStart(2, "0");
  const dStr = String(parts.day).padStart(2, "0");
  const midday = new Date(`${parts.year}-${mStr}-${dStr}T12:00:00-03:00`);

  // Pega o dia da semana (0 = domingo, 6 = sábado) no fuso de Brasília
  const dayOfWeek = new Date(
    midday.toLocaleString("en-US", { timeZone: BRAZIL_TIMEZONE }),
  ).getDay();

  const startDay = new Date(midday.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
  const endDay = new Date(
    midday.getTime() + (6 - dayOfWeek) * 24 * 60 * 60 * 1000,
  );

  const startParts = getBrasiliaDateParts(startDay);
  const endParts = getBrasiliaDateParts(endDay);

  const sY = String(startParts.year);
  const sM = String(startParts.month).padStart(2, "0");
  const sD = String(startParts.day).padStart(2, "0");

  const eY = String(endParts.year);
  const eM = String(endParts.month).padStart(2, "0");
  const eD = String(endParts.day).padStart(2, "0");

  const weekStart = new Date(`${sY}-${sM}-${sD}T00:00:00.000-03:00`);
  const weekEnd = new Date(`${eY}-${eM}-${eD}T23:59:59.999-03:00`);

  return { weekStart, weekEnd };
}

/**
 * Gera uma lista de datas para agendamentos recorrentes.
 * @param startDate A data e hora do primeiro agendamento.
 * @param occurrences O número total de sessões (ex: 10).
 * @returns Um array de objetos Date.
 */
export function generateRecurrentDates(
  startDate: Date,
  occurrences: number,
): Date[] {
  const dates: Date[] = [];

  for (let i = 0; i < occurrences; i++) {
    const nextDate = addWeeks(new Date(startDate), i);
    dates.push(nextDate);
  }

  return dates;
}

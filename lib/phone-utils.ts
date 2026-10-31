/**
 * Utilitários centralizados e padronizados para Telefonia e Identificação no Brasil.
 * Focado exclusivamente nas normas brasileiras de numeração (Anatel / ABNT).
 */

export interface PhoneFormatOptions {
  openDelimiter?: string;
  closeDelimiter?: string;
  separator?: string;
  spaceAfterDDD?: boolean;
}

// Configuração padrão de formatação brasileira
export const DEFAULT_PHONE_CONFIG: Required<PhoneFormatOptions> = {
  openDelimiter: "(",
  closeDelimiter: ")",
  separator: "-",
  spaceAfterDDD: true,
};

// Lista oficial de DDDs válidos no Brasil
export const VALID_BRAZIL_DDDS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, // SP
  21, 22, 24, // RJ
  27, 28, // ES
  31, 32, 33, 34, 35, 37, 38, // MG
  41, 42, 43, 44, 45, 46, // PR
  47, 48, 49, // SC
  51, 53, 54, 55, // RS
  61, // DF
  62, 64, // GO
  63, // TO
  65, 66, // MT
  67, // MS
  68, // AC
  69, // RO
  71, 73, 74, 75, 77, // BA
  79, // SE
  81, 87, // PE
  82, // AL
  83, // PB
  84, // RN
  85, 88, // CE
  86, 89, // PI
  91, 93, 94, // PA
  92, 97, // AM
  95, // RR
  96, // AP
  98, 99, // MA
]);

/**
 * Normaliza qualquer número de telefone para o padrão brasileiro de dígitos puros (apenas DDD + número).
 * Trata variações com DDI Brasil (+55 ou 55), zero à esquerda no DDD, etc.
 * Exemplo:
 * "+55 (11) 99999-9999" -> "11999999999"
 * "5511999999999" -> "11999999999"
 * "(11) 99999-9999" -> "11999999999"
 * "11999999999" -> "11999999999"
 * "011999999999" -> "11999999999"
 */
export function normalizeBrazilPhone(value: string | null | undefined): string {
  if (!value) return "";
  let digits = value.replace(/\D/g, "");

  // Se tem 12 ou 13 dígitos e começa com 55 (DDI Brasil), remove o DDI
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    digits = digits.slice(2);
  } else if (digits.length === 14 && digits.startsWith("055")) {
    digits = digits.slice(3);
  } else if ((digits.length === 11 || digits.length === 12) && digits.startsWith("0")) {
    // Remove zero inicial de operadora/DDD (ex: 011...)
    digits = digits.slice(1);
  }

  // Limita ao máximo de 11 dígitos nacionais (DDD + 9 dígitos)
  return digits.slice(0, 11);
}

/**
 * Formata um número de telefone no padrão brasileiro.
 * Celular: (XX) 9XXXX-XXXX
 * Fixo: (XX) XXXX-XXXX
 * Configurável caso no futuro os delimitadores mudem (ex: colchetes [XX] ou traços).
 */
export function formatBrazilPhone(
  value: string | null | undefined,
  options?: PhoneFormatOptions
): string {
  if (!value) return "";
  const opts = { ...DEFAULT_PHONE_CONFIG, ...options };
  const space = opts.spaceAfterDDD ? " " : "";

  // Normaliza primeiro para evitar cortar se tiver DDI 55
  const d = normalizeBrazilPhone(value);
  if (!d) return "";

  if (d.length <= 2) {
    return `${opts.openDelimiter}${d}`;
  }

  const ddd = d.slice(0, 2);
  const rest = d.slice(2);

  // Até 6 dígitos no número total (DDD + 4 dígitos)
  if (d.length <= 6) {
    return `${opts.openDelimiter}${ddd}${opts.closeDelimiter}${space}${rest}`;
  }

  // 10 dígitos: Fixo (XX) XXXX-XXXX
  if (d.length <= 10) {
    const part1 = rest.slice(0, rest.length - 4);
    const part2 = rest.slice(-4);
    return `${opts.openDelimiter}${ddd}${opts.closeDelimiter}${space}${part1}${opts.separator}${part2}`;
  }

  // 11 dígitos: Celular (XX) 9XXXX-XXXX
  const part1 = rest.slice(0, 5);
  const part2 = rest.slice(5, 9);
  return `${opts.openDelimiter}${ddd}${opts.closeDelimiter}${space}${part1}${opts.separator}${part2}`;
}

/**
 * Validação rigorosa de número de telefone do Brasil.
 */
export function validateBrazilPhone(value: string | null | undefined): {
  isValid: boolean;
  error?: string;
  normalized?: string;
} {
  const digits = normalizeBrazilPhone(value);

  if (!digits) {
    return { isValid: false, error: "WhatsApp/Telefone é obrigatório." };
  }

  if (digits.length < 10) {
    return { isValid: false, error: "Número incompleto (mínimo de 10 dígitos com DDD)." };
  }

  if (digits.length > 11) {
    return { isValid: false, error: "Número muito longo para o padrão brasileiro." };
  }

  const ddd = parseInt(digits.slice(0, 2), 10);
  if (!VALID_BRAZIL_DDDS.has(ddd)) {
    return { isValid: false, error: `DDD (${digits.slice(0, 2)}) inválido para o Brasil.` };
  }

  // Validação de número com todos os dígitos iguais
  if (/^(\d)\1+$/.test(digits)) {
    return { isValid: false, error: "Número de telefone inválido." };
  }

  // Celulares no Brasil (11 dígitos) DEVEM começar com 9 após o DDD
  if (digits.length === 11) {
    const ninthDigit = digits.charAt(2);
    if (ninthDigit !== "9") {
      return { isValid: false, error: "Celulares com 11 dígitos devem iniciar com o dígito 9 após o DDD." };
    }
  }

  // Fixos no Brasil (10 dígitos) começam tipicamente com 2, 3, 4 ou 5
  if (digits.length === 10) {
    const firstDigit = digits.charAt(2);
    if (!["2", "3", "4", "5"].includes(firstDigit)) {
      return { isValid: false, error: "Telefones fixos devem iniciar com 2, 3, 4 ou 5." };
    }
  }

  return { isValid: true, normalized: digits };
}

/**
 * Normaliza CPF para apenas 11 dígitos.
 */
export function normalizeCpf(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/\D/g, "").slice(0, 11);
}

/**
 * Formata CPF para o padrão XXX.XXX.XXX-XX.
 */
export function formatCpf(value: string | null | undefined): string {
  if (!value) return "";
  const d = normalizeCpf(value);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

/**
 * Validação dos dígitos verificadores do CPF.
 */
export function validateCpf(value: string | null | undefined): {
  isValid: boolean;
  error?: string;
  normalized?: string;
} {
  const cpf = normalizeCpf(value);

  if (!cpf) {
    return { isValid: false, error: "CPF é obrigatório." };
  }

  if (cpf.length !== 11) {
    return { isValid: false, error: "O CPF deve conter exatamente 11 dígitos." };
  }

  // Bloqueia CPFs com dígitos repetidos (ex: 111.111.111-11)
  if (/^(\d)\1+$/.test(cpf)) {
    return { isValid: false, error: "CPF inválido." };
  }

  // Cálculo do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(9), 10)) {
    return { isValid: false, error: "CPF inválido." };
  }

  // Cálculo do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(10), 10)) {
    return { isValid: false, error: "CPF inválido." };
  }

  return { isValid: true, normalized: cpf };
}

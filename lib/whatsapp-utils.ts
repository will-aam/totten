// lib/whatsapp-utils.ts

/**
 * Textos padrão oficiais do sistema (Single Source of Truth para fallbacks).
 */
export const DEFAULT_MESSAGE_TEMPLATES = {
  CHECK_IN:
    "Olá, {nome}! Tudo bem? 💆‍♀️✨\n\nPassando para avisar que seu check-in foi registrado. Você já realizou {usadas} de {total} sessões do seu pacote.",
  WELCOME:
    "Olá, {nome}! Que alegria ter você aqui na nossa empresa. 🥰\n\nSeu pacote de {total} sessões já está ativo no nosso sistema. Qualquer dúvida, é só chamar!",
  RENEWAL:
    "Parabéns, {nome}! 🎉 Você concluiu hoje a última sessão do seu pacote.\n\nComo o seu bem-estar é nossa prioridade, que tal já deixarmos o seu próximo pacote garantido? Responda SIM para vermos os horários!",
  REMINDER:
    "Oi, {nome}! Passando para lembrar do nosso horário agendado para amanhã às {horario}. \n\nPodemos confirmar sua presença? 👍",
  MANUAL_CONFIRMATION:
    "Olá {nome}! Passando para confirmar o seu horário amanhã às *{horario}* para o serviço de {servico}. Podemos confirmar? 🥰",
  BIRTHDAY:
    "Olá {nome}! 🎉 Passando para te desejar um Feliz Aniversário! Que seu novo ciclo seja repleto de alegrias e muito bem-estar. Um abraço com carinho de toda a nossa equipe! 🥰",
} as const;

export type MessageTemplateKey = keyof typeof DEFAULT_MESSAGE_TEMPLATES;

/**
 * Limpa e padroniza o número de telefone para o padrão internacional do WhatsApp.
 * - Remove caracteres não numéricos
 * - Adiciona o DDI 55 (Brasil) caso seja um número nacional (DDD 10 ou 11 dígitos)
 * - Retorna null caso o número seja inválido ou vazio
 */
export function sanitizeWhatsAppNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;

  const digits = phone.replace(/\D/g, "");
  if (!digits || digits.length < 10) return null;

  // Se já tem DDI 55 e pelo menos 12 dígitos (55 + DDD + 8 ou 9 dígitos)
  if (digits.startsWith("55") && digits.length >= 12) {
    return digits;
  }

  // Se tem 10 ou 11 dígitos (DDD + telefone), adiciona DDI 55 do Brasil
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  // Caso seja internacional ou já formatado com mais dígitos
  return digits;
}

/**
 * Substitui variáveis dinâmicas no template (ex: {nome}, {horario}, {servico}).
 */
export function interpolateTemplate(
  template: string,
  variables: Record<string, string | number | undefined | null>,
): string {
  if (!template) return "";

  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const valStr = value !== undefined && value !== null ? String(value) : "";
    const regex = new RegExp(`\\{${key}\\}`, "g");
    result = result.replace(regex, valStr);
  }

  return result;
}

/**
 * Constrói a URL segura da API do WhatsApp utilizando a API nativa URL.
 */
export function buildWhatsAppUrl(phone: string, text: string): string {
  const url = new URL("https://api.whatsapp.com/send");
  url.searchParams.set("phone", phone);
  url.searchParams.set("text", text);
  return url.toString();
}

/**
 * Helper para cliente que valida o número, aplica as variáveis e abre a janela do WhatsApp.
 * Retorna true se abriu, ou false se o telefone for inválido.
 */
export function openWhatsAppChat(
  phone: string | null | undefined,
  message: string,
): { success: boolean; error?: string } {
  const sanitized = sanitizeWhatsAppNumber(phone);
  if (!sanitized) {
    return {
      success: false,
      error: "Cliente sem WhatsApp cadastrado ou com número inválido.",
    };
  }

  const url = buildWhatsAppUrl(sanitized, message);
  if (typeof window !== "undefined") {
    window.open(url, "_blank");
  }

  return { success: true };
}

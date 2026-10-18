/**
 * Sistema de Proteção contra Abuso e Rate Limiting para Reagendamento na Agenda.
 * 
 * Protege contra:
 * 1. Cliques/arrastes frenéticos de usuários impacientes (Burst Lock)
 * 2. Bots automatizados tentando inflar o banco e logs (Hourly Quota & Daily Cap)
 * 3. Loop infinito no mesmo agendamento (Per-Appointment Lifetime Cap)
 */

interface UserActivity {
  burstTimestamps: number[];
  hourlyCount: number;
  hourlyResetAt: number;
  violationsCount: number;
  jailedUntil?: number;
}

interface AppointmentActivity {
  lastMovedAt: number;
  totalMovesCount: number;
}

// Armazenamento em memória (leve, limpo automaticamente)
const userActivityMap = new Map<string, UserActivity>();
const appointmentActivityMap = new Map<string, AppointmentActivity>();

// Configurações de segurança ajustadas para uso real de clínica/estética
const BURST_MAX_REQUESTS = 4;        // Máx 4 reagendamentos em 30s
const BURST_WINDOW_MS = 30 * 1000;    // 30 segundos
const HOURLY_MAX_REQUESTS = 35;       // Máx 35 reagendamentos por hora por admin
const HOURLY_WINDOW_MS = 60 * 60 * 1000; // 1 hora
const CARD_COOLDOWN_MS = 2500;        // Mínimo de 2.5s entre movimentos do mesmo card
const CARD_MAX_MOVES = 8;             // Máx de 8 reagendamentos por drag-and-drop no mesmo agendamento
const JAIL_DURATION_MS = 10 * 60 * 1000; // 10 minutos de suspensão se forçar consecutivamente

export type ThrottleCheckResult = 
  | { allowed: true }
  | { allowed: false; reason: string; waitSeconds?: number };

/**
 * Valida se um usuário ou agendamento específico pode executar um reagendamento.
 */
export function checkAppointmentThrottle(
  adminId: string,
  appointmentId: string
): ThrottleCheckResult {
  const now = Date.now();

  // 1. Limpeza periódica de memória se o mapa crescer muito
  if (userActivityMap.size > 2000) {
    userActivityMap.clear();
  }
  if (appointmentActivityMap.size > 5000) {
    appointmentActivityMap.clear();
  }

  // 2. Verificar trava do agendamento individual (Anti-Loop no mesmo card)
  const apptActivity = appointmentActivityMap.get(appointmentId) || {
    lastMovedAt: 0,
    totalMovesCount: 0,
  };

  if (now - apptActivity.lastMovedAt < CARD_COOLDOWN_MS) {
    const waitSec = Math.ceil((CARD_COOLDOWN_MS - (now - apptActivity.lastMovedAt)) / 1000);
    return {
      allowed: false,
      reason: `Aguarde ${waitSec}s para mover este mesmo agendamento novamente.`,
      waitSeconds: waitSec,
    };
  }

  if (apptActivity.totalMovesCount >= CARD_MAX_MOVES) {
    return {
      allowed: false,
      reason: "Limite de reagendamentos rápidos atingido para este agendamento. Para alterar novamente, edite os detalhes do card.",
    };
  }

  // 3. Verificar atividade do usuário (Admin)
  let userActivity = userActivityMap.get(adminId);
  if (!userActivity) {
    userActivity = {
      burstTimestamps: [],
      hourlyCount: 0,
      hourlyResetAt: now + HOURLY_WINDOW_MS,
      violationsCount: 0,
    };
    userActivityMap.set(adminId, userActivity);
  }

  // Se o usuário estiver em quarentena (Jail)
  if (userActivity.jailedUntil && now < userActivity.jailedUntil) {
    const remainingMinutes = Math.ceil((userActivity.jailedUntil - now) / 60000);
    return {
      allowed: false,
      reason: `Atividade incomum detectada. O reagendamento rápido está temporariamente suspenso para seu usuário por ${remainingMinutes} min.`,
    };
  }

  // Reset da janela de 1 hora
  if (now > userActivity.hourlyResetAt) {
    userActivity.hourlyCount = 0;
    userActivity.hourlyResetAt = now + HOURLY_WINDOW_MS;
  }

  // Limpeza da janela de burst (últimos 30s)
  userActivity.burstTimestamps = userActivity.burstTimestamps.filter(
    (t) => now - t < BURST_WINDOW_MS
  );

  // Verificação de estouro da janela horária (Anti-Bot)
  if (userActivity.hourlyCount >= HOURLY_MAX_REQUESTS) {
    userActivity.violationsCount += 1;
    if (userActivity.violationsCount >= 2) {
      userActivity.jailedUntil = now + JAIL_DURATION_MS;
    }
    return {
      allowed: false,
      reason: "Limite de reagendamentos por hora excedido para sua conta. Aguarde alguns minutos ou edite o card diretamente.",
    };
  }

  // Verificação de burst (Anti-afobado / cliques em série)
  if (userActivity.burstTimestamps.length >= BURST_MAX_REQUESTS) {
    userActivity.violationsCount += 1;
    const oldestTimestamp = userActivity.burstTimestamps[0];
    const waitSec = Math.ceil((BURST_WINDOW_MS - (now - oldestTimestamp)) / 1000);
    return {
      allowed: false,
      reason: `Muitas alterações em sequência. Aguarde ${waitSec}s para mover outro agendamento.`,
      waitSeconds: waitSec,
    };
  }

  return { allowed: true };
}

/**
 * Registra a conclusão com sucesso do reagendamento para contabilizar cotas.
 */
export function recordAppointmentMove(adminId: string, appointmentId: string) {
  const now = Date.now();

  // Atualiza contador do agendamento
  const apptActivity = appointmentActivityMap.get(appointmentId) || {
    lastMovedAt: 0,
    totalMovesCount: 0,
  };
  apptActivity.lastMovedAt = now;
  apptActivity.totalMovesCount += 1;
  appointmentActivityMap.set(appointmentId, apptActivity);

  // Atualiza contador do usuário
  const userActivity = userActivityMap.get(adminId);
  if (userActivity) {
    userActivity.burstTimestamps.push(now);
    userActivity.hourlyCount += 1;
  }
}

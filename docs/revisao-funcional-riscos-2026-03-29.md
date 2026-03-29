# Revisão funcional profunda — Fluxos críticos

Data: 2026-03-29
Escopo: check-in avulso, check-in com pacote (totem), recorrência e associação de check-ins pendentes.

## Lista priorizada de riscos (por impacto)

| Prioridade   | Fluxo                  | Risco                                                                                                            | Impacto de negócio                                                             |
| ------------ | ---------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| P0 (Crítico) | Associação de pendente | Associação permite vincular `packageId` de outro cliente                                                         | Pode consumir sessão de pacote errado e gerar fraude/inconsistência financeira |
| P0 (Crítico) | Check-in com pacote    | Concorrência/race pode estourar saldo de pacote por falta de trava atômica no update de `used_sessions`          | Pode deixar `used_sessions > total_sessions` e quebrar confiança nos saldos    |
| P1 (Alto)    | Check-in com pacote    | Check-in de agendamento `CANCELADO` não é bloqueado explicitamente no endpoint de confirmação                    | Atendimentos cancelados podem ser realizados indevidamente                     |
| P1 (Alto)    | Recorrência            | Paginação de séries recorrentes é não determinística (sem ordenação estável antes do slice)                      | Séries “somem” ou trocam de página, causando erro operacional                  |
| P1 (Alto)    | Check-in avulso        | Rota avulsa (`/api/totem/checkin-avulso`) usa `organizationSlug` e não sessão/autenticação                       | Superfície de abuso e criação indevida de check-ins                            |
| P2 (Médio)   | Totem/search           | No auto check-in (1 agendamento) erro de conflito vira 500 genérico                                              | UX ruim no totem e baixa rastreabilidade operacional                           |
| P2 (Médio)   | Associação de pendente | Associação por pacote não valida `active` do pacote                                                              | Pode reativar uso de pacote arquivado na prática                               |
| P3 (Baixo)   | Fluxo geral totem      | Rotas legadas não utilizadas (`search-client`, `checkin-avulso`) coexistem com fluxo atual (`/api/totem/search`) | Aumenta dívida técnica e risco de manutenção regressiva                        |

---

## Evidências objetivas por fluxo

### 1) Associação de check-ins pendentes

- Na associação por pacote, a validação garante organização e saldo, porém **não garante que o pacote pertence ao mesmo cliente do check-in**.
- Isso ocorre porque o pacote é buscado apenas por `id` e validado por `organization_id`, depois usado para criar appointment do `clientId` do check-in.

Referências:

- `app/api/admin/checkins/pending/[checkInId]/associate/route.ts` (busca do pacote e validação atual).

### 2) Check-in com pacote (totem)

- O endpoint de confirmação do totem bloqueia `REALIZADO`, mas não possui bloqueio explícito para `CANCELADO`.
- O incremento de sessão no pacote usa `increment: 1` sem condição atômica de saldo (`used_sessions < total_sessions`) no mesmo comando de update.

Referências:

- `app/api/totem/check-in/route.ts` (validações de status e atualização de pacote).

### 3) Agendamento recorrente

- A API de séries recorrentes reconhece em comentário que `distinct` sem ordenação estável não é determinístico antes da paginação em memória.
- Isso impacta previsibilidade de paginação no administrativo.

Referências:

- `app/api/admin/recurring/route.ts` (coleta de recorrências distintas e paginação por `slice`).

### 4) Check-in avulso

- A rota avulsa usa `organizationSlug` no corpo e não exige sessão/admin autenticado.
- No fluxo atual, o totem principal usa sessão via `getCurrentAdmin` nas rotas `/api/totem/search` e `/api/totem/check-in`.

Referências:

- `app/api/totem/checkin-avulso/route.ts`.
- `app/api/totem/search/route.ts`.
- `app/api/totem/check-in/route.ts`.

---

## Recomendações práticas (ordem sugerida)

1. **Bloquear associação cruzada de pacote (P0)**
   - Em `associate`, exigir `pkg.client_id === clientId` e `pkg.active === true`.
2. **Blindar saldo de pacote contra concorrência (P0)**
   - Trocar update por operação condicional atômica (ex.: `updateMany` com `used_sessions < total_sessions` + checagem de `count`).
3. **Impedir check-in de cancelado (P1)**
   - No `/api/totem/check-in`, rejeitar `status === CANCELADO`.
4. **Tornar paginação recorrente determinística (P1)**
   - Obter séries por query ordenada estável (ex.: `groupBy`/estratégia com `min(date_time)` + `orderBy`).
5. **Desativar/proteger rotas legadas do totem (P1/P3)**
   - Remover ou proteger `search-client` e `checkin-avulso` para não manter dois contratos ativos conflitantes.
6. **Melhorar tratamento de conflito no auto check-in (P2)**
   - Mapear violações de unicidade/conflito para retorno funcional (409/400) em vez de 500.

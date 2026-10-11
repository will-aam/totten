# Integração Baixa Manual em Gestão de Pacotes × Regra de Check-in da Agenda

## 1. Visão Geral e Contexto
Anteriormente, quando um cliente comparecia presencialmente sem ter agendado previamente (por exemplo, acordos combinados boca a boca ou esquecimento na recepção), o recepcionista realizava a **baixa manual** diretamente na tela de **Gestão de Pacotes**.

Embora o saldo do pacote fosse decrementado, identificaram-se dois desafios principais:
1. **Falta de visibilidade na Agenda:** O atendimento parecia não surgir na Agenda ou ficava oculto por desalinhamento de cache client-side SWR, desvios de fuso horário UTC ou omissão do profissional (necessário para filtros e comissões).
2. **Conflito com a Configuração de Check-in da Agenda (`auto_complete_on_checkin`):**
   - Se a empresa tiver configurado **Finalizar automaticamente no check-in = Ativado**, todo check-in dá baixa no pacote e marca o agendamento como **Realizado** (Azul).
   - Se estiver **Desativado**, o check-in serve apenas para indicar que o cliente chegou à recepção (Roxo), e o desconto no pacote só deve ocorrer quando o profissional/recepcionista finalizar o atendimento na agenda.

---

## 2. Implementação das 4 Etapas

### Etapa 1: Correção de Fuso Horário e Revalidação SWR da Agenda
- **Fuso Horário Local:** Em [`app/(private)/admin/packages/page.tsx`](file:///c:/Users/will0/Desktop/totten/app/(private)/admin/packages/page.tsx), a data e hora do formulário são combinadas respeitando estritamente os componentes locais (`year`, `month`, `day`, `hours`, `minutes`), gerando uma data ISO consistente com o horário local da empresa e evitando que atendimentos feitos à noite sejam empurrados para o dia seguinte em UTC.
- **Invalidação SWR em Tempo Real:** Ao concluir a baixa manual com sucesso, é executado `mutate((key) => typeof key === "string" && key.includes("admin/agenda"))`. Se a recepcionista estiver com a aba da agenda aberta, o novo agendamento aparece instantaneamente sem necessidade de recarregar a página (F5).

### Etapa 2: Consulta da Configuração `auto_complete_on_checkin` e Pergunta Condicional
- Em [`app/(private)/admin/packages/page.tsx`](file:///c:/Users/will0/Desktop/totten/app/(private)/admin/packages/page.tsx), a configuração da organização é consultada via SWR (`orgSettings`).
- **Se `autoCompleteOnCheckin === true` (Padrão):** O sistema não exibe perguntas desnecessárias; cria e finaliza o atendimento imediatamente como **Realizado** (Azul) e desconta a sessão do pacote.
- **Se `autoCompleteOnCheckin === false`:** É exibido um painel de opções no modal:
  1. 🔘 **Atendimento já concluído:** Marca como *Realizado* na agenda e desconta a sessão do pacote imediatamente.
  2. 🔘 **Cliente aguardando no estabelecimento:** Apenas registra o check-in na agenda (*Confirmado* com cor Roxa). O pacote **NÃO é descontado no momento da baixa**, ficando protegido contra desconto duplo até que o profissional finalize o atendimento na agenda.

### Etapa 3: Parametrização da Server Action `createManualPackageCheckIn`
- Em [`app/actions/packages.ts`](file:///c:/Users/will0/Desktop/totten/app/actions/packages.ts):
  - Adicionado o parâmetro `markAsCompleted: boolean = true`.
  - **Quando `markAsCompleted === true`:**
    - `status: AppointmentStatus.REALIZADO`
    - Movimentação de estoque e registro de despesas de insumos com a data do atendimento retroativo.
    - `auto_processed: true` na tabela `check_ins`.
    - Decrementa o pacote (`used_sessions: { increment: 1 }`).
  - **Quando `markAsCompleted === false`:**
    - `status: AppointmentStatus.CONFIRMADO`
    - Não movimenta estoque nem gera despesa.
    - `auto_processed: false` na tabela `check_ins`.
    - **Não altera o saldo do pacote**, delegando o desconto à ação padrão da agenda (`updateAppointment`) quando for marcado como "Realizado".

### Etapa 4: Detecção e Reúso de Agendamento Existente
- Antes de criar um novo agendamento, a action pesquisa na tabela `appointments` se já existia um agendamento prévio pendente ou confirmado para aquele cliente e pacote no mesmo dia.
- Se já existir, a rotina **atualiza o agendamento existente** em vez de duplicá-lo na grade da agenda.

---

## 3. Validação dos Campos Obrigatórios

Para evitar inconsistências contábeis, falta de registro em relatórios de produtividade/comissões ou agendamentos "órfãos":
- **Profissional Responsável Obrigatório:** O campo de seleção do profissional é obrigatório (removida a opção "Sem profissional").
- **Bloqueio do Botão "Confirmar Baixa":** O botão permanece desabilitado até que todos os campos obrigatórios estejam preenchidos:
  - `checkInDate` (Data do atendimento válida)
  - `checkInTime` (Hora válida no formato HH:mm)
  - `checkInProfessionalId` (Profissional selecionado)

---

## 4. Validação Inteligente da Grade de Horários e Expediente dos Profissionais

Para garantir que a baixa manual respeite integralmente o funcionamento da empresa e as escalas de trabalho de cada colaborador:

### 1. Leitura da Grade Geral da Empresa (`opening_time` e `closing_time`)
- O sistema lê os parâmetros globais configurados na Agenda / Autoatendimento (`openingTime` e `closingTime`, ex: 08:00 às 19:00).
- Horários selecionados antes da abertura ou após o encerramento da grade são sinalizados como inválidos (a menos que a opção `allowOverLimitAppointments` esteja ativada).

### 2. Leitura das Regras de Horários dos Profissionais (`ScheduleRule`, `WorkingHour`, `ScheduleException`)
- Cada profissional possui vínculo com uma regra de horários (`schedule_rule_id`). Caso não tenha regra individual atribuída, o sistema herda automaticamente a **Grade Padrão (`is_default: true`)** da organização.
- **Dias de Atendimento:** O sistema verifica se o dia da semana selecionado (ex: Domingo, Segunda, etc.) está habilitado (`is_open: true`) para o profissional selecionado.
- **Folgas e Exceções:** Exceções específicas por data (`schedule_exceptions`, "YYYY-MM-DD") têm prioridade sobre a grade semanal. Se o colaborador possuir folga/exceção cadastrada na data, o sistema identifica imediatamente.
- **Horário de Expediente e Intervalos:** O sistema verifica o horário de entrada (`open_time`), encerramento (`close_time`) e os intervalos de descanso/almoço (`break_start` até `break_end`).

### 3. Feedback Visual e Notificações em Tempo Real (UI)
- **Seletor de Profissionais Inteligente:** Ao abrir o seletor com a data preenchida, cada colaborador exibe o status correspondente para aquele dia:
  - Se estiver em dia de folga/fechado: exibe a badge vermelha `Folga / Fechado`.
  - Se estiver disponível: exibe a faixa de horário do expediente (ex: `08:00 - 18:00`).
- **Alerta em Tempo Real:** Ao selecionar o colaborador e o horário, um card contextual informa:
  - Se válido: exibe chip com o expediente daquele dia e a grade da empresa.
  - Se indisponível: exibe card de alerta vermelho detalhando o motivo (ex: *"Profissional não atende aos Domingos conforme sua grade de horários"*, *"Horário fora do expediente"*, ou *"Horário coincide com o intervalo de descanso"*).
- **Bloqueio do Botão "Confirmar Baixa":** O botão permanece bloqueado enquanto houver conflito com a grade de horários ou expediente.

### 4. Validação Rigorosa no Servidor (`createManualPackageCheckIn`)
- A Server Action executa a mesma validação contra o banco de dados antes de processar qualquer transação de check-in, impedindo manipulações client-side e retornando mensagem clara de erro caso o agendamento desrespeite a escala.

---

## 5. Exclusão de Check-in e Efeitos no Sistema (Opção 2)

Na tela de **Histórico de Check-in** (`/admin/history`), o administrador pode excluir qualquer check-in para fins de correção ou cancelamento. A operação segue a **Opção 2** acordada, com rastreabilidade completa e garantias contra inconsistências de saldo:

### 1. Efeito na Agenda (Remoção Completa)
- O agendamento correspondente na tabela `appointments` é completamente removido (`tx.appointment.delete`), independentemente de ter sido gerado via autoagendamento ou baixa manual.
- Com isso, o cartão **deixa de aparecer na Agenda**.
- Para preservar a integridade referencial e o registro de auditoria, o vínculo `appointment_id` no registro de `check_ins` é desvinculado (`null`) antes da remoção do agendamento, evitando que a regra `onDelete: Cascade` do Postgres cause hard delete no registro histórico de check-in.

### 2. Estorno Condicional de Pacotes
- **Se o atendimento estava "REALIZADO":** A sessão do pacote é estornada (`used_sessions: { decrement: 1 }`) e o pacote é reativado caso estivesse esgotado.
- **Se o atendimento estava apenas com check-in pendente ("CONFIRMADO" / Em Espera):** O pacote **NÃO** é alterado, evitando gerar saldo indevido ou sessões negativas para o cliente.

### 3. Reversão de Estoque, Despesas e Fidelidade
- **Estoque de Insumos:** As quantidades deduzidas automaticamente são devolvidas ao estoque (`quantity: { increment }`).
- **Despesas Financeiras:** As despesas de custo de materiais geradas pela movimentação são excluídas.
- **Programa de Fidelidade:** Os pontos atribuídos ao cliente pelo check-in são estornados com piso zero (`Math.max(0)`).

### 4. Auditoria Obrigatória e Rastreabilidade (Logs do Sistema)
- Todo cancelamento gera um registro de auditoria em `client_notes`, registrando:
  - Nome do administrador que realizou a exclusão.
  - Nome do serviço e data original do atendimento.
  - Informação clara sobre o estorno do pacote (se estornou ou se era pendente).
  - Informação sobre a remoção do cartão na agenda.
- **Onde o registro fica visível:**
  - **Jornada do Cliente:** No perfil do cliente (`/admin/clients/[id]`), na aba de jornada e linha do tempo.
  - **Histórico de Ações:** No menu de registros do sistema (`/admin/notes`), permitindo consulta e auditoria sem possibilidade de exclusão do log.

### 5. Atualização em Tempo Real (SWR)
- Ao confirmar a exclusão tanto na tabela de histórico quanto no modal de detalhes do pacote, o SWR invalida as chaves de cache da agenda (`admin/agenda`), clientes (`admin/clients`) e histórico (`admin/history`), sincronizando imediatamente todas as abas abertas sem necessidade de recarregar a página (F5).

### 6. Unificação da Exclusão no Modal de Pacotes (`PackageDetailsModal`)
- O botão de exclusão no modal de detalhes do pacote (`PackageService.fixAppointment`) agora opera com a mesma paridade contábil e de sistema que o Extrato de Presenças (`deleteCheckIn`):
  1. **Estorno de Sessão:** Apenas se o status for `REALIZADO` (se for agendamento futuro `PENDENTE`/`CONFIRMADO`, o saldo permanece intacto).
  2. **Estoque de Insumos:** Devolve produtos ao estoque e remove despesas automáticas de insumos vinculadas.
  3. **Programa de Fidelidade:** Estorna os pontos concedidos pelo atendimento.
  4. **Preservação de Check-in:** Realiza soft delete no `CheckIn` associado (desvinculando `appointment_id: null` para impedir a exclusão em cascata do banco).
  5. **Remoção da Agenda:** Deleta o registro de `Appointment` da tabela `appointments` e quaisquer transações financeiras residuais.
  6. **Auditoria:** Gera nota permanente em `client_notes` com autor e detalhes da ação.

---

## 7. Arquivos Modificados
- [`lib/schedule-validation.ts`](file:///c:/Users/will0/Desktop/totten/lib/schedule-validation.ts): Módulo centralizado de validação de datas, expediente, intervalos e limites de grade.
- [`lib/server/services/packages/package.service.ts`](file:///c:/Users/will0/Desktop/totten/lib/server/services/packages/package.service.ts): `fixAppointment` unificado com todas as garantias contábeis, estorno condicional, reversão de estoque e fidelidade, soft-delete de check-in e auditoria em `clientNote`.
- [`app/actions/team.ts`](file:///c:/Users/will0/Desktop/totten/app/actions/team.ts): `getTeam` agora inclui os horários completos de expediente (`working_hours`), exceções pontuais (`schedule_exceptions`) e herança automática da regra padrão caso o colaborador não tenha regra individual vinculada.
- [`app/actions/packages.ts`](file:///c:/Users/will0/Desktop/totten/app/actions/packages.ts): Validação de expediente e limites da grade na action `createManualPackageCheckIn`; parâmetro `markAsCompleted`, baixa condicional de estoque e pacote; `fixAppointmentAction` com autor e revalidação de rotas.
- [`app/(private)/admin/packages/page.tsx`](file:///c:/Users/will0/Desktop/totten/app/(private)/admin/packages/page.tsx): Leitura de `autoCompleteOnCheckin`, exibição condicional do seletor de tipo de atendimento, validação reativa e badges de disponibilidade por profissional e data, bloqueio dinâmico do botão "Confirmar Baixa", fuso horário local seguro e revalidação de cache SWR da agenda.
- [`app/(private)/admin/packages/_components/package-details-modal.tsx`](file:///c:/Users/will0/Desktop/totten/app/(private)/admin/packages/_components/package-details-modal.tsx): Invalidação SWR de agenda, clientes e histórico no callback de exclusão e texto explicativo claro no diálogo de confirmação.
- [`app/(private)/admin/history/_components/history-table.tsx`](file:///c:/Users/will0/Desktop/totten/app/(private)/admin/history/_components/history-table.tsx): Invalidação de cache SWR (`admin/agenda` e `admin/clients`) no callback de sucesso de exclusão de check-in.

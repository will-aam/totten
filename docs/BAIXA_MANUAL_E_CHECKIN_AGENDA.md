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
- Ao confirmar a exclusão na tabela de histórico, o SWR invalida as chaves de cache da agenda (`admin/agenda`) e clientes (`admin/clients`), sincronizando imediatamente todas as abas abertas sem necessidade de recarregar a página (F5).

---

## 6. Arquivos Modificados
- [`app/actions/packages.ts`](file:///c:/Users/will0/Desktop/totten/app/actions/packages.ts): Parâmetro `markAsCompleted`, verificação de agendamento do mesmo dia, baixa condicional de estoque e pacote; implementação de `deleteCheckIn` com auditoria em `client_notes`, estorno condicional de sessão e remoção do agendamento na agenda (Opção 2).
- [`app/(private)/admin/packages/page.tsx`](file:///c:/Users/will0/Desktop/totten/app/(private)/admin/packages/page.tsx): Leitura de `autoCompleteOnCheckin`, exibição condicional do seletor de tipo de atendimento, validação de campos obrigatórios, fuso horário local e revalidação de cache SWR da agenda.
- [`app/(private)/admin/history/_components/history-table.tsx`](file:///c:/Users/will0/Desktop/totten/app/(private)/admin/history/_components/history-table.tsx): Invalidação de cache SWR (`admin/agenda` e `admin/clients`) no callback de sucesso de exclusão de check-in.

### 🗄️ Banco de Dados & Prisma
* **`prisma/schema.prisma`**: Adicionado o campo `source` (com valor padrão `"MANUAL"`) no modelo `Client` para identificar a origem do cadastro (ex: Manual vs. Autoatendimento).

### ⚙️ Backend (Serviços e APIs)
* **`lib/server/services/clients/client.service.ts`**: Atualizado para suportar e manipular o novo campo `source` no cadastro de clientes.
* **`app/api/clients/route.ts` & `app/api/clients/[id]/route.ts`**: Rotas da API de clientes atualizadas para receber e retornar os novos dados.
* **`lib/server/services/agenda/agenda.service.ts`**: Lógicas internas da agenda ajustadas (provavelmente relacionadas às validações ou integrações com as novas regras).
* **`lib/server/services/settings/settings.service.ts`**: Ajustes no serviço responsável por carregar e salvar as configurações do sistema.
* **Server Actions (`app/actions/`)**:
  * `appointments.ts`, `availability.ts`, e `settings.ts`: Atualizados para refletir as novas validações e propriedades nas ações executadas pelo cliente/servidor.

### 🖥️ Frontend (Admin - Área Privada)
* **Nova Sessão de Autoatendimento (`app/(private)/admin/auto/`)**:
  * Novos arquivos de página e visualização criados para gerenciar as "Solicitações" e fluxos automatizados da clínica.
* **Agenda (`app/(private)/admin/agenda/`)**:
  * `page.tsx`: Corrigidas tipagens da função `handleSaveSettings` para usar `Partial<AgendaSettings>` e integrar perfeitamente com o modal.
  * `_components/schedule-settings-modal.tsx`: Refatorado para o formato Sidebar/Sheet e atualizado os campos exportados (`autoConfirmAppointments`, `allowOverLimitAppointments`, `defaultScheduleView`).
* **Clientes (`app/(private)/admin/clients/page.tsx`)**:
  * Adicionada uma badge/indicador visual (bolinha azul) ao lado do nome do cliente caso a origem (`source`) seja `"SELF_SERVICE"`.
* **Configurações e Regras**:
  * `app/(private)/admin/self-service/_components/rules-form.tsx`: Formulário de regras modificado/implementado.
  * `app/(private)/admin/_components/AdminSidebar/nav-config.ts`: Barra lateral atualizada para incluir os novos menus (ex: Autoatendimento/Solicitações).

### 📱 Frontend (Área Pública do Cliente)
* **`app/(public)/[slug]/agendar/client-agendar-view.tsx`**: Ajustes na interface de agendamento público para refletir configurações de bloqueio, limites ou envio da origem (`source`) como autoatendimento na hora do agendamento.

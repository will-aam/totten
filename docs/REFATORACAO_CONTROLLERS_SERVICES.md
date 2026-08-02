# Documentação de Arquitetura: Refatoração de Regras de Negócio e Controllers

## 1. Contexto e Motivação

**O Problema Original:**
A aplicação possuía rotas de API (`app/api/*`) "gordas". Um único arquivo `route.ts` estava acumulando múltiplas responsabilidades:

- Extração e validação de sessão/tenant.
- Consultas complexas e transações no Prisma.
- Cálculos financeiros e baixa de estoque (Auto Check-in).
- Mutações de dados (métodos `POST`, `PUT`, `DELETE`).
- Formatação de respostas HTTP.

**A Solução Implementada:**
Alinhamos o código à arquitetura oficial do Totten. Executamos a separação rigorosa entre **Controladores** (Rotas e Actions) e **Regras de Negócio** (Serviços):

- **Regras de Negócio:** Movidas exclusivamente para a camada de Serviços (`lib/server/services/*`).
- **Endpoints de Leitura (GET):** Mantidos na `app/api/*` como _Controllers_ finos, servindo exclusivamente para alimentar o Client-side (via SWR ou fetch).

- **Mutações (POST/PUT/DELETE):** Removidas da pasta `app/api/` e convertidas em **Server Actions** nativas na pasta `app/actions/`.

---

## 2. O Padrão "Antes e Depois"

### Como era antes (Antipadrão)

O arquivo `app/api/packages/route.ts` (ou `settings`, `totem`, etc.) recebia a requisição HTTP, instanciava o Prisma, fazia a validação de negócio (ex: verificar se o cliente já tinha pacote ativo), gravava no banco e retornava o JSON. Se a interface precisasse realizar a mesma lógica, teria que disparar um `fetch` para essa URL.

### Como ficou depois (Padrão Atual)

A lógica foi dividida em três camadas distintas:

1. **Service Layer (`lib/server/services/packages/package.service.ts`):** Classes estáticas puras em TypeScript. Recebem o `organizationId` e os dados. Fazem todas as validações de domínio (ex: `ACTIVE_PACKAGE_EXISTS`), cálculos, transações no Prisma e formatação dos dados de saída. Não sabem o que é um `Request` ou `Response` do Next.js.
2. **Server Actions (`app/actions/packages.ts`):** Ponto de entrada para mutações. Chamam o `requireAuth()` para extrair o `organizationId` com segurança, repassam os dados para o Service, mapeiam erros de domínio para mensagens amigáveis ao usuário e chamam o `revalidatePath()` para atualizar o cache do Next.js.
3. **API Routes (`app/api/totem/history/route.ts`):** Ponto de entrada para leituras HTTP. Extraem parâmetros da URL (`searchParams`), chamam o Service correspondente e devolvem o `NextResponse.json()`. Extremamente finos.

---

## 3. Benefícios Arquiteturais (O que ganhamos)

- **Reusabilidade Total:** Agora podemos reaproveitar regras complexas (como o Auto Check-in do Totem) em qualquer lugar do sistema chamando o Service, sem precisar disparar requisições HTTP locais.
- **Segurança e Isolamento de Tenant:** O `organizationId` é injetado pelos _Controllers_ (Actions/API) diretamente nos Services, reduzindo a chance de vazar dados entre clínicas.
- **Otimização de Frontend:** Ao trocar o `apiClient("route", { method: "PUT" })` por Server Actions nativas, o frontend ganha tipagem de ponta a ponta (Type Safety), elimina a necessidade de gerenciar estados complexos de loading de rede e aproveita a revalidação nativa do Next.js.
- **Isolamento Público vs Privado:** Rotas que não exigem autenticação do cliente (como a busca do nome da clínica pelo Totem) saíram da pasta segura de `settings` e ganharam um domínio próprio (`/api/public/*`).

---

## 4. Mapeamento dos Domínios Refatorados

Abaixo está o registro de onde as regras moram agora:

### Domínio: Pacotes (Packages)

- **Service Criado:** `lib/server/services/packages/package.service.ts`
- **Ação:** Criação e regras de negócio de venda de pacotes.
- **Controller Destruído:** `app/api/packages/route.ts` (Deletado).
- **Controller Novo:** Mutação migrada para `app/actions/packages.ts`.

### Domínio: Totem (Check-in Automático e Histórico)

- **Services Criados:**
- `lib/server/services/totem/search.service.ts` (Lógica de CPF, formatação, busca de cliente, Auto Check-in e consumo de estoque/financeiro).
- `lib/server/services/totem/totem.service.ts` (Busca de histórico com tratamento para serviços avulsos).

- **Controllers Refinados:**
- `app/api/totem/history/route.ts` (Apenas leitura GET).
- `app/api/totem/search-client/route.ts` (Apenas leitura GET).
- `app/api/totem/search/route.ts` (Action proxy mantida para integração HTTP do Kiosk).

### Domínio: Configurações Gerais e Mensagens (Settings)

- **Services Criados:**
- `lib/server/services/settings/settings.service.ts` (Upsert de dados da clínica).
- `lib/server/services/settings/messages.service.ts` (Upsert em massa via `prisma.$transaction` dos templates de mensagens).

- **Controllers Refinados:**
- `app/api/settings/route.ts` (Mantido apenas GET).
- `app/api/settings/messages/route.ts` (Mantido apenas GET).

- **Controllers Novos (Mutações):** Migrados para `app/actions/settings.ts` e `app/actions/messages.ts`.

### Domínio: Identidade Pública (Idle Kiosk e Página Personalizada)

- **Service Criado:** `lib/server/services/public/organization.service.ts` (Resolução de organização via Session ou Slug para ambientes sem login).
- **Controller Antigo:** `app/api/settings/public/route.ts` (Deletado para evitar vazamento de domínio).
- **Controller Novo:** `app/api/public/organization/route.ts`.

---

## 5. Impacto no Client Layer (Frontend)

Para acompanhar a nova arquitetura do backend, os componentes React sofreram as seguintes padronizações:

1. **Leituras (`useEffect` e SWR):** Continuam utilizando o `apiClient` ou `fetch` batendo nas rotas `app/api/*` (ex: carregar os templates no formulário).
2. **Mutações (Botão de Salvar):** O uso do `apiClient({ method: "PUT/POST" })` foi completamente removido dos componentes modificados (ex: `general-settings.tsx`, `message-settings.tsx`). Eles agora importam e invocam diretamente as Server Actions, tratando o objeto de retorno `{ success, error, message }` para os `toasts` do Sonner.
3. **Atualização de Endpoints:** O componente `appointment-details-modal.tsx`, `proxy.ts` (middleware) e `totem/success/page.tsx` foram atualizados para consumir a nova URL pública `/api/public/organization`.

---

## 6. Próximos Passos e Débitos Técnicos Acordados

Durante a refatoração, a rota `app/api/settings/hours/route.ts` foi deliberadamente ignorada e deixada para o final.

- **Motivo:** As configurações de horários de funcionamento pertencem arquiteturalmente ao domínio de **Agendamento** e **Autoatendimento** (Link da Bio/Agenda Pública), e não nas configurações gerais administrativas da clínica.
- **Ação Futura:** Quando a funcionalidade de Autoatendimento for refatorada, esta rota deverá ser movida para um Service de Agenda Pública (`lib/server/services/scheduling/`) e seu respectivo endpoint HTTP/Server Action atualizado.

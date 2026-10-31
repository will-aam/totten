# 🏪 Totten - Visão geral

> **Plataforma modular de gestão** para empresas de beleza, bem-estar e serviços

**Totten** reúne ferramentas para organizar a operação e o relacionamento com clientes de empresas de beleza, bem-estar e serviços. O produto está sendo pensado em módulos que podem ser compreendidos e, futuramente, precificados separadamente. A agenda é o núcleo operacional: recebe ferramentas de gestão que dão suporte ao atendimento e se integra a módulos que também podem funcionar como ofertas próprias.

Este documento apresenta primeiro o conceito funcional do produto e, depois, sua organização técnica. A divisão abaixo é uma **estrutura de produto para discussão**, não uma definição de planos ou preços.

> **Fontes:** `package.json`, `app/layout.tsx`, `prisma/schema.prisma`

---

### 🎯 Conceito do produto

A Totten ajuda negócios de serviços a conduzir o atendimento do primeiro agendamento ao retorno do cliente. Seu produto pode ser entendido em três camadas: um núcleo de operação, ferramentas que ampliam esse núcleo e módulos de operação complementares.

### 🧩 Núcleo operacional: Agenda

A **Agenda** organiza horários, profissionais, serviços e atendimentos. É o ponto central da operação e reúne os recursos necessários para preparar, acompanhar e concluir cada atendimento.

| Ferramentas de gestão ligadas à agenda | Papel no fluxo |
| --- | --- |
| Confirmações manuais e acompanhamento de solicitações | Apoiar a comunicação e a organização dos horários |
| Gestão de pacotes e sessões | Relacionar os atendimentos aos pacotes vendidos e às sessões utilizadas |
| Auditoria e histórico de registros | Consultar alterações e eventos ligados à operação |
| Cadastros de clientes, serviços e profissionais | Manter os dados usados no agendamento e atendimento |
| Mapa de aniversários | Ajudar a equipe a manter o relacionamento com clientes |
| Dashboard operacional | Resumir indicadores e atividades da agenda |

Essas ferramentas são complementos do fluxo de agenda e podem ser agrupadas como **Gestão da Agenda**. O dashboard funciona como uma visão transversal da operação, em vez de representar necessariamente um módulo independente.

### 🧱 Módulos complementares

Além do núcleo de agenda, a Totten possui áreas com objetivos próprios, que podem ser avaliadas como módulos independentes na futura composição dos planos:

| Módulo | O que organiza | Exemplos de recursos |
| --- | --- | --- |
| **Financeiro** | Movimentações e visão financeira do negócio | Receitas, despesas, recebimentos, métodos de pagamento e relatórios |
| **Autoatendimento** | Ações que o cliente pode realizar sem depender da recepção | Totem e experiência de autoatendimento |
| **Check-in** | Registro da chegada e encaminhamento do cliente para o atendimento | Busca do cliente, confirmação de presença e acompanhamento dos check-ins |
| **Fidelidade** | Incentivos para recorrência e relacionamento com clientes | Programa de fidelidade e benefícios associados |

O **Autoatendimento** e o **Check-in** se relacionam na experiência do totem, mas representam capacidades diferentes: um é o canal de autoatendimento; o outro é o processo de confirmar a chegada. Essa distinção permite avaliar se serão ofertados juntos ou separadamente.

### 🌱 Capacidades transversais e extensões

Cadastro e histórico de clientes, estoque, anamnese, vouchers, página pública personalizável e notificações apoiam diferentes partes da operação. Nesta etapa, são tratados como capacidades do sistema, sem decisão prévia sobre quais formarão módulos ou itens de cada plano.

### 🧭 Princípio para a futura precificação

Organizar o produto por módulos significa primeiro explicitar **qual problema cada módulo resolve**, **quais recursos pertencem a ele** e **de quais outros módulos depende**. A definição de pacotes, limites e preços fica para uma etapa posterior, com essa estrutura funcional como base.

---

## 🛠️ Conjunto de Tecnologias

A stack é **deliberadamente moderna e opinativa**, priorizando ergonomia do desenvolvedor e segurança de tipos:

| Camada                     | Tecnologia            | Versão           | Propósito                                   |
| -------------------------- | --------------------- | ---------------- | ------------------------------------------- |
| **Framework**              | Next.js               | 16.1.6           | App Router, RSC, Server Actions             |
| **Linguagem**              | TypeScript            | 5.7.3            | Cobertura total de tipos                    |
| **Banco de Dados**         | PostgreSQL            | —                | Persistência relacional                     |
| **ORM**                    | Prisma                | 6.4.1            | Migrações schema-first, consultas type-safe |
| **Autenticação**           | NextAuth.js           | 4.24.14          | Gestão de sessão baseada em credenciais     |
| **Primitivas UI**          | Radix UI              | latest           | Componentes headless acessíveis             |
| **Sistema de Componentes** | shadcn/ui             | estilo new-york  | Blocos de UI pré-construídos e componíveis  |
| **Estilização**            | Tailwind CSS          | 4.3.3            | CSS utility-first                           |
| **Data Fetching**          | SWR                   | 2.4.2            | Cache e revalidação no lado do cliente      |
| **Formulários**            | React Hook Form + Zod | 7.81.0 / 3.25.76 | Validação e tipagem de esquemas             |
| **Gráficos**               | Recharts              | 2.15.0           | Painéis financeiros                         |
| **PWA**                    | @ducanh2912/next-pwa  | 10.2.9           | App instalável com capacidade offline       |
| **Email**                  | Resend                | 6.17.2           | Emails de verificação e notificação         |
| **Animações**              | Framer Motion         | 12.42.2          | Transições de página e micro-interações     |

> ⚠️ **Importante:** O projeto usa **pnpm** como gerenciador de pacotes (evidenciado por `pnpm-lock.yaml` e `pnpm-workspace.yaml`). Sempre use `pnpm add` em vez de `npm install` para manter a integridade do lockfile.

**Fontes:** `package.json`, `components.json`, `next.config.mjs`

---

## 🏗️ Arquitetura em Resumo

A Totten segue a convenção do **Next.js App Router** com uma separação clara entre grupos de rotas, ações do servidor e rotas de API.

### 📊 Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                      NAVEGADOR DO USUÁRIO                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐ │
│  │  Totem   │  │  Admin   │  │ Cliente  │  │  Landing   │ │
│  │  Kiosk   │  │Dashboard │  │  Portal  │  │   Page     │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘ │
└───────┼──────────────┼─────────────┼───────────────┼────────┘
        │              │             │               │
        └──────────────┴─────────────┴───────────────┘
                        │
              ┌─────────▼─────────┐
              │   Next.js Server  │
              │                   │
              │  ┌─────────────┐  │
              │  │   Proxy     │  │ ← Autenticação
              │  └──────┬──────┘  │
              │         │         │
              │  ┌──────▼──────┐  │
              │  │   Rotas     │  │
              │  └──┬──────┬──┘  │
              │     │      │      │
              │  ┌──▼──┐ ┌─▼───┐ │
              │  │ API │ │Server│ │
              │  │Routes│ │Actions│ │
              │  └──┬──┘ └──┬──┘ │
              │     │       │     │
              │  ┌──▼───────▼──┐ │
              │  │    Prisma   │ │
              │  │     ORM     │ │
              │  └──────┬──────┘ │
              └─────────┼────────┘
                        │
              ┌─────────▼─────────┐
              │   PostgreSQL      │
              │   (Neon Tech)     │
              └───────────────────┘
```

### 🔄 Fluxo de Dados

- **Operações de escrita** (criar, atualizar, deletar) → fluem através de **Server Actions** em `app/actions/`
- **Operações de leitura e integrações** → fluem através de **API Routes** em `app/api/`

> 💡 **Vantagem:** Esta separação mantém as mutações co-localizadas com sua UI e aproveita o progressive enhancement do Next.js.

**Fontes:** `app/actions/appointments.ts`, `app/actions/auth.ts`, `app/totem/layout.tsx`, `app/(private)/admin/layout.tsx`

---

## 🗺️ Superfícies da Aplicação e Grupos de Rotas

A Totten expõe **quatro superfícies distintas**, cada uma direcionada a uma persona de usuário diferente. Os grupos de rotas do App Router — `(private)` e `(public)` — impõem limites de autenticação a nível do sistema de arquivos.

| Superfície               | Grupo de Rotas     | Requer Autenticação | Usuário Principal         | Ponto de Entrada                                 |
| ------------------------ | ------------------ | ------------------- | ------------------------- | ------------------------------------------------ |
| 🖥️ **Painel Admin**      | `(private)/admin`  | ✅ Sim              | Proprietário/funcionários | `/admin` → redireciona para `/admin/dashboard`   |
| 🚶 **Totem Kiosk**       | `totem/`           | ❌ Não              | Cliente que chega         | `/` e `/totem` → redirecionam para `/totem/idle` |
| 👤 **Portal do Cliente** | `(public)/cliente` | ❌ Não              | Cliente recorrente        | `/cliente/[slug]`                                |
| 🔐 **Autenticação**      | `(public)`         | ❌ Não              | Novo proprietário         | `/login`, `/register`, `/forgot-password`        |
| 🌐 **Landing Page**      | `landingpage/`     | ❌ Não              | Potencial cliente         | `/landingpage`                                   |

> 📌 A raiz `/` redireciona diretamente para a tela ociosa do totem — isso significa que um tablet montado na recepção abre direto na interface de check-in sem qualquer navegação manual.

**Fontes:** `app/page.tsx`, `app/totem/page.tsx`, `app/(private)/admin/page.tsx`, `app/landingpage/page.tsx`

---

## 📁 Estrutura do Projeto (Anotada)

```
totten/
├── 📁 app/
│   ├── 📁 (private)/                    #  Grupo de rotas protegidas
│   │   └── 📁 admin/                    # Painel admin completo (20+ sub-rotas)
│   │       ├── 📁 agenda/               # Agendamentos e recorrências
│   │       ├── 📁 dashboard/            # Visão geral do negócio
│   │       ├── 📁 finance/              # Controle financeiro
│   │       ├── 📁 packages/             # Gestão de pacotes
│   │       ├── 📁 clients/              # Gestão de clientes
│   │       ├── 📁 services/             # Catálogo de serviços
│   │       ├── 📁 stock/                # Controle de estoque
│   │       ├── 📁 vouchers/             # Geração de vouchers
│   │       ├── 📁 reports/              # Relatórios
│   │       └── 📁 settings/             # Configurações
│   │
│   ├── 📁 (public)/                     # 🌐 Grupo de rotas públicas
│   │   ├── 📁 login/                    # Página de login
│   │   ├── 📁 register/                 # Cadastro da organização + admin
│   │   ├── 📁 forgot-password/          # Recuperação de senha
│   │   ├── 📁 check-email/              # Aviso de verificação pós-cadastro
│   │   └── 📁 cliente/                  # Portal do cliente (baseado em slug)
│   │
│   ├── 📁 actions/                      # ⚡ Server Actions - todas as mutações
│   │   ├── 📄 appointments.ts           # Agendamento + recorrência
│   │   ├── 📄 auth.ts                   # Cadastro + verificação
│   │   ├── 📄 finance-dashboard.ts      # Agregação de KPIs
│   │   ├── 📄 packages.ts               # Ciclo de vida dos pacotes
│   │   ├── 📄 transactions.ts           # Lançamentos financeiros
│   │   ├── 📄 services.ts               # Gestão de serviços
│   │   ├── 📄 clients.ts                # Gestão de clientes
│   │   ├── 📄 stock.ts                  # Controle de estoque
│   │   ├── 📄 vouchers.ts               # Geração de vouchers
│   │   ├── 📄 totem.ts                  # Operações do totem
│   │   └── 📄 settings.ts               # Configurações
│   │
│   ├── 📁 api/                          # 🌐 API Routes - endpoints de leitura
│   │   ├── 📁 auth/                     # Handlers NextAuth
│   │   ├── 📁 totem/                    # Busca e check-in do totem
│   │   ├── 📁 dashboard/                # KPIs do dashboard
│   │   ├── 📁 appointments/             # Consultas de agenda
│   │   ├── 📁 clients/                  # Busca de clientes
│   │   ├── 📁 services/                 # Catálogo de serviços
│   │   ├── 📁 finance/                  # Dados financeiros
│   │   ├── 📁 packages/                 # Dados de pacotes
│   │   ├── 📁 stock/                    # Dados de estoque
│   │   └── 📁 webhooks/                 # Integrações externas
│   │
│   ├── 📁 totem/                        # 🚶 Quiosque de autoatendimento
│   │   ├── 📄 layout.tsx                # Layout fullscreen do totem
│   │   ├── 📁 idle/                     # Tela ociosa (atraente)
│   │   ├── 📁 check-in/                 # Fluxo de check-in
│   │   └── 📁 success/                  # Confirmação pós check-in
│   │
│   ├── 📁 landingpage/                  # 🌐 Site de marketing
│   ├── 📁 verify-email/                 # Handler de token de verificação
│   ├── 📄 layout.tsx                    # Layout raiz (providers, fontes, PWA)
│   └── 📄 globals.css                   # Estilos globais e base Tailwind
│
├── 📁 components/
│   ├── 📁 ui/                           # 60+ componentes shadcn/ui
│   ├── 📄 session-provider.tsx          # Wrapper de sessão NextAuth
│   ├── 📄 swr-provider.tsx              # Configuração SWR
│   ├── 📄 theme-provider.tsx            # Modo escuro/claro (next-themes)
│   ├── 📄 install-prompt.tsx            # Banner de instalação PWA
│   └── 📄 pwa-updater.tsx               # Handler de atualização do service worker
│
├── 📁 prisma/
│   ├── 📄 schema.prisma                 # 17 modelos, 4 enums, multi-tenant
│   └── 📁 migrations/                   # 8 arquivos de migração
│
├── 📁 hooks/                            # Custom React hooks
├── 📁 types/                            # Tipos TypeScript compartilhados
├── 📁 styles/                           # CSS adicional
└── 📁 public/                           # Assets estáticos e service worker
    ├── 📄 sw.js                         # Service worker PWA
    └── 📄 site.webmanifest              # Manifesto do web app
```

**Fontes:** `app/layout.tsx`, `prisma/schema.prisma`, `components.json`

---

## 🗄️ Resumo do Modelo de Dados

O schema Prisma define **17 modelos e 4 enums**, todos ancorados a uma entidade `Organization` que impõe o isolamento de tenants.

### 📐 Diagrama de Relacionamentos (Simplificado)

```
┌──────────────────────┐
│    Organization      │ ← Tenant principal
│  (tenant isolation)  │
└──────────┬───────────┘
           │
    ┌──────┼──────┬──────┬───────┐
    │      │      │      │       │
┌───▼──┐ ┌▼────┐ ┌▼────┐ ┌▼────┐ ┌▼─────┐
│Client│ │User │ │Serv.│ │Stock│ │Vouch.│
└───┬──┘ └─────┘ └──┬──┘ └──┬──┘ └──────┘
    │                │       │
    │    ┌───────────┼───────┘
    │    │           │
┌───▼────▼──┐  ┌─────▼──────┐
│Appointment│  │  Package   │
│           │  │            │
│ • snapshot│  │ • template │
│ • recurr.│  │ • sold     │
└─────┬─────┘  │ • sessions │
      │        └─────┬──────┘
      │              │
┌─────▼──────┐  ┌────▼─────┐
│Transaction │  │ Payment  │
│ • recurrence│  │ Methods  │
└────────────┘  └──────────┘
```

### 🔑 Padrões de Design Importantes

| Padrão                 | Descrição                                                                  | Benefício                                                                                           |
| ---------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 📸 **Campos Snapshot** | `snapshot_service_name`, `snapshot_service_price` em Appointment e Package | Congela detalhes do serviço no momento da criação, evitando distorções quando preços ou nomes mudam |
| 🔄 **Recorrência**     | `recurrence_id` em Appointment e Transaction                               | Permite operações em lote em séries repetidas                                                       |
| 🗑️ **Soft Delete**     | `deleted_at` + `deleted_by_admin_id` em CheckIn                            | Preserva trilhas de auditoria sem exclusão permanente                                               |

> 💡 **Isolamento de Tenant:** Toda tabela crítica de negócio carrega uma chave estrangeira `organization_id` com `onDelete: Cascade`, garantindo separação completa de dados entre tenants.

**Fontes:** `prisma/schema.prisma`

---

## 🔐 Hierarquia de Providers e Contexto de Execução

O layout raiz envolve toda a aplicação em uma **hierarquia precisa de providers** que estabelece estado de sessão, data fetching e gerenciamento de tema antes que qualquer rota seja renderizada:

```
<html>
  └─ <body>
       └─ SessionProvider          ← Sessão NextAuth (identidade + orgId)
            └─ SWRProvider         ← Config global SWR (fetcher, intervalo)
                 └─ ThemeProvider   ← Modo escuro/claro (next-themes)
                      ├─ PWAUpdater       ← Notificações de update do SW
                      ├─ InstallPrompt    ← Lógica do banner de instalação PWA
                      ├─ {children}       ← Conteúdo da página
                      └─ Toaster          ← Notificações toast (Sonner)
```

> ⚠️ **Ordem Importante:** O `SessionProvider` fica mais externo porque todo componente downstream — incluindo o fetcher do SWR — pode precisar ler o `organizationId` do usuário autenticado. Esta ordenação **não é arbitrária**; ela garante que `useSession()` esteja sempre disponível antes de qualquer tentativa de fetch.

**Fontes:** `app/layout.tsx`, `components/session-provider.tsx`, `components/swr-provider.tsx`, `components/theme-provider.tsx`

---

## 📱 Capacidades PWA

A Totten é um **Progressive Web App totalmente instalável**. A configuração em `next.config.mjs` habilita:

- Cache agressivo de navegação front-end
- Registro automático de service worker
- Limpeza de cache desatualizado

> 💡 **Resultado:** Um proprietário de salão pode "instalar" a Totten em um tablet e ela se comporta como um app nativo com páginas com capacidade offline.

| Funcionalidade PWA        | Configuração                                                             |
| ------------------------- | ------------------------------------------------------------------------ |
| **Service Worker**        | Auto-gerado no build via `@ducanh2912/next-pwa`                          |
| **Prompt de Instalação**  | Componente `<InstallPrompt>` customizado com prompt diferido             |
| **Notificação de Update** | `<PWAUpdater>` detecta novas versões do SW e solicita reload             |
| **Estratégia de Cache**   | Cache agressivo front-end + `cache-on-nav` habilitado                    |
| **Manifesto**             | `public/site.webmanifest` com locale Português Brasileiro                |
| **Viewport**              | Bloqueado em `user-scalable=false`, `width=device-width` para modo kiosk |

**Fontes:** `next.config.mjs`, `app/layout.tsx`, `components/install-prompt.tsx`, `components/pwa-updater.tsx`

---

## 🚀 Fluxos Principais

### 📅 Agendamento com Recorrência

```
Cliente → Seleciona serviço → Escolhe horário
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
               Agendamento    Recorrência    Pacote de
                 Único        Semanal/       Sessões
                              Quinzenal/
                              Mensal
```

### 🚶 Check-in via Totem

```
Tela Ociosa → Cliente toca na tela
                    │
                    └─→ Busca por nome/CPF/telefone
                              │
                              └─→ Confirma check-in
                                        │
                                        └─→ Tela de sucesso
                                              │
                                              └─→ Retorna à tela ociosa
```

### 📦 Ciclo de Vida do Pacote

```
Template de Pacote → Venda do Pacote → Uso das Sessões
     │                    │                   │
     │                    │                   │
  5 sessões          Cliente X          -1 sessão por
  de corte           comprou            agendamento
                                          concluído
```

---

## 📚 Referências Técnicas

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Radix UI Documentation](https://www.radix-ui.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [SWR Documentation](https://swr.vercel.app)
- [Recharts Documentation](https://recharts.org)
- [React Hook Form Documentation](https://react-hook-form.com)
- [Zod Documentation](https://zod.dev)
- [Framer Motion Documentation](https://www.framer.com/motion)
- [Resend Documentation](https://resend.com)

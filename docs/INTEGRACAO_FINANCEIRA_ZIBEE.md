# Integração Financeira: Totten & Zibee (Supabase)

> [!WARNING]
> **EXCEÇÃO TEMPORÁRIA E SINGLE-TENANT (NÃO É PADRÃO DO SISTEMA):**
> Esta integração foi desenvolvida contra a vontade do mantenedor do sistema para atender à exigência específica e temporária de **uma única cliente** (`cmmgntg4s0000l504vyelqq2u`).
> **O financeiro nativo do Totten é soberano e oficial.** Novas funcionalidades financeiras devem ser construídas para o Totten e **nunca** desenhadas em torno do Zibee. Nenhuma outra organização do Totten possui ou deve ter essa integração ativada.

## 1. Visão Geral da Funcionalidade

A integração entre o **Totten** e o aplicativo de finanças **Zibee** (Supabase) permite a sincronização financeira 100% em tempo real, automática e silenciosa, sem nenhuma intervenção manual (sem upload de planilhas, sem cliques e sem CSV).

### Escopo e Regra de Single-Tenant Gating
Esta integração foi desenvolvida com o padrão **Tenant Gating** estrito:
- **Organização Autorizada:** `cmmgntg4s0000l504vyelqq2u` (Clínica da Crislaine Fernandes).
- **Usuário Destino no Zibee:** `0IktFfSPwvRIAXYhGe2RXLkRW9qTpyIN` (ID da Crislaine no BetterAuth do Zibee).
- **Isolamento de Segurança:** Nenhuma outra organização do Totten possui acesso à rotina, nem visualiza qualquer elemento relacionado ao Zibee na interface.

---

## 2. Arquitetura Técnica

### 2.1. Conexão e Biblioteca
- Utiliza a biblioteca oficial `@supabase/supabase-js`.
- Conecta-se via **Service Role Key** para garantir permissões diretas de escrita no backend e contornar restrições de RLS do Supabase.

### 2.2. Tabela de Destino (`lancamentos`)
Os lançamentos são gravados na tabela `public.lancamentos` do Supabase com a seguinte correspondência de colunas:

| Coluna no Zibee | Tipo | Origem no Totten | Regra de Mapeamento |
| :--- | :--- | :--- | :--- |
| `totten_transaction_id` | `text UNIQUE` | `transaction.id` | Chave de unicidade para `upsert` idempotente (`onConflict`). |
| `user_id` | `text` | `ZIBEE_CLIENT_USER_ID` | Identificador do usuário no Zibee. |
| `descricao` | `text` | `transaction.description` | Detalhes do atendimento, pacote ou movimentação. |
| `valor` | `numeric` | `transaction.amount` | Valor monetário em formato numérico. |
| `tipo` | `text` | `transaction.type` | `"Receita"` ou `"Despesa"` (primeira letra maiúscula). |
| `forma_pagamento` | `text` | `payment_method` | Normalizado (ex: `"Pix"`, `"Cartão"`, `"Dinheiro"`). |
| `data_vencimento` | `date` | `transaction.date` | Formato `"YYYY-MM-DD"`. |
| `pago` | `boolean` | `transaction.status` | `true` se `"PAGO"`, `false` se `"PENDENTE"`. |
| `categoria` | `text` | - | `"Atendimentos"` (ou `"Insumos & Despesas"`). |
| `observacoes` | `text` | - | Informações contextuais (ex: `[Totten] Cliente: Maria`). |
| `grupo_id` | `uuid` | `null` | Nulo (modo individual). |

---

## 3. Gatilhos em Tempo Real Conectados

A sincronização ocorre em segundo plano (não-bloqueante e pós-commit do Prisma), garantindo que instabilidades temporárias de rede nunca afetem o fluxo operacional da clínica.

1. **Check-in Automático do Totem:**
   - [lib/server/services/totem/checkin.service.ts](file:///c:/Users/will0/Desktop/totten/lib/server/services/totem/checkin.service.ts)
   - [lib/server/services/totem/search.service.ts](file:///c:/Users/will0/Desktop/totten/lib/server/services/totem/search.service.ts)
   - Dispara a sincronização de receitas e despesas de insumos decorrentes do auto check-in.

2. **Venda de Pacotes (À Vista ou Parcelado):**
   - [lib/server/services/packages/package.service.ts](file:///c:/Users/will0/Desktop/totten/lib/server/services/packages/package.service.ts)
   - Lança a receita no Zibee como liquidada (à vista) ou como parcelas pendentes com suas respectivas datas de vencimento.

3. **Consumo de Sessão de Pacote:**
   - [app/actions/packages.ts](file:///c:/Users/will0/Desktop/totten/app/actions/packages.ts)
   - Lança o custo de insumos/materiais utilizados durante a sessão realizada.

4. **Atendimentos Concluídos na Agenda:**
   - [app/actions/appointments.ts](file:///c:/Users/will0/Desktop/totten/app/actions/appointments.ts)
   - Sincroniza a receita do serviço avulso e despesas de estoque quando o agendamento é marcado como `REALIZADO`.

5. **Lançamentos Avulsos e Baixas Financeiras:**
   - [app/actions/transactions.ts](file:///c:/Users/will0/Desktop/totten/app/actions/transactions.ts)
   - Criação de novas receitas/despesas manuais.
   - Edição de valores ou datas.
   - Baixa de contas a receber (atualiza `pago: true` e a forma de pagamento).

6. **Exclusões e Estornos:**
   - Se um agendamento ou transação for excluído no Totten, o registro correspondente é removido no Zibee através da função `deleteTransactionFromZibee`.

---

## 4. Carga Histórica e Idempotência

- **Carga Inicial:** As 187 movimentações financeiras já existentes no banco do Totten da clínica foram migradas para o Zibee.
- **Idempotência com Upsert:** Como o Zibee utiliza a chave `totten_transaction_id` com restrição `UNIQUE`, novas sincronizações apenas atualizam registros existentes sem duplicar valores nem poluir o extrato.

---

## 5. Interface do Usuário

No painel administrativo, em **Financeiro > Configurações** (`app/(private)/admin/finance/settings/page.tsx`), foi adicionado um card exclusivo visível apenas para a organização autorizada:
- **Card:** *Integração Zibee (Finanças Pessoais)*
- **Badge:** *Sincronização Ativa* (com indicador animado).
- **Contador:** Quantidade de lançamentos sincronizados no Zibee em relação ao total do Totten (`187 / 187`).
- **Ação:** Botão *Ressincronizar Histórico* para acionar uma reconciliação completa sob demanda.

---

## 6. Variáveis de Ambiente Necessárias

Para que a integração funcione em ambiente de homologação e produção, as seguintes variáveis devem estar configuradas no `.env` e nas **Environment Variables da Vercel**:

```env
# URL do Supabase do Zibee
ZIBEE_SUPABASE_URL="https://zkrosvlxrbbmzeglgnmq.supabase.co"

# Service Role Key do Supabase do Zibee (acesso backend com bypass de RLS)
ZIBEE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprcm9zdmx4cmJibXplZ2xnbm1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDM0OTcyNiwiZXhwIjoyMDc5OTI1NzI2fQ.78PazXnDgb1X9gnKVmryDZjZUVSeJj8PHe3fG5SRuYs"

# ID do usuário da cliente no Zibee
ZIBEE_CLIENT_USER_ID="0IktFfSPwvRIAXYhGe2RXLkRW9qTpyIN"

# ID da organização da clínica dela no Totten (Tenant Gating)
ZIBEE_ENABLED_ORG_ID="cmmgntg4s0000l504vyelqq2u"
```

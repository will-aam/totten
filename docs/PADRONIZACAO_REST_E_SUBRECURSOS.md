# Padronização de Nomenclatura REST e Consolidação de Sub-Recursos

## 1. Visão Geral
Este documento registra as refatorações executadas para eliminar rotas duplicadas/zumbis, corrigir inconsistências de nomenclatura plural/singular, migrar ações RPC com verbos para Server Actions e normalizar a hierarquia REST de sub-recursos na aplicação.

---

## 2. Mudanças Executadas

### 2.1. Eliminação de Rotas Zumbis e Duplicadas
Foram removidas rotas legadas e duplicadas que causavam concorrência de domínio ou estavam sem uso ativo:
* **`app/api/admin/clients/route.ts`** (Deletado): Rota não paginada redundante. O endpoint canônico e oficial é `app/api/clients/route.ts`.
* **`app/api/admin/services/route.ts`** (Deletado): Rota não consumida concorrente de `app/api/services/route.ts`.
* **`app/api/check-in/route.ts`** (Deletado): Rota legada não padronizada e sem consumidores no front.

### 2.2. Correção de Rota Pública no Proxy
No arquivo [proxy.ts](file:///c:/Users/will0/Desktop/totten/proxy.ts):
* Substituída a entrada em português e singular `"/api/cliente"` pela rota canônica em inglês e plural:
  ```ts
  "/api/clients", // <--- Rota oficial da API de clientes
  ```
* Mantida a rota de UI `"/cliente"` para o portal público do cliente.

### 2.3. Migração da Rota RPC para Server Action
A rota `POST /api/admin/packages/fix-appointment` violava as diretrizes REST (verbo na URL e mutação HTTP legada):
* **Server Action criada:** Adicionada `fixAppointmentAction(appointmentId: string)` em [app/actions/packages.ts](file:///c:/Users/will0/Desktop/totten/app/actions/packages.ts).
* **Consumidor atualizado:** [app/(private)/admin/packages/_components/package-details-modal.tsx](file:///c:/Users/will0/Desktop/totten/app/(private)/admin/packages/_components/package-details-modal.tsx) passou a invocar diretamente a Server Action nativa.
* **Rota deletada:** Removido o arquivo e pasta `app/api/admin/packages/fix-appointment/route.ts`.

### 2.4. Normalização de Sub-Recursos e Filtros Canônicos
Alinhamento de sub-recursos sob a raiz canônica `/api/clients/[id]`:
* **Pacotes por Cliente:**
  * Nova rota: [app/api/clients/[id]/packages/route.ts](file:///c:/Users/will0/Desktop/totten/app/api/clients/[id]/packages/route.ts).
  * Removida: `app/api/admin/clients/[clientId]/packages`.
  * Componentes atualizados: `client-vouchers.tsx` e `client-package.tsx`.
* **Histórico / Linha do Tempo por Cliente:**
  * Nova rota: [app/api/clients/[id]/history/route.ts](file:///c:/Users/will0/Desktop/totten/app/api/clients/[id]/history/route.ts).
  * Removida: `app/api/admin/clients/[clientId]/history`.
  * Componentes atualizados: `client-history.tsx`.
* **Filtros de Clientes com Anotações:**
  * Unificação de `/notes/clients` e `/manual-notes/clients` na rota canônica:
    * `GET /api/clients?has_notes=true`
    * `GET /api/clients?has_manual_notes=true`
  * O método `ClientService.getPaginatedClients` em [lib/server/services/clients/client.service.ts](file:///c:/Users/will0/Desktop/totten/lib/server/services/clients/client.service.ts) foi atualizado para suportar os filtros `hasNotes` e `hasManualNotes`.
  * Telas atualizadas: [app/(private)/admin/notes/page.tsx](file:///c:/Users/will0/Desktop/totten/app/(private)/admin/notes/page.tsx) e [app/(private)/admin/manual-notes/page.tsx](file:///c:/Users/will0/Desktop/totten/app/(private)/admin/manual-notes/page.tsx).
  * Rotas deletadas: `app/api/admin/notes/clients` e `app/api/admin/manual-notes/clients`.

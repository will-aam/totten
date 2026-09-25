# Padrões e Layout das Páginas (Pages)

Este documento descreve as convenções de layout aplicadas nas páginas do sistema Totten, especialmente nas rotas dentro de `app/(private)/admin/`.

## 1. Padrão de Largura Fluida (`max-w-400`)

Historicamente, algumas páginas utilizavam larguras fixas baseadas nos tamanhos convencionais do Tailwind (`max-w-4xl`, `max-w-5xl`, `max-w-7xl`). Isso fazia com que telas muito largas (ex: 1600px+) ficassem com áreas laterais vazias exageradas.

Para resolver isso e garantir um design mais responsivo e fluido:
- **`max-w-400`** tornou-se a classe padrão de controle de largura em páginas (Containers).
- Quando esticada, a página continua fluida, preenchendo o espaço lateral de maneira elegante sem criar as margens mortas exageradas que ocorriam com `max-w-5xl` ou similares.

## 2. Estrutura Padrão Recomendada de um `page.tsx`

Toda página principal deve ter uma div envolvente (wrapper) contendo classes específicas para garantir o mesmo comportamento, espaçamento e animações:

```tsx
import { AdminHeader } from "@/components/admin-header";

export default function MinhaPaginaTemplate() {
  return (
    <>
      {/* 1. Header padrão da aplicação administrativa */}
      <AdminHeader title="Minha Nova Página" />

      {/* 2. Container fluido padrão */}
      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 md:pb-6 relative animate-in fade-in duration-500 min-h-[calc(100vh-100px)]">
        
        {/* 3. Conteúdo da página aqui */}
        
      </div>
    </>
  );
}
```

### 2.1 Componentes do Padrão
* **`flex flex-col gap-6`**: Mantém as seções (blocos, cards, painéis) separadas de forma harmônica.
* **`p-4 md:p-6`**: Espaçamento dinâmico (menor em mobile, padrão em desktop).
* **`max-w-400`**: A classe principal que resolve telas gigantes (1600px+).
* **`mx-auto w-full`**: Centraliza o layout caso chegue no limite do `max-w-400`.
* **`pb-24 md:pb-6`**: Evita que conteúdo seja tapado pela navegação mobile (que costuma ficar fixa no fundo do app). Em Desktop o padding é reduzido.
* **`animate-in fade-in duration-500`**: Todas as páginas devem usar esse fade suave ao serem acessadas, criando uma navegação premium sem carregamentos abruptos (Glassmorphism UX/UI).
* **`min-h-[calc(100vh-100px)]`**: Garante que o container ocupa pelo menos o espaço visível, impedindo o footer/background de "subir".

## 3. Páginas Atualizadas

Durante a padronização, as seguintes páginas deixaram de usar limites engessados (como `5xl` ou `7xl`) e foram migradas para o padrão fluido:
- `/admin/waiting-room/page.tsx`
- `/admin/finance/receivables/page.tsx`
- `/admin/finance/transactions/page.tsx`
- `/admin/finance/reports/page.tsx`
- `/admin/finance/payment-methods/page.tsx`
- `/admin/finance/dashboard/page.tsx`
- `/admin/anamnesis/[id]/edit/page.tsx`

Demais áreas (como Services, Packages, Settings) já estavam fazendo uso do novo formato.

## 4. Instruções para IAs/IDEs (Agents)

A IA do projeto já foi configurada para reconhecer essa alteração. Qualquer novo agente (Cursor, Copilot, Antigravity) que gere código nesse repositório e for instruído a ler a pasta `.agents/rules` irá incorporar esta padronização. As regras foram incluídas em `.agents/rules/pages-standard.md`.

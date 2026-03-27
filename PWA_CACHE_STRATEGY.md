# Estratégia de Gerenciamento de Cache e Atualização em PWAs

## 📌 Introdução e Contexto

Aplicações Web Progressivas (PWAs) oferecem uma experiência incrível ao usuário, permitindo instalação offline e carregamento instantâneo. No entanto, o ciclo de vida do **Service Worker (SW)** frequentemente introduz o problema do "Software Zumbi": o navegador baixa a nova versão da aplicação em segundo plano, mas mantém a versão antiga na tela (em estado de _waiting_) para não interromper a navegação atual do usuário.

**O Problema:** Isso faz com que clientes fiquem presos em versões desatualizadas. Quando há mudanças na API ou nos assets (arquivos JS/CSS), a aplicação antiga tenta buscar arquivos que já foram deletados do servidor, resultando em telas brancas, erros de layout e a temida necessidade de pedir ao usuário para "limpar o cache do navegador".

**Nossa Solução:** Neste e em futuros projetos, **não aceitamos o problema de cache travado**. Implementamos uma estratégia proativa ("Update & Force Reload") que garante que a aplicação se auto-atualize silenciosamente, limpando seu próprio lixo, sem exigir nenhuma ação manual do usuário.

---

## 🏗️ A Arquitetura da Solução

Nossa estratégia baseia-se em 3 pilares fundamentais:

1. **Service Worker Agressivo:** Forçar a nova versão a assumir o controle imediatamente (`skipWaiting`) e limpar caches antigos automaticamente.
2. **Cache Busting de Assets:** Versionar arquivos estáticos "teimosos" (como ícones e manifestos) através de _Query Strings_.
3. **Frontend Listener:** Um componente invisível na interface que detecta quando o novo Service Worker assumiu o controle e força um recarregamento (`reload`) da página, avisando o usuário.

---

## 🛠️ Guia de Implementação (Padrão Next.js + next-pwa)

### Passo 1: Configuração do Service Worker (`next.config.mjs`)

Devemos instruir o gerador do PWA a não aguardar o fechamento de todas as abas para aplicar a atualização.

```javascript
// Exemplo usando @ducanh2912/next-pwa
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",

  // ESSENCIAL PARA EVITAR CACHE PRESO
  register: true,
  skipWaiting: true, // Pula o estado de "waiting" e assume o controle na hora
  cleanupOutdatedCaches: true, // Deleta pastas de cache de versões anteriores
});

export default withPWA(nextConfig);
```

### Passo 2: Cache Busting para Ícones e Manifesto

Sistemas operacionais (especialmente iOS/Safari) cacheiam ícones de forma extremamente agressiva. Para forçar a atualização visual do ícone na tela inicial, adicionamos uma variável de versão (`?v=X`) sempre que a imagem for alterada.

**No arquivo de layout (`app/layout.tsx`):**

```tsx
export const metadata: Metadata = {
  // ... outras configurações
  manifest: "/site.webmanifest?v=2", // Atualize o número quando mudar o ícone
  icons: {
    icon: "/favicon.ico?v=2",
    apple: "/apple-touch-icon.png?v=2",
  },
};
```

**No arquivo de manifesto (`public/site.webmanifest`):**

```json
{
  "icons": [
    {
      "src": "/android-chrome-192x192.png?v=2",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

### Passo 3: O Componente Monitor (Frontend Updater)

Como o Service Worker agora se atualiza agressivamente em segundo plano, precisamos que a tela do usuário reflita isso. Criamos um componente global que escuta a mudança de controle e recarrega a página de forma elegante.

**`components/pwa-updater.tsx`:**

```tsx
"use client";

import { useEffect } from "react";
// Importe sua biblioteca de Toast favorita (ex: Sonner, React Hot Toast)
import { toast } from "sonner";

export function PWAUpdater() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Dispara quando o SW executa o "skipWaiting" e assume a página
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        // 1. Avisa o usuário para evitar o susto do reload
        toast.info("Atualização disponível", {
          description: "A aplicar a nova versão do sistema...",
          duration: 3000,
        });

        // 2. Dá tempo para ler o aviso e força o recarregamento
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      });
    }
  }, []);

  return null; // Componente invisível
}
```

_Nota: Este componente deve ser injetado no topo da árvore da aplicação (dentro do `RootLayout`), para que esteja ativo em qualquer página._

---

## 🎯 Comportamento Esperado (Experiência do Usuário)

Com essa arquitetura implantada, este é o fluxo que o usuário final vivenciará após um novo _deploy_ em produção:

1. O usuário abre o PWA. O carregamento é **instantâneo** utilizando o cache atual.
2. Em segundo plano, o navegador detecta uma mudança no servidor (hash do `sw.js` mudou) e baixa os novos arquivos.
3. O Service Worker se instala e executa `skipWaiting`, matando o cache antigo (`cleanupOutdatedCaches`).
4. O evento `controllerchange` é disparado no navegador.
5. O usuário vê um Toast: _"Atualização disponível..."_
6. A tela recarrega automaticamente após 1.5 segundos.
7. O usuário agora está na versão mais recente, com zero arquivos corrompidos e sem nunca precisar saber onde fica a opção "Limpar Histórico" do dispositivo.

---

> **Dica Sênior:** Utilize essa estratégia sempre que construir sistemas críticos (PDVs, Totens, ERPs) onde a intervenção manual do usuário para manutenção é inviável ou indesejada.

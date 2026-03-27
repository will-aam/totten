// componentes/pwa-updater.tsx
"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function PWAUpdater() {
  useEffect(() => {
    // Verifica se estamos no browser e se o navegador suporta Service Workers
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Este evento é disparado automaticamente quando o novo Service Worker
      // assume o controlo (devido ao skipWaiting que configurámos)
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        // Avisa o cliente para ele saber porque é que o ecrã vai piscar
        toast.info("Atualização disponível", {
          description: "A aplicar a nova versão do Totten...",
          duration: 3000,
        });

        // Dá um pequeno delay de 1.5 segundos para o cliente ler o Toast e força o reload
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      });
    }
  }, []);

  return null; // Este componente não renderiza nada visualmente, apenas roda a lógica
}

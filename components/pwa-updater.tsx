"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function PWAUpdater() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // 1. Escuta quando o NOVO Service Worker assume o controle
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        toast.info("Atualização disponível", {
          description: "A aplicar a nova versão do Totten...",
          duration: 3000,
        });

        setTimeout(() => {
          window.location.reload();
        }, 1500);
      });

      // 2. FORÇA A CHECAGEM POR ATUALIZAÇÕES NO SERVIDOR
      // Isso é crucial para telas que ficam muito tempo abertas (como Totens)
      navigator.serviceWorker.ready.then((registration) => {
        // Opcional: Checa uma vez logo que a página carrega
        registration.update();

        // Checa silenciosamente a cada 15 minutos se você subiu um novo código
        setInterval(
          () => {
            registration.update().catch((err) => {
              console.error("Erro ao checar atualizações do PWA:", err);
            });
          },
          15 * 60 * 1000,
        ); // 15 minutos em milissegundos
      });
    }
  }, []);

  return null;
}

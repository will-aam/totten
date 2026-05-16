"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "@boxicons/react"; // Usando o Boxicons do seu projeto

export function PWAUpdater() {
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // 1. Escuta quando o novo SW assumir (skipWaiting)
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        setIsUpdating(true);

        // Dá 2.5 segundos para o usuário ler o aviso animado, então força o recarregamento
        setTimeout(() => {
          window.location.reload();
        }, 2500);
      });

      // 2. Estratégia de Atualização "Quase Instantânea"
      navigator.serviceWorker.ready.then((registration) => {
        // Gatilho 1: Sempre que a tela acender ou a aba voltar a ficar visível
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") {
            registration.update().catch(() => {});
          }
        });

        // Gatilho 2: Checa a cada 1 minuto (essencial para totens inativos)
        setInterval(() => {
          registration.update().catch(() => {});
        }, 60 * 1000);
      });
    }
  }, []);

  return (
    <AnimatePresence>
      {isUpdating && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          // Customizado para o tema do Totten e posicionado bem no topo visual (z-[9999])
          className="fixed bottom-12 md:bottom-24 left-1/2 -translate-x-1/2 z-9999 bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.2)] flex items-center gap-3 whitespace-nowrap"
        >
          <RefreshCw size="sm" className="animate-spin" />
          <span className="text-sm font-medium tracking-wide">
            Atualizando o sistema...
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

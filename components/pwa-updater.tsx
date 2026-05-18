"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "@boxicons/react";

export function PWAUpdater() {
  const [isUpdating, setIsUpdating] = useState(false);
  const isReloading = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator))
      return;

    // Função centralizada para evitar múltiplos reloads
    const triggerUpdate = () => {
      if (isReloading.current) return;
      isReloading.current = true;
      setIsUpdating(true);

      setTimeout(() => {
        window.location.reload();
      }, 2500);
    };

    // 1. Escuta Clássica: Quando o novo SW assumir (se o React já estiver montado)
    navigator.serviceWorker.addEventListener("controllerchange", triggerUpdate);

    // 2. Estratégia de Fallback: Monitora o ciclo de vida direto no registro
    navigator.serviceWorker.ready.then((registration) => {
      // Escuta ativamente quando um novo ciclo de instalação começa em segundo plano
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            // Se o novo worker foi ativado E já havia um controlador antigo (tela desatualizada)
            if (
              newWorker.state === "activated" &&
              navigator.serviceWorker.controller
            ) {
              triggerUpdate();
            }
          });
        }
      });

      // Gatilhos de Checagem "Quase Instantânea"
      const checkForUpdate = () => {
        registration.update().catch(() => {});
      };

      // Sempre que a tela acender ou o app voltar de segundo plano no celular
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") checkForUpdate();
      });

      // Checa a cada 1 minuto
      setInterval(checkForUpdate, 60 * 1000);
    });
  }, []);

  return (
    <AnimatePresence>
      {isUpdating && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          // Retornado para a sintaxe limpa recomendada pelo seu VS Code
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

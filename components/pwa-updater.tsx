"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "@boxicons/react"; // Mantido o seu ícone original

export function PWAUpdater() {
  const [isUpdating, setIsUpdating] = useState(false);
  const isReloading = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator))
      return;

    const triggerUpdate = () => {
      if (isReloading.current) return;
      isReloading.current = true;
      setIsUpdating(true);

      setTimeout(() => {
        window.location.reload();
      }, 2500);
    };

    navigator.serviceWorker.addEventListener("controllerchange", triggerUpdate);

    navigator.serviceWorker.ready.then((registration) => {
      // 🔥 CÓDIGO NUCLEAR: Se o navegador travou um worker na fila, manda ele assassinar o antigo
      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // Quando o download do novo SW terminar, envia o comando direto pra ele assumir
              newWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        }
      });

      const checkForUpdate = () => {
        registration.update().catch(() => {});
      };

      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") checkForUpdate();
      });

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

"use client";

import { useEffect, useState, useRef } from "react";
import { RefreshCw } from "@boxicons/react";

export function PWAUpdater() {
  const [isUpdating, setIsUpdating] = useState(false);
  const isReloading = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator))
      return;

    // Função centralizada que mostra o aviso e recarrega a página sozinha
    const triggerUpdate = () => {
      if (isReloading.current) return;
      isReloading.current = true;
      setIsUpdating(true);

      // Dá 2.5 segundos para o usuário ler a notificação, e força o refresh (F5)
      setTimeout(() => {
        window.location.reload();
      }, 2500);
    };

    // 1. Ouve o evento principal (quando a nova versão "chuta a porta" e assume o controle)
    navigator.serviceWorker.addEventListener("controllerchange", triggerUpdate);

    // 2. Estratégia de Checagem Background
    navigator.serviceWorker.ready.then((registration) => {
      // Captura ativamente a mudança se a aba ficar inativa muito tempo
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "activated" &&
              navigator.serviceWorker.controller
            ) {
              triggerUpdate();
            }
          });
        }
      });

      // Bate no servidor para procurar versão nova silenciosamente
      const checkForUpdate = () => registration.update().catch(() => {});

      // Checa sempre que o usuário voltar para a aba ou acender a tela do celular
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") checkForUpdate();
      });

      // Checa a cada 1 minuto
      setInterval(checkForUpdate, 60 * 1000);
    });
  }, []);

  // Se não estiver atualizando, o componente fica invisível e não pesa na tela
  if (!isUpdating) return null;

  return (
    <div className="fixed bottom-12 md:bottom-24 left-1/2 -translate-x-1/2 z-9999 bg-zinc-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 whitespace-nowrap animate-in slide-in-from-bottom-10 fade-in duration-300">
      <RefreshCw className="animate-spin" />
      <span className="text-sm font-medium tracking-wide">
        Atualizando o sistema...
      </span>
    </div>
  );
}

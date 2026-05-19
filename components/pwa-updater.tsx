"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function PWAUpdater() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null,
  );

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator))
      return;

    // 1. Quando o novo worker finalmente assumir o controle (após o clique), recarrega a tela
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });

    navigator.serviceWorker.ready.then((registration) => {
      // Cenário A: O usuário abriu o app e já existe uma atualização engatilhada esperando
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setShowUpdatePrompt(true);
      }

      // Cenário B: O usuário está usando o app e uma nova versão acabou de ser baixada
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            // Se o download terminou e ele está "esperando" para assumir
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setWaitingWorker(newWorker);
              setShowUpdatePrompt(true);
            }
          });
        }
      });

      // Checagem periódica silenciosa no servidor
      const checkForUpdate = () => {
        registration.update().catch(() => {});
      };

      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") checkForUpdate();
      });

      setInterval(checkForUpdate, 60 * 1000);
    });
  }, []);

  // Função disparada ao clicar no botão
  const handleUpdate = () => {
    if (waitingWorker) {
      // Manda a ordem de execução para o novo código assumir o controle do navegador
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    } else {
      // Fallback de segurança caso o worker tenha se perdido
      window.location.reload();
    }
  };

  return (
    <AnimatePresence>
      {showUpdatePrompt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          // Fundo ofuscado que bloqueia interações com z-index altíssimo
          className="fixed inset-0 z-9999 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card text-card-foreground shadow-2xl rounded-2xl p-8 max-w-sm w-full mx-4 text-center border border-border flex flex-col items-center gap-6"
          >
            {/* Ícone de Atualização */}
            <div className="bg-primary/10 p-4 rounded-full text-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 21v-5h5" />
              </svg>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-2">Atualização Necessária</h2>
              <p className="text-muted-foreground text-sm">
                Uma nova versão do sistema Totten acabou de chegar. Para
                continuar utilizando e garantir a melhor estabilidade, atualize
                agora.
              </p>
            </div>

            <button
              onClick={handleUpdate}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Atualizar Sistema
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

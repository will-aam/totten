"use client";

import { useState, useEffect } from "react";
import { X, ArrowToBottom, Share, PlusSquare } from "@boxicons/react";

export function InstallPrompt() {
  const [isStandalone, setIsStandalone] = useState(true); // Começa true para não piscar na tela
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // 1. Verifica se já está instalado (rodando como PWA)
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator &&
        (window.navigator as any).standalone);
    setIsStandalone(standalone);

    // 2. Verifica se o usuário já fechou o banner antes
    const hasDismissed =
      localStorage.getItem("totten_install_dismissed") === "true";

    // 3. Detecta se é iPhone/iPad
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Lógica de exibição inicial
    if (!standalone && !hasDismissed) {
      if (isIOSDevice) {
        // iOS não tem evento de prompt, então mostramos o banner direto
        setShowPrompt(true);
      }
    }

    // Lógica para Android/Desktop (captura o evento nativo de instalação)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // Impede o mini-info bar padrão do Chrome
      setDeferredPrompt(e);
      if (!standalone && !hasDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Se o usuário instalar com sucesso, esconde o banner
    window.addEventListener("appinstalled", () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("totten_install_dismissed", "true");
  };

  const handleInstallClick = async () => {
    // Se for iOS, apenas mostra as instruções
    if (isIOS) {
      setShowIOSInstructions(!showIOSInstructions);
      return;
    }

    // Se for Android/Desktop, aciona o prompt nativo
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-zinc-900 text-white p-4 shadow-xl border-b border-zinc-800 animate-in slide-in-from-top-full duration-500">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <div className="bg-zinc-800 p-2 rounded-xl text-white">
            <ArrowToBottom />{" "}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm leading-tight">
              Instalar Totten
            </span>
            <span className="text-xs text-zinc-400">
              Acesso rápido em tela cheia
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="bg-white text-zinc-900 text-sm font-bold px-4 py-2 rounded-full active:scale-95 transition-transform"
          >
            {isIOS && showIOSInstructions ? "Fechar" : "Instalar"}
          </button>
          <button
            onClick={handleDismiss}
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
            aria-label="Fechar aviso"
          >
            {/* 🟢 Correção 1: De 20 para "20" */}
            <X />
          </button>
        </div>
      </div>

      {/* Caixa de instruções exclusivas para iOS */}
      {showIOSInstructions && isIOS && (
        <div className="mt-4 pt-4 border-t border-zinc-800 text-sm text-zinc-300 max-w-md mx-auto animate-in fade-in zoom-in-95 duration-200">
          <p className="mb-2 font-medium text-white">
            Como instalar no iPhone:
          </p>
          <ol className="space-y-3">
            <li className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 text-xs font-bold">
                1
              </span>
              Toque no ícone {/* 🟢 Correção 2: De 18 para "18" */}
              <Share className="text-blue-400 mx-1" /> na barra inferior
            </li>
            <li className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 text-xs font-bold">
                2
              </span>
              Role para baixo e escolha{" "}
              <span className="font-semibold text-white inline-flex items-center gap-1">
                Adicionar à Tela de Início{" "}
                {/* 🟢 Correção 3: De 16 para "16" */}
                <PlusSquare />
              </span>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}

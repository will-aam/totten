"use client";

import { useEffect, useState, useRef } from "react";
import { RefreshCw } from "@boxicons/react";

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

      const checkForUpdate = () => registration.update().catch(() => {});

      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") checkForUpdate();
      });

      setInterval(checkForUpdate, 60 * 1000);
    });
  }, []);

  if (!isUpdating) return null;

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-9999 bg-zinc-900 text-white px-8 py-4 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-4 whitespace-nowrap animate-in zoom-in-95 fade-in duration-300">
      <RefreshCw className="animate-spin w-5 h-5" />
      <span className="text-base font-semibold tracking-wide">
        Atualizando o sistema...
      </span>
    </div>
  );
}

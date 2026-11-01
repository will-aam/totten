"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Save, LoaderDots } from "@boxicons/react";

interface FloatingSaveButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  ariaLabel?: string;
}

/**
 * Botão flutuante mobile circular padrão Totten.
 * Renderizado diretamente no document.body via Portal para evitar qualquer
 * confinamento de overflow, transform ou height de containers pai.
 */
export function FloatingSaveButton({
  onClick,
  disabled = false,
  loading = false,
  ariaLabel = "Salvar alterações",
}: FloatingSaveButtonProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="md:hidden fixed bottom-28 right-6 h-14 w-14 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl transition-transform duration-300 z-50 hover:scale-105 active:scale-95"
      aria-label={ariaLabel}
    >
      {loading ? (
        <LoaderDots className="h-6 w-6 animate-spin" />
      ) : (
        <Save className="h-6 w-6" strokeWidth={2.5} />
      )}
    </button>,
    document.body,
  );
}


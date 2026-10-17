import React from "react";
import { DEFAULT_TERMS_OF_USE } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface TermsOfUseBoxProps {
  text?: string | null;
  requirePrepayment?: boolean;
  className?: string;
}

export function TermsOfUseBox({ text, requirePrepayment, className }: TermsOfUseBoxProps) {
  const content = text || DEFAULT_TERMS_OF_USE;

  return (
    <div className={cn("text-xs p-4 rounded-3xl border bg-muted/30 overflow-y-auto max-h-36 whitespace-pre-wrap leading-relaxed", className)}>
      {content}
      {requirePrepayment !== false && (
        <span className="font-bold block mt-3 text-red-600 dark:text-red-400">
          • CLÁUSULA DE SINAL: O valor pago a título de sinal (50%) é retido para garantia da reserva do horário e NÃO É REEMBOLSÁVEL pelo sistema em hipótese de cancelamento, desistência ou não comparecimento.
        </span>
      )}
    </div>
  );
}

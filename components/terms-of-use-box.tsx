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
    <div className={cn("text-xs p-4 rounded-3xl border bg-muted/30 overflow-y-auto max-h-32 whitespace-pre-wrap leading-relaxed", className)}>
      {content}
      {requirePrepayment !== false && (
        <span className="font-bold block mt-3">
          • A taxa de sinal não é reembolsável em casos de cancelamento fora do prazo ou não comparecimento.
          <br />• O não comparecimento sem aviso implica na perda do sinal.
        </span>
      )}
    </div>
  );
}

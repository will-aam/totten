// CPF Keypad Component - componentes/cpf-keypad.tsx
"use client";

import { Button } from "@/components/ui/button";
import { TagX } from "@boxicons/react";

interface CpfKeypadProps {
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  disabled?: boolean;
}

function formatCpf(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function CpfKeypad({
  value,
  onChange,
  onConfirm,
  disabled,
}: CpfKeypadProps) {
  const digits = value.replace(/\D/g, "");

  const handleDigit = (digit: string) => {
    if (digits.length < 11) {
      onChange(digits + digit);
    }
  };

  const handleDelete = () => {
    onChange(digits.slice(0, -1));
  };

  const handleClear = () => {
    onChange("");
  };

  const isComplete = digits.length === 11;

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      {/* CPF Display */}
      <div className="flex h-20 w-full items-center justify-center rounded-xl border-2 border-border bg-card px-4">
        <span className="font-mono text-3xl tracking-widest text-foreground md:text-4xl">
          {digits.length > 0 ? (
            formatCpf(digits)
          ) : (
            <span className="text-muted-foreground">000.000.000-00</span>
          )}
        </span>
      </div>

      {/* Keypad Grid */}
      <div className="grid w-full grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <Button
            key={digit}
            type="button"
            variant="secondary"
            className="h-16 text-2xl font-semibold text-secondary-foreground md:h-20 md:text-3xl"
            onClick={() => handleDigit(digit)}
            disabled={disabled}
          >
            {digit}
          </Button>
        ))}

        {/* Bottom row */}
        <Button
          type="button"
          variant="outline"
          className="h-16 text-sm font-medium text-foreground md:h-20 md:text-base"
          onClick={handleClear}
          disabled={disabled}
        >
          Limpar
        </Button>

        <Button
          type="button"
          variant="secondary"
          className="h-16 text-2xl font-semibold text-secondary-foreground md:h-20 md:text-3xl"
          onClick={() => handleDigit("0")}
          disabled={disabled}
        >
          0
        </Button>

        <Button
          type="button"
          variant="outline"
          className="h-16 text-foreground md:h-20"
          onClick={handleDelete}
          disabled={disabled}
        >
          <TagX className="h-6 w-6" />
          <span className="sr-only">Apagar</span>
        </Button>
      </div>

      {/* Confirm Button */}
      <Button
        type="button"
        className="h-16 w-full text-xl font-semibold md:h-20 md:text-2xl"
        onClick={onConfirm}
        disabled={!isComplete || disabled}
      >
        Confirmar
      </Button>
    </div>
  );
}

export { formatCpf };

// app/totem/check-in/_components/identification-keypad.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

export type InputMode = "CPF" | "PHONE";

interface IdentificationKeypadProps {
  value: string;
  onChange: (value: string) => void;
  onConfirm: (mode: InputMode) => void;
  disabled?: boolean;
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
}

function formatCpf(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function IdentificationKeypad({
  value,
  onChange,
  onConfirm,
  disabled,
  mode,
  onModeChange,
}: IdentificationKeypadProps) {
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

  const handleModeSwitch = (newMode: InputMode) => {
    onModeChange(newMode);
    onChange("");
  };

  const isComplete =
    mode === "CPF" ? digits.length === 11 : digits.length >= 10;
  const displayValue = mode === "CPF" ? formatCpf(digits) : formatPhone(digits);
  const placeholder = mode === "CPF" ? "000.000.000-00" : "(00) 00000-0000";

  return (
    <div className="flex w-full flex-col items-center gap-6 md:gap-8 lg:gap-10">
      {" "}
      <div className="flex w-full rounded-xl border border-border bg-muted/30 p-1">
        <button
          type="button"
          onClick={() => handleModeSwitch("CPF")}
          disabled={disabled}
          className={cn(
            "flex-1 rounded-lg py-3 text-sm font-semibold transition-all",
            mode === "CPF"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
          )}
        >
          CPF
        </button>
        <button
          type="button"
          onClick={() => handleModeSwitch("PHONE")}
          disabled={disabled}
          className={cn(
            "flex-1 rounded-lg py-3 text-sm font-semibold transition-all",
            mode === "PHONE"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
          )}
        >
          Telefone
        </button>
      </div>
      {/* Texto limpo e dinâmico */}
      <div className="text-center">
        <p className="text-lg font-normal text-foreground md:text-xl">
          Digite seu {mode === "CPF" ? "CPF" : "telefone"} para iniciar.
        </p>
      </div>
      <div className="flex h-20 w-full items-center justify-center rounded-xl border-2 border-border bg-card px-4">
        <span className="font-mono text-3xl tracking-widest text-foreground md:text-4xl">
          {digits.length > 0 ? (
            displayValue
          ) : (
            <span className="text-muted-foreground opacity-40">
              {placeholder}
            </span>
          )}
        </span>
      </div>
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

        <Button
          type="button"
          variant="outline"
          className="h-16 text-sm font-medium text-foreground md:h-20 md:text-base"
          onClick={handleClear}
          disabled={disabled || digits.length === 0}
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
          disabled={disabled || digits.length === 0}
        >
          <Delete className="size-6 md:size-8 lg:size-10" />
          <span className="sr-only">Apagar</span>
        </Button>
      </div>
      <Button
        type="button"
        className="h-16 w-full text-xl font-semibold md:h-20 md:text-2xl"
        onClick={() => onConfirm(mode)}
        disabled={!isComplete || disabled}
      >
        Confirmar
      </Button>
    </div>
  );
}

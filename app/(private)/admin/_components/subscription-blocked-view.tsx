"use client";

import Link from "next/link";
import { ShieldAlert, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubscriptionBlockedViewProps {
  reason?: string;
  status?: "TRIAL" | "ACTIVE" | "PAST_DUE" | "SUSPENDED" | "CANCELLED";
}

export function SubscriptionBlockedView({ reason, status }: SubscriptionBlockedViewProps) {
  const isTrialExpired = status === "TRIAL" || (reason && reason.toLowerCase().includes("teste"));
  const buttonText = isTrialExpired ? "Escolher um Plano" : "Regularizar Assinatura";

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 text-center animate-in fade-in duration-300">
      <div className="relative mb-6">
        <div className="size-20 rounded-3xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center border border-amber-500/20 shadow-xs">
          <ShieldAlert className="size-10 text-amber-600 dark:text-amber-400" />
        </div>
      </div>

      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground max-w-md">
        Acesso temporariamente suspenso
      </h1>

      <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-lg leading-relaxed">
        {reason ||
          (isTrialExpired
            ? "Seu período de teste de 14 dias expirou. Escolha um plano para continuar utilizando o Totten."
            : "Identificamos uma pendência no pagamento da sua assinatura. Regularize para reativar o acesso.")}
      </p>

      {/* Botões empilhados verticalmente (um em cima do outro) */}
      <div className="mt-8 flex flex-col items-center gap-3 w-full max-w-xs">
        <Button asChild className="w-full h-11 text-sm font-semibold gap-2 shadow-sm">
          <Link href="/admin/plan">
            {buttonText}
            <ArrowRight className="size-4" />
          </Link>
        </Button>

        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="w-full h-11 text-sm font-medium gap-2 border-border/70"
        >
          <RefreshCw className="size-4" />
          Já realizei o pagamento
        </Button>
      </div>

      <p className="mt-6 text-xs text-muted-foreground/80 max-w-sm">
        Se você já realizou o pagamento pelo Mercado Pago, a liberação costuma ocorrer de forma automática em instantes.
      </p>
    </div>
  );
}

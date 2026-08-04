"use client";

import { Label } from "@/components/ui/label";
import { Star, CheckCircle } from "@boxicons/react";
import { cn } from "@/lib/utils";

export function ProSocialProof({ data, onChange }: any) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <Star className="h-5 w-5 text-primary" />
          Depoimentos do Google
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Importe automaticamente as avaliações da sua clínica no Google Meu Negócio.
        </p>
      </div>

      <div className="flex flex-col gap-6 p-5 border border-border/50 rounded-xl bg-muted/10">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <Label className="text-foreground font-medium text-base">Exibir Avaliações do Google</Label>
            <span className="text-xs text-muted-foreground">Mostra no site as suas melhores avaliações do Google Maps.</span>
          </div>
          <button
            onClick={() => onChange({ ...data, useGoogleReviews: !data.useGoogleReviews })}
            className={cn(
              "w-12 h-6 rounded-full transition-colors relative",
              data.useGoogleReviews ? "bg-primary" : "bg-muted-foreground/30"
            )}
          >
            <div className={cn(
              "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm",
              data.useGoogleReviews ? "left-6" : "left-0.5"
            )} />
          </button>
        </div>

        {data.useGoogleReviews && (
          <div className="mt-2 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex gap-3 text-emerald-600 dark:text-emerald-400 text-sm">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <p>
              Avaliações ativadas. No momento, estamos exibindo depoimentos de demonstração. Em breve, conectaremos diretamente com o CPF/CNPJ da clínica cadastrada.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

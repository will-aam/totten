"use client";

import Link from "next/link";
import { Heart, Lock } from "lucide-react";

export default function TotemIdlePage() {
  return (
    /* h-dvh garante que a tela ocupe exatamente 100% da área visível, sem rolagem */
    <div className="relative flex h-dvh w-full flex-col items-center justify-between p-6 pb-12 overflow-hidden bg-background">
      {/* 1. Topo: Espaçador discreto ou logo secundária se quiser */}
      <div className="h-10 w-full" />

      {/* 2. Centro: Conteúdo Principal (Logo + Botão) */}
      <div className="flex flex-col items-center gap-8 w-full max-w-sm animate-in fade-in zoom-in duration-700">
        {/* Logo / Clinic Name */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-full bg-primary">
            <Heart className="h-10 w-10 md:h-12 md:w-12 text-primary-foreground" />
          </div>
          <div className="space-y-1 text-center">
            {" "}
            <h1 className="font-serif text-5xl font-bold tracking-tight text-foreground md:text-6xl">
              Totten
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Sua jornada de bem-estar começa aqui.
            </p>
          </div>
        </div>

        {/* Check-in Button */}
        <div className="w-full px-4 pt-4">
          <Link
            href="/totem/check-in"
            className="flex h-20 w-full items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground hover:scale-[1.02] active:scale-95 md:h-24 md:text-2xl"
          >
            Fazer Check-in
          </Link>
          <p className="mt-4 text-xs md:text-sm text-muted-foreground animate-pulse text-center">
            Toque para registrar sua presença
          </p>
        </div>
      </div>

      {/* 3. Rodapé: Cadeado fixo, mas visível */}
      <div className="w-full flex justify-center items-center">
        <Link
          href="/admin/login"
          className="group flex items-center gap-2 p-4 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        >
          <Lock className="h-4 w-4 transition-transform group-hover:scale-110" />
          <span className="text-[10px] uppercase tracking-widest font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Acesso Restrito
          </span>
        </Link>
      </div>
    </div>
  );
}

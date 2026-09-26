"use client";

import React from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export function PageNotAvailable() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 p-6">
      <div className="w-full max-w-sm">
        <DotLottieReact
          src="/Lonely 404.lottie"
          loop
          autoplay
        />
      </div>
      <h1 className="text-2xl font-bold mt-8 mb-2 text-center">Página não disponível</h1>
      <p className="text-muted-foreground text-center">
        Parece que não há nada para ver por aqui.
      </p>
    </div>
  );
}

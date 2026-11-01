"use client";

import React from "react";
import { Whatsapp } from "@boxicons/react";

export function FloatingWhatsAppButton() {
  const whatsappUrl =
    "https://wa.me/5579998752198?text=" +
    encodeURIComponent("Olá! Preciso de ajuda com o sistema Totten.");

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white px-3.5 py-3 md:px-4 md:py-3 rounded-full shadow-lg shadow-emerald-950/20 hover:shadow-emerald-950/30 transition-all duration-300 hover:scale-105 active:scale-95 group"
      title="Falar com Suporte via WhatsApp"
    >
      <Whatsapp className="w-5 h-5 shrink-0 fill-current" />
      <span className="font-semibold text-xs md:text-sm hidden sm:inline">
        Suporte
      </span>
    </a>
  );
}


"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Palette, Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

// Cores pré-definidas para garantir estética e acessibilidade.
export const PRO_THEMES = [
  { id: "light", name: "Clean (Branco)", css: "bg-white", txt: "#0f172a", primary: "#0f172a", btnTxt: "#ffffff" },
  { id: "dark", name: "Elegante (Escuro)", css: "bg-slate-950", txt: "#f8fafc", primary: "#38bdf8", btnTxt: "#0f172a" },
  { id: "rose", name: "Suave (Rose)", css: "bg-rose-50", txt: "#4c0519", primary: "#e11d48", btnTxt: "#ffffff" },
  { id: "nature", name: "Natural (Verde)", css: "bg-emerald-50", txt: "#022c22", primary: "#059669", btnTxt: "#ffffff" },
  { id: "purple", name: "Vibrante (Lilás)", css: "bg-purple-50", txt: "#2e1065", primary: "#9333ea", btnTxt: "#ffffff" },
  { id: "blue", name: "Clássico (Azul)", css: "bg-blue-50", txt: "#1e3a8a", primary: "#2563eb", btnTxt: "#ffffff" },
  { id: "warm", name: "Acolhedor (Bege)", css: "bg-orange-50", txt: "#431407", primary: "#ea580c", btnTxt: "#ffffff" },
  { id: "stone", name: "Sóbrio (Cinza)", css: "bg-stone-50", txt: "#1c1917", primary: "#57534e", btnTxt: "#ffffff" },
];

interface BookingAppearanceSettingsProps {
  bookingTheme: string;
  setBookingTheme: (theme: string) => void;
  bookingPrimaryColor: string;
  setBookingPrimaryColor: (color: string) => void;
}

export function BookingAppearanceSettings({
  bookingTheme,
  setBookingTheme,
  bookingPrimaryColor,
  setBookingPrimaryColor,
}: BookingAppearanceSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const activeTheme = PRO_THEMES.find((t) => t.id === bookingTheme) || PRO_THEMES[0];

  const handleThemeChange = (theme: (typeof PRO_THEMES)[0]) => {
    setBookingTheme(theme.id);
    setBookingPrimaryColor(theme.primary);
  };

  return (
    <div className="flex flex-col gap-3 pt-1">
      {/* Barra de Resumo do Tema Ativo com Botão de Recolher/Expandir */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-muted/20">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "w-8 h-8 rounded-xl shadow-xs flex items-center justify-center border border-border/40 shrink-0 relative overflow-hidden",
              activeTheme.css
            )}
          >
            <div className="w-3 h-3 rounded-full shadow-xs" style={{ backgroundColor: activeTheme.primary }} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Tema Selecionado</span>
            <span className="text-xs font-bold text-foreground truncate">{activeTheme.name}</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-8 px-3 rounded-xl text-xs font-semibold text-foreground hover:bg-muted gap-1.5 shrink-0"
        >
          {isExpanded ? (
            <>
              <span>Recolher</span>
              <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
            </>
          ) : (
            <>
              <span>Alterar Tema</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </>
          )}
        </Button>
      </div>

      {/* Grid de Temas: No mobile é estreito (slim) e compacto */}
      {isExpanded && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
          {PRO_THEMES.map((theme) => {
            const isSelected = bookingTheme === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleThemeChange(theme)}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl border-2 p-1.5 sm:p-2 transition-all outline-none text-left w-full cursor-pointer",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-xs"
                    : "border-border/50 bg-card hover:border-primary/50"
                )}
              >
                {/* Preview Estreito / Compacto no mobile */}
                <div
                  className={cn(
                    "w-full h-12 sm:h-20 rounded-lg shadow-2xs flex flex-col justify-between p-1.5 sm:p-2 relative overflow-hidden border border-border/20",
                    theme.css
                  )}
                >
                  <div className="flex flex-col gap-1 w-full">
                    <div className="h-1.5 sm:h-2 w-3/5 rounded-full" style={{ backgroundColor: theme.txt, opacity: 0.8 }} />
                    <div className="h-1 sm:h-1.5 w-4/5 rounded-full" style={{ backgroundColor: theme.txt, opacity: 0.4 }} />
                  </div>
                  <div className="h-2.5 sm:h-4 w-2/5 rounded-md self-start" style={{ backgroundColor: theme.primary }} />

                  {isSelected && (
                    <div className="absolute inset-0 bg-black/15 flex items-center justify-center">
                      <div className="bg-background/90 backdrop-blur-xs rounded-full p-1 shadow-sm">
                        <Check className="h-3 w-3 text-foreground" strokeWidth={3} />
                      </div>
                    </div>
                  )}
                </div>

                <span className="text-[11px] sm:text-xs font-semibold text-foreground text-center truncate w-full px-1">
                  {theme.name}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

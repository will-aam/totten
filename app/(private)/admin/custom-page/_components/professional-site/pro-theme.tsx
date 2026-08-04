"use client";

import { Label } from "@/components/ui/label";
import { Palette, Check, Layout } from "@boxicons/react";
import { cn } from "@/lib/utils";

// Cores pré-definidas para garantir estética e acessibilidade.
const PRO_THEMES = [
  { id: "light", name: "Clean (Branco)", css: "bg-white", txt: "#0f172a", primary: "#0f172a" },
  { id: "dark", name: "Elegante (Escuro)", css: "bg-slate-950", txt: "#f8fafc", primary: "#38bdf8" },
  { id: "rose", name: "Suave (Rose)", css: "bg-rose-50", txt: "#4c0519", primary: "#e11d48" },
  { id: "nature", name: "Natural (Verde)", css: "bg-emerald-50", txt: "#022c22", primary: "#059669" },
  { id: "purple", name: "Vibrante (Lilás)", css: "bg-purple-50", txt: "#2e1065", primary: "#9333ea" },
];

export function ProTheme({ data, onChange }: any) {
  const handleThemeChange = (theme: (typeof PRO_THEMES)[0]) => {
    onChange({
      ...data,
      id: theme.id,
      css: theme.css,
      textColor: theme.txt,
      primaryColor: theme.primary,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <Palette className="h-5 w-5 text-primary" />
          Aparência do Site
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Defina as cores e o layout principal do seu site profissional.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Label className="text-foreground font-medium">Paleta de Cores</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PRO_THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme)}
                className={cn(
                  "relative flex flex-col items-center gap-2 rounded-xl border-2 p-2 transition-all outline-none",
                  data.id === theme.id
                    ? "border-primary bg-primary/5"
                    : "border-border/50 bg-card hover:border-primary/50",
                )}
              >
                <div
                  className={cn(
                    "w-full h-24 rounded-lg shadow-sm flex flex-col gap-2 p-2 relative overflow-hidden",
                    theme.css,
                  )}
                >
                  <div className="h-2 w-1/2 rounded-full" style={{ backgroundColor: theme.txt, opacity: 0.8 }} />
                  <div className="h-2 w-3/4 rounded-full" style={{ backgroundColor: theme.txt, opacity: 0.5 }} />
                  <div className="h-4 w-1/3 rounded-md mt-auto" style={{ backgroundColor: theme.primary }} />

                  {data.id === theme.id && (
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                      <div className="bg-background/80 backdrop-blur-sm rounded-full p-1 shadow-sm">
                        <Check className="h-4 w-4 text-foreground" />
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium text-foreground">
                  {theme.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="w-full h-px bg-border/50" />

        <div className="flex flex-col gap-3">
          <Label className="text-foreground font-medium">Formato do Cabeçalho</Label>
          <div className="flex bg-muted p-1 rounded-lg border border-border/50 w-full md:w-2/3">
            <button
              onClick={() => onChange({ ...data, headerStyle: "center" })}
              className={cn(
                "flex-1 text-xs py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 font-medium",
                (data.headerStyle || "center") === "center"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:bg-background/50",
              )}
            >
              <Layout className="h-4 w-4" /> Centralizado
            </button>
            <button
              onClick={() => onChange({ ...data, headerStyle: "left" })}
              className={cn(
                "flex-1 text-xs py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 font-medium",
                data.headerStyle === "left"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:bg-background/50",
              )}
            >
              <Layout className="h-4 w-4 rotate-180" /> Alinhado à Esquerda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

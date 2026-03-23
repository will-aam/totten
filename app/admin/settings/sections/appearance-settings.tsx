// app/admin/settings/sections/appearance-settings.tsx
"use client";

import { useTheme } from "next-themes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Palette,
  MessageCircle,
  PaintbrushVertical,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  // 🔥 A MÁGICA CORRIGIDA: Expande sempre a nova cor a partir do clique
  const handleThemeChange = (newTheme: string, e: React.MouseEvent) => {
    if (theme === newTheme) return;

    // Se o browser não suportar o efeito, muda sem animação
    if (!document.startViewTransition) {
      setTheme(newTheme);
      return;
    }

    // Calcula de onde o rato clicou para a "bolha" de cor sair do quadrado
    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    // Inicia a transição de visualização
    const transition = document.startViewTransition(() => {
      setTheme(newTheme);
    });

    // Aplica o efeito: A nova cor cresce sempre do 0 até ao ecrã inteiro
    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 500,
          easing: "ease-out",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    });
  };
  const handleRequestTheme = () => {
    const message = encodeURIComponent(
      "Olá! Gostaria de solicitar um tema personalizado com as cores da minha empresa para o sistema Totten.",
    );
    window.open(`https://wa.me/5579999365157?text=${message}`, "_blank");
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Configuração de Temas */}
      <Card className="border-border/50 shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-foreground font-black text-xl">
            <Palette className="h-5 w-5 text-primary" />
            Aparência do Sistema
          </CardTitle>
          <CardDescription className="font-medium text-base">
            Escolha o tema de cores que melhor combina com sua empresa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* QUADRADO CLARO */}
            <button
              onClick={(e) => handleThemeChange("light", e)}
              className={cn(
                "relative flex h-28 w-28 flex-col items-center justify-center rounded-2xl border-2 transition-all hover:scale-105 active:scale-95",
                theme === "light"
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20 ring-offset-2 ring-offset-background"
                  : "border-border bg-card hover:border-primary/50",
              )}
            >
              {theme === "light" && (
                <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-primary animate-in zoom-in" />
              )}
              <div className="h-10 w-10 rounded-full bg-[#f8fafc] border border-slate-200 shadow-sm" />
              <span className="mt-3 text-sm font-bold text-foreground">
                Claro
              </span>
            </button>

            {/* QUADRADO ESCURO */}
            <button
              onClick={(e) => handleThemeChange("dark", e)}
              className={cn(
                "relative flex h-28 w-28 flex-col items-center justify-center rounded-2xl border-2 transition-all hover:scale-105 active:scale-95",
                theme === "dark"
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20 ring-offset-2 ring-offset-background"
                  : "border-border bg-card hover:border-primary/50",
              )}
            >
              {theme === "dark" && (
                <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-primary animate-in zoom-in" />
              )}
              <div className="h-10 w-10 rounded-full bg-[#020817] border border-slate-800 shadow-sm" />
              <span className="mt-3 text-sm font-bold text-foreground">
                Escuro
              </span>
            </button>

            {/* 🔥 QUADRADO AZUL (BLOQUEADO / EM BREVE) */}
            <button
              disabled
              className="relative flex h-28 w-28 flex-col items-center justify-center rounded-2xl border-2 border-border/50 bg-muted/30 cursor-not-allowed opacity-70 transition-all group"
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/40 backdrop-blur-[1px] rounded-xl z-10">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-background/80 px-2 py-0.5 rounded-full shadow-sm border border-border/50">
                  Em Breve
                </span>
              </div>

              <div className="h-10 w-10 rounded-full bg-linear-to-br from-blue-500 to-indigo-700 border border-blue-600/50 shadow-sm grayscale-[0.3]" />
              <span className="mt-3 text-sm font-bold text-foreground/50">
                Azul
              </span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Banner de Upsell - Minimalista e Clean */}
      <Card className="border border-dashed border-border bg-muted/30 rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-foreground text-lg font-semibold">
            <PaintbrushVertical className="h-5 w-5 text-primary" />
            Personalize com a sua marca
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Quer sair do padrão? Criamos um tema exclusivo utilizando as cores
            da sua logomarca.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm text-muted-foreground">
              Taxa única de customização:{" "}
              <span className="font-bold text-foreground">R$ 15,00</span>
            </p>
            <p className="text-xs text-muted-foreground/70 max-w-md">
              Aplicamos a paleta da sua marca nos botões, menus e
              autoatendimento.
            </p>
          </div>

          <Button
            onClick={handleRequestTheme}
            // Botão outline padrão, sem sombra, com efeito de clique suave
            variant="default"
            className="w-full sm:w-auto gap-2 rounded-xl h-10 px-5 font-semibold transition-transform active:scale-95"
          >
            <MessageCircle className="h-4 w-4" />
            Solicitar Tema
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

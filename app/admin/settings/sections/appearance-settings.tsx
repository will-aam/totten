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
import { Palette, MessageCircle, PaintbrushVertical } from "lucide-react";

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  // Função para chamar você no WhatsApp (coloque o seu número aqui depois)
  const handleRequestTheme = () => {
    const message = encodeURIComponent(
      "Olá! Gostaria de solicitar um tema personalizado com as cores da minha empresa para o sistema Totten.",
    );
    window.open(`https://wa.me/5579999365157?text=${message}`, "_blank");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Configuração Padrão */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Palette className="h-5 w-5 text-primary" />
            Aparência do Sistema
          </CardTitle>
          <CardDescription>
            Escolha entre os temas padrão de alto contraste.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <button
              onClick={() => setTheme("light")}
              className={`flex h-24 w-24 flex-col items-center justify-center rounded-xl border-2 transition-all ${
                theme === "light"
                  ? "border-primary bg-card ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : "border-border bg-muted hover:border-primary/50"
              }`}
            >
              <div className="h-10 w-10 rounded-full bg-white border border-gray-200 shadow-sm" />
              <span className="mt-2 text-sm font-medium text-foreground">
                Claro
              </span>
            </button>

            <button
              onClick={() => setTheme("dark")}
              className={`flex h-24 w-24 flex-col items-center justify-center rounded-xl border-2 transition-all ${
                theme === "dark"
                  ? "border-primary bg-card ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : "border-border bg-muted hover:border-primary/50"
              }`}
            >
              <div className="h-10 w-10 rounded-full bg-zinc-950 border border-zinc-800 shadow-sm" />
              <span className="mt-2 text-sm font-medium text-foreground">
                Escuro
              </span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Banner de Upsell (Venda do Tema Customizado) */}
      <Card className="border-primary/30 bg-primary/5 relative overflow-hidden">
        {/* Efeito visual de fundo para deixar mais premium */}
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full " />

        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-primary text-lg">
            <PaintbrushVertical className="h-5 w-5" />
            Deixe o Totten com a cara da sua empresa!
          </CardTitle>
          <CardDescription className="text-foreground/80">
            Quer sair do padrão? Nós criamos um tema exclusivo utilizando as
            cores exatas da sua logomarca para uma experiência única.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              Taxa única de customização:{" "}
              <span className="text-primary font-bold text-base ml-1">
                R$ 15,00
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-100">
              Nossa equipe extrai a paleta de cores da sua logomarca e aplica
              nos botões, menus e no Totten de autoatendimento.
            </p>
          </div>
          <Button
            onClick={handleRequestTheme}
            className="w-full sm:w-auto gap-2 shadow-sm hover:scale-[1.02] transition-transform"
          >
            <MessageCircle className="h-4 w-4" />
            Solicitar Tema
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { updateSelfServiceSettingsAction, getSelfServiceSettingsAction } from "@/app/actions/settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Palette, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Cores pré-definidas para garantir estética e acessibilidade.
export const PRO_THEMES = [
  { id: "light", name: "Clean (Branco)", css: "bg-white", txt: "#0f172a", primary: "#0f172a" },
  { id: "dark", name: "Elegante (Escuro)", css: "bg-slate-950", txt: "#f8fafc", primary: "#38bdf8" },
  { id: "rose", name: "Suave (Rose)", css: "bg-rose-50", txt: "#4c0519", primary: "#e11d48" },
  { id: "nature", name: "Natural (Verde)", css: "bg-emerald-50", txt: "#022c22", primary: "#059669" },
  { id: "purple", name: "Vibrante (Lilás)", css: "bg-purple-50", txt: "#2e1065", primary: "#9333ea" },
  { id: "blue", name: "Clássico (Azul)", css: "bg-blue-50", txt: "#1e3a8a", primary: "#2563eb" },
  { id: "warm", name: "Acolhedor (Bege)", css: "bg-orange-50", txt: "#431407", primary: "#ea580c" },
  { id: "stone", name: "Sóbrio (Cinza)", css: "bg-stone-50", txt: "#1c1917", primary: "#57534e" },
];

interface BookingAppearanceSettingsProps {
  initialData?: any;
}

export function BookingAppearanceSettings({
  initialData,
}: BookingAppearanceSettingsProps) {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(!initialData);

  const [bookingTheme, setBookingTheme] = useState(
    initialData?.bookingTheme || "light"
  );
  
  const [bookingPrimaryColor, setBookingPrimaryColor] = useState(
    initialData?.bookingPrimaryColor || "#0f172a"
  );

  useEffect(() => {
    if (!initialData) {
      getSelfServiceSettingsAction().then(res => {
        if (res.success && res.data) {
          setBookingTheme(res.data.bookingTheme || "light");
          setBookingPrimaryColor(res.data.bookingPrimaryColor || "#0f172a");
        }
        setIsLoading(false);
      });
    }
  }, [initialData]);

  const handleThemeChange = (theme: (typeof PRO_THEMES)[0]) => {
    setBookingTheme(theme.id);
    setBookingPrimaryColor(theme.primary);
  };

  const handleSave = () => {
    startTransition(async () => {
      const response = await updateSelfServiceSettingsAction({
        bookingTheme,
        bookingPrimaryColor,
      });

      if (response.success) {
        toast.success("Aparência atualizada", {
          description: "O tema da sua página de agendamento foi salvo.",
        });
      } else {
        toast.error("Erro ao salvar", {
          description: response.error,
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <Card className="border-none shadow-none py-0 sm:py-6 bg-transparent">
        <CardHeader className="px-0">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Palette className="h-5 w-5 text-primary" />
            Temas do Sistema
          </CardTitle>
          <CardDescription>
            Escolha um fundo para a sua página de agendamento.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 space-y-8">

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PRO_THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme)}
                className={cn(
                  "relative flex flex-col items-center gap-2 rounded-xl border-2 p-2 transition-all outline-none",
                  bookingTheme === theme.id
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

                  {bookingTheme === theme.id && (
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

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


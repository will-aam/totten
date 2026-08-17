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
import { Palette, CheckCircle, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SYSTEM_THEMES } from "@/app/(private)/admin/custom-page/_components/theme-settings";

interface BookingAppearanceSettingsProps {
  initialData?: any;
}

export function BookingAppearanceSettings({
  initialData,
}: BookingAppearanceSettingsProps) {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(!initialData);

  const [bookingTheme, setBookingTheme] = useState(
    initialData?.bookingTheme || "solid"
  );
  // We can still keep bookingPrimaryColor around just in case, but we mainly care about bookingTheme for the predefined ones
  const [bookingPrimaryColor, setBookingPrimaryColor] = useState(
    initialData?.bookingPrimaryColor || "#0f172a"
  );

  useEffect(() => {
    if (!initialData) {
      getSelfServiceSettingsAction().then(res => {
        if (res.success && res.data) {
          setBookingTheme(res.data.bookingTheme || "solid");
          setBookingPrimaryColor(res.data.bookingPrimaryColor || "#0f172a");
        }
        setIsLoading(false);
      });
    }
  }, [initialData]);

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
          
          <div className="flex overflow-x-auto sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-2 no-scrollbar">
            {SYSTEM_THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setBookingTheme(theme.id)}
                className={cn(
                  "relative flex flex-col items-center gap-2 rounded-xl border-2 p-2 transition-all outline-none shrink-0 w-[120px] sm:w-auto",
                  bookingTheme === theme.id
                    ? "border-primary bg-primary/5"
                    : "border-border/50 bg-card hover:border-primary/50"
                )}
              >
                <div
                  className={cn(
                    "w-full h-24 rounded-lg shadow-sm flex items-center justify-center relative overflow-hidden",
                    theme.id === "solid" && bookingTheme === "solid"
                      ? "bg-slate-200"
                      : theme.css
                  )}
                >
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

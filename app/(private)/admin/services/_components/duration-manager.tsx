// components/service-durations/duration-manager.tsx
"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, LoaderDots, Trash, Timer } from "@boxicons/react";
import { Plus } from "@boxicons/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Duration = {
  id: string;
  label: string;
  minutes: number;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const formatDurationDisplay = (minutes: number) => {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
};

const noSpinClass =
  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

export function DurationManager() {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    label: "",
    hours: "",
    minutes: "",
  });

  const [isCustomLabel, setIsCustomLabel] = useState(false);

  const {
    data: durations,
    mutate,
    isLoading,
  } = useSWR<Duration[]>("/api/service-durations", fetcher);

  const calculateMinutes = () => {
    const h = Number(form.hours) || 0;
    const m = Number(form.minutes) || 0;
    return h * 60 + m;
  };

  const handleTimeChange = (field: "hours" | "minutes", value: string) => {
    setForm((prev) => {
      const newForm = { ...prev, [field]: value };
      const h = Number(newForm.hours) || 0;
      const m = Number(newForm.minutes) || 0;
      const total = h * 60 + m;

      if (!isCustomLabel) {
        newForm.label = total > 0 ? formatDurationDisplay(total) : "";
      }

      return newForm;
    });
  };

  const handleAdd = async () => {
    const totalMinutes = calculateMinutes();

    if (!form.label.trim()) {
      toast.error("Digite um nome para a duração");
      return;
    }

    if (totalMinutes < 1) {
      toast.error("Duração deve ser maior que zero");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/service-durations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: form.label,
          minutes: totalMinutes,
        }),
      });

      if (res.ok) {
        toast.success("Duração cadastrada!");
        setForm({ label: "", hours: "", minutes: "" });
        setIsCustomLabel(false);
        mutate();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Erro ao cadastrar");
      }
    } catch (error) {
      toast.error("Erro de conexão ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const updatedDurations = durations?.filter((d) => d.id !== id);

    try {
      toast.promise(
        fetch(`/api/service-durations?id=${id}`, { method: "DELETE" }),
        {
          loading: "Removendo...",
          success: () => {
            mutate(updatedDurations, false);
            return "Duração removida!";
          },
          error: "Erro ao remover.",
        },
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      {/* FORMULÁRIO DE CADASTRO */}
      <div className="flex flex-col gap-6 pb-8 border-b border-border/40">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Nova Opção de Tempo
          </h2>
          <p className="text-sm text-muted-foreground">
            Defina intervalos de tempo para seus serviços.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">
              Nome Exibido
            </Label>
            <Input
              placeholder="Ex: 1h 30min"
              value={form.label}
              onChange={(e) => {
                setForm({ ...form, label: e.target.value });
                setIsCustomLabel(true);
              }}
              className="h-11 rounded-xl bg-muted/30 border-0 focus-visible:ring-1 focus-visible:ring-primary shadow-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 md:col-span-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">
                Horas
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  value={form.hours}
                  onChange={(e) => handleTimeChange("hours", e.target.value)}
                  className={cn(
                    "h-11 pl-9 rounded-xl bg-muted/30 border-0 shadow-none focus-visible:ring-1 focus-visible:ring-primary",
                    noSpinClass,
                  )}
                />
                <Clock
                  size="sm"
                  className="absolute left-3 top-3.5 text-muted-foreground/50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">
                Minutos
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  value={form.minutes}
                  onChange={(e) => handleTimeChange("minutes", e.target.value)}
                  className={cn(
                    "h-11 pl-9 rounded-xl bg-muted/30 border-0 shadow-none focus-visible:ring-1 focus-visible:ring-primary",
                    noSpinClass,
                  )}
                />
                <Timer
                  size="sm"
                  className="absolute left-3 top-3.5 text-muted-foreground/50"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Resultado:{" "}
            <span className="text-foreground font-medium">
              {form.label || "---"}
            </span>
            <span className="text-xs opacity-60">
              ({calculateMinutes()} min)
            </span>
          </div>

          <Button
            onClick={handleAdd}
            disabled={saving}
            className="w-full sm:w-auto rounded-xl px-6 h-11 active:scale-95 transition-transform"
          >
            {saving ? (
              <LoaderDots size="sm" className="animate-spin" />
            ) : (
              "Salvar Duração"
            )}
          </Button>
        </div>
      </div>

      {/* LISTAGEM DE DURAÇÕES */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Clock size="sm" className="text-primary" />
          Tempos Configurados
        </h2>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 w-full bg-muted/30 animate-pulse rounded-xl"
              />
            ))}
          </div>
        ) : !durations || durations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/20 rounded-xl border border-dashed border-border">
            <p className="text-sm text-muted-foreground">
              Nenhuma duração cadastrada.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {durations.map((duration) => (
              <div
                key={duration.id}
                className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/10 select-none transition-all active:scale-[0.98] active:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <Timer size="sm" className="text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">
                      {duration.label}
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      {duration.minutes} minutos
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(duration.id)}
                  className="text-muted-foreground hover:bg-transparent hover:text-muted-foreground active:bg-destructive/10 active:text-destructive active:scale-90 transition-all -mr-2"
                >
                  <Trash size="sm" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

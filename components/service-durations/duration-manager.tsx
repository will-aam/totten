// components/service-durations/duration-manager.tsx
"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, Loader2, Plus, Trash2, Timer, Zap } from "lucide-react";
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

export function DurationManager() {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    label: "",
    hours: "",
    minutes: "",
  });

  const [isCustomLabel, setIsCustomLabel] = useState(false);

  // 🔥 OTIMIZAÇÃO: Usando SWR para gerenciar a lista com cache e auto-revalidação
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
        toast.success("Duração cadastrada com sucesso!");
        setForm({ label: "", hours: "", minutes: "" });
        setIsCustomLabel(false);
        // 🔥 Atualiza a lista localmente sem recarregar a página
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
    // Usamos o mutate otimista: removemos da lista antes mesmo da resposta do banco
    const updatedDurations = durations?.filter((d) => d.id !== id);

    try {
      toast.promise(
        fetch(`/api/service-durations?id=${id}`, { method: "DELETE" }),
        {
          loading: "Removendo...",
          success: () => {
            mutate(updatedDurations, false); // Atualiza cache local
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
      <Card className="border-border/50 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1" />
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Nova Opção de Tempo
          </CardTitle>
          <CardDescription>
            Defina intervalos de tempo personalizados para seus serviços.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Nome Exibido
              </Label>
              <Input
                placeholder="Ex: 1h 30min"
                value={form.label}
                onChange={(e) => {
                  setForm({ ...form, label: e.target.value });
                  setIsCustomLabel(true);
                }}
                className="h-11 bg-muted/30 focus-visible:ring-primary/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 md:col-span-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Horas
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={form.hours}
                    onChange={(e) => handleTimeChange("hours", e.target.value)}
                    className="h-11 pl-10 bg-muted/30 [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <Clock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Minutos
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={form.minutes}
                    onChange={(e) =>
                      handleTimeChange("minutes", e.target.value)
                    }
                    className="h-11 pl-10 bg-muted/30 [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <Timer className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/50" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-border/50">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              Resultado:{" "}
              <span className="text-foreground">{form.label || "---"}</span>
              <span className="text-xs opacity-50">
                ({calculateMinutes()} min)
              </span>
            </div>

            <Button
              onClick={handleAdd}
              disabled={saving}
              className="w-full sm:w-auto rounded-full px-8 shadow-md"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>Salvar Duração</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* LISTAGEM DE DURAÇÕES */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold tracking-tight">
            Tempos Configurados
          </h2>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 w-full bg-muted/50 animate-pulse rounded-2xl border"
              />
            ))}
          </div>
        ) : !durations || durations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-muted/20 border border-dashed rounded-3xl">
            <Clock className="h-12 w-12 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhuma duração cadastrada.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {durations.map((duration) => (
              <div
                key={duration.id}
                className="group flex items-center justify-between p-4 rounded-2xl border border-border/60 bg-card hover:border-primary/40 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center border border-primary/10">
                    <Timer className="h-6 w-6" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground leading-tight">
                      {duration.label}
                    </h3>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-tighter">
                      {duration.minutes} minutos totais
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(duration.id)}
                  className="rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Clock,
  Palette,
  DollarSign,
  TrendingDown,
  Tag,
  AlignLeft,
  Globe,
  Save,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { CategorySelect } from "./category-select";

type Duration = {
  id: string;
  label: string;
  minutes: number;
};

export function ServiceForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingDurations, setLoadingDurations] = useState(true);
  const [durations, setDurations] = useState<Duration[]>([]);
  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    duration: "",
    color: "#D9C6BF",
    price: "",
    cost: "", // Nosso campo de custo de material
    isOnline: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchDurations = async () => {
      try {
        const res = await fetch("/api/service-durations");
        if (res.ok) {
          const data = await res.json();
          setDurations(data);
        }
      } catch (error) {
        console.error("Erro ao buscar durações:", error);
      } finally {
        setLoadingDurations(false);
      }
    };

    fetchDurations();
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!form.name.trim()) errs.name = "Nome é obrigatório";
    if (!form.category) errs.category = "Selecione uma categoria";
    if (!form.duration) errs.duration = "Selecione a duração";
    if (!form.price || Number(form.price) <= 0) {
      errs.price = "Preço deve ser maior que zero";
    }
    // Opcional: validar se o custo é maior ou igual a zero (se preenchido)
    if (form.cost && Number(form.cost) < 0) {
      errs.cost = "O custo não pode ser negativo";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          category_id: form.category,
          description: form.description || null,
          duration: Number(form.duration),
          price: Number(form.price),
          // 🔥 ENVIANDO O NOVO CAMPO PARA A API
          material_cost: form.cost ? Number(form.cost) : null,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Serviço cadastrado com sucesso!");
        router.push("/admin/services");
      } else {
        toast.error(data.error || "Erro ao cadastrar serviço");
      }
    } catch (error) {
      console.error("Erro ao salvar serviço:", error);
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* BLOCO 1: Informações Básicas */}
      <Card className="border-0 shadow-none bg-transparent md:border md:shadow-sm md:bg-card">
        <CardHeader className="px-0 pt-0 md:pt-6 md:px-6 pb-4">
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            Informações do Serviço
          </CardTitle>
          <CardDescription>
            Detalhes principais de como o serviço será apresentado.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0 md:pb-6 md:px-6 flex flex-col gap-5">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name" className="text-foreground font-medium">
                Nome do Serviço *
              </Label>
              <Input
                id="name"
                placeholder="Ex: Massagem Relaxante"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-muted/50 border-border/50 h-11"
              />
              {errors.name && (
                <p className="text-xs font-medium text-destructive ml-1">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="category"
                className="flex items-center gap-2 text-foreground font-medium"
              >
                <Tag className="h-4 w-4 text-muted-foreground" />
                Categoria *
              </Label>
              <CategorySelect
                value={form.category}
                onValueChange={(value) => setForm({ ...form, category: value })}
                error={errors.category}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="description"
              className="flex items-center gap-2 text-foreground font-medium"
            >
              <AlignLeft className="h-4 w-4 text-muted-foreground" />
              Descrição (Para o Cliente)
            </Label>
            <Textarea
              id="description"
              placeholder="Descreva o que está incluso neste serviço. Isso aparecerá no agendamento online."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="bg-muted/50 border-border/50 min-h-25 resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BLOCO 2: Agenda e Visual */}
        <Card className="border-0 shadow-none bg-transparent md:border md:shadow-sm md:bg-card">
          <CardHeader className="px-0 pt-0 md:pt-6 md:px-6 pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <Clock className="h-5 w-5 text-primary" />
              Agenda e Visual
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0 md:pb-6 md:px-6 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="duration" className="text-foreground font-medium">
                Duração Estimada *
              </Label>
              {loadingDurations ? (
                <div className="h-11 bg-muted/50 rounded-md animate-pulse" />
              ) : durations.length === 0 ? (
                <div className="p-3 bg-muted/30 rounded-lg border border-dashed border-border">
                  <p className="text-xs text-muted-foreground">
                    Nenhuma duração cadastrada.{" "}
                    <Link
                      href="/admin/services?tab=schedules"
                      className="text-primary hover:underline font-medium"
                    >
                      Cadastre as opções de tempo
                    </Link>
                  </p>
                </div>
              ) : (
                <Select
                  value={form.duration}
                  onValueChange={(v) => setForm({ ...form, duration: v })}
                >
                  <SelectTrigger className="bg-muted/50 border-border/50 h-11">
                    <SelectValue placeholder="Tempo de atendimento" />
                  </SelectTrigger>
                  <SelectContent>
                    {durations.map((duration) => (
                      <SelectItem
                        key={duration.id}
                        value={duration.minutes.toString()}
                      >
                        {duration.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.duration && (
                <p className="text-xs font-medium text-destructive ml-1">
                  {errors.duration}
                </p>
              )}
            </div>

            {/* 🔥 Cor na Agenda (INATIVO) */}
            <div className="flex flex-col gap-2 opacity-60 pointer-events-none select-none">
              <Label
                htmlFor="color"
                className="flex items-center gap-2 text-foreground font-medium"
              >
                <Palette className="h-4 w-4 text-muted-foreground" />
                Cor na Agenda
                <span className="ml-auto text-[10px] font-bold tracking-wider uppercase bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                  Em breve
                </span>
              </Label>
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11 rounded-full overflow-hidden border-2 border-border shadow-sm shrink-0">
                  <input
                    type="color"
                    id="color"
                    value={form.color}
                    disabled
                    onChange={(e) =>
                      setForm({ ...form, color: e.target.value })
                    }
                    className="absolute -top-2 -left-2 h-16 w-16 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Escolha a cor que representará este serviço no calendário.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BLOCO 3: Financeiro */}
        <Card className="border-0 shadow-none bg-transparent md:border md:shadow-sm md:bg-card">
          <CardHeader className="px-0 pt-0 md:pt-6 md:px-6 pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <DollarSign className="h-5 w-5 text-primary" />
              Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0 md:pb-6 md:px-6 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="price" className="text-foreground font-medium">
                Preço de Venda (R$) *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  R$
                </span>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="bg-muted/50 border-border/50 h-11 pl-9 font-medium text-lg"
                />
              </div>
              {errors.price && (
                <p className="text-xs font-medium text-destructive ml-1">
                  {errors.price}
                </p>
              )}
            </div>

            {/* 🔥 Custo de Insumo (AGORA ATIVO!) */}
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="cost"
                className="flex items-center gap-2 text-foreground font-medium"
              >
                <TrendingDown className="h-4 w-4 text-destructive" />
                Custo de Material (R$)
                {/* Removi o badge "Em breve" */}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  R$
                </span>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  className="bg-muted/50 border-border/50 h-11 pl-9"
                  // Removi o disabled e a opacidade
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Gasto médio com cremes, óleos, descartáveis, etc. Será
                descontado do seu lucro.
              </p>
              {errors.cost && (
                <p className="text-xs font-medium text-destructive ml-1">
                  {errors.cost}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BLOCO 4: Configurações Extras (Switch INATIVO) */}
      <Card className="border-0 shadow-none bg-transparent md:border md:shadow-sm md:bg-card opacity-60 pointer-events-none select-none">
        <CardContent className="px-0 pt-0 md:p-6 flex items-center justify-between">
          <div className="flex flex-col gap-1 pr-4">
            <Label className="flex items-center gap-2 text-foreground font-medium text-base">
              <Globe className="h-5 w-5 text-primary" />
              Disponível no Agendamento Online
              <span className="ml-2 text-[10px] font-bold tracking-wider uppercase bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                Em breve
              </span>
            </Label>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Permite que os clientes vejam e agendem este serviço sozinhos pela
              internet.
            </p>
          </div>
          <Switch
            checked={form.isOnline}
            disabled
            onCheckedChange={(checked) =>
              setForm({ ...form, isOnline: checked })
            }
          />
        </CardContent>
      </Card>

      {/* RODAPÉ: Botões de Ação */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
        <Button
          asChild
          variant="ghost"
          type="button"
          className="hidden sm:flex text-muted-foreground rounded-full md:rounded-md"
        >
          <Link href="/admin/services">Cancelar</Link>
        </Button>
        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="w-full sm:w-auto rounded-full md:rounded-md shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
        >
          {loading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Save className="mr-2 h-5 w-5" />
          )}
          {loading ? "Salvando..." : "Salvar Serviço"}
        </Button>
      </div>
    </form>
  );
}

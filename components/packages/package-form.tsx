// components/package-form.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Package,
  Layers,
  Dollar,
  Calendar,
  Save,
  LoaderDots,
  Briefcase,
} from "@boxicons/react";
import { toast } from "sonner";

export function PackageForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);
  const [services, setServices] = useState<any[]>([]);

  // Constantes de proteção estabelecidas
  const MAX_SESSIONS = 120;
  const MAX_VALIDITY_DAYS = 730; // 2 anos

  const [form, setForm] = useState({
    name: "",
    description: "",
    total_sessions: "10",
    price: "",
    validity_days: "90",
    active: true,
    service_id: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadServices() {
      try {
        const res = await fetch("/api/services?active=true");
        if (res.ok) {
          const data = await res.json();
          setServices(data);
        }
      } catch (error) {
        console.error("Erro ao carregar serviços:", error);
      } finally {
        setLoadingServices(false);
      }
    }
    loadServices();
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Nome é obrigatório";
    if (!form.service_id) errs.service_id = "Selecione um serviço base";
    if (!form.total_sessions || Number(form.total_sessions) < 1)
      errs.total_sessions = "Mínimo 1 sessão";
    // Proteção extra no backend-side logic front
    if (Number(form.total_sessions) > MAX_SESSIONS)
      errs.total_sessions = `Mínimo 1, Máximo ${MAX_SESSIONS}`;
    if (!form.price || Number(form.price) <= 0) errs.price = "Preço inválido";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Preencha os campos corretamente.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/package-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          total_sessions: Number(form.total_sessions),
          price: Number(form.price),
          validity_days:
            form.validity_days !== "" ? Number(form.validity_days) : null,
          active: form.active,
          service_id: form.service_id,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Pacote cadastrado com sucesso!");
        router.push("/admin/services?tab=packages");
      } else {
        toast.error(data.error || "Erro ao salvar.");
      }
    } catch (error) {
      toast.error("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full pb-8 md:pb-2">
      {/* SEÇÃO 1: CABEÇALHO E SERVIÇO */}
      <div className="flex flex-col gap-6 pb-6 border-b border-border/50">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
            <Package className="h-5 w-5 text-primary" />
            Configuração do Pacote
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Vincule este pacote a um serviço base e defina suas regras.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" /> Serviço Base
            *
          </Label>
          <Select
            value={form.service_id}
            onValueChange={(val) => setForm({ ...form, service_id: val })}
          >
            <SelectTrigger className="bg-muted/30 h-12 rounded-xl border-border/50">
              <SelectValue
                placeholder={
                  loadingServices ? "Carregando..." : "Selecione o serviço..."
                }
              />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {services.map((s) => (
                <SelectItem key={s.id} value={s.id} className="rounded-lg">
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.service_id && (
            <p className="text-xs text-destructive">{errors.service_id}</p>
          )}
        </div>
      </div>

      {/* SEÇÃO 2: DADOS PRINCIPAIS */}
      <div className="flex flex-col gap-5 py-6 border-b border-border/50">
        <div className="grid md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome Comercial *</Label>
            <Input
              id="name"
              placeholder="Ex: Combo Fidelidade (10 sessões)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-muted/30 h-12 rounded-xl border-border/50"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" /> Qtd.
                Sessões *
              </span>
              <span className="text-[10px] text-muted-foreground">
                Máx: {MAX_SESSIONS}
              </span>
            </Label>
            <Input
              type="text"
              inputMode="numeric"
              value={form.total_sessions}
              onChange={(e) => {
                let cleanDigit = e.target.value.replace(/\D/g, "");
                // Impede zero à esquerda (se digitar 0, ignora).
                if (cleanDigit && Number(cleanDigit) === 0) cleanDigit = "";
                // Trava no limite
                if (Number(cleanDigit) > MAX_SESSIONS)
                  cleanDigit = MAX_SESSIONS.toString();
                setForm({ ...form, total_sessions: cleanDigit });
              }}
              className="bg-muted/30 h-12 rounded-xl border-border/50 font-bold"
            />
            {errors.total_sessions && (
              <p className="text-xs text-destructive">
                {errors.total_sessions}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Descrição(Para o Cliente)</Label>
          <Textarea
            id="description"
            placeholder="Detalhes sobre o que o pacote inclui..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="bg-muted/30 min-h-24 rounded-xl border-border/50 resize-none"
          />
        </div>
      </div>

      {/* SEÇÃO 3: VALORES E REGRAS */}
      <div className="grid md:grid-cols-2 gap-6 py-6 border-b border-border/50">
        <div className="flex flex-col gap-2">
          <Label className="flex items-center gap-2">
            <Dollar className="h-4 w-4 text-primary" /> Preço Total *
          </Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
              R$
            </span>
            <Input
              type="text"
              inputMode="numeric"
              value={form.price ? form.price.replace(".", ",") : ""}
              onChange={(e) => {
                const onlyNumbers = e.target.value.replace(/\D/g, "");
                if (!onlyNumbers) {
                  setForm({ ...form, price: "" });
                } else {
                  setForm({
                    ...form,
                    price: (Number(onlyNumbers) / 100).toFixed(2),
                  });
                }
              }}
              placeholder="0,00"
              className="bg-muted/30 h-12 rounded-xl border-border/50 pl-11 font-bold text-lg text-foreground"
            />
          </div>
          {errors.price && (
            <p className="text-xs text-destructive">{errors.price}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> Validade do Pacote
            </span>
            <span className="text-[10px] text-muted-foreground">
              Máx: {MAX_VALIDITY_DAYS} dias
            </span>
          </Label>
          <div className="relative">
            <Input
              type="text"
              inputMode="numeric"
              value={form.validity_days}
              onChange={(e) => {
                let cleanDigit = e.target.value.replace(/\D/g, "");
                // Impede zero (se não digitou nada, deixa vazio)
                if (cleanDigit && Number(cleanDigit) === 0) cleanDigit = "";
                // Trava no limite
                if (Number(cleanDigit) > MAX_VALIDITY_DAYS)
                  cleanDigit = MAX_VALIDITY_DAYS.toString();

                setForm({ ...form, validity_days: cleanDigit });
              }}
              className="bg-muted/30 h-12 rounded-xl border-border/50 pr-14"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
              dias
            </span>
          </div>
        </div>
      </div>

      {/* SEÇÃO 4: STATUS (Switch) */}
      <div className="flex items-center justify-between py-6">
        <div className="flex flex-col gap-1 pr-4">
          <Label className="text-base font-bold text-foreground">
            Pacote Ativo
          </Label>
          <p className="text-sm text-muted-foreground leading-snug">
            Disponível para venda imediatamente.
          </p>
        </div>
        <Switch
          checked={form.active}
          onCheckedChange={(checked) => setForm({ ...form, active: checked })}
          className="data-[state=checked]:bg-primary"
        />
      </div>

      {/* BOTÕES DE AÇÃO */}
      <div className="flex items-center justify-end gap-3 pt-6 mt-auto md:mt-0">
        <Button
          asChild
          variant="ghost"
          className="hidden sm:flex rounded-xl h-12 font-medium"
        >
          <Link href="/admin/services?tab=packages">Cancelar</Link>
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto h-12 px-8 rounded-xl font-bold shadow-md transition-all hover:scale-[1.02] active:scale-95"
        >
          {loading ? (
            <LoaderDots className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Save className="mr-2 h-5 w-5" />
          )}
          {loading ? "Salvando..." : "Criar Pacote"}
        </Button>
      </div>
    </form>
  );
}

// components/packages/package-form.tsx
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
  Package,
  Layers,
  DollarSign,
  CalendarDays,
  Save,
  Loader2,
  Sparkles,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";

export function PackageForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);
  const [services, setServices] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    total_sessions: "10",
    price: "",
    validity_days: "90",
    active: true, // 🔥 Nome do campo sincronizado com o Prisma
    service_id: "", // 🔥 Campo obrigatório para o banco
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 1. Busca serviços para o catálogo de amarração
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
    if (!form.price || Number(form.price) <= 0) errs.price = "Preço inválido";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Preencha os campos obrigatórios.");
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
          active: form.active, // 🔥 Enviando o campo correto
          service_id: form.service_id, // 🔥 Enviando a amarração
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card className="border-0 shadow-none bg-transparent md:border md:shadow-sm md:bg-card">
        <CardHeader className="px-0 pt-0 md:pt-6 md:px-6 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Configuração do Pacote
          </CardTitle>
          <CardDescription>
            Vincule este pacote a um serviço base e defina as regras.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0 md:pb-6 md:px-6 flex flex-col gap-5">
          {/* SELEÇÃO DE SERVIÇO */}
          <div className="flex flex-col gap-2">
            <Label className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" /> Serviço
              Base *
            </Label>
            <Select
              value={form.service_id}
              onValueChange={(val) => setForm({ ...form, service_id: val })}
            >
              <SelectTrigger className="bg-muted/50 h-11">
                <SelectValue
                  placeholder={
                    loadingServices ? "Carregando..." : "Selecione o serviço..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.service_id && (
              <p className="text-xs text-destructive">{errors.service_id}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nome Comercial *</Label>
              <Input
                id="name"
                placeholder="Ex: Combo Fidelidade (10 sessões)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-muted/50 h-11"
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" /> Qtd.
                Sessões *
              </Label>
              <Input
                type="number"
                value={form.total_sessions}
                onChange={(e) =>
                  setForm({ ...form, total_sessions: e.target.value })
                }
                className="bg-muted/50 h-11 font-bold"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Detalhes sobre o que o pacote inclui..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="bg-muted/50 min-h-20"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-none bg-transparent md:border md:shadow-sm md:bg-card">
          <CardHeader className="px-0 pt-0 md:pt-6 md:px-6 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" /> Preço Total
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0 md:pb-6 md:px-6">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                R$
              </span>
              <Input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="bg-muted/50 h-11 pl-9 font-bold text-lg text-primary"
              />
            </div>
            {errors.price && (
              <p className="text-xs text-destructive mt-1">{errors.price}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-none bg-transparent md:border md:shadow-sm md:bg-card">
          <CardHeader className="px-0 pt-0 md:pt-6 md:px-6 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" /> Validade
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0 md:pb-6 md:px-6">
            <div className="relative">
              <Input
                type="number"
                value={form.validity_days}
                onChange={(e) =>
                  setForm({ ...form, validity_days: e.target.value })
                }
                className="bg-muted/50 h-11 pr-12"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                dias
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-none bg-transparent md:border md:shadow-sm md:bg-card">
        <CardContent className="px-0 pt-0 md:p-6 flex items-center justify-between">
          <div className="flex flex-col gap-1 pr-4">
            <Label className="flex items-center gap-2 text-base font-medium">
              Pacote Ativo
            </Label>
            <p className="text-sm text-muted-foreground">
              Disponível para venda imediatamente após salvar.
            </p>
          </div>
          <Switch
            checked={form.active}
            onCheckedChange={(checked) => setForm({ ...form, active: checked })}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
        <Button asChild variant="ghost" className="hidden sm:flex">
          <Link href="/admin/services?tab=packages">Cancelar</Link>
        </Button>
        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="w-full sm:w-auto px-10 font-bold shadow-md"
        >
          {loading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Save className="mr-2 h-5 w-5" />
          )}
          {loading ? "Salvando..." : "Criar Pacote"}
        </Button>
      </div>
    </form>
  );
}

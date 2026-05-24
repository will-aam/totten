"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Calendar } from "@/components/ui/calendar"; // O calendário bonito
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"; // O popup bonito
import {
  User,
  Phone,
  Package,
  LoaderDots,
  Pin,
  ChevronDown,
  CreditCard,
  Calendar as CalendarIcon, // O ícone
} from "@boxicons/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Máscaras
function formatCpfInput(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatPhoneInput(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function formatCepInput(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

type PackageTemplate = {
  id: string;
  name: string;
  total_sessions: number;
  price: number;
  description: string | null;
  service_id: string;
};

export function ClientForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [showMore, setShowMore] = useState(false);
  const [packageTemplates, setPackageTemplates] = useState<PackageTemplate[]>(
    [],
  );

  const [form, setForm] = useState({
    name: "",
    cpf: "",
    phone_whatsapp: "",
    email: "",
    birth_date: undefined as Date | undefined,
    zip_code: "",
    street: "",
    number: "",
    city: "",
    package_template_id: "none",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch("/api/package-templates?active=true");
        if (res.ok) {
          const data = await res.json();
          setPackageTemplates(data);
        }
      } catch (error) {
        console.error("Erro ao buscar pacotes:", error);
      } finally {
        setLoadingPackages(false);
      }
    };
    fetchTemplates();
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Nome é obrigatório";
    if (form.cpf.replace(/\D/g, "").length !== 11) errs.cpf = "CPF incompleto";
    if (form.phone_whatsapp.replace(/\D/g, "").length < 10)
      errs.phone_whatsapp = "WhatsApp inválido";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const clientRes = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          cpf: form.cpf,
          phone_whatsapp: form.phone_whatsapp,
          email: form.email || null,
          birth_date: form.birth_date
            ? format(form.birth_date, "yyyy-MM-dd")
            : null,
          zip_code: form.zip_code || null,
          street: form.street || null,
          number: form.number || null,
          city: form.city || null,
        }),
      });

      const clientData = await clientRes.json();
      if (!clientRes.ok)
        throw new Error(clientData.error || "Erro ao criar cliente");

      if (form.package_template_id !== "none") {
        const template = packageTemplates.find(
          (t) => t.id === form.package_template_id,
        );

        if (template) {
          const packageRes = await fetch("/api/packages/templates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              client_id: clientData.client.id,
              service_id: template.service_id,
              total_sessions: Number(template.total_sessions),
              price: Number(template.price),
            }),
          });

          if (!packageRes.ok) {
            const errorText = await packageRes.text();
            console.error("Erro detalhado da API de Pacotes:", errorText);
            throw new Error(
              "Cliente criado, mas falha ao gerar o pacote vinculado.",
            );
          }
        }
      }

      toast.success("Cadastro realizado com sucesso!");
      router.push("/admin/clients");
    } catch (error: any) {
      toast.error(error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const selectedTemplate = packageTemplates.find(
    (t) => t.id === form.package_template_id,
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 md:gap-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 items-start">
        {/* LADO ESQUERDO: Dados do Cliente (Flutuante / Flat) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 text-foreground mb-4">
              <User className="h-5 w-5 text-primary" /> Ficha da Cliente
            </h2>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Maria Oliveira"
                className="h-11 bg-muted/30 rounded-xl border-border/50"
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4" /> WhatsApp *
                </Label>
                <Input
                  value={form.phone_whatsapp}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone_whatsapp: formatPhoneInput(e.target.value),
                    })
                  }
                  placeholder="(00) 00000-0000"
                  className="h-11 bg-muted/30 rounded-xl border-border/50"
                />
                {errors.phone_whatsapp && (
                  <p className="text-xs text-destructive">
                    {errors.phone_whatsapp}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> CPF *
                </Label>
                <Input
                  value={form.cpf}
                  onChange={(e) =>
                    setForm({ ...form, cpf: formatCpfInput(e.target.value) })
                  }
                  placeholder="000.000.000-00"
                  className="h-11 bg-muted/30 rounded-xl border-border/50"
                />
                {errors.cpf && (
                  <p className="text-xs text-destructive">{errors.cpf}</p>
                )}
              </div>
            </div>

            <Collapsible
              open={showMore}
              onOpenChange={setShowMore}
              className="border-t border-border/50 pt-5 mt-2"
            >
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-between hover:bg-primary/5 rounded-xl h-12"
                >
                  <span className="text-muted-foreground font-medium">
                    {showMore
                      ? "Ocultar detalhes"
                      : "Ficha completa (Endereço, E-mail...)"}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      showMore && "rotate-180",
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-6 space-y-6">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label>Nascimento</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start h-11 bg-muted/30 border-border/50 rounded-xl font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                          {form.birth_date
                            ? format(form.birth_date, "dd/MM/yyyy")
                            : "Selecionar data"}
                        </Button>
                      </PopoverTrigger>
                      {/* AQUI ESTÁ O SEGREDO DO VISUAL BONITO DO POPOVER */}
                      <PopoverContent
                        className="w-auto p-0 rounded-3xl border-none shadow-2xl"
                        align="start"
                      >
                        {/* AQUI ESTÁ O SEGREDO DO CALENDÁRIO DA SHADCN */}
                        <Calendar
                          mode="single"
                          selected={form.birth_date}
                          onSelect={(d) => setForm({ ...form, birth_date: d })}
                          locale={ptBR}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      placeholder="email@exemplo.com"
                      className="h-11 bg-muted/30 rounded-xl border-border/50"
                    />
                  </div>
                </div>

                <div className="space-y-5 border-t border-border/50 pt-5">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                    <Pin className="h-4 w-4" /> Endereço
                  </h4>

                  <div className="grid sm:grid-cols-3 gap-5">
                    <div className="space-y-2 sm:col-span-1">
                      <Label>CEP</Label>
                      <Input
                        value={form.zip_code}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            zip_code: formatCepInput(e.target.value),
                          })
                        }
                        placeholder="00000-000"
                        className="h-11 bg-muted/30 rounded-xl border-border/50"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Cidade</Label>
                      <Input
                        value={form.city}
                        onChange={(e) =>
                          setForm({ ...form, city: e.target.value })
                        }
                        className="h-11 bg-muted/30 rounded-xl border-border/50"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-5">
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Rua / Logradouro</Label>
                      <Input
                        value={form.street}
                        onChange={(e) =>
                          setForm({ ...form, street: e.target.value })
                        }
                        placeholder="Ex: Avenida Beira Mar"
                        className="h-11 bg-muted/30 rounded-xl border-border/50"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-1">
                      <Label>Número</Label>
                      <Input
                        value={form.number}
                        onChange={(e) =>
                          setForm({ ...form, number: e.target.value })
                        }
                        placeholder="Ex: 123"
                        className="h-11 bg-muted/30 rounded-xl border-border/50"
                      />
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        {/* LADO DIREITO: Pacote Inicial (Highlight Box) */}
        <div className="lg:col-span-1">
          <div className="flex flex-col gap-5 p-5 md:p-6 rounded-2xl bg-muted/20 border border-border/50 sticky top-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Package className="h-5 w-5 text-primary" /> Pacote Inicial
              </h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Escolha um Pacote do Catálogo</Label>
                <Select
                  value={form.package_template_id}
                  onValueChange={(v) =>
                    setForm({ ...form, package_template_id: v })
                  }
                >
                  <SelectTrigger className="h-11 bg-background border-border/50 rounded-xl">
                    <SelectValue placeholder="Selecione um pacote..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum pacote agora</SelectItem>
                    {packageTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTemplate && (
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-3 animate-in fade-in zoom-in-95 duration-200 mt-2">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    Resumo Selecionado
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">
                      {selectedTemplate.name}
                    </p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Total de sessões:</span>
                      <span className="font-bold text-foreground">
                        {selectedTemplate.total_sessions} sessões
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground border-t border-primary/10 pt-2 mt-2">
                      <span>Valor do Pacote:</span>
                      <span className="text-lg font-black text-primary">
                        {formatCurrency(Number(selectedTemplate.price))}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RODAPÉ: Botões de Ação */}
      <div className="flex flex-col sm:flex-row gap-3 pt-8 border-t border-border/50">
        <Button
          asChild
          variant="ghost"
          className="h-12 rounded-xl font-medium order-2 sm:order-1"
        >
          <Link href="/admin/clients">Cancelar</Link>
        </Button>

        <Button
          type="submit"
          disabled={loading}
          className="h-12 rounded-xl font-bold shadow-md transition-all hover:scale-[1.02] active:scale-95 order-1 sm:order-2 w-full sm:w-auto"
        >
          {loading ? (
            <>
              <LoaderDots className="mr-2 h-5 w-5 animate-spin" /> Salvando...
            </>
          ) : (
            "Finalizar Cadastro"
          )}
        </Button>
      </div>
    </form>
  );
}

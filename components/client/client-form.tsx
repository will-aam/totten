"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  User,
  CreditCard,
  Phone,
  Package,
  Loader2,
  CheckCircle2,
  Mail,
  CalendarDays,
  MapPin,
  ChevronDown,
  Sparkles,
  CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Máscaras
function formatCpfInput(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatPhoneInput(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function formatCepInput(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// Tipo do serviço
type Service = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  category: { name: string };
};

export function ClientForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);
  const [showMore, setShowMore] = useState(false);
  const [services, setServices] = useState<Service[]>([]);

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
    service_id: "none",
    total_sessions: "10",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Busca serviços ao carregar
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch("/api/services");
        if (res.ok) {
          const data = await res.json();
          setServices(data);
        }
      } catch (error) {
        console.error("Erro ao buscar serviços:", error);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  // Calcula o preço do pacote automaticamente
  const calculatePackagePrice = (): number => {
    if (!form.service_id || form.service_id === "none" || !form.total_sessions)
      return 0;

    const service = services.find((s) => s.id === form.service_id);
    if (!service) return 0;

    const sessions = Number(form.total_sessions);
    const pricePerSession = Number(service.price);
    const subtotal = sessions * pricePerSession;

    // Aplica desconto baseado na quantidade
    let discount = 0;
    if (sessions >= 20) discount = 0.15;
    else if (sessions >= 10) discount = 0.1;
    else if (sessions >= 5) discount = 0.05;

    return subtotal * (1 - discount);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Nome é obrigatório";

    if (form.cpf.replace(/\D/g, "").length !== 11) {
      errs.cpf = "CPF inválido ou incompleto";
    }

    if (form.phone_whatsapp.replace(/\D/g, "").length < 10) {
      errs.phone_whatsapp = "Telefone inválido";
    }

    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Formato inválido";
    }

    // Valida pacote SE um serviço foi selecionado
    if (form.service_id && form.service_id !== "none") {
      if (!form.total_sessions || Number(form.total_sessions) < 1) {
        errs.total_sessions = "Mín. 1 sessão";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // 1. Cria o cliente
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
          city: form.city || null,
          street: form.street || null,
          number: form.number || null,
        }),
      });

      const clientData = await clientRes.json();

      if (!clientRes.ok) {
        toast.error(clientData.error || "Erro ao cadastrar cliente");
        setLoading(false);
        return;
      }

      // 2. Se selecionou um serviço (diferente de "none"), cria o pacote
      if (form.service_id && form.service_id !== "none") {
        const packageRes = await fetch("/api/packages/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: clientData.client.id,
            service_id: form.service_id,
            total_sessions: Number(form.total_sessions),
            price: calculatePackagePrice(),
          }),
        });

        if (!packageRes.ok) {
          toast.error("Cliente criado, mas erro ao criar pacote");
          router.push("/admin/clients");
          return;
        }
      }

      toast.success(
        form.service_id && form.service_id !== "none"
          ? "Cliente e pacote cadastrados com sucesso!"
          : "Cliente cadastrado com sucesso!",
      );
      router.push("/admin/clients");
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  const selectedService = services.find((s) => s.id === form.service_id);
  const packagePrice = calculatePackagePrice();

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 items-start">
        {/* COLUNA ESQUERDA: Dados do Cliente */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card className="border-0 shadow-none bg-transparent md:border md:shadow-sm md:bg-card">
            <CardHeader className="px-0 pt-0 md:pt-6 md:px-6 pb-3 md:pb-6">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Ficha do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0 md:pb-6 md:px-6 flex flex-col gap-4 md:gap-5">
              {/* NOME */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="name" className="text-foreground font-medium">
                  Nome Completo *
                </Label>
                <Input
                  id="name"
                  placeholder="Ex: Maria Silva"
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

              {/* WHATSAPP e CPF */}
              <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="phone"
                    className="flex items-center gap-2 text-foreground font-medium"
                  >
                    <Phone className="h-4 w-4 text-muted-foreground" /> WhatsApp
                    *
                  </Label>
                  <Input
                    id="phone"
                    placeholder="(00) 90000-0000"
                    value={form.phone_whatsapp}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        phone_whatsapp: formatPhoneInput(e.target.value),
                      })
                    }
                    className="bg-muted/50 border-border/50 h-11"
                  />
                  {errors.phone_whatsapp && (
                    <p className="text-xs font-medium text-destructive ml-1">
                      {errors.phone_whatsapp}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="cpf"
                    className="flex items-center gap-2 text-foreground font-medium"
                  >
                    <CreditCard className="h-4 w-4 text-muted-foreground" /> CPF
                    *
                  </Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={form.cpf}
                    onChange={(e) =>
                      setForm({ ...form, cpf: formatCpfInput(e.target.value) })
                    }
                    className="bg-muted/50 border-border/50 font-mono h-11"
                  />
                  {errors.cpf && (
                    <p className="text-xs font-medium text-destructive ml-1">
                      {errors.cpf}
                    </p>
                  )}
                </div>
              </div>

              {/* CAMPOS ADICIONAIS (Collapsible) */}
              <Collapsible
                open={showMore}
                onOpenChange={setShowMore}
                className="mt-2 w-full border-t border-border/50 pt-4"
              >
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full flex justify-between items-center text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl"
                  >
                    <span className="font-medium">
                      {showMore
                        ? "Ocultar campos adicionais"
                        : "Preencher ficha completa"}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${showMore ? "rotate-180" : ""}`}
                    />
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="pt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  {/* ANIVERSÁRIO E EMAIL */}
                  <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
                    <div className="flex flex-col gap-2">
                      <Label
                        htmlFor="birth_date"
                        className="flex items-center gap-2 text-foreground font-medium"
                      >
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        Nascimento
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "justify-start text-left font-normal bg-muted/50 h-11",
                              !form.birth_date && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {form.birth_date ? (
                              format(form.birth_date, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={form.birth_date}
                            onSelect={(date) =>
                              setForm({ ...form, birth_date: date })
                            }
                            initialFocus
                            locale={ptBR}
                            defaultMonth={new Date(2000, 0)}
                            captionLayout="dropdown-buttons"
                            fromYear={1920}
                            toYear={new Date().getFullYear()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label
                        htmlFor="email"
                        className="flex items-center gap-2 text-foreground font-medium"
                      >
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        E-mail
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="cliente@email.com"
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        className="bg-muted/50 border-border/50 h-11"
                      />
                      {errors.email && (
                        <p className="text-xs font-medium text-destructive ml-1">
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ENDEREÇO */}
                  <div className="flex flex-col gap-2">
                    <Label className="flex items-center gap-2 text-foreground font-medium mb-1 mt-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      Endereço
                    </Label>
                    <div className="grid grid-cols-3 gap-3">
                      <Input
                        placeholder="CEP"
                        value={form.zip_code}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            zip_code: formatCepInput(e.target.value),
                          })
                        }
                        className="col-span-1 bg-muted/50 h-11"
                      />
                      <Input
                        placeholder="Cidade/UF"
                        value={form.city}
                        onChange={(e) =>
                          setForm({ ...form, city: e.target.value })
                        }
                        className="col-span-2 bg-muted/50 h-11"
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <Input
                        placeholder="Rua / Avenida"
                        value={form.street}
                        onChange={(e) =>
                          setForm({ ...form, street: e.target.value })
                        }
                        className="col-span-3 bg-muted/50 h-11"
                      />
                      <Input
                        placeholder="Nº"
                        value={form.number}
                        onChange={(e) =>
                          setForm({ ...form, number: e.target.value })
                        }
                        className="col-span-1 bg-muted/50 h-11"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        </div>

        {/* COLUNA DIREITA: Pacote Inicial (OPCIONAL) */}
        <Card className="lg:col-span-1 border-0 shadow-none bg-transparent md:border md:shadow-sm md:bg-card mt-2 lg:mt-0 sticky top-4">
          <CardHeader className="px-0 pt-0 md:pt-6 md:px-6 pb-3 md:pb-6">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Pacote Inicial
              <span className="text-xs font-normal text-muted-foreground ml-auto">
                (Opcional)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0 md:pb-6 md:px-6 flex flex-col gap-4">
            {/* SELECT DE SERVIÇO */}
            <div className="flex flex-col gap-2">
              <Label className="text-foreground font-medium">
                Tipo de Serviço
              </Label>
              {loadingServices ? (
                <div className="h-11 bg-muted/50 rounded-md animate-pulse" />
              ) : (
                <Select
                  value={form.service_id}
                  onValueChange={(value) =>
                    setForm({ ...form, service_id: value })
                  }
                >
                  <SelectTrigger className="bg-muted/50 h-11">
                    <SelectValue placeholder="Selecione o serviço (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground text-center">
                        Nenhum serviço cadastrado.
                        <br />
                        <Link
                          href="/admin/services/new"
                          className="text-primary hover:underline font-medium"
                        >
                          Cadastre o primeiro serviço
                        </Link>
                      </div>
                    ) : (
                      <>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">
                            Sem pacote inicial
                          </span>
                        </SelectItem>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {service.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatCurrency(Number(service.price))}/sessão
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              )}
              {errors.service_id && (
                <p className="text-xs font-medium text-destructive ml-1">
                  {errors.service_id}
                </p>
              )}
            </div>

            {/* CAMPOS DE PACOTE (SÓ APARECEM SE SELECIONOU UM SERVIÇO) */}
            {form.service_id && form.service_id !== "none" && (
              <div className="flex flex-col gap-4 animate-in slide-in-from-top-2">
                {/* QUANTIDADE DE SESSÕES */}
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground font-medium">
                    Quantidade de Sessões
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={form.total_sessions}
                    onChange={(e) =>
                      setForm({ ...form, total_sessions: e.target.value })
                    }
                    className="bg-background border-border/50 h-14 text-2xl font-black text-center"
                  />
                  {errors.total_sessions && (
                    <p className="text-xs font-medium text-destructive text-center">
                      {errors.total_sessions}
                    </p>
                  )}
                </div>

                {/* PREVIEW DO PACOTE */}
                {selectedService && form.total_sessions && (
                  <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-2">
                    <div className="flex items-center gap-2 text-primary text-sm font-medium">
                      <Sparkles className="h-4 w-4" />
                      Resumo do Pacote
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>
                        {form.total_sessions}x {selectedService.name}
                      </p>
                      <p>{selectedService.duration} min por sessão</p>
                      <p className="font-mono">
                        Valor unitário:{" "}
                        {formatCurrency(Number(selectedService.price))}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-primary/10">
                      <p className="text-lg font-black text-foreground">
                        Total: {formatCurrency(packagePrice)}
                      </p>
                      {Number(form.total_sessions) >= 5 && (
                        <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Desconto aplicado
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RODAPÉ */}
      <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-border/50">
        <Button
          asChild
          variant="ghost"
          type="button"
          className="hidden sm:flex text-muted-foreground rounded-full md:rounded-md"
        >
          <Link href="/admin/clients">Cancelar</Link>
        </Button>
        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="w-full sm:w-auto py-6 rounded-full md:rounded-md shadow-sm hover:shadow-md transition-all active:scale-[0.98] font-semibold text-base"
        >
          {loading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-2 h-5 w-5" />
          )}
          {loading ? "Salvando..." : "Finalizar Cadastro"}
        </Button>
      </div>
    </form>
  );
}

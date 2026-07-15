// app/(private)/admin/clients/_components/client-form.tsx
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
import {
  User,
  Phone,
  Package,
  LoaderDots,
  Pin,
  ChevronDown,
  CreditCard,
} from "@boxicons/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

import { getPaymentMethods } from "@/app/actions/payment-methods";
import { OrganizationPaymentMethod } from "@/types/finance";
import { apiClient } from "@/lib/api-client";

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

// Máscara Dinâmica para a Data de Nascimento
function formatDateInput(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
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
  const [loadingCep, setLoadingCep] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [packageTemplates, setPackageTemplates] = useState<PackageTemplate[]>(
    [],
  );

  // Formas de pagamento
  const [paymentMethods, setPaymentMethods] = useState<
    OrganizationPaymentMethod[]
  >([]);

  // Estados de venda
  const [payUpfront, setPayUpfront] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [generateInstallments, setGenerateInstallments] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState<number>(2);

  // Estados para o campo dinâmico de Nascimento
  const [birthDateStr, setBirthDateStr] = useState("");

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
    const loadData = async () => {
      try {
        const [templatesData, methodsData] = await Promise.all([
          apiClient<PackageTemplate[]>("package-templates", {
            params: { active: "true" },
          }),
          getPaymentMethods(),
        ]);

        setPackageTemplates(templatesData);
        setPaymentMethods(methodsData as OrganizationPaymentMethod[]);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoadingPackages(false);
      }
    };

    loadData();
  }, []);

  // Reset opções quando usuário escolhe "Nenhum pacote agora"
  useEffect(() => {
    if (form.package_template_id === "none") {
      setPayUpfront(false);
      setSelectedMethod("");
      setGenerateInstallments(false);
      setInstallmentsCount(2);
    }
  }, [form.package_template_id]);

  const handleCepLookup = async (cep: string) => {
    const rawCep = cep.replace(/\D/g, "");
    if (rawCep.length === 8) {
      setLoadingCep(true);
      try {
        // Mantemos o fetch nativo aqui pois é uma API externa
        const res = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
        const data = await res.json();

        if (!data.erro) {
          setForm((prev) => ({
            ...prev,
            street: data.logradouro || prev.street,
            city: `${data.localidade} - ${data.uf}` || prev.city,
          }));
          toast.success("Endereço encontrado!");
        } else {
          toast.error("CEP não encontrado.");
        }
      } catch (error) {
        toast.error("Erro ao buscar o endereço.");
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Nome é obrigatório";

    const cpfLimpo = form.cpf.replace(/\D/g, "");
    if (cpfLimpo.length > 0 && cpfLimpo.length !== 11) {
      errs.cpf = "CPF incompleto";
    }

    if (form.phone_whatsapp.replace(/\D/g, "").length < 10)
      errs.phone_whatsapp = "WhatsApp inválido";

    // Validações extras se vender pacote
    if (form.package_template_id !== "none") {
      if (payUpfront && !selectedMethod) {
        errs.payment_method = "Selecione a forma de pagamento.";
      }
      if (!payUpfront && generateInstallments) {
        if (installmentsCount < 2 || installmentsCount > 48) {
          errs.installments = "O número de parcelas deve ser entre 2 e 48.";
        }
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
      // 1) cria cliente utilizando apiClient
      const clientData = await apiClient<{ client: { id: string } }>(
        "clients",
        {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            cpf: form.cpf.trim() !== "" ? form.cpf : null,
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
        },
      );

      // 2) cria pacote vinculado, se houver
      if (form.package_template_id !== "none") {
        const template = packageTemplates.find(
          (t) => t.id === form.package_template_id,
        );

        if (template) {
          await apiClient("packages", {
            method: "POST",
            body: JSON.stringify({
              client_id: clientData.client.id,
              service_id: template.service_id,
              total_sessions: Number(template.total_sessions),
              price: Number(template.price),
              pay_upfront: payUpfront,
              payment_method: payUpfront ? selectedMethod : null,
              generate_installments: !payUpfront ? generateInstallments : false,
              installments_count: installmentsCount,
              package_template_id: template.id,
            }),
          });
        }
      }

      toast.success("Cadastro realizado com sucesso!");
      router.push("/admin/clients");
    } catch (error: any) {
      // O apiClient já formata o erro corretamente lançando a mensagem tratada
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
                  <CreditCard className="h-4 w-4" /> CPF
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
                  className="w-full justify-between bg-primary/5 rounded-xl h-12"
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
                  {/*  BLOCO DE NASCIMENTO LIMPO (SÓ DIGITAÇÃO) */}
                  <div className="space-y-2">
                    <Label>Nascimento</Label>
                    <Input
                      placeholder="DD/MM/AAAA"
                      value={birthDateStr}
                      maxLength={10}
                      onChange={(e) => {
                        const val = formatDateInput(e.target.value);
                        setBirthDateStr(val);
                        if (val.length === 10) {
                          const [day, month, year] = val.split("/");
                          const dateObj = new Date(
                            Number(year),
                            Number(month) - 1,
                            Number(day),
                          );
                          // Validação básica se a data é minimamente coerente
                          if (
                            !isNaN(dateObj.getTime()) &&
                            dateObj.getFullYear() > 1900 &&
                            dateObj.getFullYear() <= new Date().getFullYear()
                          ) {
                            setForm({ ...form, birth_date: dateObj });
                          } else {
                            setForm({ ...form, birth_date: undefined });
                          }
                        } else {
                          setForm({ ...form, birth_date: undefined });
                        }
                      }}
                      className="h-11 bg-muted/30 rounded-xl border-border/50 w-full"
                    />
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
                    <div className="space-y-2 sm:col-span-1 relative">
                      <Label>
                        CEP
                        {loadingCep && (
                          <LoaderDots className="inline-block ml-2 h-3 w-3 animate-spin text-primary" />
                        )}
                      </Label>
                      <Input
                        value={form.zip_code}
                        onChange={(e) => {
                          const val = formatCepInput(e.target.value);
                          setForm({ ...form, zip_code: val });
                          handleCepLookup(val);
                        }}
                        placeholder="00000-000"
                        className="h-11 bg-muted/30 rounded-xl border-border/50"
                        maxLength={9}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Cidade</Label>
                      <Input
                        value={form.city}
                        onChange={(e) =>
                          setForm({ ...form, city: e.target.value })
                        }
                        placeholder="Ex: Aracaju - SE"
                        className="h-11 bg-muted/30 rounded-xl border-border/50"
                        disabled={loadingCep}
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-5">
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Rua</Label>
                      <Input
                        value={form.street}
                        onChange={(e) =>
                          setForm({ ...form, street: e.target.value })
                        }
                        placeholder="Ex: Avenida Beira Mar"
                        className="h-11 bg-muted/30 rounded-xl border-border/50"
                        disabled={loadingCep}
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

        {/* ✅ Pacote inicial robusto */}
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
                  disabled={loadingPackages || loading}
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

              {/* ✅ Opções avançadas só quando tem pacote */}
              {selectedTemplate && (
                <div className="space-y-4 border-t border-border/50 pt-4">
                  <div className="flex items-center justify-between rounded-xl border border-border/50 p-3 bg-muted/20">
                    <div className="space-y-0.5 pr-4">
                      <Label className="text-sm font-bold">
                        Pagar Pacote à Vista?
                      </Label>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        Registra o valor total no caixa agora.
                      </p>
                    </div>

                    <Switch
                      checked={payUpfront}
                      onCheckedChange={(val) => {
                        setPayUpfront(val);
                        if (val) setGenerateInstallments(false);
                      }}
                      disabled={loading}
                    />
                  </div>

                  {payUpfront && (
                    <div className="flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        Forma de Pagamento
                      </Label>

                      <Select
                        value={selectedMethod}
                        onValueChange={setSelectedMethod}
                        disabled={loading}
                      >
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="Como o cliente está pagando?" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods
                            .filter((pm) => pm.isActive)
                            .map((pm) => (
                              <SelectItem key={pm.id} value={pm.type}>
                                {pm.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>

                      {errors.payment_method && (
                        <p className="text-xs text-destructive">
                          {errors.payment_method}
                        </p>
                      )}
                    </div>
                  )}

                  {!payUpfront && (
                    <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center justify-between rounded-xl border border-border/50 p-3 bg-amber-500/10 dark:bg-amber-500/5">
                        <div className="space-y-0.5 pr-4">
                          <Label className="text-sm font-bold text-amber-700 dark:text-amber-500">
                            Gerar Contas a Receber?
                          </Label>
                          <p className="text-[11px] text-amber-600/80 dark:text-amber-500/80 leading-tight">
                            Cria parcelas mensais pendentes.
                          </p>
                        </div>

                        <Switch
                          checked={generateInstallments}
                          onCheckedChange={setGenerateInstallments}
                          disabled={loading}
                        />
                      </div>

                      {generateInstallments && (
                        <div className="flex flex-col gap-2">
                          <Label className="text-xs font-bold uppercase text-muted-foreground">
                            Quantidade de Parcelas
                          </Label>

                          <Input
                            type="number"
                            inputMode="numeric"
                            min={2}
                            max={48}
                            step={1}
                            value={installmentsCount}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "") {
                                setInstallmentsCount(0);
                                return;
                              }
                              let num = parseInt(value, 10);
                              if (isNaN(num)) return;
                              if (num < 2) num = 2;
                              if (num > 48) num = 48;
                              setInstallmentsCount(num);
                            }}
                            onWheel={(e) => e.currentTarget.blur()}
                            onKeyDown={(e) => {
                              if (
                                e.key === "ArrowUp" ||
                                e.key === "ArrowDown"
                              ) {
                                e.preventDefault();
                              }
                            }}
                            disabled={loading}
                            className="h-11 rounded-xl w-32 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />

                          {errors.installments && (
                            <p className="text-xs text-destructive">
                              {errors.installments}
                            </p>
                          )}

                          {installmentsCount >= 2 && (
                            <p className="text-xs text-muted-foreground mt-1 font-medium">
                              Serão geradas {installmentsCount} parcelas de{" "}
                              {formatCurrency(
                                Number(selectedTemplate.price) /
                                  installmentsCount,
                              )}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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

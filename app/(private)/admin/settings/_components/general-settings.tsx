"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Repeat,
  LoaderDots,
  Save,
  Search,
} from "@boxicons/react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { apiClient, ApiError } from "@/lib/api-client";
import { updateSettingsAction } from "@/app/actions/settings";

interface GeneralSettingsResponse {
  companyName: string;
  responsibleName: string;
  document: string;
  contactPhone: string;
  whatsapp: string;
  address: string;
}

export function GeneralSettings() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [docType, setDocType] = useState<"CNPJ" | "CPF">("CNPJ");

  const [formData, setFormData] = useState({
    companyName: "",
    responsibleName: "",
    document: "",
    contactPhone: "",
    whatsapp: "",
    address: "",
  });

  const [cpfCache, setCpfCache] = useState("");
  const [cnpjCache, setCnpjCache] = useState("");

  const [cep, setCep] = useState("");
  const [searchingCep, setSearchingCep] = useState(false);

  const handleCepSearch = async () => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) {
      toast.error("CEP inválido (deve conter 8 dígitos)");
      return;
    }

    setSearchingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }

      const newAddress = `${data.logradouro},  - ${data.bairro}, ${data.localidade}/${data.uf}`;
      setFormData((prev) => ({ ...prev, address: newAddress }));
      toast.success("Endereço preenchido! Complete com o número.");
    } catch {
      toast.error("Erro ao buscar CEP");
    } finally {
      setSearchingCep(false);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await apiClient<GeneralSettingsResponse>("settings");

        setFormData({
          companyName: data.companyName || "",
          responsibleName: data.responsibleName || "",
          document: data.document || "",
          contactPhone: data.contactPhone || "",
          whatsapp: data.whatsapp || "",
          address: data.address || "",
        });
        const cleanDoc = data.document?.replace(/\D/g, "") || "";
        if (cleanDoc.length > 0) {
          if (cleanDoc.length <= 11) {
            setDocType("CPF");
            setCpfCache(data.document);
          } else {
            setDocType("CNPJ");
            setCnpjCache(data.document);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar configurações:", error);
        if (error instanceof ApiError) {
          toast.error("Erro ao carregar configurações");
        } else {
          toast.error("Erro de conexão");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [session]);

  const formatPhone = (value: string) => {
    let v = value.replace(/\D/g, "");
    if (v.length <= 10) {
      v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
      v = v.replace(/(\d{4})(\d)/g, "$1-$2");
    } else {
      v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
      v = v.replace(/(\d{5})(\d)/g, "$1-$2");
    }
    return v.slice(0, 15);
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (docType === "CPF") {
      v = v.slice(0, 11);
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      setFormData({ ...formData, document: v });
      setCpfCache(v);
    } else {
      v = v.slice(0, 14);
      v = v.replace(/^(\d{2})(\d)/, "$1.$2");
      v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
      v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
      v = v.replace(/(\d{4})(\d)/, "$1-$2");
      setFormData({ ...formData, document: v });
      setCnpjCache(v);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, contactPhone: formatPhone(e.target.value) });
  };

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, whatsapp: formatPhone(e.target.value) });
  };

  const toggleDocType = () => {
    if (docType === "CNPJ") {
      setDocType("CPF");
      setFormData({ ...formData, document: cpfCache });
    } else {
      setDocType("CNPJ");
      setFormData({ ...formData, document: cnpjCache });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateSettingsAction(formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.success) {
        toast.success("Configurações salvas com sucesso!");
      }
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro de conexão com o servidor");
    } finally {
      setSaving(false);
    }
  };

  // Skeleton state conforme diretriz pages-standard.md
  if (loading) {
    return (
      <Card className="rounded-2xl md:rounded-3xl border border-border/60 bg-card shadow-xs overflow-hidden">
        <CardHeader className="p-5 md:p-6 border-b border-border/40 bg-muted/10">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-44 rounded-lg" />
              <Skeleton className="h-4 w-72 rounded-lg" />
            </div>
            <Skeleton className="hidden md:block h-11 w-36 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="p-5 md:p-6 grid gap-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-36 rounded-md" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
          <Skeleton className="h-28 w-full rounded-2xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl md:rounded-3xl border border-border/60 bg-card shadow-xs overflow-hidden">
      <CardHeader className="p-5 md:p-6 border-b border-border/40 bg-muted/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold tracking-tight text-foreground">
              Dados da Empresa
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              Configure as informações principais da sua empresa.
            </CardDescription>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="hidden md:flex h-11 px-6 font-semibold rounded-full shadow-sm"
          >
            {saving ? (
              <>
                <LoaderDots className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-5 md:p-6 grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="companyName" className="font-medium text-sm">
            Nome da Empresa
          </Label>
          <Input
            id="companyName"
            value={formData.companyName}
            onChange={(e) =>
              setFormData({ ...formData, companyName: e.target.value })
            }
            placeholder="Ex: Clínica Bem-Estar LTDA"
            required
            minLength={3}
            maxLength={30}
            className="rounded-xl h-10"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="responsibleName" className="font-medium text-sm">
              Nome Completo do Responsável
            </Label>
            <Input
              id="responsibleName"
              value={formData.responsibleName}
              onChange={(e) =>
                setFormData({ ...formData, responsibleName: e.target.value })
              }
              placeholder="Ex: Maria da Silva"
              className="rounded-xl h-10"
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="document" className="font-medium text-sm">{docType}</Label>
              <button
                type="button"
                onClick={toggleDocType}
                className="text-[11px] text-primary flex items-center gap-1 hover:underline font-semibold uppercase tracking-wider"
              >
                <Repeat className="h-3 w-3" />
                Mudar para {docType === "CNPJ" ? "CPF" : "CNPJ"}
              </button>
            </div>
            <Input
              id="document"
              value={formData.document}
              onChange={handleDocumentChange}
              placeholder={
                docType === "CNPJ" ? "00.000.000/0001-00" : "000.000.000-00"
              }
              className="rounded-xl h-10"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="contactPhone" className="font-medium text-sm">Telefone Fixo / Outro</Label>
            <Input
              id="contactPhone"
              value={formData.contactPhone}
              onChange={handlePhoneChange}
              placeholder="(00) 0000-0000"
              maxLength={15}
              className="rounded-xl h-10"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="whatsapp" className="font-medium text-sm">WhatsApp Principal</Label>
            <Input
              id="whatsapp"
              value={formData.whatsapp}
              onChange={handleWhatsappChange}
              placeholder="(00) 00000-0000"
              maxLength={15}
              className="rounded-xl h-10"
            />
          </div>
        </div>

        {/* Localização e Endereço */}
        <div className="flex flex-col gap-4 p-4 md:p-5 rounded-2xl border border-border/50 bg-muted/20">
          <div className="grid gap-2">
            <Label htmlFor="cep" className="font-medium text-sm">Buscar por CEP</Label>
            <div className="flex gap-2">
              <Input
                id="cep"
                value={cep}
                onChange={(e) => {
                  let v = e.target.value.replace(/\D/g, "");
                  if (v.length > 5) v = v.replace(/^(\d{5})(\d)/, "$1-$2");
                  setCep(v.slice(0, 9));
                }}
                placeholder="00000-000"
                className="max-w-[150px] rounded-xl h-10"
                onKeyDown={(e) => e.key === "Enter" && handleCepSearch()}
              />
              <Button
                type="button"
                onClick={handleCepSearch}
                disabled={searchingCep}
                variant="secondary"
                className="rounded-xl h-10 px-4"
              >
                {searchingCep ? (
                  <LoaderDots className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address" className="font-medium text-sm">Endereço Completo</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Ex: Rua das Flores, 123 - Centro, São Paulo/SP"
              className="rounded-xl h-10"
            />
          </div>
        </div>
      </CardContent>

      {/* Botão flutuante mobile circular padrão */}
      <button
        type="button"
        onClick={handleSave}
        disabled={loading || saving}
        className="md:hidden fixed bottom-28 right-6 h-14 w-14 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl transition-transform duration-300 z-50 hover:scale-105 active:scale-95"
        aria-label="Salvar configurações"
      >
        {saving ? (
          <LoaderDots className="h-6 w-6 animate-spin" />
        ) : (
          <Save className="h-6 w-6" strokeWidth={2.5} />
        )}
      </button>
    </Card>
  );
}

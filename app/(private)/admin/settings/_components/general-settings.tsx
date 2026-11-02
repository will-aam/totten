"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import useSWR from "swr";
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
import { Eraser } from "@boxicons/react";
import { apiClient } from "@/lib/api-client";
import { updateSettingsAction } from "@/app/actions/settings";
import { FloatingSaveButton } from "./floating-save-button";

interface GeneralSettingsResponse {
  companyName: string;
  responsibleName: string;
  document: string;
  contactPhone: string;
  whatsapp: string;
  address: string;
}

interface BrasilApiCnpjResponse {
  razao_social: string;
  nome_fantasia?: string;
  ddd_telefone_1?: string;
  ddd_telefone_2?: string;
  cep?: string;
  descricao_tipo_de_logradouro?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  qsa?: Array<{
    nome_socio?: string;
    qualificacao_socio?: string;
  }>;
}

/**
 * Converte texto para Title Case:
 * - Primeira letra de cada palavra maiúscula, restante minúscula.
 * - Mantém preposições em minúsculo (de, da, do, e, etc.).
 * - Mantém siglas empresariais em maiúsculo (LTDA, S.A., ME, EPP, EIRELI, etc.).
 * - Mantém siglas de estados (UF) em maiúsculo (SP, RJ, SE, etc.).
 */
export function toTitleCase(text: string): string {
  if (!text) return "";

  const lowerCaseWords = new Set([
    "de", "da", "do", "das", "dos",
    "e", "em", "na", "no", "nas", "nos",
    "a", "o", "as", "os", "ao", "aos",
    "por", "para", "com", "sob", "sobre",
  ]);

  const upperCaseWords = new Set([
    "ltda", "ltda.", "sa", "s.a.", "s/a", "me", "epp", "eireli", "cnpj", "cpf", "cep", "ss", "s/s",
  ]);

  const ufs = new Set([
    "ac", "al", "ap", "am", "ba", "ce", "df", "es", "go", "ma",
    "mt", "ms", "mg", "pa", "pb", "pr", "pe", "pi", "rj", "rn",
    "rs", "ro", "rr", "sc", "sp", "se", "to",
  ]);

  return text
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      const cleanWord = word.replace(/[^a-zA-Z]/g, "").toLowerCase();

      // Siglas empresariais
      if (upperCaseWords.has(cleanWord)) {
        return word.toUpperCase();
      }

      // UF isolada
      if (ufs.has(cleanWord) && cleanWord.length === 2 && word.length <= 4) {
        return word.toUpperCase();
      }

      // Preposições (exceto se for a primeira palavra)
      if (index > 0 && lowerCaseWords.has(cleanWord)) {
        return word.toLowerCase();
      }

      // Cidade/UF separada por barra (Ex: Aracaju/SE)
      if (word.includes("/")) {
        return word
          .split("/")
          .map((part) => {
            const cleanPart = part.replace(/[^a-zA-Z]/g, "").toLowerCase();
            if (ufs.has(cleanPart)) return part.toUpperCase();
            return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
          })
          .join("/");
      }

      // Palavras com hífen (Ex: Bem-Estar)
      if (word.includes("-")) {
        return word
          .split("-")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join("-");
      }

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

export function GeneralSettings() {
  // SWR: Cache global em memória para evitar requisições repetidas ao alternar tabs
  const {
    data: settingsData,
    isLoading,
    mutate: mutateSettings,
  } = useSWR<GeneralSettingsResponse>("settings", apiClient, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    dedupingInterval: 60000,
  });

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
  const [searchingCnpj, setSearchingCnpj] = useState(false);
  const lastSearchedCnpjRef = useRef("");

  // Sincroniza formulário com o cache do SWR sem disparar requisições extras
  useEffect(() => {
    if (settingsData) {
      setFormData({
        companyName: settingsData.companyName || "",
        responsibleName: settingsData.responsibleName || "",
        document: settingsData.document || "",
        contactPhone: settingsData.contactPhone || "",
        whatsapp: settingsData.whatsapp || "",
        address: settingsData.address || "",
      });

      const cleanDoc = settingsData.document?.replace(/\D/g, "") || "";
      if (cleanDoc.length > 0) {
        if (cleanDoc.length <= 11) {
          setDocType("CPF");
          setCpfCache(settingsData.document);
        } else {
          setDocType("CNPJ");
          setCnpjCache(settingsData.document);
        }
      }
    }
  }, [settingsData]);

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

  const formatCep = (value: string) => {
    let v = value.replace(/\D/g, "").slice(0, 8);
    if (v.length > 5) v = v.replace(/^(\d{5})(\d)/, "$1-$2");
    return v;
  };

  // Automação BrasilAPI: Busca dados cadastrais da empresa pelo CNPJ
  const searchCnpjData = useCallback(async (cleanCnpj: string) => {
    if (cleanCnpj.length !== 14) return;
    if (lastSearchedCnpjRef.current === cleanCnpj) return;

    lastSearchedCnpjRef.current = cleanCnpj;
    setSearchingCnpj(true);

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
      if (!response.ok) {
        toast.error("CNPJ não encontrado na base da Receita");
        return;
      }

      const data: BrasilApiCnpjResponse = await response.json();

      // 1. Nome da empresa (prioriza nome fantasia; se vazio usa razão social)
      const rawCompanyName = data.nome_fantasia?.trim() || data.razao_social?.trim() || "";
      const formattedCompanyName = toTitleCase(rawCompanyName);

      // 2. Responsável (pega do QSA se disponível)
      let formattedResponsible = "";
      if (data.qsa && data.qsa.length > 0) {
        const primaryAdmin =
          data.qsa.find(
            (s) =>
              s.qualificacao_socio?.toLowerCase().includes("administrador") ||
              s.qualificacao_socio?.toLowerCase().includes("sócio"),
          ) || data.qsa[0];

        if (primaryAdmin?.nome_socio) {
          formattedResponsible = toTitleCase(primaryAdmin.nome_socio);
        }
      }

      // 3. Telefone
      const rawPhone = data.ddd_telefone_1 || data.ddd_telefone_2 || "";
      const formattedPhoneValue = rawPhone ? formatPhone(rawPhone) : "";

      // 4. Endereço completo formatado em Title Case
      const addressParts: string[] = [];
      const streetType = data.descricao_tipo_de_logradouro ? toTitleCase(data.descricao_tipo_de_logradouro) : "";
      const streetName = data.logradouro ? toTitleCase(data.logradouro) : "";
      const fullStreet = [streetType, streetName].filter(Boolean).join(" ");

      if (fullStreet) {
        addressParts.push(fullStreet);
      }
      if (data.numero) {
        addressParts.push(data.numero);
      }
      if (data.complemento) {
        addressParts.push(toTitleCase(data.complemento));
      }

      const streetLine = addressParts.join(", ");
      const neighborhood = data.bairro ? toTitleCase(data.bairro) : "";
      const city = data.municipio ? toTitleCase(data.municipio) : "";
      const state = (data.uf || "").toUpperCase();

      let formattedFullAddress = streetLine;
      if (neighborhood) formattedFullAddress += ` - ${neighborhood}`;
      if (city && state) formattedFullAddress += `, ${city}/${state}`;

      // 5. CEP
      if (data.cep) {
        setCep(formatCep(data.cep));
      }

      setFormData((prev) => ({
        ...prev,
        companyName: formattedCompanyName || prev.companyName,
        responsibleName: formattedResponsible || prev.responsibleName,
        contactPhone: formattedPhoneValue || prev.contactPhone,
        address: formattedFullAddress || prev.address,
      }));

      toast.success("Dados da empresa carregados automaticamente via BrasilAPI!");
    } catch (err) {
      console.error("Erro ao consultar CNPJ:", err);
      toast.error("Erro ao consultar CNPJ via BrasilAPI");
    } finally {
      setSearchingCnpj(false);
    }
  }, []);

  // Automação ViaCEP: Busca endereço completo e formata em Title Case
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

      const street = toTitleCase(data.logradouro || "");
      const neighborhood = toTitleCase(data.bairro || "");
      const city = toTitleCase(data.localidade || "");
      const state = (data.uf || "").toUpperCase();

      const newAddress = `${street},  - ${neighborhood}, ${city}/${state}`;
      setFormData((prev) => ({ ...prev, address: newAddress }));
      toast.success("Endereço preenchido! Complete com o número.");
    } catch {
      toast.error("Erro ao buscar CEP");
    } finally {
      setSearchingCep(false);
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (docType === "CPF") {
      v = v.slice(0, 11);
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      setFormData((prev) => ({ ...prev, document: v }));
      setCpfCache(v);
    } else {
      v = v.slice(0, 14);
      const cleanDigits = v;
      v = v.replace(/^(\d{2})(\d)/, "$1.$2");
      v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
      v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
      v = v.replace(/(\d{4})(\d)/, "$1-$2");
      setFormData((prev) => ({ ...prev, document: v }));
      setCnpjCache(v);

      // Dispara busca automática ao completar os 14 dígitos do CNPJ
      if (cleanDigits.length === 14) {
        searchCnpjData(cleanDigits);
      }
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, contactPhone: formatPhone(e.target.value) }));
  };

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, whatsapp: formatPhone(e.target.value) }));
  };

  const toggleDocType = () => {
    if (docType === "CNPJ") {
      setDocType("CPF");
      setFormData((prev) => ({ ...prev, document: cpfCache }));
    } else {
      setDocType("CNPJ");
      setFormData((prev) => ({ ...prev, document: cnpjCache }));
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
        // Atualiza o cache local do SWR sem refazer chamada de rede
        await mutateSettings(formData, false);
        toast.success("Configurações salvas com sucesso!");
      }
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro de conexão com o servidor");
    } finally {
      setSaving(false);
    }
  };

  // Limpa apenas os dados visuais no front-end sem alterar o banco de dados
  const handleClearForm = () => {
    setFormData({
      companyName: "",
      responsibleName: "",
      document: "",
      contactPhone: "",
      whatsapp: "",
      address: "",
    });
    setCep("");
    setCpfCache("");
    setCnpjCache("");
    lastSearchedCnpjRef.current = "";

    toast.info("Campos limpos no formulário!", {
      description:
        "Nenhum dado foi apagado do banco de dados. Para gravar em branco, clique em Salvar.",
      action: {
        label: "Restaurar",
        onClick: () => {
          if (settingsData) {
            setFormData({
              companyName: settingsData.companyName || "",
              responsibleName: settingsData.responsibleName || "",
              document: settingsData.document || "",
              contactPhone: settingsData.contactPhone || "",
              whatsapp: settingsData.whatsapp || "",
              address: settingsData.address || "",
            });
            const cleanDoc = settingsData.document?.replace(/\D/g, "") || "";
            if (cleanDoc.length > 0) {
              if (cleanDoc.length <= 11) {
                setDocType("CPF");
                setCpfCache(settingsData.document);
              } else {
                setDocType("CNPJ");
                setCnpjCache(settingsData.document);
              }
            }
            toast.success("Dados originais restaurados no formulário!");
          }
        },
      },
    });
  };

  // Skeleton state: apenas no primeiro carregamento
  if (isLoading && !settingsData) {
    return (
      <Card className="border-none shadow-none bg-transparent rounded-none md:rounded-3xl md:border md:border-border/60 md:bg-card md:shadow-xs overflow-hidden">
        <CardHeader className="px-0 pt-0 pb-4 md:p-6 md:pb-2">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-44 rounded-lg" />
              <Skeleton className="h-4 w-72 rounded-lg" />
            </div>
            <Skeleton className="hidden md:block h-11 w-36 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0 md:p-6 md:pt-4 grid gap-6">
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
    <Card className="border-none shadow-none bg-transparent rounded-none md:rounded-3xl md:border md:border-border/60 md:bg-card md:shadow-xs overflow-hidden">
      {/* Header: chapado no mobile (px-0 pt-0), com padding e acabamento de card no desktop */}
      <CardHeader className="px-0 pt-0 pb-4 md:p-6 md:pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold tracking-tight text-foreground">
              Dados da Empresa
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              Configure as informações principais da sua empresa.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClearForm}
              className="h-10 md:h-11 px-4 font-medium rounded-full border-border/70 text-muted-foreground hover:text-foreground shadow-xs text-xs md:text-sm"
              title="Limpar campos apenas na tela"
            >
              <Eraser className="h-4 w-4 mr-1.5" />
              Limpar Campos
            </Button>
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
        </div>
      </CardHeader>

      <CardContent className="px-0 pb-0 md:p-6 md:pt-4 grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="companyName" className="font-medium text-sm">
            Nome da Empresa
          </Label>
          <Input
            id="companyName"
            value={formData.companyName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, companyName: e.target.value }))
            }
            onBlur={(e) =>
              setFormData((prev) => ({ ...prev, companyName: toTitleCase(e.target.value) }))
            }
            placeholder="Ex: Clínica Bem-Estar LTDA"
            required
            minLength={3}
            maxLength={60}
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
                setFormData((prev) => ({ ...prev, responsibleName: e.target.value }))
              }
              onBlur={(e) =>
                setFormData((prev) => ({ ...prev, responsibleName: toTitleCase(e.target.value) }))
              }
              placeholder="Ex: Maria da Silva"
              className="rounded-xl h-10"
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="document" className="font-medium text-sm">{docType}</Label>
                {searchingCnpj && (
                  <span className="text-xs text-primary flex items-center gap-1 font-medium">
                    <LoaderDots className="h-3 w-3 animate-spin" />
                    Buscando na Receita...
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={toggleDocType}
                className="text-[11px] text-primary flex items-center gap-1 hover:underline font-semibold uppercase tracking-wider"
              >
                <Repeat className="h-3 w-3" />
                Mudar para {docType === "CNPJ" ? "CPF" : "CNPJ"}
              </button>
            </div>
            <div className="relative">
              <Input
                id="document"
                value={formData.document}
                onChange={handleDocumentChange}
                placeholder={
                  docType === "CNPJ" ? "00.000.000/0001-00" : "000.000.000-00"
                }
                className="rounded-xl h-10 pr-9"
              />
              {docType === "CNPJ" && (
                <button
                  type="button"
                  onClick={() => {
                    const clean = formData.document.replace(/\D/g, "");
                    if (clean.length === 14) {
                      searchCnpjData(clean);
                    } else {
                      toast.info("Digite os 14 dígitos do CNPJ para buscar");
                    }
                  }}
                  disabled={searchingCnpj}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  title="Buscar dados do CNPJ na BrasilAPI"
                >
                  {searchingCnpj ? (
                    <LoaderDots className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
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

        {/* Localização e Endereço sem excesso de cores de fundo */}
        <div className="flex flex-col gap-4 p-4 md:p-5 rounded-2xl border border-border/50">
          <div className="grid gap-2">
            <Label htmlFor="cep" className="font-medium text-sm">Buscar por CEP</Label>
            <div className="flex gap-2">
              <Input
                id="cep"
                value={cep}
                onChange={(e) => setCep(formatCep(e.target.value))}
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
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              onBlur={(e) => setFormData((prev) => ({ ...prev, address: toTitleCase(e.target.value) }))}
              placeholder="Ex: Rua das Flores, 123 - Centro, São Paulo/SP"
              className="rounded-xl h-10"
            />
          </div>
        </div>
      </CardContent>

      {/* Botão flutuante mobile circular padrão via Portal */}
      <FloatingSaveButton
        onClick={handleSave}
        disabled={isLoading || saving}
        loading={saving}
        ariaLabel="Salvar configurações"
      />
    </Card>
  );
}

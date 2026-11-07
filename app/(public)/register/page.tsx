"use client";

import { useState, useActionState, useCallback, useRef, useMemo } from "react";
import { registerAdmin, ActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Repeat, Check, X, Search, LoaderDots, InfoCircle } from "@boxicons/react";
import { Progress } from "@/components/ui/progress";
import { BackButton } from "@/components/ui/back-button";
import { toast } from "sonner";
import { toTitleCase, formatPhone, formatCep, formatDocument } from "@/lib/utils";

const initialState: ActionState = { error: "" };

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

// Asterisco vermelho padrão para campos obrigatórios
function RequiredAsterisk() {
  return (
    <span className="text-red-500 font-bold ml-1 text-sm select-none" aria-hidden="true">
      *
    </span>
  );
}

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(
    registerAdmin,
    initialState,
  );

  // Estados dos Campos
  const [companyName, setCompanyName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [docType, setDocType] = useState<"CNPJ" | "CPF">("CNPJ");
  const [document, setDocument] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const [cep, setCep] = useState("");
  const [address, setAddress] = useState("");

  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [searchingCnpj, setSearchingCnpj] = useState(false);
  const [searchingCep, setSearchingCep] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const lastSearchedCnpjRef = useRef("");

  // Alterna tipo de documento
  const toggleDocType = () => {
    setDocType(docType === "CNPJ" ? "CPF" : "CNPJ");
    setDocument("");
  };

  // Busca Automática BrasilAPI (CNPJ)
  const searchCnpjData = useCallback(async (cleanCnpj: string) => {
    if (cleanCnpj.length !== 14) return;
    if (lastSearchedCnpjRef.current === cleanCnpj) return;

    lastSearchedCnpjRef.current = cleanCnpj;
    setSearchingCnpj(true);

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
      if (!response.ok) {
        toast.error("CNPJ não encontrado na Receita Federal.");
        return;
      }

      const data: BrasilApiCnpjResponse = await response.json();

      // 1. Nome da Empresa (Nome Fantasia ou Razão Social)
      const rawName = data.nome_fantasia?.trim() || data.razao_social?.trim() || "";
      if (rawName) {
        setCompanyName(toTitleCase(rawName).slice(0, 80));
      }

      // 2. Responsável / Sócio Administrador
      if (data.qsa && data.qsa.length > 0) {
        const primaryAdmin =
          data.qsa.find(
            (s) =>
              s.qualificacao_socio?.toLowerCase().includes("administrador") ||
              s.qualificacao_socio?.toLowerCase().includes("sócio"),
          ) || data.qsa[0];

        if (primaryAdmin?.nome_socio) {
          const parts = toTitleCase(primaryAdmin.nome_socio).trim().split(/\s+/);
          const fName = (parts[0] || "").replace(/[^a-zA-ZÀ-ÿ'-]/g, "").slice(0, 30);
          const lName = parts.slice(1).join(" ").replace(/[^a-zA-ZÀ-ÿ' -]/g, "").slice(0, 80);
          setFirstName(fName);
          setLastName(lName);
          setDisplayName(fName);
        }
      }

      // 3. Telefone
      const rawPhone = data.ddd_telefone_1 || data.ddd_telefone_2 || "";
      if (rawPhone) {
        const formatted = formatPhone(rawPhone);
        if (!whatsapp) setWhatsapp(formatted);
        else if (!contactPhone) setContactPhone(formatted);
      }

      // 4. Endereço Completo
      const addressParts: string[] = [];
      const streetType = data.descricao_tipo_de_logradouro ? toTitleCase(data.descricao_tipo_de_logradouro) : "";
      const streetName = data.logradouro ? toTitleCase(data.logradouro) : "";
      const fullStreet = [streetType, streetName].filter(Boolean).join(" ");
      if (fullStreet) addressParts.push(fullStreet);
      if (data.numero) addressParts.push(data.numero);
      if (data.complemento) addressParts.push(toTitleCase(data.complemento));

      const streetLine = addressParts.join(", ");
      const neighborhood = data.bairro ? toTitleCase(data.bairro) : "";
      const city = data.municipio ? toTitleCase(data.municipio) : "";
      const state = (data.uf || "").toUpperCase();

      let formattedFullAddress = streetLine;
      if (neighborhood) formattedFullAddress += ` - ${neighborhood}`;
      if (city && state) formattedFullAddress += `, ${city}/${state}`;

      if (formattedFullAddress) {
        setAddress(formattedFullAddress.slice(0, 150));
      }

      // 5. CEP
      if (data.cep) {
        setCep(formatCep(data.cep));
      }

      toast.success("Dados da empresa carregados automaticamente via BrasilAPI!");
    } catch (err) {
      console.error("Erro ao consultar CNPJ:", err);
      toast.error("Erro ao consultar CNPJ via BrasilAPI");
    } finally {
      setSearchingCnpj(false);
    }
  }, [whatsapp, contactPhone]);

  // Busca de Endereço por CEP (Opcional)
  const handleCepSearch = async (providedCep?: string) => {
    const targetCep = (providedCep ?? cep).replace(/\D/g, "");
    if (targetCep.length !== 8) {
      toast.error("CEP inválido (deve conter 8 números)");
      return;
    }

    setSearchingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${targetCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast.error("CEP não encontrado.");
        return;
      }

      const street = toTitleCase(data.logradouro || "");
      const neighborhood = toTitleCase(data.bairro || "");
      const city = toTitleCase(data.localidade || "");
      const state = (data.uf || "").toUpperCase();

      const newAddress = [street, neighborhood ? `- ${neighborhood}` : "", `${city}/${state}`]
        .filter(Boolean)
        .join(" ");

      setAddress(newAddress.slice(0, 150));
      toast.success("Endereço preenchido! Complete com o número.");
    } catch {
      toast.error("Erro ao consultar CEP.");
    } finally {
      setSearchingCep(false);
    }
  };

  // Handlers com Validação e Restrição Estrita de Entrada
  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/[<>{}\\]/g, "").slice(0, 80);
    setCompanyName(clean);
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawClean = docType === "CNPJ"
      ? e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
      : e.target.value.replace(/\D/g, "");
    const maxChars = docType === "CNPJ" ? 14 : 11;
    const limited = rawClean.slice(0, maxChars);
    const formatted = formatDocument(limited, docType);
    setDocument(formatted);

    if (docType === "CNPJ" && limited.length === 14) {
      searchCnpjData(limited);
    }
  };

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, "").slice(0, 11);
    setWhatsapp(formatPhone(rawDigits));
  };

  const handleContactPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, "").slice(0, 11);
    setContactPhone(formatPhone(rawDigits));
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, "").slice(0, 8);
    setCep(formatCep(rawDigits));
    if (rawDigits.length === 8) {
      handleCepSearch(rawDigits);
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/[<>{}\\]/g, "").slice(0, 150);
    setAddress(clean);
  };

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permite apenas letras e acentos, sem espaços e sem números
    const clean = e.target.value.replace(/[^a-zA-ZÀ-ÿ'-]/g, "").slice(0, 30);
    setFirstName(clean);
    if (!displayName || displayName === firstName) {
      setDisplayName(clean);
    }
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permite letras, acentos e espaços simples (sem números)
    const clean = e.target.value.replace(/[^a-zA-ZÀ-ÿ' -]/g, "").slice(0, 80);
    setLastName(clean);
  };

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Letras, números, ponto e espaços simples
    const clean = e.target.value.replace(/[^a-zA-ZÀ-ÿ0-9. -]/g, "").slice(0, 40);
    setDisplayName(clean);
  };

  // Termômetro da Senha (Apenas Visual Informativo, sem obrigar nível forte)
  const getPasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 6) strength += 25;
    if (pass.match(/[A-Z]/)) strength += 25;
    if (pass.match(/[0-9]/)) strength += 25;
    if (pass.match(/[^A-Za-z0-9]/)) strength += 25;
    return strength;
  };

  const strength = getPasswordStrength(password);
  let strengthColor = "bg-muted";
  let strengthText = "Muito fraca";
  if (strength >= 25) {
    strengthColor = "bg-red-500";
    strengthText = "Fraca";
  }
  if (strength >= 50) {
    strengthColor = "bg-yellow-500";
    strengthText = "Média";
  }
  if (strength >= 75) {
    strengthColor = "bg-blue-500";
    strengthText = "Forte";
  }
  if (strength === 100) {
    strengthColor = "bg-green-500";
    strengthText = "Muito Forte";
  }

  // Lista de Pendências dos Campos Obrigatórios
  const pendingRequirements = useMemo(() => {
    const list: string[] = [];

    // 1. Dados da Empresa
    if (companyName.trim().length < 2) {
      list.push("Nome Fantasia da empresa (mínimo 2 letras)");
    }

    if (docType === "CPF") {
      const cleanDoc = document.replace(/\D/g, "");
      if (cleanDoc.length !== 11) list.push("CPF completo (11 números)");
    } else {
      const cleanDoc = document.replace(/[^a-zA-Z0-9]/g, "");
      if (cleanDoc.length !== 14) list.push("CNPJ completo (14 caracteres numéricos ou alfanuméricos)");
    }

    const cleanWpp = whatsapp.replace(/\D/g, "");
    if (cleanWpp.length !== 11) {
      list.push("WhatsApp com DDD (11 números)");
    }

    // 2. Dados do Responsável
    if (firstName.trim().length < 2) {
      list.push("Primeiro nome do responsável (mínimo 2 letras, sem espaços ou números)");
    }
    if (lastName.trim().length < 2) {
      list.push("Sobrenome do responsável (sem números)");
    }
    if (displayName.trim().length < 2) {
      list.push("Como gostaria de ser chamado");
    }

    // 3. Acesso e Segurança
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      list.push("E-mail de acesso válido");
    }
    if (!confirmEmail.trim() || email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
      list.push("Confirmação de e-mail idêntica");
    }
    if (password.length < 6) {
      list.push("Senha com no mínimo 6 caracteres");
    }
    if (!confirmPassword || password !== confirmPassword) {
      list.push("Confirmação de senha idêntica");
    }

    return list;
  }, [
    companyName,
    document,
    docType,
    whatsapp,
    firstName,
    lastName,
    displayName,
    email,
    confirmEmail,
    password,
    confirmPassword,
  ]);

  const isFormValid = pendingRequirements.length === 0;

  // Validação ao enviar
  const preSubmitCheck = (e: React.FormEvent<HTMLFormElement>) => {
    if (!isFormValid) {
      e.preventDefault();
      setAttemptedSubmit(true);
      setValidationError("Por favor, complete os campos obrigatórios destacados para continuar.");
      return;
    }
    setValidationError("");
  };

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-background px-4 py-12 sm:px-6">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Philosopher:ital,wght@0,400;0,700;1,400;1,700&display=swap');
        .font-philosopher { font-family: 'Philosopher', sans-serif; }
      `,
        }}
      />
      <BackButton href="/login" label="Voltar ao Login" />

      <div className="w-full max-w-xl mt-8 sm:mt-0">
        <div className="text-center mb-10">
          <h1 className="font-philosopher text-3xl sm:text-4xl text-foreground mb-3">
            Totten
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Crie a conta da sua empresa
          </p>
        </div>

        <form
          action={formAction}
          onSubmit={preSubmitCheck}
          className="flex flex-col gap-10"
        >
          {/* Bloco 1: Dados da Empresa */}
          <div className="flex flex-col gap-6">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-widest border-b border-border pb-2">
              Dados da Empresa
            </h3>

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="companyName" className="text-base sm:text-sm">
                  Nome Fantasia <RequiredAsterisk />
                </Label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={companyName}
                  onChange={handleCompanyNameChange}
                  onBlur={(e) => setCompanyName(toTitleCase(e.target.value.trim()))}
                  placeholder="Ex: Totten Tecnologia"
                  required
                  maxLength={80}
                  className="h-12 sm:h-11 bg-muted/50 border-transparent hover:border-border focus-visible:bg-transparent text-base sm:text-sm"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="document" className="text-base sm:text-sm">
                      {docType} <RequiredAsterisk />
                    </Label>
                    {searchingCnpj && (
                      <span className="text-xs text-primary flex items-center gap-1 font-medium ml-2">
                        <LoaderDots className="h-3 w-3 animate-spin" />
                        Buscando...
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={toggleDocType}
                    className="text-xs text-primary flex items-center gap-1 hover:underline font-medium"
                  >
                    <Repeat className="h-3 w-3" />
                    Mudar para {docType === "CNPJ" ? "CPF" : "CNPJ"}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="document"
                    name="document"
                    value={document}
                    onChange={handleDocumentChange}
                    required
                    placeholder={
                      docType === "CNPJ" ? "00.000.000/0001-00" : "000.000.000-00"
                    }
                    className="h-12 sm:h-11 bg-muted/50 border-transparent hover:border-border focus-visible:bg-transparent text-base sm:text-sm pr-10"
                  />
                  {docType === "CNPJ" && (
                    <button
                      type="button"
                      onClick={() => {
                        const clean = document.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                        if (clean.length === 14) searchCnpjData(clean);
                        else toast.info("Digite os 14 caracteres do CNPJ para buscar.");
                      }}
                      disabled={searchingCnpj}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                      title="Buscar CNPJ na BrasilAPI"
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

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="whatsapp" className="text-base sm:text-sm">
                  WhatsApp <RequiredAsterisk />
                </Label>
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  value={whatsapp}
                  onChange={handleWhatsappChange}
                  required
                  placeholder="(00) 00000-0000"
                  className="h-12 sm:h-11 bg-muted/50 border-transparent hover:border-border focus-visible:bg-transparent text-base sm:text-sm"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="contactPhone" className="text-base sm:text-sm">
                    Telefone Fixo
                  </Label>
                  <span className="text-xs text-muted-foreground font-normal">Opcional</span>
                </div>
                <Input
                  id="contactPhone"
                  name="contactPhone"
                  value={contactPhone}
                  onChange={handleContactPhoneChange}
                  placeholder="(00) 0000-0000"
                  className="h-12 sm:h-11 bg-muted/50 border-transparent hover:border-border focus-visible:bg-transparent text-base sm:text-sm"
                />
              </div>
            </div>

            {/* Endereço e Localização (Opcional) */}
            <div className="flex flex-col gap-4 p-4 rounded-2xl border border-border/50 bg-muted/20">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2 sm:col-span-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cep" className="text-base sm:text-sm">
                      Buscar por CEP
                    </Label>
                    <span className="text-xs text-muted-foreground font-normal">Opcional</span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="cep"
                      name="cep"
                      value={cep}
                      onChange={handleCepChange}
                      placeholder="00000-000"
                      maxLength={9}
                      className="h-11 bg-background text-base sm:text-sm"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleCepSearch())}
                    />
                    <Button
                      type="button"
                      onClick={() => handleCepSearch()}
                      disabled={searchingCep}
                      variant="secondary"
                      className="h-11 px-3.5 shrink-0"
                      title="Buscar endereço pelo CEP"
                    >
                      {searchingCep ? (
                        <LoaderDots className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="address" className="text-base sm:text-sm">
                      Endereço Completo
                    </Label>
                    <span className="text-xs text-muted-foreground font-normal">Opcional</span>
                  </div>
                  <Input
                    id="address"
                    name="address"
                    value={address}
                    onChange={handleAddressChange}
                    onBlur={(e) => setAddress(toTitleCase(e.target.value.trim()))}
                    placeholder="Ex: Rua das Flores, 123 - Centro, São Paulo/SP"
                    maxLength={150}
                    className="h-11 bg-background text-base sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bloco 2: Dados do Responsável */}
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-widest border-b border-border pb-2">
                Dados do Responsável
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5">
                Informações da pessoa responsável pela conta da empresa.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="firstName" className="text-base sm:text-sm">
                  Nome <RequiredAsterisk />
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={firstName}
                  onChange={handleFirstNameChange}
                  onBlur={(e) => setFirstName(toTitleCase(e.target.value.trim()))}
                  placeholder="Ex: João"
                  required
                  maxLength={30}
                  className="h-12 sm:h-11 bg-muted/50 border-transparent hover:border-border focus-visible:bg-transparent text-base sm:text-sm"
                />
                <span className="text-[11px] text-muted-foreground">
                  Apenas o primeiro nome (sem sobrenome ou números).
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="lastName" className="text-base sm:text-sm">
                  Sobrenome <RequiredAsterisk />
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={lastName}
                  onChange={handleLastNameChange}
                  onBlur={(e) => setLastName(toTitleCase(e.target.value.trim()))}
                  placeholder="Ex: Silva Ramos"
                  required
                  maxLength={80}
                  className="h-12 sm:h-11 bg-muted/50 border-transparent hover:border-border focus-visible:bg-transparent text-base sm:text-sm"
                />
                <span className="text-[11px] text-muted-foreground">
                  Seus sobrenomes (sem números).
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="displayName" className="text-base sm:text-sm font-medium">
                  Como gostaria de ser chamado <RequiredAsterisk />
                </Label>
                <span className="text-xs text-muted-foreground font-normal">Nome preferencial</span>
              </div>
              <Input
                id="displayName"
                name="displayName"
                value={displayName}
                onChange={handleDisplayNameChange}
                onBlur={(e) => setDisplayName(toTitleCase(e.target.value.trim()))}
                placeholder="Ex: João, Dra. Carol, Will"
                required
                maxLength={40}
                className="h-12 sm:h-11 bg-muted/50 border-transparent hover:border-border focus-visible:bg-transparent text-base sm:text-sm"
              />
              <span className="text-xs text-muted-foreground">
                Exibido na agenda de atendimentos, nas saudações e nas notificações do sistema.
              </span>
            </div>
          </div>

          {/* Bloco 3: Acesso e Segurança */}
          <div className="flex flex-col gap-6">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-widest border-b border-border pb-2">
              Acesso e Segurança
            </h3>

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-base sm:text-sm">
                  E-mail de Acesso <RequiredAsterisk />
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="admin@empresa.com"
                  required
                  maxLength={100}
                  className="h-12 sm:h-11 bg-muted/50 border-transparent hover:border-border focus-visible:bg-transparent text-base sm:text-sm"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmEmail" className="text-base sm:text-sm">
                  Confirmar E-mail <RequiredAsterisk />
                </Label>
                <Input
                  id="confirmEmail"
                  name="confirmEmail"
                  type="email"
                  value={confirmEmail}
                  onChange={(e) => {
                    setConfirmEmail(e.target.value.trim());
                    setValidationError("");
                  }}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="admin@empresa.com"
                  required
                  maxLength={100}
                  className={`h-12 sm:h-11 bg-muted/50 border-transparent hover:border-border focus-visible:bg-transparent text-base sm:text-sm ${confirmEmail && email !== confirmEmail
                    ? "border-destructive focus-visible:border-destructive bg-destructive/5"
                    : ""
                    }`}
                />
                {confirmEmail && (
                  <p
                    className={`text-xs flex items-center gap-1 mt-1 ${email.toLowerCase() === confirmEmail.toLowerCase()
                      ? "text-green-500"
                      : "text-destructive"
                      }`}
                  >
                    {email.toLowerCase() === confirmEmail.toLowerCase() ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    {email.toLowerCase() === confirmEmail.toLowerCase()
                      ? "E-mails coincidem"
                      : "E-mails não coincidem"}
                  </p>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="text-base sm:text-sm">
                  Senha <RequiredAsterisk />
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  maxLength={64}
                  className="h-12 sm:h-11 bg-muted/50 border-transparent hover:border-border focus-visible:bg-transparent text-base sm:text-sm"
                />
                {password && (
                  <div className="space-y-1.5 mt-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Termômetro da senha:</span>
                      <span
                        className={`font-medium ${strength >= 75
                          ? "text-green-500"
                          : strength >= 50
                            ? "text-yellow-500"
                            : "text-amber-500"
                          }`}
                      >
                        {strengthText}
                      </span>
                    </div>
                    <Progress
                      value={strength}
                      indicatorColor={strengthColor}
                      className="h-1"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword" className="text-base sm:text-sm">
                  Confirmar Senha <RequiredAsterisk />
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setValidationError("");
                  }}
                  placeholder="Repita a senha"
                  required
                  minLength={6}
                  maxLength={64}
                  className={`h-12 sm:h-11 bg-muted/50 border-transparent hover:border-border focus-visible:bg-transparent text-base sm:text-sm ${confirmPassword && password !== confirmPassword
                    ? "border-destructive focus-visible:border-destructive bg-destructive/5"
                    : ""
                    }`}
                />
                {confirmPassword && (
                  <p
                    className={`text-xs flex items-center gap-1 mt-1 ${password === confirmPassword ? "text-green-500" : "text-destructive"
                      }`}
                  >
                    {password === confirmPassword ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    {password === confirmPassword
                      ? "Senhas coincidem"
                      : "Senhas não coincidem"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Erros Gerais / Alertas */}
          {(state.error || validationError) && (
            <div className="p-4 rounded-2xl bg-destructive/10 text-destructive text-sm font-medium text-center border border-destructive/20 animate-in fade-in duration-200">
              {validationError || state.error}
            </div>
          )}

          {/* Lista de Ajuda (Aparece apenas quando o usuário tenta submeter com campos pendentes) */}
          {attemptedSubmit && !isFormValid && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300 mb-2">
                <InfoCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  Campos obrigatórios pendentes ({pendingRequirements.length}):
                </span>
              </div>
              <ul className="grid sm:grid-cols-2 gap-1.5 list-disc pl-4 text-muted-foreground">
                {pendingRequirements.map((req, idx) => (
                  <li key={idx} className="text-[11px] leading-tight">
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              size="lg"
              onClick={() => {
                if (!isFormValid) setAttemptedSubmit(true);
              }}
              className={`w-full h-14 sm:h-12 text-lg sm:text-base rounded-2xl transition-all shadow-md font-semibold ${isFormValid
                ? "hover:scale-[1.01] bg-primary text-primary-foreground cursor-pointer"
                : "opacity-80"
                }`}
              disabled={isPending}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <LoaderDots className="h-5 w-5 animate-spin" />
                  Criando conta...
                </span>
              ) : (
                "Finalizar Cadastro"
              )}
            </Button>
            {attemptedSubmit && !isFormValid && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Preencha os campos obrigatórios destacados acima para concluir.
              </p>
            )}
          </div>

          <div className="text-center text-base sm:text-sm text-muted-foreground">
            Já possui uma conta?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:underline"
            >
              Faça login aqui
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

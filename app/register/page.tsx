"use client";

import { useState, useActionState } from "react";
import { registerAdmin, ActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ArrowLeft, Repeat, Check, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const initialState: ActionState = { error: "" };

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(
    registerAdmin,
    initialState,
  );

  // Estados para as máscaras e validações
  const [docType, setDocType] = useState<"CNPJ" | "CPF">("CNPJ");
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMatchError, setPasswordMatchError] = useState("");

  // Funções de Máscara
  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");

    if (docType === "CPF") {
      v = v.slice(0, 11);
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      setDocument(v);
    } else {
      v = v.slice(0, 14);
      v = v.replace(/^(\d{2})(\d)/, "$1.$2");
      v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
      v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
      v = v.replace(/(\d{4})(\d)/, "$1-$2");
      setDocument(v);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");

    if (v.length <= 10) {
      v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
      v = v.replace(/(\d{4})(\d)/g, "$1-$2");
    } else {
      v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
      v = v.replace(/(\d{5})(\d)/g, "$1-$2");
    }
    setPhone(v.slice(0, 15));
  };

  const toggleDocType = () => {
    setDocType(docType === "CNPJ" ? "CPF" : "CNPJ");
    setDocument(""); // Limpa para evitar bugar a formatação
  };

  // Lógica de Força da Senha
  const getPasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 8) strength += 25;
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

  // Validar senhas antes do submit
  const preSubmitCheck = (e: React.FormEvent<HTMLFormElement>) => {
    if (password !== confirmPassword) {
      e.preventDefault();
      setPasswordMatchError("As senhas não coincidem.");
      return;
    }
    if (strength < 50) {
      e.preventDefault();
      setPasswordMatchError("A senha precisa ser mais forte.");
      return;
    }
    setPasswordMatchError("");
  };

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-background px-4 py-12 sm:px-6">
      <Link
        href="/admin/login"
        className="absolute top-4 left-4 sm:top-8 sm:left-8 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group z-10"
      >
        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-transparent sm:bg-muted/50 hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </div>
        <span className="hidden sm:inline font-medium">Voltar ao Login</span>
      </Link>

      <div className="w-full max-w-xl mt-8 sm:mt-0">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground mb-3">
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
          {/* Bloco 1: Dados da Empresa e Responsável */}
          <div className="flex flex-col gap-6">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-widest border-b border-border pb-2">
              Dados da Empresa
            </h3>

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="companyName" className="text-base sm:text-sm">
                  Nome de Exibição / Fantasia
                </Label>
                <Input
                  id="companyName"
                  name="companyName"
                  placeholder="Ex: Totten Tecnologia"
                  required
                  className="h-12 sm:h-11 bg-muted/50 border-transparent hover:border-border focus-visible:bg-transparent text-base sm:text-sm"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="displayName" className="text-base sm:text-sm">
                  Seu Nome Completo
                </Label>
                <Input
                  id="displayName"
                  name="displayName"
                  placeholder="Ex: João Silva"
                  required
                  className="h-12 sm:h-11 bg-muted/50 border-transparent hover:border-border focus-visible:bg-transparent text-base sm:text-sm"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="document" className="text-base sm:text-sm">
                    {docType}
                  </Label>
                  <button
                    type="button"
                    onClick={toggleDocType}
                    className="text-xs text-primary flex items-center gap-1 hover:underline font-medium"
                  >
                    <Repeat className="h-3 w-3" />
                    Mudar para {docType === "CNPJ" ? "CPF" : "CNPJ"}
                  </button>
                </div>
                <Input
                  id="document"
                  name="document"
                  value={document}
                  onChange={handleDocumentChange}
                  required
                  placeholder={
                    docType === "CNPJ" ? "00.000.000/0001-00" : "000.000.000-00"
                  }
                  className="h-12 sm:h-11 bg-muted/50 border-transparent hover:border-border focus-visible:bg-transparent text-base sm:text-sm"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="contactPhone" className="text-base sm:text-sm">
                  Telefone de Contato
                </Label>
                <Input
                  id="contactPhone"
                  name="contactPhone"
                  value={phone}
                  onChange={handlePhoneChange}
                  required
                  placeholder="(00) 00000-0000"
                  className="h-12 sm:h-11 bg-muted/50 border-transparent hover:border-border focus-visible:bg-transparent text-base sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Bloco 2: Acesso e Segurança */}
          <div className="flex flex-col gap-6">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-widest border-b border-border pb-2">
              Acesso e Segurança
            </h3>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-base sm:text-sm">
                E-mail de Acesso
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@empresa.com"
                required
                className="h-12 sm:h-11 bg-muted/50 border-transparent hover:border-border focus-visible:bg-transparent text-base sm:text-sm"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="text-base sm:text-sm">
                  Senha
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="h-12 sm:h-11 bg-muted/50 border-transparent hover:border-border focus-visible:bg-transparent text-base sm:text-sm"
                />
                {password && (
                  <div className="space-y-1.5 mt-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Força:</span>
                      <span
                        className={`font-medium ${strength >= 75 ? "text-green-500" : strength >= 50 ? "text-yellow-500" : "text-red-500"}`}
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
                <Label
                  htmlFor="confirmPassword"
                  className="text-base sm:text-sm"
                >
                  Confirmar Senha
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordMatchError("");
                  }}
                  placeholder="••••••••"
                  required
                  className={`h-12 sm:h-11 bg-muted/50 border-transparent hover:border-border focus-visible:bg-transparent text-base sm:text-sm ${
                    confirmPassword && password !== confirmPassword
                      ? "border-destructive focus-visible:border-destructive bg-destructive/5"
                      : ""
                  }`}
                />
                {confirmPassword && (
                  <p
                    className={`text-xs flex items-center gap-1 mt-1 ${password === confirmPassword ? "text-green-500" : "text-destructive"}`}
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

          {/* Erros Gerais */}
          {(state.error || passwordMatchError) && (
            <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium text-center border border-destructive/20">
              {passwordMatchError || state.error}
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              size="lg"
              className="w-full h-14 sm:h-12 text-lg sm:text-base rounded-xl transition-all hover:scale-[1.02] shadow-md"
              disabled={
                isPending || password !== confirmPassword || strength < 50
              }
            >
              {isPending ? "Criando empresa..." : "Finalizar Cadastro"}
            </Button>
          </div>

          <div className="text-center text-base sm:text-sm text-muted-foreground">
            Já possui uma conta?{" "}
            <Link
              href="/admin/login"
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

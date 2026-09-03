"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Lock, Mail, ArrowLeft, ArrowRight, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { sendClientOtp, verifyClientOtp, loginWithCpfPhone } from "@/app/actions/client-auth";

export function ClientLoginView({ org, theme }: { org: any, theme: any }) {
  const [loginMethod, setLoginMethod] = useState<"EMAIL" | "CPF_PHONE">("CPF_PHONE");
  const [step, setStep] = useState<"INPUT_EMAIL" | "CODE">("INPUT_EMAIL");

  // States for OTP login
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  // States for CPF + Phone login
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // MASK HELPERS
  const handleCpfChange = (val: string) => {
    let v = val.replace(/\D/g, "");
    if (v.length <= 11) {
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      setCpf(v);
    }
  };

  const handlePhoneChange = (val: string) => {
    let v = val.replace(/\D/g, "");
    if (v.length <= 11) {
      v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
      v = v.replace(/(\d)(\d{4})$/, "$1-$2");
      setPhone(v);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Por favor, digite um e-mail válido.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await sendClientOtp(email, org.slug);
      if (res.success) {
        toast.success("Código enviado para o seu e-mail!");
        setStep("CODE");
      } else {
        toast.error(res.message || "Erro ao enviar código.");
      }
    } catch (err) {
      toast.error("Erro interno.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) {
      toast.error("O código deve ter 6 dígitos.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyClientOtp(email, code, org.slug);
      if (res.success) {
        if (typeof window !== "undefined") {
          localStorage.setItem(`totten_client_logged_in_${org.slug}`, "true");
        }
        toast.success("Login realizado com sucesso!");
        router.push(`/${org.slug}/cliente`);
      } else {
        toast.error(res.message || "Código inválido.");
      }
    } catch (err) {
      toast.error("Erro interno.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCpfPhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawCpf = cpf.replace(/\D/g, "");
    const rawPhone = phone.replace(/\D/g, "");

    if (rawCpf.length !== 11) {
      toast.error("CPF inválido.");
      return;
    }
    if (rawPhone.length < 10) {
      toast.error("Telefone inválido.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginWithCpfPhone(cpf, phone, org.slug);
      if (res.success) {
        if (typeof window !== "undefined") {
          localStorage.setItem(`totten_client_logged_in_${org.slug}`, "true");
          localStorage.setItem(`totten_client_phone_${org.slug}`, phone);
        }
        toast.success("Login realizado com sucesso!");
        router.push(`/${org.slug}/cliente`);
      } else {
        toast.error(res.message || "Dados inválidos.");
      }
    } catch (err) {
      toast.error("Erro interno.");
    } finally {
      setIsLoading(false);
    }
  };

  const isCpfPhoneValid = cpf.replace(/\D/g, "").length === 11 && phone.replace(/\D/g, "").length >= 10;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative font-sans bg-slate-50 text-slate-900">
      <button
        onClick={() => {
          if (loginMethod === "EMAIL" && step === "CODE") {
            setStep("INPUT_EMAIL");
          } else {
            router.back();
          }
        }}
        className="absolute top-6 left-6 p-2 rounded-full hover:bg-black/5 transition-colors"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>

      <div className="w-full max-w-md p-8 rounded-3xl shadow-xl flex flex-col items-center text-center bg-white border border-black/5">

        <div className="h-16 w-16 rounded-2xl bg-black/5 flex items-center justify-center mb-6">
          {loginMethod === "CPF_PHONE" ? (
            <User className="h-8 w-8 opacity-70" />
          ) : step === "INPUT_EMAIL" ? (
            <Mail className="h-8 w-8 opacity-70" />
          ) : (
            <Lock className="h-8 w-8 opacity-70" />
          )}
        </div>

        <h1 className="text-2xl font-bold mb-2">Área do Cliente</h1>
        <p className="text-sm opacity-70 mb-8 max-w-[280px]">
          {loginMethod === "CPF_PHONE"
            ? `Acesse seu painel em ${org.name} informando seu CPF e WhatsApp.`
            : step === "INPUT_EMAIL"
              ? `Para acessar seus agendamentos, digite o e-mail cadastrado.`
              : `Digite o código de 6 dígitos enviado para ${email}.`}
        </p>

        {/* METHOD 1: CPF + PHONE */}
        {loginMethod === "CPF_PHONE" && (
          <form onSubmit={handleCpfPhoneLogin} className="w-full space-y-5">
            <div className="space-y-2 text-left">
              <Label htmlFor="cpf" className="font-medium opacity-80">CPF</Label>
              <Input
                id="cpf"
                type="text"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={e => handleCpfChange(e.target.value)}
                className="h-12 text-base rounded-xl focus-visible:ring-1 bg-black/5 border-black/10"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2 text-left">
              <Label htmlFor="phone" className="font-medium opacity-80">WhatsApp</Label>
              <Input
                id="phone"
                type="text"
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={e => handlePhoneChange(e.target.value)}
                className="h-12 text-base rounded-xl focus-visible:ring-1 bg-black/5 border-black/10"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !isCpfPhoneValid}
              className="w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 mt-2"
              style={{ backgroundColor: theme?.primaryColor || "#0f172a", color: "#fff" }}
            >
              {isLoading ? "Entrando..." : "Entrar na sua conta"} <ArrowRight className="h-5 w-5" />
            </button>
          </form>
        )}

        {/* METHOD 2: EMAIL + OTP */}
        {loginMethod === "EMAIL" && (
          <>
            {step === "INPUT_EMAIL" ? (
              <form onSubmit={handleSendEmail} className="w-full space-y-6">
                <div className="space-y-2 text-left">
                  <Label htmlFor="email" className="font-medium opacity-80">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu.email@exemplo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="h-12 text-base rounded-xl focus-visible:ring-1 bg-black/5 border-black/10"
                    required
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !email.includes("@")}
                  className="w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 mt-2"
                  style={{ backgroundColor: theme?.primaryColor || "#0f172a", color: "#fff" }}
                >
                  {isLoading ? "Enviando..." : "Receber Código"} <ArrowRight className="h-5 w-5" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="w-full space-y-6">
                <div className="space-y-2 text-left">
                  <Label htmlFor="code" className="font-medium opacity-80">Código de Acesso</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
                    className="h-12 text-center tracking-widest text-2xl font-bold rounded-xl focus-visible:ring-1 bg-black/5 border-black/10"
                    required
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || code.length < 6}
                  className="w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 mt-2"
                  style={{ backgroundColor: theme?.primaryColor || "#0f172a", color: "#fff" }}
                >
                  {isLoading ? "Verificando..." : "Entrar"} <ArrowRight className="h-5 w-5" />
                </button>
              </form>
            )}
          </>
        )}

        {/* TOGGLE LOGIN METHOD */}
        {!isLoading && step !== "CODE" && (
          <div className="mt-8 pt-6 border-t border-black/5 w-full flex flex-col gap-2">
            <p className="text-xs text-muted-foreground font-medium">Ou tente outra forma de acesso:</p>
            <Button
              variant="outline"
              className="w-full h-10 rounded-xl font-bold"
              onClick={() => {
                setLoginMethod(prev => prev === "CPF_PHONE" ? "EMAIL" : "CPF_PHONE");
                setStep("INPUT_EMAIL");
              }}
            >
              {loginMethod === "CPF_PHONE" ? "Acessar usando E-mail" : "Acessar usando CPF e WhatsApp"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

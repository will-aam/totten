"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Lock, Mail, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { sendClientOtp, verifyClientOtp } from "@/app/actions/client-auth";

export function ClientLoginView({ org, theme }: { org: any, theme: any }) {
  const [step, setStep] = useState<"EMAIL" | "CODE">("EMAIL");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative font-sans bg-slate-50 text-slate-900"
    >
      <button
        onClick={() => {
          if (step === "CODE") setStep("EMAIL");
          else router.back();
        }}
        className="absolute top-6 left-6 p-2 rounded-full hover:bg-black/5 transition-colors"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>

      <div className="w-full max-w-md p-8 rounded-3xl shadow-xl flex flex-col items-center text-center bg-white border border-black/5">
        <div className="h-16 w-16 rounded-2xl bg-black/5 flex items-center justify-center mb-6">
          {step === "EMAIL" ? <Mail className="h-8 w-8 opacity-70" /> : <Lock className="h-8 w-8 opacity-70" />}
        </div>

        <h1 className="text-2xl font-bold mb-2">Área do Cliente</h1>
        <p className="text-sm opacity-70 mb-8 max-w-[280px]">
          {step === "EMAIL" 
            ? `Para acessar seus agendamentos em ${org.name}, digite o e-mail cadastrado.`
            : `Digite o código de 6 dígitos enviado para ${email}.`}
        </p>

        {step === "EMAIL" ? (
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
      </div>
    </div>
  );
}

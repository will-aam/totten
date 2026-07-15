// app/(public)/forgot-password/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Envelope,
  LoaderDots,
  CheckCircle,
} from "@boxicons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiClient("auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      setSuccess(true);
      toast.success("Nova senha enviada para o seu e-mail!");
    } catch (error) {
      // Distingue erro de API (apiClient lança ApiError) de falha de rede,
      // preservando as duas mensagens que já existiam antes da refatoração
      if (error instanceof ApiError) {
        toast.error(error.message || "Erro ao recuperar senha");
      } else {
        toast.error("Erro de conexão. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative flex min-h-svh items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-border shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl">E-mail Enviado!</CardTitle>
            <CardDescription className="text-base">
              Verifique sua caixa de entrada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Enviamos uma senha temporária para <strong>{email}</strong>.
              <br />
              Use essa senha para fazer login e depois altere nas configurações.
            </p>

            <div className="bg-muted/50 p-4 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground">
                <strong>Não recebeu o e-mail?</strong>
                <br />
                Verifique sua caixa de spam ou aguarde alguns minutos.
              </p>
            </div>

            <Button asChild className="w-full">
              <Link href="/login">Ir para o Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center bg-background p-4">
      {/* Botão Voltar */}
      <Link
        href="/login"
        className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm border border-border group-hover:bg-[#D9C6BF]/20 transition-colors">
          <ChevronLeft removePadding className="h-5 w-5" />
        </div>
        <span className="hidden sm:inline font-medium">Voltar</span>
      </Link>

      <Card className="w-full max-w-md border-border shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Envelope removePadding className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Esqueceu a senha?</CardTitle>
          <CardDescription>
            Digite seu e-mail para receber uma senha temporária
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail cadastrado</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="bg-muted text-foreground"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoaderDots className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Nova Senha"
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Lembrou a senha?{" "}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                Voltar para o login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Eye, EyeClosed } from "@boxicons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// 🔥 FORÇA RENDERIZAÇÃO APENAS NO CLIENTE
export const dynamic = "force-dynamic";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ✅ Toggle: login de teste (sem senha)
  const [devEmailOnly, setDevEmailOnly] = useState(false);

  const verified = searchParams.get("verified");
  const error = searchParams.get("error");

  useEffect(() => {
    if (verified === "true") {
      toast.success("E-mail verificado! Você já pode fazer login.");
    }
    if (error === "invalid_token") {
      toast.error("Link de verificação inválido ou expirado.");
    }
    if (error === "session_required") {
      toast.warning("Faça login para usar o totem de check-in.");
    }
  }, [verified, error]);

  // Opcional: quando marcar "sem senha", limpa o campo
  useEffect(() => {
    if (devEmailOnly) setPassword("");
  }, [devEmailOnly]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        // ✅ Se devEmailOnly estiver marcado, manda senha vazia.
        // O servidor só aceitará se DEV_EMAIL_LOGIN=true e NODE_ENV !== "production"
        password: devEmailOnly ? "" : password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes("E-mail não verificado")) {
          toast.error(
            "Você precisa verificar seu e-mail primeiro. Verifique sua caixa de entrada.",
          );
        } else if (result.error.includes("Credenciais inválidas")) {
          toast.error("Credenciais inválidas");
        } else {
          // fallback genérico (evita vazar mensagens internas)
          toast.error("E-mail ou senha inválidos");
        }
      } else if (result?.ok) {
        toast.success("Login realizado com sucesso!");
        router.push("/admin/dashboard");
        router.refresh();
      }
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh flex-col bg-background p-4 sm:p-8 overflow-hidden">
      <Link
        href="/totem/idle"
        className="absolute top-4 left-4 sm:static sm:self-start flex w-fit items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group z-10"
      >
        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-transparent sm:bg-muted/50 hover:bg-muted transition-colors">
          <ChevronLeft removePadding className="h-5 w-5" />
        </div>
        <span className="hidden sm:inline font-medium">Voltar</span>
      </Link>

      <div className="flex flex-1 items-center justify-center w-full">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="flex flex-col items-center gap-4">
              <Image
                src="/totten.png"
                alt="Totten Logo"
                width={80}
                height={80}
                className="rounded-full overflow-hidden aspect-square h-24 w-24 md:h-32 md:w-32 object-cover animate-pulse-slow"
                priority
              />
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-foreground mb-3">
              Totten
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              Acesse o painel administrativo
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-base sm:text-sm">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-12 sm:h-11 bg-muted/50 border-transparent hover:border-border focus-visible:bg-transparent text-base sm:text-sm"
              />
            </div>

            {/* ✅ Checkbox do login sem senha (só para facilitar em localhost) */}
            <div className="flex items-center gap-2">
              <input
                id="devEmailOnly"
                type="checkbox"
                checked={devEmailOnly}
                onChange={(e) => setDevEmailOnly(e.target.checked)}
                disabled={loading}
              />
              <Label htmlFor="devEmailOnly" className="text-base sm:text-sm">
                Entrar sem senha (somente DEV/localhost)
              </Label>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-base sm:text-sm">
                  Senha
                </Label>
                <Link
                  href="/admin/forgot-password"
                  className="text-sm sm:text-xs text-primary hover:underline font-medium"
                >
                  Esqueceu a senha?
                </Link>
              </div>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={
                    devEmailOnly
                      ? "Desativada (modo DEV sem senha)"
                      : "Sua senha"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  // ✅ Só exige senha quando NÃO estiver em modo "sem senha"
                  required={!devEmailOnly}
                  disabled={loading || devEmailOnly}
                  className="h-12 sm:h-11 bg-muted/50 border-transparent hover:border-border focus-visible:bg-transparent text-base sm:text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  disabled={devEmailOnly}
                  aria-disabled={devEmailOnly}
                >
                  {showPassword ? (
                    <EyeClosed className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                size="lg"
                className="w-full h-14 sm:h-12 text-lg sm:text-base rounded-xl transition-all hover:scale-[1.02] shadow-md"
                disabled={loading}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>

              {/* dica rápida pro caso de erro */}
              <p className="mt-2 text-xs text-muted-foreground">
                Dica: para o login sem senha funcionar, o servidor precisa ter{" "}
                <code className="px-1 py-0.5 rounded bg-muted">
                  DEV_EMAIL_LOGIN=true
                </code>{" "}
                no{" "}
                <code className="px-1 py-0.5 rounded bg-muted">.env.local</code>
                .
              </p>
            </div>

            <div className="text-center text-base sm:text-sm text-muted-foreground">
              Ainda não tem uma conta?{" "}
              <Link
                href="/register"
                className="font-semibold text-primary hover:underline"
              >
                Crie uma conta
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

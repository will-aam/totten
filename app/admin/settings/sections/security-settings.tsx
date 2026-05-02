"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SealCheck, LoaderDots, Save } from "@boxicons/react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useIsMobile } from "@/hooks/use-mobile";

export function SecuritySettings() {
  const { data: session } = useSession();
  const isMobile = useIsMobile();
  const [email, setEmail] = useState(session?.user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Senha alterada com sucesso!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "Erro ao alterar senha");
      }
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-none py-0 sm:py-6">
      <CardHeader className="px-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-card-foreground mb-2">
              <SealCheck size="sm" className="text-primary" />
              Acesso e Segurança
            </CardTitle>
            <CardDescription>
              Faça a gestão das credenciais de acesso ao painel de
              administração.
            </CardDescription>
          </div>
          <div className="flex items-center justify-end gap-2 shrink-0">
            <Button
              onClick={handleChangePassword}
              disabled={loading}
              className={`${isMobile ? "hidden" : "max-w-xs"}`}
            >
              {loading ? (
                <>
                  <LoaderDots size="sm" className="animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size="sm" className="mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 px-0">
        <div className="grid gap-2">
          <Label htmlFor="email">E-mail de Acesso</Label>
          <Input
            id="email"
            type="email"
            value={email}
            disabled
            className="max-w-sm bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            O e-mail não pode ser alterado após o cadastro.
          </p>
        </div>

        <div className="grid gap-4">
          <h3 className="font-medium text-sm">Alterar Senha</h3>

          <div className="grid sm:grid-cols-2 gap-2 max-w-2xl">
            <div className="grid gap-2">
              <Label htmlFor="current-password">Senha Atual</Label>
              <Input
                id="current-password"
                type="text"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
            <div className="grid gap-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="text"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input
                id="confirm-password"
                type="text"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>
        </div>
      </CardContent>

      {/* Botão flutuante mobile */}
      <button
        onClick={handleChangePassword}
        disabled={loading}
        className={`${
          !isMobile
            ? "hidden"
            : "fixed bottom-0 right-4 md:bottom-8 md:right-8 h-14 w-14 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-300 z-50 translate-y-16 opacity-100 hover:scale-110"
        }`}
      >
        <Save size="sm" />
      </button>
    </Card>
  );
}

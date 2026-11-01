// app/(private)/admin/settings/_components/security-settings.tsx
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
import { LoaderDots, Save } from "@boxicons/react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { changePassword } from "@/app/actions/auth";

export function SecuritySettings() {
  const { data: session } = useSession();
  const [email] = useState(session?.user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!currentPassword) {
      toast.error("Informe a senha atual");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      const result = await changePassword(currentPassword, newPassword);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message || "Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-2xl md:rounded-3xl border border-border/60 bg-card shadow-xs overflow-hidden">
      <CardHeader className="p-5 md:p-6 border-b border-border/40 bg-muted/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold tracking-tight text-foreground">
              Acesso e Segurança
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              Faça a gestão das credenciais de acesso ao painel de administração.
            </CardDescription>
          </div>
          <Button
            onClick={() => handleChangePassword()}
            disabled={loading}
            className="hidden md:flex h-11 px-6 font-semibold rounded-full shadow-sm"
          >
            {loading ? (
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
          <Label htmlFor="email" className="font-medium text-sm">E-mail de Acesso</Label>
          <Input
            id="email"
            type="email"
            value={email}
            disabled
            className="max-w-md bg-muted/50 rounded-xl h-10"
          />
          <p className="text-xs text-muted-foreground">
            O e-mail de acesso não pode ser alterado após o cadastro.
          </p>
        </div>

        <div className="flex flex-col gap-4 pt-2 border-t border-border/40">
          <h3 className="font-semibold text-base text-foreground">Alterar Senha</h3>

          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
            <div className="grid gap-2">
              <Label htmlFor="current-password" className="font-medium text-sm">Senha Atual</Label>
              <Input
                id="current-password"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="rounded-xl h-10"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
            <div className="grid gap-2">
              <Label htmlFor="new-password" className="font-medium text-sm">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                className="rounded-xl h-10"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password" className="font-medium text-sm">Confirmar Nova Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                className="rounded-xl h-10"
              />
            </div>
          </div>
        </div>
      </CardContent>

      {/* Botão flutuante mobile circular padrão */}
      <button
        type="button"
        onClick={() => handleChangePassword()}
        disabled={loading}
        className="md:hidden fixed bottom-28 right-6 h-14 w-14 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl transition-transform duration-300 z-50 hover:scale-105 active:scale-95"
        aria-label="Salvar senha"
      >
        {loading ? (
          <LoaderDots className="h-6 w-6 animate-spin" />
        ) : (
          <Save className="h-6 w-6" strokeWidth={2.5} />
        )}
      </button>
    </Card>
  );
}

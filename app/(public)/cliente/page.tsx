"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function PortalClienteLoginPage() {
  const [cpf, setCpf] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Remove tudo que não for número
    const cleanCpf = cpf.replace(/\D/g, "");

    if (cleanCpf.length === 11) {
      // Redireciona para a página de histórico usando o CPF na URL
      router.push(`/cliente/${cleanCpf}`);
    } else {
      // Você pode trocar por um Toast do shadcn se preferir
      alert("Por favor, digite um CPF válido com 11 números.");
    }
  };

  // Máscara visual simples para o CPF (XXX.XXX.XXX-XX)
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 9) {
      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else if (value.length > 6) {
      value = value.replace(/(\d{3})(\d{3})(\d{3})/, "$1.$2.$3");
    } else if (value.length > 3) {
      value = value.replace(/(\d{3})(\d{3})/, "$1.$2");
    }

    setCpf(value);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Portal do Cliente
          </CardTitle>
          <CardDescription>
            Acompanhe seu histórico de sessões e pacotes de forma rápida e
            segura.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="cpf">Seu CPF</Label>
              <Input
                id="cpf"
                type="text"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={handleCpfChange}
                className="text-lg text-center tracking-widest py-6"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full py-6 text-lg"
              disabled={cpf.replace(/\D/g, "").length !== 11}
            >
              Acessar meu histórico
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

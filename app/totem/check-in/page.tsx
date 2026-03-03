"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CpfKeypad, formatCpf } from "@/components/cpf-keypad";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Package = {
  id: string;
  name: string;
  serviceName: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  price: number;
};

type ClientData = {
  id: string;
  name: string;
  phone: string;
  packages: Package[];
};

export default function TotemCheckInPage() {
  const router = useRouter();
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [showPackageSelection, setShowPackageSelection] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  // 1️⃣ Busca cliente pelo CPF
  const handleConfirm = async () => {
    const digits = cpf.replace(/\D/g, "");
    if (digits.length !== 11) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/totem/search-client?cpf=${digits}`);

      if (res.status === 404) {
        router.push("/totem/error?type=CPF_NOT_FOUND");
        return;
      }

      const data = await res.json();

      if (data.packages.length === 0) {
        router.push("/totem/error?type=NO_ACTIVE_PACKAGE");
        return;
      }

      // Se tem apenas 1 pacote, faz check-in direto
      if (data.packages.length === 1) {
        await handleCheckIn(data.id, data.packages[0].id, data.name);
      } else {
        // Se tem múltiplos pacotes, mostra modal de seleção
        setClientData(data);
        setShowPackageSelection(true);
      }
    } catch (error) {
      console.error("Erro ao buscar cliente:", error);
      router.push("/totem/error?type=UNKNOWN");
    } finally {
      setLoading(false);
    }
  };

  // 2️⃣ Realiza o check-in
  const handleCheckIn = async (
    clientId: string,
    packageId: string,
    clientName: string,
  ) => {
    setCheckingIn(true);
    try {
      const res = await fetch("/api/totem/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          package_id: packageId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const params = new URLSearchParams({
          name: clientName,
          used: String(data.package.usedSessions),
          total: String(data.package.totalSessions),
        });
        router.push(`/totem/success?${params.toString()}`);
      } else {
        const errorType = data.error.includes("já fez check-in")
          ? "CHECKIN_DUPLICATE"
          : data.error.includes("totalmente utilizado")
            ? "PACKAGE_EXHAUSTED"
            : "UNKNOWN";
        router.push(`/totem/error?type=${errorType}`);
      }
    } catch (error) {
      console.error("Erro ao fazer check-in:", error);
      router.push("/totem/error?type=UNKNOWN");
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <>
      <div className="flex min-h-dvh w-full items-center justify-center bg-background p-4 sm:p-6 md:p-8">
        <div className="relative flex w-full max-w-lg flex-col items-center gap-8 rounded-3xl bg-card p-6 shadow-xl border border-border sm:p-10 md:p-12">
          {/* Botão Voltar */}
          <div className="absolute top-6 left-6 sm:top-8 sm:left-8">
            <Link
              href="/totem/idle"
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted group-hover:bg-[#D9C6BF]/30 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </div>
              <span className="hidden font-medium sm:inline">Voltar</span>
            </Link>
          </div>

          {/* Textos de Cabeçalho */}
          <div className="mt-12 text-center sm:mt-4">
            <h1 className="font-serif text-3xl font-bold text-foreground md:text-5xl">
              Check-in
            </h1>
            <p className="mt-3 text-sm text-muted-foreground md:text-base leading-relaxed">
              Digite seu CPF para registrar sua presença
            </p>
          </div>

          {/* O teclado numérico */}
          <div className="w-full max-w-sm">
            <CpfKeypad
              value={cpf}
              onChange={setCpf}
              onConfirm={handleConfirm}
              disabled={loading}
            />
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verificando pacotes...
            </div>
          )}
        </div>
      </div>

      {/* Modal de Seleção de Pacote */}
      <Dialog
        open={showPackageSelection}
        onOpenChange={setShowPackageSelection}
      >
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              Olá, {clientData?.name}!
            </DialogTitle>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Selecione o pacote para fazer check-in:
            </p>
          </DialogHeader>

          <div className="flex flex-col gap-3 mt-4">
            {clientData?.packages.map((pkg) => (
              <Button
                key={pkg.id}
                onClick={() =>
                  handleCheckIn(clientData.id, pkg.id, clientData.name)
                }
                disabled={checkingIn}
                variant="outline"
                className="h-auto py-4 px-4 flex flex-col items-start gap-2 hover:border-primary hover:bg-primary/5"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-left">{pkg.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {pkg.remainingSessions} restantes
                  </Badge>
                </div>
                <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                  <span>{pkg.serviceName}</span>
                  <span>
                    {pkg.usedSessions}/{pkg.totalSessions} sessões
                  </span>
                </div>
              </Button>
            ))}
          </div>

          {checkingIn && (
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary mt-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Registrando check-in...
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

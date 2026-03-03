"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const [clinicName, setClinicName] = useState("Totten");

  const name = searchParams.get("name") || "Cliente";
  const used = Number(searchParams.get("used") || 0);
  const total = Number(searchParams.get("total") || 10);
  const progress = Math.round((used / total) * 100);
  const time = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // 🔥 Busca o nome da clínica
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings/public");
        if (res.ok) {
          const data = await res.json();
          setClinicName(data.tradeName);
        }
      } catch (error) {
        console.error("Erro ao buscar configurações:", error);
      }
    };

    fetchSettings();
  }, []);

  // Efeito 1: Apenas diminui o contador de 1 em 1 segundo
  useEffect(() => {
    if (countdown <= 0) return;

    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [countdown]);

  // Efeito 2: Escuta o contador e, quando chegar a 0, redireciona
  useEffect(() => {
    if (countdown === 0) {
      router.push("/totem/idle");
    }
  }, [countdown, router]);

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-background p-4 sm:p-6 md:p-8">
      <div className="relative flex w-full max-w-lg flex-col items-center gap-8 rounded-3xl bg-card p-8 shadow-xl border border-border sm:p-12 text-center">
        {/* Ícone de Sucesso */}
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/20 mt-4 sm:mt-0">
          <CheckCircle2 className="h-14 w-14 text-primary" />
        </div>

        {/* Nome da Cliente */}
        <div>
          <p className="text-lg text-muted-foreground">Bem-vinda,</p>
          <h1 className="font-serif text-4xl font-bold text-foreground md:text-5xl mt-1">
            {name}
          </h1>
        </div>

        {/* Horário do Check-in */}
        <p className="text-muted-foreground">
          {"Check-in realizado às "}
          <span className="font-semibold text-foreground">{time}</span>
        </p>

        {/* Barra de Progresso do Pacote */}
        <div className="w-full rounded-2xl border border-border bg-background p-6 shadow-sm">
          <p className="mb-3 text-lg font-semibold text-foreground">
            {`Sessão ${used} de ${total} concluída!`}
          </p>
          <Progress
            value={progress}
            className="h-4 bg-muted [&>div]:bg-primary"
          />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            {total - used > 0
              ? `${total - used} sessões restantes neste pacote`
              : "Parabéns! Pacote concluído!"}
          </p>
        </div>

        {/* Nome da clínica no rodapé */}
        <div className="mt-4 pt-4 border-t border-border/50 w-full">
          <p className="text-sm font-semibold text-foreground">{clinicName}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Obrigada pela confiança! 💆‍♀️
          </p>
        </div>

        {/* Contagem regressiva */}
        <p className="text-sm font-medium text-muted-foreground animate-pulse mt-2">
          {`Retornando em ${countdown} ${countdown === 1 ? "segundo" : "segundos"}...`}
        </p>
      </div>
    </div>
  );
}

export default function TotemSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-background p-6">
          <p className="text-muted-foreground font-medium animate-pulse">
            Carregando dados do check-in...
          </p>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}

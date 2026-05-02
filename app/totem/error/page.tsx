// app/totem/error/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { AlertTriangle, ArrowLeft } from "@boxicons/react";
import { Button } from "@/components/ui/button";

const errorMessages: Record<string, { title: string; description: string }> = {
  CPF_NOT_FOUND: {
    title: "CPF não encontrado",
    description:
      "Não encontramos seu cadastro. Por favor, fale com a recepção para se cadastrar.",
  },
  PACKAGE_EXHAUSTED: {
    title: "Pacote de sessões esgotado",
    description:
      "Todas as sessões do seu pacote foram utilizadas. Fale com a recepção para renovar.",
  },
  NO_ACTIVE_PACKAGE: {
    title: "Nenhum pacote ativo",
    description:
      "Você não possui um pacote de sessões ativo. Fale com a recepção.",
  },
  CHECKIN_DUPLICATE: {
    title: "Check-in já realizado",
    description:
      "Você já fez check-in hoje neste pacote. Aproveite seu atendimento!",
  },
  ORG_NOT_FOUND: {
    title: "Login não identificado",
    description: "Não conseguimos identificar a empresa.",
  },
  UNKNOWN: {
    title: "Erro inesperado",
    description:
      "Ocorreu um problema ao processar seu check-in. Fale com a recepção.",
  },
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const errorType = searchParams.get("type") || "UNKNOWN";
  const slug = searchParams.get("slug") || "";
  const error = errorMessages[errorType] || errorMessages.UNKNOWN;

  // Agora definimos apenas o link para voltar ao início
  const idleLink = slug ? `/totem/idle?slug=${slug}` : "/totem/idle";

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-8 p-6 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-14 w-14 text-destructive" />
      </div>

      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
          {error.title}
        </h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          {error.description}
        </p>
      </div>

      <div className="flex w-full flex-col gap-3">
        <Button asChild size="lg" className="h-16 text-lg">
          <Link href={idleLink}>
            <ArrowLeft className="mr-2 h-5 w-5" />
            Voltar ao Início
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function TotemErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-6">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}

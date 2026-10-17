// app/(private)/admin/dashboard/_components/scheduling-link.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Link as LinkIcon, Cog, Check } from "@boxicons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type SchedulingLinkData = string | {
  slug?: string;
  isActive?: boolean;
};

export function SchedulingLink({ data }: { data?: SchedulingLinkData }) {
  const [copied, setCopied] = useState(false);

  const organizationSlug = typeof data === "string" ? data : (data?.slug || "");
  const isActive = typeof data === "object" ? Boolean(data?.isActive) : false;

  const schedulingUrl = `https://totten.com.br/${organizationSlug}/agendar`;

  const handleCopy = () => {
    navigator.clipboard.writeText(schedulingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-none shadow-none bg-transparent flex flex-col w-full h-full transition-all relative overflow-hidden">
      {/* Decoração de fundo */}
      <LinkIcon
        className="absolute -right-4 -bottom-4 text-primary/5 pointer-events-none"
        width={120}
        height={120}
        rotate={-15}
      />

      <CardHeader className="py-3 px-4 relative z-10">
        <CardTitle className="text-base font-bold text-foreground">
          Link de Agendamento
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 pb-4 flex-1 flex flex-col justify-center relative z-10">
        {!isActive ? (
          <div className="flex-1 flex flex-col justify-between py-1">
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-foreground">
                Página de agendamento inativa
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ative e configure sua página personalizada para liberar o agendamento online dos seus clientes.
              </p>
            </div>

            <div className="pt-4 mt-auto">
              <Link href="/admin/custom-page" className="w-full block">
                <Button
                  size="sm"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-sm text-xs font-semibold"
                >
                  <Cog size="xs" className="mr-1.5" /> Configurar e Ativar
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              Compartilhe este link com seus clientes para que eles mesmos possam agendar horários.
            </p>

            <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg border border-border/50 mb-4">
              <span className="text-sm text-foreground truncate flex-1 font-medium pl-2">
                {schedulingUrl}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-primary shrink-0"
                onClick={handleCopy}
                title="Copiar Link"
              >
                {copied ? <Check size="sm" className="text-emerald-500" /> : <Copy size="sm" />}
              </Button>
            </div>

            <div className="flex items-center gap-3 mt-auto">
              <Button
                size="sm"
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-sm text-xs"
                onClick={() => window.open(schedulingUrl, "_blank")}
              >
                <LinkIcon size="xs" className="mr-1.5" /> Acessar
              </Button>
              <Link href="/admin/custom-page" className="flex-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-border/50 bg-background hover:bg-muted text-foreground rounded-xl shadow-sm text-xs"
                >
                  <Cog size="xs" className="mr-1.5" /> Configurar
                </Button>
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

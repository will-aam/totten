// app/admin/clients/[id]/anamnesis/[responseId]/page.tsx
"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileDetail,
  LoaderDots,
  Printer,
  CheckCircle,
  Clock,
  PenDraw,
} from "@boxicons/react";

import { AdminHeader } from "@/components/admin-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

import { SignaturePad } from "@/components/ui/signature-pad";
import {
  getAnamnesisResponseById,
  signAnamnesisResponse,
} from "@/app/actions/anamnesis";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const formatDate = (dateString: string) => {
  return dateFormatter.format(new Date(dateString));
};

export default function AnamnesisDocumentPage({
  params,
}: {
  params: Promise<{ id: string; responseId: string }>;
}) {
  const { toast } = useToast();

  const resolvedParams = use(params);
  const clientId = resolvedParams.id;
  const responseId = resolvedParams.responseId;

  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [signature, setSignature] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const result = await getAnamnesisResponseById(responseId);
    if (result.success && result.data) {
      setResponse(result.data);
    } else {
      toast({
        title: "Erro",
        description: result.error || "Falha ao carregar.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }, [responseId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSign = async () => {
    if (!signature) return;

    setIsSigning(true);
    const signResult = await signAnamnesisResponse(responseId, signature);
    setIsSigning(false);

    if (signResult.success) {
      toast({
        title: "Sucesso!",
        description: "Ficha assinada e trancada com valor legal.",
      });
      loadData();
    } else {
      toast({
        title: "Erro ao Assinar",
        description: signResult.error,
        variant: "destructive",
      });
    }
  };

  const renderValue = (type: string, value: any) => {
    if (value === null || value === undefined || value === "") {
      return (
        <span className="text-muted-foreground italic print:text-gray-500">
          Não respondido
        </span>
      );
    }
    if (type === "boolean") {
      return (
        <span className="font-semibold">{value === true ? "Sim" : "Não"}</span>
      );
    }
    if (type === "multiple_choice" && Array.isArray(value)) {
      if (value.length === 0)
        return (
          <span className="text-muted-foreground italic print:text-gray-500">
            Nenhuma opção selecionada
          </span>
        );
      return (
        <ul className="list-disc list-inside">
          {value.map((item, idx) => (
            <li key={idx} className="font-semibold">
              {item}
            </li>
          ))}
        </ul>
      );
    }
    return <span className="font-semibold whitespace-pre-wrap">{value}</span>;
  };

  if (isLoading && !response) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <LoaderDots size="lg" className="text-primary mb-4" />
        <p className="text-muted-foreground">Carregando o documento...</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <FileDetail
          size="lg"
          className="text-muted-foreground mb-4 opacity-50"
        />
        <p className="text-muted-foreground">Documento não encontrado.</p>
        <Button asChild variant="link" className="mt-4">
          <Link href={`/admin/clients/${clientId}`}>Voltar ao perfil</Link>
        </Button>
      </div>
    );
  }

  const content = (response.content as any[]) || [];
  const client = response.client || {};

  return (
    <>
      <style type="text/css" media="print">
        {`
          @page { size: A4 portrait; margin: 0; }
          body { padding: 15mm !important; }
          header, nav, aside, .print-hidden { display: none !important; }
          :root, html, html.dark, .dark, body {
            --background: #ffffff !important;
            --foreground: #09090b !important;
            --card: #ffffff !important;
            --card-foreground: #09090b !important;
            --muted: #f4f4f5 !important;
            --muted-foreground: #71717a !important;
            --border: #e4e4e7 !important;
            background-color: #ffffff !important;
            color: #09090b !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-wrapper { max-width: 100% !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .print-document { border: none !important; box-shadow: none !important; margin: 0 !important; padding: 0 !important; }
          .signature-img-print { filter: none !important; -webkit-filter: none !important; mix-blend-mode: normal !important; }
        `}
      </style>

      <div className="print-hidden">
        <AdminHeader title="Visualizar Ficha" />
      </div>

      <div className="print-wrapper flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 relative animate-in fade-in duration-500 min-h-[calc(100vh-100px)]">
        {/* Barra de Ações Superior */}
        <div className="print-hidden flex items-center justify-between border-b border-border/50 pb-4">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl font-bold h-10 px-4"
          >
            <Link href={`/admin/clients/${clientId}`}>
              <ArrowLeft size="sm" className="mr-2" /> Voltar
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="rounded-xl font-bold shadow-sm h-10 px-4"
            onClick={() => window.print()}
          >
            <Printer size="sm" className="mr-2" /> Imprimir Documento
          </Button>
        </div>

        {/* O Documento */}
        <div className="print-document bg-background border border-border/60 shadow-sm rounded-4xl p-6 md:p-10">
          {/* Cabeçalho */}
          <div className="text-center mb-8 pb-6 border-b-2 border-primary/20 print:border-gray-300">
            <h1 className="text-2xl font-black uppercase tracking-widest mb-2 text-foreground">
              {response.template?.name || "Ficha de Anamnese"}
            </h1>
            <p className="text-sm font-medium text-muted-foreground print:text-gray-600">
              Documento registrado em {formatDate(response.created_at)}
            </p>

            <div className="mt-4 inline-flex items-center gap-2 print-hidden">
              {response.signed_at ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xl">
                  <CheckCircle size="xs" className="mr-1.5" /> Assinado
                  Legalmente
                </Badge>
              ) : (
                <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xl">
                  <Clock size="xs" className="mr-1.5" /> Rascunho Pendente
                </Badge>
              )}
            </div>
          </div>

          {/* Dados do Cliente */}
          <div className="mb-8 grid grid-cols-2 md:grid-cols-3 gap-4 bg-muted/30 p-6 rounded-3xl print:bg-gray-50 print:border print:border-gray-200">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest print:text-gray-500">
                Cliente
              </p>
              <p className="font-bold text-foreground text-sm sm:text-base truncate">
                {client.name}
              </p>
            </div>
            {client.cpf && (
              <div className="flex flex-col gap-1">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest print:text-gray-500">
                  CPF
                </p>
                <p className="font-bold text-foreground text-sm sm:text-base">
                  {client.cpf}
                </p>
              </div>
            )}
            {client.phone_whatsapp && (
              <div className="flex flex-col gap-1">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest print:text-gray-500">
                  WhatsApp
                </p>
                <p className="font-bold text-foreground text-sm sm:text-base">
                  {client.phone_whatsapp}
                </p>
              </div>
            )}
            {client.email && (
              <div className="md:col-span-2 print:col-span-1 flex flex-col gap-1">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest print:text-gray-500">
                  E-mail
                </p>
                <p className="font-bold text-foreground text-sm sm:text-base truncate">
                  {client.email}
                </p>
              </div>
            )}
          </div>

          {/* Respostas */}
          <div className="space-y-6">
            {content.map((item, index) => {
              if (item.type === "section_title") {
                return (
                  <div
                    key={index}
                    className="pt-6 pb-2 border-b border-border/50 print:border-gray-200 print:break-after-avoid"
                  >
                    <h3 className="text-lg font-black text-primary print:text-black tracking-tight">
                      {item.label}
                    </h3>
                  </div>
                );
              }
              return (
                <div
                  key={index}
                  className="flex flex-col gap-1.5 print:break-inside-avoid"
                >
                  <p className="text-sm font-semibold text-muted-foreground print:text-gray-600">
                    {item.label}
                  </p>
                  <div className="text-base text-foreground print:text-black">
                    {renderValue(item.type, item.value)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Assinatura */}
          {response.signature ? (
            <div className="mt-16 pt-8 border-t-2 border-dashed border-border print:border-gray-300 flex flex-col items-center print:break-inside-avoid">
              <p className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest print:text-gray-600">
                Assinatura registrada eletronicamente em{" "}
                {formatDate(response.signed_at)}
              </p>
              <div className="bg-muted/10 border border-border/50 rounded-2xl p-4 w-full max-w-md flex justify-center print:bg-transparent print:border-none">
                <img
                  src={response.signature}
                  alt="Assinatura do Cliente"
                  className="signature-img-print max-h-24 object-contain mix-blend-multiply dark:mix-blend-normal dark:invert"
                />
              </div>
              <div className="w-full max-w-sm border-t border-foreground/30 print:border-black mt-2 text-center pt-2">
                <p className="font-black text-sm uppercase tracking-widest print:text-black mt-2">
                  {client.name}
                </p>
                <p className="text-xs font-medium text-muted-foreground mt-1 print:text-gray-500">
                  CPF: {client.cpf || "Não informado"}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-12 pt-8 border-t-2 border-dashed border-border print:border-gray-300 w-full print:break-inside-avoid">
              <div className="block w-full print-hidden">
                <div className="space-y-4 p-5 border-2 border-primary/10 rounded-2xl bg-background shadow-sm w-full">
                  <div className="flex items-center gap-2 mb-2">
                    <PenDraw size="sm" className="text-primary" />
                    <h3 className="text-xl font-bold">Assinatura da Cliente</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Solicite que a cliente assine no quadro abaixo usando o dedo
                    ou caneta touch. Após assinar, o documento não poderá mais
                    ser alterado.
                  </p>
                  <SignaturePad onSignatureChange={setSignature} />
                </div>

                <div className="flex justify-end mt-4">
                  <Button
                    onClick={handleSign}
                    disabled={!signature || isSigning}
                    className="w-full md:w-auto h-12 px-8 rounded-xl font-bold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isSigning ? (
                      <LoaderDots size="sm" className="animate-spin mr-2" />
                    ) : (
                      <CheckCircle size="sm" className="mr-2" />
                    )}
                    Finalizar Assinatura
                  </Button>
                </div>
              </div>

              {/* Interface de Impressão */}
              <div className="hidden print:flex flex-col items-center w-full mt-8">
                <p className="text-gray-500 italic text-xs font-bold mb-16">
                  Este documento foi impresso sem assinatura digital.
                </p>
                <div className="w-full max-w-sm border-t border-black text-center pt-2">
                  <p className="font-bold text-black uppercase text-sm mt-2">
                    {client.name}
                  </p>
                  <p className="text-xs font-medium text-gray-500 mt-1">
                    Assinatura Manual
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

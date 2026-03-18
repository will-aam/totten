// app/admin/clients/[id]/anamnesis/[responseId]/page.tsx
"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Loader2,
  Printer,
  CheckCircle2,
  Clock,
} from "lucide-react";

import { AdminHeader } from "@/components/admin-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

import { getAnamnesisResponseById } from "@/app/actions/anamnesis";

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

  useEffect(() => {
    async function loadData() {
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
    }
    loadData();
  }, [responseId, toast]);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando o documento...</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <FileText className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
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
      {/* 🔥 A MÁGICA DA IMPRESSÃO ACONTECE AQUI */}
      <style type="text/css" media="print">
        {`
          /* 1. Margem 0 desativa a injeção da URL e Data do navegador na folha */
          @page { size: A4 portrait; margin: 0; }
          
          /* 2. Devolvemos a margem ao corpo do documento para o texto não encostar na borda */
          body { padding: 15mm !important; }

          /* 3. Esconde qualquer header, navbar, sidebar ou botões à força */
          header, nav, aside, .print-hidden { 
            display: none !important; 
          }

          /* 4. Sobrescreve as variáveis do tema escuro para claro */
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

          /* 5. Estica o documento e tira a aparência de "quadro" (remove max-width e bordas) */
          .print-wrapper {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-document {
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* 🔥 NOVA REGRA: Força a assinatura a ser preta na impressão */
          .signature-img-print {
            filter: none !important;
            -webkit-filter: none !important;
            mix-blend-mode: normal !important;
          }
        `}
      </style>

      {/* Ocultamos o Header do painel admin na impressão */}
      <div className="print-hidden">
        <AdminHeader title="Visualizar Ficha" />
      </div>

      <div className="print-wrapper flex flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto w-full pb-24">
        {/* Barra de Ações Superior (Oculta na impressão) */}
        <div className="print-hidden flex items-center justify-between border-b border-border/50 pb-4">
          <Button asChild variant="outline" size="sm" className="rounded-xl">
            <Link href={`/admin/clients/${clientId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="rounded-xl font-bold shadow-sm"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4 mr-2" /> Imprimir Documento
          </Button>
        </div>

        {/* O Documento (A "Folha de Papel") */}
        <div className="print-document bg-background border border-border/60 shadow-sm rounded-xl p-6 md:p-10">
          {/* Cabeçalho do Documento */}
          <div className="text-center mb-8 pb-6 border-b-2 border-primary/20 print:border-gray-300">
            <h1 className="text-2xl font-bold uppercase tracking-wider mb-2">
              {response.template?.name || "Ficha de Anamnese"}
            </h1>
            <p className="text-muted-foreground print:text-gray-600">
              Documento registrado em {formatDate(response.created_at)}
            </p>

            <div className="mt-4 inline-flex items-center gap-2 print:hidden">
              {response.signed_at ? (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none px-3 py-1">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Assinado
                  Legalmente
                </Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none px-3 py-1">
                  <Clock className="w-4 h-4 mr-1.5" /> Rascunho Pendente
                </Badge>
              )}
            </div>
          </div>

          {/* Dados Dinâmicos do Cliente */}
          <div className="mb-8 grid grid-cols-2 md:grid-cols-3 gap-4 bg-muted/20 p-5 rounded-xl print:bg-gray-50 print:border print:border-gray-200">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1 print:text-gray-500">
                Cliente
              </p>
              <p className="font-semibold text-base">{client.name}</p>
            </div>

            {client.cpf && (
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1 print:text-gray-500">
                  CPF
                </p>
                <p className="font-semibold text-base">{client.cpf}</p>
              </div>
            )}

            {client.phone_whatsapp && (
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1 print:text-gray-500">
                  WhatsApp
                </p>
                <p className="font-semibold text-base">
                  {client.phone_whatsapp}
                </p>
              </div>
            )}

            {client.email && (
              <div className="md:col-span-2 print:col-span-1">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1 print:text-gray-500">
                  E-mail
                </p>
                <p className="font-semibold text-base">{client.email}</p>
              </div>
            )}
          </div>

          {/* Perguntas e Respostas */}
          <div className="space-y-6">
            {content.map((item, index) => {
              if (item.type === "section_title") {
                return (
                  <div
                    key={index}
                    className="pt-4 pb-2 border-b print:border-gray-200 print:break-after-avoid"
                  >
                    <h3 className="text-lg font-bold text-primary print:text-black">
                      {item.label}
                    </h3>
                  </div>
                );
              }

              return (
                <div
                  key={index}
                  className="flex flex-col gap-1 print:break-inside-avoid"
                >
                  <p className="text-sm text-muted-foreground print:text-gray-600">
                    {item.label}
                  </p>
                  <div className="text-base text-foreground print:text-black">
                    {renderValue(item.type, item.value)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Área de Assinatura */}
          {response.signature ? (
            <div className="mt-16 pt-8 border-t-2 border-dashed border-border print:border-gray-300 flex flex-col items-center print:break-inside-avoid">
              <p className="text-sm text-muted-foreground mb-4 print:text-gray-600">
                Assinatura registrada eletronicamente em{" "}
                {formatDate(response.signed_at)}
              </p>
              <div className="bg-muted/10 border border-border/50 rounded-lg p-4 w-full max-w-md flex justify-center print:bg-transparent print:border-none">
                <img
                  src={response.signature}
                  alt="Assinatura do Cliente"
                  className="signature-img-print max-h-24 object-contain mix-blend-multiply dark:mix-blend-normal dark:invert"
                />
              </div>
              <div className="w-full max-w-sm border-t border-foreground print:border-black mt-2 text-center pt-2">
                <p className="font-bold print:text-black">{client.name}</p>
                <p className="text-xs text-muted-foreground mt-1 print:text-gray-500">
                  CPF: {client.cpf || "Não informado"}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-16 pt-8 border-t border-dashed border-border print:border-gray-300 flex flex-col items-center text-center print:break-inside-avoid">
              <p className="text-muted-foreground italic print:text-gray-500">
                Este documento ainda não foi assinado pela cliente.
              </p>
              <div className="w-full max-w-sm border-t border-foreground print:border-black mt-16 text-center pt-2">
                <p className="font-bold print:text-black">{client.name}</p>
                <p className="text-xs text-muted-foreground mt-1 print:text-gray-500">
                  Assinatura Manual
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

"use client";

import { useEffect, useState, use } from "react";
import { getAnamnesisTemplateById } from "@/app/actions/anamnesis";
import { Printer, ChevronLeft } from "@boxicons/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";

export default function PrintAnamnesisTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const templateId = resolvedParams.id;
  const [template, setTemplate] = useState<any>(null);

  useEffect(() => {
    async function loadTemplate() {
      const result = await getAnamnesisTemplateById(templateId);
      if (result.success && result.data) {
        setTemplate(result.data);
      }
    }
    loadTemplate();
  }, [templateId]);

  if (!template) {
    return <div className="p-8 text-center text-muted-foreground">Carregando documento...</div>;
  }

  const fields = (template.fields as any[]) || [];

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
        `}
      </style>

      <div className="print-hidden">
        <AdminHeader title="Imprimir Ficha" />
      </div>

      <div className="print-hidden flex items-center justify-between p-4 max-w-400 mx-auto w-full border-b border-border/50">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="font-bold h-10 px-4"
        >
          <Link href="/admin/anamnesis">
            <ChevronLeft size="sm" className="mr-2" /> Voltar
          </Link>
        </Button>
        <Button onClick={() => window.print()} className="font-bold shadow-sm h-10 px-6">
          <Printer className="mr-2 w-5 h-5" /> Imprimir / Baixar PDF
        </Button>
      </div>

      <div className="print-wrapper p-8 max-w-3xl mx-auto bg-white text-black min-h-screen border my-8 shadow-sm print:border-none print:shadow-none print:my-0">
        <div className="text-center mb-8 pb-6 border-b-2 border-gray-300">
          <h1 className="text-2xl font-black uppercase tracking-widest mb-2 text-black">
            {template.name}
          </h1>
          <p className="text-sm font-medium text-gray-600">
            Ficha de Anamnese
          </p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 bg-gray-50 p-6 rounded-3xl border border-gray-200">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">
              Nome da Cliente
            </p>
            <div className="border-b border-gray-400 h-6 w-full"></div>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">
              Data de Nascimento / Idade
            </p>
            <div className="border-b border-gray-400 h-6 w-full"></div>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">
              Telefone / WhatsApp
            </p>
            <div className="border-b border-gray-400 h-6 w-full"></div>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">
              Data
            </p>
            <div className="border-b border-gray-400 h-6 w-full"></div>
          </div>
        </div>

        <div className="space-y-6">
          {fields.map((item, index) => {
            if (item.type === "section_title") {
              return (
                <div key={index} className="pt-6 pb-2 border-b border-gray-200 print:break-after-avoid">
                  <h3 className="text-lg font-black text-black tracking-tight">
                    {item.label}
                  </h3>
                </div>
              );
            }
            if (item.type === "text") {
              return (
                <div key={index} className="flex flex-col gap-1.5 print:break-inside-avoid">
                  <p className="text-sm font-semibold text-gray-800">
                    {item.label}
                  </p>
                  <div className="border-b border-gray-300 w-full h-6 mt-1"></div>
                  <div className="border-b border-gray-300 w-full h-6 mt-1"></div>
                </div>
              );
            }
            if (item.type === "boolean") {
              return (
                <div key={index} className="flex flex-col gap-1.5 print:break-inside-avoid">
                  <p className="text-sm font-semibold text-gray-800">
                    {item.label}
                  </p>
                  <div className="flex gap-6 items-center mt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-gray-400 rounded-sm"></div>
                      <span className="text-base">Sim</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-gray-400 rounded-sm"></div>
                      <span className="text-base">Não</span>
                    </div>
                  </div>
                  {item.requireSpecificationWhenYes && (
                    <div className="mt-4 flex items-end gap-2 w-full">
                      <span className="text-sm text-gray-600 whitespace-nowrap">Se sim, especifique:</span>
                      <div className="border-b border-gray-400 w-full"></div>
                    </div>
                  )}
                </div>
              );
            }
            if (item.type === "single_choice" || item.type === "multiple_choice") {
              const options = [...(item.options || [])];
              if (item.hasOtherOption) {
                options.push("Outros");
              }
              const isMultiple = item.type === "multiple_choice";
              return (
                <div key={index} className="flex flex-col gap-1.5 print:break-inside-avoid">
                  <p className="text-sm font-semibold text-gray-800">
                    {item.label}
                  </p>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 mt-2">
                    {options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className={`w-5 h-5 border-2 border-gray-400 ${isMultiple ? 'rounded-sm' : 'rounded-full'}`}></div>
                        <span className="text-base">{opt}</span>
                      </div>
                    ))}
                  </div>
                  {(item.hasOtherOption) && (
                    <div className="mt-4 flex items-end gap-2 w-full">
                      <span className="text-sm text-gray-600 whitespace-nowrap">Se outros, especifique:</span>
                      <div className="border-b border-gray-400 w-full"></div>
                    </div>
                  )}
                </div>
              );
            }
            if (item.type === "consent_term") {
              return (
                <div key={index} className="flex flex-col gap-1.5 mt-8 print:break-inside-avoid">
                  <p className="text-sm font-semibold text-gray-800 text-justify">
                    {item.label}
                  </p>
                  <div className="flex items-center gap-3 mt-4">
                    <div className="w-6 h-6 border-2 border-gray-400 rounded-sm"></div>
                    <span className="text-base font-bold">Li e concordo com o termo acima.</span>
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>

        <div className="mt-24 pt-8 flex flex-col items-center print:break-inside-avoid">
          <div className="w-full max-w-sm border-t border-black text-center pt-2">
            <p className="font-bold text-black uppercase text-sm mt-2">
              Assinatura da Cliente
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

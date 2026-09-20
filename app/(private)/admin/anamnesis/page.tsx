// app/admin/anamnesis/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Plus } from "@boxicons/react";
import {
  Edit,
  FileDetail,
  LoaderDots,
  Archive,
  ArchiveArrowUp,
  Printer,
} from "@boxicons/react";
import { createRoot } from "react-dom/client";

import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

import {
  getAllAnamnesisTemplates,
  toggleAnamnesisTemplateStatus,
} from "@/app/actions/anamnesis";

export default function AnamnesisListPage() {
  const { data: session } = useSession();
  const { toast } = useToast();

  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<string | null>(null);

  const organizationId = session?.user?.organizationId;

  const loadTemplates = useCallback(async () => {
    if (organizationId) {
      setIsLoading(true);
      const result = await getAllAnamnesisTemplates(organizationId);
      if (result.success && result.data) {
        setTemplates(result.data);
      }
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const actionText = currentStatus ? "arquivar" : "reativar";

    if (
      !confirm(
        `Tem certeza que deseja ${actionText} este modelo? ${currentStatus
          ? "Ele não aparecerá mais para preenchimento de novas fichas."
          : "Ele voltará a aparecer na lista de novas fichas."
        }`,
      )
    )
      return;

    const result = await toggleAnamnesisTemplateStatus(id, currentStatus);
    if (result.success) {
      toast({
        title: "Sucesso",
        description: `Modelo ${currentStatus ? "arquivado" : "reativado"} com sucesso.`,
      });
      loadTemplates();
    } else {
      toast({
        title: "Erro",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleDownloadPdf = async (template: any) => {
    setIsGeneratingPdf(template.id);
    try {
      const container = document.createElement("div");
      
      const fields = (template.fields as any[]) || [];
      const content = (
        <div style={{ padding: "40px", fontFamily: "sans-serif", color: "#000", backgroundColor: "#fff" }}>
          <div style={{ textAlign: "center", marginBottom: "30px", paddingBottom: "20px", borderBottom: "2px solid #ddd" }}>
            <h1 style={{ fontSize: "24px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "2px", margin: "0 0 10px 0" }}>
              {template.name}
            </h1>
            <p style={{ fontSize: "14px", color: "#555", margin: 0 }}>Ficha de Anamnese</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", backgroundColor: "#f9f9f9", padding: "20px", borderRadius: "16px", border: "1px solid #eee", marginBottom: "30px" }}>
            {["Nome da Cliente", "Data de Nascimento / Idade", "Telefone / WhatsApp", "Data"].map(label => (
              <div key={label} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <p style={{ fontSize: "10px", color: "#777", textTransform: "uppercase", fontWeight: "900", letterSpacing: "1px", margin: 0 }}>{label}</p>
                <div style={{ borderBottom: "1px solid #999", height: "20px", width: "100%" }}></div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {fields.map((item, index) => {
              if (item.type === "section_title") {
                return (
                  <div key={index} style={{ paddingTop: "20px", paddingBottom: "10px", borderBottom: "1px solid #ddd" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: "900", margin: 0 }}>{item.label}</h3>
                  </div>
                );
              }
              if (item.type === "text") {
                return (
                  <div key={index} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <p style={{ fontSize: "14px", fontWeight: "600", margin: 0 }}>{item.label}</p>
                    <div style={{ borderBottom: "1px solid #ccc", height: "20px", width: "100%", marginTop: "4px" }}></div>
                    <div style={{ borderBottom: "1px solid #ccc", height: "20px", width: "100%", marginTop: "4px" }}></div>
                  </div>
                );
              }
              if (item.type === "boolean") {
                return (
                  <div key={index} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <p style={{ fontSize: "14px", fontWeight: "600", margin: 0 }}>{item.label}</p>
                    <div style={{ display: "flex", gap: "24px", alignItems: "center", marginTop: "4px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "16px", height: "16px", border: "2px solid #999", borderRadius: "2px" }}></div>
                        <span style={{ fontSize: "14px" }}>Sim</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "16px", height: "16px", border: "2px solid #999", borderRadius: "2px" }}></div>
                        <span style={{ fontSize: "14px" }}>Não</span>
                      </div>
                    </div>
                    {item.requireSpecificationWhenYes && (
                      <div style={{ marginTop: "16px", display: "flex", alignItems: "flex-end", gap: "8px", width: "100%" }}>
                        <span style={{ fontSize: "12px", color: "#555", whiteSpace: "nowrap" }}>Se sim, especifique:</span>
                        <div style={{ borderBottom: "1px solid #999", width: "100%" }}></div>
                      </div>
                    )}
                  </div>
                );
              }
              if (item.type === "single_choice" || item.type === "multiple_choice") {
                const options = [...(item.options || [])];
                if (item.hasOtherOption) options.push("Outros");
                const isMultiple = item.type === "multiple_choice";
                return (
                  <div key={index} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <p style={{ fontSize: "14px", fontWeight: "600", margin: 0 }}>{item.label}</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: "12px", columnGap: "16px", marginTop: "8px" }}>
                      {options.map((opt, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "16px", height: "16px", border: "2px solid #999", borderRadius: isMultiple ? "2px" : "50%" }}></div>
                          <span style={{ fontSize: "14px" }}>{opt}</span>
                        </div>
                      ))}
                    </div>
                    {item.hasOtherOption && (
                      <div style={{ marginTop: "16px", display: "flex", alignItems: "flex-end", gap: "8px", width: "100%" }}>
                        <span style={{ fontSize: "12px", color: "#555", whiteSpace: "nowrap" }}>Se outros, especifique:</span>
                        <div style={{ borderBottom: "1px solid #999", width: "100%" }}></div>
                      </div>
                    )}
                  </div>
                );
              }
              if (item.type === "consent_term") {
                return (
                  <div key={index} style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "32px" }}>
                    <p style={{ fontSize: "14px", fontWeight: "600", margin: 0, textAlign: "justify" }}>{item.label}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "16px" }}>
                      <div style={{ width: "20px", height: "20px", border: "2px solid #999", borderRadius: "2px" }}></div>
                      <span style={{ fontSize: "14px", fontWeight: "bold" }}>Li e concordo com o termo acima.</span>
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>

          <div style={{ marginTop: "80px", paddingTop: "32px", display: "flex", flexDirection: "column", alignItems: "center", pageBreakInside: "avoid" }}>
            <div style={{ width: "100%", maxWidth: "300px", borderTop: "1px solid #000", textAlign: "center", paddingTop: "8px" }}>
              <p style={{ fontWeight: "bold", color: "#000", textTransform: "uppercase", fontSize: "12px", margin: 0 }}>
                Assinatura da Cliente
              </p>
            </div>
          </div>
        </div>
      );

      const root = createRoot(container);
      root.render(content);

      // Wait a bit for React to render
      await new Promise(resolve => setTimeout(resolve, 500));

      const html2pdf = (await import("html2pdf.js")).default;

      const opt = {
        margin: 10,
        filename: `Anamnese_${template.name.replace(/[^a-z0-9]/gi, '_')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(container).save();
      
      root.unmount();
    } catch (err) {
      console.error(err);
      toast({
        title: "Erro",
        description: "Falha ao gerar o PDF.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPdf(null);
    }
  };

  return (
    <>
      <AdminHeader title="Fichas de Anamnese" />

      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 md:pb-6 relative animate-in fade-in duration-500 min-h-[calc(100vh-100px)]">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Modelos de Anamnese
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Crie e gerencie os formulários que suas clientes precisarão
              assinar.
            </p>
          </div>
          <Button
            asChild
            className="h-12 px-8 font-medium shadow-sm"
          >
            <Link href="/admin/anamnesis/new">
              <Plus className="w-5 h-5 mr-2" />
              Novo Modelo
            </Link>
          </Button>
        </div>

        {/* Lista de Templates */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground flex-1">
            <LoaderDots size="lg" className="mb-4 text-primary" />
            <p>Carregando modelos...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-border">
            <img width="48" height="48" src="https://img.icons8.com/parakeet/48/question.png" alt="question" />
            <h3 className="text-lg font-bold text-foreground mt-4">
              Nenhum modelo encontrado
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mt-1">
              Você ainda não criou nenhum formulário de anamnese. Clique no
              botão abaixo para criar o seu primeiro.
            </p>

          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card
                key={template.id}
                className={`group overflow-hidden rounded-2xl border-border/50 transition-all ${template.active
                  ? "bg-muted/10 hover:bg-muted/30 hover:border-primary/30"
                  : "bg-muted/5 opacity-70 grayscale-[0.5]"
                  }`}
              >
                <CardContent className="p-5 flex flex-col h-full relative">
                  <div className="absolute top-4 right-4">
                    {template.active ? (
                      <Badge
                        variant="default"
                        className="bg-primary/10 text-primary hover:bg-primary/20 pointer-events-none"
                      >
                        Ativo
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="pointer-events-none"
                      >
                        Arquivado
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-start justify-between mb-4 mt-2">
                    <div
                      className={`p-2.5 rounded-lg ${template.active
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                        }`}
                    >
                      <FileDetail size="md" />
                    </div>
                  </div>

                  <h3 className="font-bold text-lg text-foreground line-clamp-1 mb-1 pr-16">
                    {template.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {template.fields ? template.fields.length : 0} perguntas
                  </p>

                  {/* Ações */}
                  <div className="mt-auto grid grid-cols-3 gap-2 pt-4 border-t border-border/50">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-base font-medium px-0"
                      disabled={isGeneratingPdf === template.id}
                      onClick={() => handleDownloadPdf(template)}
                    >
                      {isGeneratingPdf === template.id ? (
                        <LoaderDots size="sm" className="mr-1.5 animate-spin" />
                      ) : (
                        <Printer size="sm" className="mr-1.5" />
                      )}
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-base font-medium px-0"
                      asChild
                    >
                      <Link href={`/admin/anamnesis/${template.id}/edit`}>
                        <Edit size="sm" className="mr-1.5" />
                        Editar
                      </Link>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-base font-medium px-0"
                      onClick={() =>
                        handleToggleStatus(template.id, template.active)
                      }
                    >
                      {template.active ? (
                        <>
                          <Archive size="sm" className="mr-1.5" />
                          Arquivar
                        </>
                      ) : (
                        <>
                          <ArchiveArrowUp size="sm" className="mr-1.5" />
                          Reativar
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

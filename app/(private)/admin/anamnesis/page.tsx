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
      const ReactPdf = await import('@react-pdf/renderer');
      const { Document, Page, Text, View, StyleSheet, pdf } = ReactPdf;

      const styles = StyleSheet.create({
        page: { padding: 30, fontFamily: 'Helvetica', color: '#000' },
        header: { textAlign: 'center', marginBottom: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' },
        title: { fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 5 },
        subtitle: { fontSize: 12, color: '#555' },
        grid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#f9f9f9', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#eee', marginBottom: 20 },
        gridItem: { width: '50%', marginBottom: 12 },
        gridLabel: { fontSize: 9, color: '#777', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 2 },
        line: { borderBottomWidth: 1, borderBottomColor: '#999', marginTop: 12, width: '90%' },
        sectionTitle: { paddingTop: 12, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#ddd', marginBottom: 12, marginTop: 12 },
        sectionTitleText: { fontSize: 16, fontWeight: 'bold' },
        fieldBlock: { marginBottom: 16 },
        fieldLabel: { fontSize: 13, fontWeight: 'bold', marginBottom: 6 },
        textInputLine: { borderBottomWidth: 1, borderBottomColor: '#ccc', marginTop: 16 },
        booleanRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 6 },
        checkboxWrapper: { flexDirection: 'row', alignItems: 'flex-start', marginRight: 24, flex: 1 },
        checkbox: { width: 14, height: 14, borderWidth: 1.5, borderColor: '#999', marginRight: 6, flexShrink: 0 },
        checkboxLabel: { fontSize: 11, flex: 1, paddingTop: 1 },
        specWrapper: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 16 },
        specLabel: { fontSize: 11, color: '#555', marginRight: 6 },
        specLine: { borderBottomWidth: 1, borderBottomColor: '#999', flex: 1 },
        choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
        choiceItem: { width: '33.33%', flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, paddingRight: 8 },
        choiceCheckbox: { width: 14, height: 14, borderWidth: 1.5, borderColor: '#999', marginRight: 6, flexShrink: 0 },
        choiceCircle: { width: 14, height: 14, borderWidth: 1.5, borderColor: '#999', marginRight: 6, borderRadius: 7, flexShrink: 0 },
        consentBlock: { marginTop: 24 },
        consentText: { fontSize: 11, textAlign: 'justify', marginBottom: 12 },
        signatureBlock: { marginTop: 60, alignItems: 'center' },
        signatureLineWrapper: { width: 250, borderTopWidth: 1, borderTopColor: '#000', paddingTop: 6, alignItems: 'center' },
        signatureLabel: { fontSize: 11, textTransform: 'uppercase', fontWeight: 'bold' }
      });

      const fields = (template.fields as any[]) || [];

      const MyDoc = (
        <Document>
          <Page size="A4" style={styles.page}>
            <View style={styles.header} wrap={false}>
              <Text style={styles.title}>{template.name}</Text>
              <Text style={styles.subtitle}>Ficha de Anamnese</Text>
            </View>

            <View style={styles.grid} wrap={false}>
              {["Nome da Cliente", "Data de Nascimento / Idade", "Telefone / WhatsApp", "Data"].map(label => (
                <View key={label} style={styles.gridItem}>
                  <Text style={styles.gridLabel}>{label}</Text>
                  <View style={styles.line} />
                </View>
              ))}
            </View>

            {fields.map((item, index) => {
              if (item.type === "section_title") {
                return (
                  <View key={index} style={styles.sectionTitle} wrap={false}>
                    <Text style={styles.sectionTitleText}>{item.label}</Text>
                  </View>
                );
              }
              if (item.type === "text") {
                return (
                  <View key={index} style={styles.fieldBlock} wrap={false}>
                    <Text style={styles.fieldLabel}>{item.label}</Text>
                    <View style={styles.textInputLine} />
                    <View style={styles.textInputLine} />
                  </View>
                );
              }
              if (item.type === "boolean") {
                return (
                  <View key={index} style={styles.fieldBlock} wrap={false}>
                    <Text style={styles.fieldLabel}>{item.label}</Text>
                    <View style={styles.booleanRow}>
                      <View style={styles.checkboxWrapper}>
                        <View style={styles.checkbox} />
                        <Text style={styles.checkboxLabel}>Sim</Text>
                      </View>
                      <View style={styles.checkboxWrapper}>
                        <View style={styles.checkbox} />
                        <Text style={styles.checkboxLabel}>Não</Text>
                      </View>
                    </View>
                    {item.requireSpecificationWhenYes && (
                      <View style={styles.specWrapper}>
                        <Text style={styles.specLabel}>Se sim, especifique:</Text>
                        <View style={styles.specLine} />
                      </View>
                    )}
                  </View>
                );
              }
              if (item.type === "single_choice" || item.type === "multiple_choice") {
                const options = [...(item.options || [])];
                if (item.hasOtherOption) options.push("Outros");
                const isMultiple = item.type === "multiple_choice";
                return (
                  <View key={index} style={styles.fieldBlock}>
                    <Text style={styles.fieldLabel}>{item.label}</Text>
                    <View style={styles.choiceGrid}>
                      {options.map((opt, idx) => (
                        <View key={idx} style={styles.choiceItem}>
                          <View style={isMultiple ? styles.choiceCheckbox : styles.choiceCircle} />
                          <Text style={styles.checkboxLabel}>{opt}</Text>
                        </View>
                      ))}
                    </View>
                    {item.hasOtherOption && (
                      <View style={styles.specWrapper}>
                        <Text style={styles.specLabel}>Se outros, especifique:</Text>
                        <View style={styles.specLine} />
                      </View>
                    )}
                  </View>
                );
              }
              if (item.type === "consent_term") {
                return (
                  <View key={index} style={styles.consentBlock} wrap={false}>
                    <Text style={styles.consentText}>{item.label}</Text>
                    <View style={styles.booleanRow}>
                      <View style={styles.checkbox} />
                      <Text style={{ fontSize: 13, fontWeight: 'bold' }}>Li e concordo com o termo acima.</Text>
                    </View>
                  </View>
                );
              }
              return null;
            })}

            <View style={styles.signatureBlock} wrap={false}>
              <View style={styles.signatureLineWrapper}>
                <Text style={styles.signatureLabel}>Assinatura da Cliente</Text>
              </View>
            </View>
          </Page>
        </Document>
      );

      const blob = await pdf(MyDoc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Anamnese_${template.name.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
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

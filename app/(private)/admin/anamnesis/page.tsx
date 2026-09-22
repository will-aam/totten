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
  Trash,
  DotsVerticalRounded
} from "@boxicons/react";

import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

import {
  getAllAnamnesisTemplates,
  toggleAnamnesisTemplateStatus,
  deleteAnamnesisTemplate,
} from "@/app/actions/anamnesis";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ActionDialogType = "archive" | "unarchive" | "delete" | null;

export default function AnamnesisListPage() {
  const { data: session } = useSession();
  const { toast } = useToast();

  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<string | null>(null);

  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    type: ActionDialogType;
    templateId: string;
    templateName: string;
  }>({
    isOpen: false,
    type: null,
    templateId: "",
    templateName: "",
  });

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

  const handleActionConfirm = async () => {
    if (!dialogConfig.type || !dialogConfig.templateId) return;

    try {
      if (dialogConfig.type === "delete") {
        const result = await deleteAnamnesisTemplate(dialogConfig.templateId);
        if (result.success) {
          toast({
            title: "Sucesso",
            description: "Modelo excluído permanentemente.",
          });
          loadTemplates();
        } else {
          toast({
            title: "Não foi possível excluir",
            description: result.error,
            variant: "destructive",
          });
        }
      } else {
        // Archive or Unarchive
        const isArchiving = dialogConfig.type === "archive";
        // toggle expects current status, which is true if we are archiving
        const result = await toggleAnamnesisTemplateStatus(dialogConfig.templateId, isArchiving);
        if (result.success) {
          toast({
            title: "Sucesso",
            description: `Modelo ${isArchiving ? "arquivado" : "reativado"} com sucesso.`,
          });
          loadTemplates();
        } else {
          toast({
            title: "Erro",
            description: result.error,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao processar a ação.",
        variant: "destructive",
      });
    } finally {
      setDialogConfig({ ...dialogConfig, isOpen: false });
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
          <div className="flex flex-col rounded-xl border border-border/50 overflow-hidden divide-y divide-border/50">
            {templates.map((template, index) => (
              <div
                key={template.id}
                className={`flex items-center gap-4 px-5 py-4 transition-colors ${
                  template.active
                    ? "bg-card hover:bg-muted/20"
                    : "bg-muted/10 opacity-60"
                }`}
              >
                {/* Acento colorido */}
                <div
                  className={`w-1 self-stretch rounded-full flex-shrink-0 ${
                    template.active ? "bg-primary" : "bg-border"
                  }`}
                />

                {/* Ícone numerado */}
                <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0 select-none">
                  {index + 1}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {template.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {template.fields?.length ?? 0} perguntas
                  </p>
                </div>

                {/* Status */}
                {!template.active && (
                  <span className="hidden sm:inline-flex items-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground border border-border/60 rounded-full px-2 py-0.5 bg-muted/40 flex-shrink-0">
                    Arquivado
                  </span>
                )}

                {/* Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    >
                      {isGeneratingPdf === template.id ? (
                        <LoaderDots size="sm" className="animate-spin" />
                      ) : (
                        <DotsVerticalRounded size="sm" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg">
                    <DropdownMenuItem
                      onClick={() => handleDownloadPdf(template)}
                      disabled={isGeneratingPdf === template.id}
                      className="cursor-pointer"
                    >
                      <Printer size="sm" className="mr-2 text-muted-foreground" />
                      Salvar PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href={`/admin/anamnesis/${template.id}/edit`}>
                        <Edit size="sm" className="mr-2 text-muted-foreground" />
                        Editar
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() =>
                        setDialogConfig({
                          isOpen: true,
                          type: template.active ? "archive" : "unarchive",
                          templateId: template.id,
                          templateName: template.name,
                        })
                      }
                    >
                      {template.active ? (
                        <Archive size="sm" className="mr-2 text-muted-foreground" />
                      ) : (
                        <ArchiveArrowUp size="sm" className="mr-2 text-muted-foreground" />
                      )}
                      {template.active ? "Arquivar modelo" : "Reativar modelo"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                      onClick={() =>
                        setDialogConfig({
                          isOpen: true,
                          type: "delete",
                          templateId: template.id,
                          templateName: template.name,
                        })
                      }
                    >
                      <Trash size="sm" className="mr-2" />
                      Excluir permanente
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={dialogConfig.isOpen}
        onOpenChange={(open) => setDialogConfig({ ...dialogConfig, isOpen: open })}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogConfig.type === "archive" && "Arquivar modelo"}
              {dialogConfig.type === "unarchive" && "Reativar modelo"}
              {dialogConfig.type === "delete" && "Excluir permanentemente"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogConfig.type === "archive" && (
                <>
                  Tem certeza que deseja arquivar <strong>{dialogConfig.templateName}</strong>? 
                  Ele não aparecerá mais para preenchimento de novas fichas, mas as fichas antigas continuarão salvas.
                </>
              )}
              {dialogConfig.type === "unarchive" && (
                <>
                  Deseja reativar o modelo <strong>{dialogConfig.templateName}</strong>? 
                  Ele voltará a estar disponível para preenchimento de novas fichas.
                </>
              )}
              {dialogConfig.type === "delete" && (
                <>
                  Você está prestes a excluir <strong>{dialogConfig.templateName}</strong>. 
                  Esta ação é <strong className="text-destructive">irreversível</strong> e só poderá ser feita se o modelo não tiver nenhuma ficha preenchida usando ele.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleActionConfirm}
              className={dialogConfig.type === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {dialogConfig.type === "delete" ? "Sim, excluir" : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

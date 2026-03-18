// app/admin/clients/[id]/anamnesis/new/page.tsx
"use client";

import { useState, useEffect, use } from "react"; // 🔥 Importamos o 'use' aqui
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Save, PenTool, Loader2, CheckCircle2 } from "lucide-react";

import { AdminHeader } from "@/components/admin-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

import { SignaturePad } from "@/components/ui/signature-pad";
import {
  getAnamnesisTemplates,
  saveAnamnesisResponse,
  signAnamnesisResponse,
} from "@/app/actions/anamnesis";

// 🔥 Tipagem atualizada para Promise
export default function NewClientAnamnesisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();

  // 🔥 Desempacotando o params
  const resolvedParams = use(params);
  const clientId = resolvedParams.id;

  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);

  // Estado para guardar as respostas: { "id_da_pergunta": "resposta" }
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [signature, setSignature] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Busca os templates da organização ao abrir a tela
  useEffect(() => {
    async function loadTemplates() {
      if (session?.user?.organizationId) {
        const result = await getAnamnesisTemplates(session.user.organizationId);
        if (result.success && result.data) {
          setTemplates(result.data);
        }
        setIsLoading(false);
      }
    }
    loadTemplates();
  }, [session]);

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    setSelectedTemplate(template || null);
    setAnswers({}); // Reseta as respostas ao trocar de template
    setSignature(null);
  };

  const handleAnswerChange = (fieldId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSave = async (withSignature: boolean) => {
    if (!selectedTemplate) return;

    if (withSignature && !signature) {
      toast({
        title: "Aviso",
        description: "A assinatura da cliente é obrigatória para finalizar.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    // Formata as respostas para salvar o label da pergunta junto com a resposta (facilita na hora de gerar o PDF)
    const formattedContent = selectedTemplate.fields.map((field: any) => ({
      fieldId: field.id,
      label: field.label,
      type: field.type,
      value: answers[field.id] !== undefined ? answers[field.id] : null,
    }));

    // 1. Salva a Ficha (Rascunho)
    const saveResult = await saveAnamnesisResponse({
      templateId: selectedTemplate.id,
      clientId,
      organizationId: session?.user?.organizationId as string,
      content: formattedContent,
    });

    if (!saveResult.success || !saveResult.data) {
      toast({
        title: "Erro",
        description: saveResult.error,
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }

    // 2. Se tiver assinatura, tranca a ficha (Imutabilidade)
    if (withSignature && signature) {
      const signResult = await signAnamnesisResponse(
        saveResult.data.id,
        signature,
      );
      if (!signResult.success) {
        toast({
          title: "Erro ao Assinar",
          description: signResult.error,
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }
    }

    setIsSaving(false);
    toast({
      title: "Sucesso!",
      description: withSignature
        ? "Ficha assinada e salva com valor legal."
        : "Rascunho da ficha salvo com sucesso.",
    });

    // Volta para o perfil da cliente
    router.push(`/admin/clients/${clientId}`);
  };

  // Função para renderizar o input dinâmico baseado no tipo
  const renderField = (field: any, index: number) => {
    if (field.type === "section_title") {
      return (
        <div
          key={field.id}
          className="col-span-1 border-b border-border/50 pb-2 mt-6 mb-2"
        >
          <h3 className="text-lg font-bold text-primary">{field.label}</h3>
        </div>
      );
    }

    return (
      <div
        key={field.id}
        className="space-y-3 p-4 bg-muted/20 rounded-xl border border-border/50"
      >
        <Label className="text-base font-semibold text-foreground">
          {index + 1}. {field.label}
        </Label>

        {field.type === "text" && (
          <Input
            value={answers[field.id] || ""}
            onChange={(e) => handleAnswerChange(field.id, e.target.value)}
            placeholder="Digite a resposta..."
            className="bg-background"
          />
        )}

        {field.type === "boolean" && (
          <RadioGroup
            value={
              answers[field.id] !== undefined
                ? String(answers[field.id])
                : undefined
            }
            onValueChange={(val) =>
              handleAnswerChange(field.id, val === "true")
            }
            className="flex gap-6 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id={`${field.id}-sim`} />
              <Label htmlFor={`${field.id}-sim`} className="cursor-pointer">
                Sim
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id={`${field.id}-nao`} />
              <Label htmlFor={`${field.id}-nao`} className="cursor-pointer">
                Não
              </Label>
            </div>
          </RadioGroup>
        )}

        {field.type === "single_choice" && (
          <RadioGroup
            value={answers[field.id] || ""}
            onValueChange={(val) => handleAnswerChange(field.id, val)}
            className="flex flex-col gap-3 mt-2"
          >
            {field.options?.map((opt: string) => (
              <div key={opt} className="flex items-center space-x-2">
                <RadioGroupItem value={opt} id={`${field.id}-${opt}`} />
                <Label
                  htmlFor={`${field.id}-${opt}`}
                  className="cursor-pointer"
                >
                  {opt}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {field.type === "multiple_choice" && (
          <div className="flex flex-col gap-3 mt-2">
            {field.options?.map((opt: string) => {
              const currentAnswers: string[] = answers[field.id] || [];
              const isChecked = currentAnswers.includes(opt);
              return (
                <div key={opt} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.id}-${opt}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleAnswerChange(field.id, [...currentAnswers, opt]);
                      } else {
                        handleAnswerChange(
                          field.id,
                          currentAnswers.filter((x) => x !== opt),
                        );
                      }
                    }}
                  />
                  <Label
                    htmlFor={`${field.id}-${opt}`}
                    className="cursor-pointer"
                  >
                    {opt}
                  </Label>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <AdminHeader title="Preencher Anamnese" />

      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto w-full pb-32">
        <div className="flex items-center gap-4 border-b border-border/50 pb-4">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="rounded-full h-10 w-10 shrink-0"
          >
            <Link href={`/admin/clients/${clientId}`}>
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Nova Ficha da Cliente
            </h1>
            <p className="text-sm text-muted-foreground">
              Selecione o modelo e preencha as respostas.
            </p>
          </div>
        </div>

        {/* Escolha do Template */}
        <div className="space-y-3 bg-primary/5 p-5 rounded-xl border border-primary/20">
          <Label className="text-primary font-bold">
            Qual modelo de ficha deseja preencher?
          </Label>
          {isLoading ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Carregando
              modelos...
            </div>
          ) : (
            <Select onValueChange={handleTemplateSelect}>
              <SelectTrigger className="bg-background h-12">
                <SelectValue placeholder="Selecione um modelo..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Formulário Dinâmico */}
        {selectedTemplate && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
              {selectedTemplate.fields.map((field: any, index: number) =>
                renderField(field, index),
              )}
            </div>

            {/* Assinatura Digital */}
            <div className="mt-8 space-y-4 p-5 border-2 border-primary/10 rounded-2xl bg-background shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <PenTool className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold">Assinatura da Cliente</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Solicite que a cliente assine no quadro abaixo usando o dedo ou
                caneta touch. Após assinar, o documento não poderá mais ser
                alterado.
              </p>

              <SignaturePad onSignatureChange={setSignature} />
            </div>
          </div>
        )}
      </div>

      {/* Footer Mobile/Desktop Fixo */}
      {selectedTemplate && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t z-50">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-end gap-3">
            <Button
              variant="outline"
              className="h-12 rounded-xl font-bold sm:w-auto w-full"
              onClick={() => handleSave(false)}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar como Rascunho
            </Button>

            <Button
              className="h-12 rounded-xl font-bold shadow-lg sm:w-auto w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => handleSave(true)}
              disabled={isSaving || !signature}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Assinar e Finalizar
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

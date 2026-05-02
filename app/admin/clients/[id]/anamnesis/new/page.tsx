// app/admin/clients/[id]/anamnesis/new/page.tsx
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  PenDraw,
  LoaderDots,
  CheckCircle,
} from "@boxicons/react";

import { AdminHeader } from "@/components/admin-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
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

export default function NewClientAnamnesisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();

  const resolvedParams = use(params);
  const clientId = resolvedParams.id;

  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [signature, setSignature] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const organizationId = session?.user?.organizationId;

  useEffect(() => {
    async function loadTemplates() {
      if (organizationId) {
        const result = await getAnamnesisTemplates(organizationId);
        if (result.success && result.data) {
          setTemplates(result.data);
        }
        setIsLoading(false);
      }
    }
    loadTemplates();
  }, [organizationId]);

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    setSelectedTemplate(template || null);
    setAnswers({});
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

    if (withSignature) {
      setIsSaving(true);
    } else {
      setIsSavingDraft(true);
    }

    const formattedContent = selectedTemplate.fields.map((field: any) => ({
      fieldId: field.id,
      label: field.label,
      type: field.type,
      value: answers[field.id] !== undefined ? answers[field.id] : null,
    }));

    const saveResult = await saveAnamnesisResponse({
      templateId: selectedTemplate.id,
      clientId,
      organizationId: organizationId as string,
      content: formattedContent,
    });

    if (!saveResult.success || !saveResult.data) {
      toast({
        title: "Erro",
        description: saveResult.error,
        variant: "destructive",
      });
      setIsSaving(false);
      setIsSavingDraft(false);
      return;
    }

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
    setIsSavingDraft(false);

    toast({
      title: "Sucesso!",
      description: withSignature
        ? "Ficha assinada e salva com valor legal."
        : "Rascunho da ficha salvo com sucesso.",
    });

    router.push(`/admin/clients/${clientId}`);
  };

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

      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-32 animate-in fade-in duration-500 min-h-[calc(100vh-100px)] relative">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div className="flex items-center gap-4">
            <Button
              asChild
              variant="outline"
              size="icon"
              className="rounded-full h-10 w-10 shrink-0"
            >
              <Link href={`/admin/clients/${clientId}`}>
                <ArrowLeft size="sm" className="text-muted-foreground" />
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

          {selectedTemplate && (
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="outline"
                className="h-10 rounded-xl font-bold"
                onClick={() => handleSave(false)}
                disabled={isSaving || isSavingDraft}
              >
                {isSavingDraft ? (
                  <LoaderDots size="sm" className="animate-spin mr-2" />
                ) : (
                  <Save size="sm" className="mr-2" />
                )}
                Rascunho
              </Button>

              <Button
                className="h-10 rounded-xl font-bold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => handleSave(true)}
                disabled={isSaving || isSavingDraft || !signature}
              >
                {isSaving ? (
                  <LoaderDots size="sm" className="animate-spin mr-2" />
                ) : (
                  <CheckCircle size="sm" className="mr-2" />
                )}
                Finalizar
              </Button>
            </div>
          )}
        </div>

        {/* Escolha do Template */}
        <div className="space-y-3 bg-primary/5 p-5 rounded-xl border border-primary/20">
          <Label className="text-primary font-bold">
            Qual modelo de ficha deseja preencher?
          </Label>
          {isLoading ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <LoaderDots size="sm" className="animate-spin mr-2" /> Carregando
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
          <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
            <div className="space-y-4">
              {selectedTemplate.fields.map((field: any, index: number) =>
                renderField(field, index),
              )}
            </div>

            {/* Assinatura Digital */}
            <div className="mt-8 space-y-4 p-5 border-2 border-primary/10 rounded-2xl bg-background shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <PenDraw size="sm" className="text-primary" />
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

      {/* Botões Flutuantes Mobile */}
      {selectedTemplate && (
        <div className="md:hidden fixed bottom-20 right-4 flex flex-col gap-3 z-50 animate-in fade-in slide-in-from-bottom-8 duration-300">
          <Button
            variant="secondary"
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg border border-border bg-background"
            onClick={() => handleSave(false)}
            disabled={isSaving || isSavingDraft}
          >
            {isSavingDraft ? (
              <LoaderDots
                size="sm"
                className="text-muted-foreground animate-spin"
              />
            ) : (
              <Save size="sm" className="text-muted-foreground" />
            )}
          </Button>

          <Button
            size="icon"
            className={cn(
              "h-14 w-14 rounded-full shadow-xl transition-all duration-300",
              !signature ? "opacity-50 grayscale" : "hover:scale-105",
            )}
            onClick={() => handleSave(true)}
            disabled={isSaving || isSavingDraft || !signature}
          >
            {isSaving ? (
              <LoaderDots size="sm" className="animate-spin" />
            ) : (
              <CheckCircle size="sm" />
            )}
          </Button>
        </div>
      )}
    </>
  );
}

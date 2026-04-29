"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  X,
  Save,
  FileDetail,
  LoaderDots,
  PlusCircle,
} from "@boxicons/react";
import { Plus } from "lucide-react";

import { AdminHeader } from "@/components/admin-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

import {
  getAnamnesisTemplateById,
  updateAnamnesisTemplate,
} from "@/app/actions/anamnesis";

type FieldType =
  | "text"
  | "boolean"
  | "single_choice"
  | "multiple_choice"
  | "section_title";

interface FormField {
  id: string;
  label: string;
  type: FieldType;
  options?: string[];
}

export default function EditAnamnesisTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();

  const resolvedParams = use(params);
  const templateId = resolvedParams.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);

  useEffect(() => {
    async function loadTemplate() {
      setIsLoading(true);
      const result = await getAnamnesisTemplateById(templateId);

      if (result.success && result.data) {
        setName(result.data.name);
        const loadedFields = (result.data.fields as any) || [];
        setFields(loadedFields);
      } else {
        toast({
          title: "Erro",
          description: "Modelo não encontrado.",
          variant: "destructive",
        });
        router.push("/admin/anamnesis");
      }
      setIsLoading(false);
    }

    if (session?.user) {
      loadTemplate();
    }
  }, [templateId, session, router, toast]);

  const addField = () => {
    setFields([
      ...fields,
      { id: crypto.randomUUID(), label: "", type: "text" },
    ]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter((field) => field.id !== id));
  };

  const updateField = (id: string, key: keyof FormField, value: any) => {
    setFields(
      fields.map((field) => {
        if (field.id === id) {
          const updatedField = { ...field, [key]: value };
          if (
            key === "type" &&
            (value === "single_choice" || value === "multiple_choice") &&
            !field.options
          ) {
            updatedField.options = ["", ""];
          }
          return updatedField;
        }
        return field;
      }),
    );
  };

  const addOption = (fieldId: string) => {
    setFields(
      fields.map((field) =>
        field.id === fieldId
          ? { ...field, options: [...(field.options || []), ""] }
          : field,
      ),
    );
  };

  const updateOption = (fieldId: string, index: number, value: string) => {
    setFields(
      fields.map((field) => {
        if (field.id === fieldId && field.options) {
          const newOptions = [...field.options];
          newOptions[index] = value;
          return { ...field, options: newOptions };
        }
        return field;
      }),
    );
  };

  const removeOption = (fieldId: string, index: number) => {
    setFields(
      fields.map((field) => {
        if (field.id === fieldId && field.options) {
          return {
            ...field,
            options: field.options.filter((_, i) => i !== index),
          };
        }
        return field;
      }),
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Aviso",
        description: "Dê um nome para a sua ficha.",
        variant: "destructive",
      });
      return;
    }

    if (fields.some((f) => !f.label.trim())) {
      toast({
        title: "Aviso",
        description: "Preencha todas as perguntas ou remova as vazias.",
        variant: "destructive",
      });
      return;
    }

    const invalidOptions = fields.some(
      (f) =>
        (f.type === "single_choice" || f.type === "multiple_choice") &&
        (!f.options ||
          f.options.length < 2 ||
          f.options.some((opt) => !opt.trim())),
    );

    if (invalidOptions) {
      toast({
        title: "Aviso",
        description:
          "Preencha todas as alternativas das perguntas de múltipla escolha.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    const result = await updateAnamnesisTemplate(templateId, { name, fields });
    setIsSaving(false);

    if (result.success) {
      toast({
        title: "Sucesso!",
        description: "Modelo atualizado com sucesso.",
      });
      router.push("/admin/anamnesis");
    } else {
      toast({
        title: "Erro",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoaderDots size="lg" className="text-primary mb-4" />
        <p className="text-muted-foreground">Carregando dados do modelo...</p>
      </div>
    );
  }

  return (
    <>
      <AdminHeader title="Editar Fichário" />

      <div className="flex flex-col gap-4 md:gap-6 p-4 md:p-6 max-w-5xl mx-auto w-full pb-24 md:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-border/50 pb-4 md:pb-6">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="rounded-full h-10 w-10 shrink-0"
          >
            <Link href="/admin/anamnesis">
              <ArrowLeft size="sm" className="text-muted-foreground" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Editar Modelo de Anamnese
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Altere o nome ou adicione/remova perguntas do seu fichário.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name" className="font-semibold text-foreground">
            Nome do Modelo
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Ficha de Extensão de Cílios"
            className="h-12 text-base bg-muted/30 border-border/60 focus:border-primary rounded-xl"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-border/50">
            <div className="flex items-center gap-2">
              <FileDetail size="sm" className="text-primary" />
              <h2 className="font-semibold text-foreground">Perguntas</h2>
            </div>
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              {fields.length}
            </span>
          </div>

          {fields.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-border">
              <FileDetail size="lg" className="text-muted-foreground/40 mb-4" />
              <p className="text-sm font-medium text-muted-foreground">
                Nenhuma pergunta adicionada.
              </p>
              <Button variant="link" onClick={addField} className="mt-2">
                Adicionar a primeira
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="group flex flex-col gap-3 p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-border transition-all relative"
                >
                  <div className="absolute -left-3 top-4 hidden md:flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow z-10">
                    {index + 1}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-start">
                    <div className="space-y-2 md:ml-4">
                      <Label className="text-xs text-muted-foreground font-medium">
                        {field.type === "section_title"
                          ? "Título da Seção"
                          : "Pergunta"}
                      </Label>
                      <Input
                        value={field.label}
                        onChange={(e) =>
                          updateField(field.id, "label", e.target.value)
                        }
                        placeholder={
                          field.type === "section_title"
                            ? "Ex: Histórico Clínico"
                            : "Ex: Você está gestante?"
                        }
                        className={`h-11 bg-background border-border/60 focus:border-primary rounded-lg ${
                          field.type === "section_title"
                            ? "font-bold text-lg"
                            : ""
                        }`}
                      />
                    </div>

                    <div className="w-full md:w-56 space-y-2">
                      <Label className="text-xs text-muted-foreground font-medium">
                        Tipo
                      </Label>
                      <Select
                        value={field.type}
                        onValueChange={(value) =>
                          updateField(field.id, "type", value)
                        }
                      >
                        <SelectTrigger className="h-11 bg-background border-border/60 rounded-lg w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="section_title">
                            Título (Seção)
                          </SelectItem>
                          <SelectItem value="text">Texto Livre</SelectItem>
                          <SelectItem value="boolean">Sim / Não</SelectItem>
                          <SelectItem value="single_choice">
                            Múltipla Escolha (1)
                          </SelectItem>
                          <SelectItem value="multiple_choice">
                            Caixa de Seleção (Várias)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 md:static md:self-end md:mb-1 h-9 w-9 text-muted-foreground hover:bg-transparent active:bg-destructive/10 active:text-destructive active:scale-95 transition-transform shrink-0"
                      onClick={() => removeField(field.id)}
                    >
                      <X size="sm" />
                    </Button>
                  </div>

                  {(field.type === "single_choice" ||
                    field.type === "multiple_choice") && (
                    <div className="md:ml-4 mt-1 p-3 bg-background rounded-lg border border-border/40 space-y-2">
                      <Label className="text-xs text-muted-foreground font-semibold">
                        Alternativas:
                      </Label>
                      {field.options?.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 border border-muted-foreground/50 shrink-0 ${
                              field.type === "single_choice"
                                ? "rounded-full"
                                : "rounded-sm"
                            }`}
                          />
                          <Input
                            value={option}
                            onChange={(e) =>
                              updateOption(field.id, optIndex, e.target.value)
                            }
                            placeholder={`Opção ${optIndex + 1}`}
                            className="h-9 text-sm"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive active:scale-90 transition-transform"
                            onClick={() => removeOption(field.id, optIndex)}
                            disabled={(field.options?.length || 0) <= 2}
                          >
                            <X size="sm" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addOption(field.id)}
                        className="text-xs text-primary mt-1"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Adicionar alternativa
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {fields.length > 0 && (
            <Button
              variant="outline"
              onClick={addField}
              className="w-full h-12 border-dashed border-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors rounded-xl"
            >
              <PlusCircle size="sm" className="mr-2" /> Adicionar Nova Pergunta
            </Button>
          )}
        </div>

        {/* Footer Desktop */}
        <div className="hidden md:flex justify-end gap-3 pt-6 border-t border-border/50">
          <Button
            variant="outline"
            asChild
            className="h-12 rounded-xl font-bold px-8"
          >
            <Link href="/admin/clients">Cancelar</Link>
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 h-12 rounded-xl font-bold shadow-lg"
          >
            {isSaving ? (
              <LoaderDots size="sm" className="animate-spin mr-2" />
            ) : (
              <Save size="sm" className="mr-2" />
            )}
            Salvar Modelo
          </Button>
        </div>
      </div>

      {/* Footer Mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t md:hidden z-50 grid grid-cols-2 gap-3">
        <Button variant="outline" asChild className="h-12 rounded-xl font-bold">
          <Link href="/admin/anamnesis">Cancelar</Link>
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="h-12 rounded-xl font-bold shadow-lg"
        >
          {isSaving ? (
            <LoaderDots size="sm" className="animate-spin mr-2" />
          ) : (
            <Save size="sm" className="mr-2" />
          )}
          Salvar
        </Button>
      </div>
    </>
  );
}

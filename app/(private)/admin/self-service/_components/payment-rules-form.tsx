// app/(private)/admin/self-service/_components/payment-rules-form.tsx
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { updateSelfServiceSettingsAction } from "@/app/actions/settings";

// ---------------------------------------------------------------------------
// Metadados por tipo de chave Pix — cada tipo tem seu próprio placeholder,
// texto de ajuda e validação de formato.
// ---------------------------------------------------------------------------
const PIX_KEY_TYPES = [
  "CPF/CNPJ",
  "Celular",
  "E-mail",
  "Chave Aleatória",
] as const;

type PixKeyType = (typeof PIX_KEY_TYPES)[number];

const PIX_KEY_META: Record<PixKeyType, { placeholder: string; help: string }> =
  {
    "CPF/CNPJ": {
      placeholder: "000.000.000-00",
      help: "Digite apenas os números do CPF (11 dígitos) ou CNPJ (14 dígitos).",
    },
    Celular: {
      placeholder: "(11) 91234-5678",
      help: "Informe o número com DDD, do jeito que seu banco cadastrou.",
    },
    "E-mail": {
      placeholder: "financeiro@suaempresa.com",
      help: "Use o e-mail cadastrado como chave Pix no seu banco.",
    },
    "Chave Aleatória": {
      placeholder: "a1b2c3d4-e5f6-... (32 caracteres)",
      help: "Cole a chave aleatória gerada pelo seu banco.",
    },
  };

const paymentRulesSchema = z
  .object({
    confirmationTitle: z.string().min(1, "O título é obrigatório."),
    pixInstructions: z
      .string()
      .min(1, "As instruções do Pix são obrigatórias."),
    pixKeyType: z.enum(PIX_KEY_TYPES),
    pixKey: z.string().min(1, "A chave Pix é obrigatória."),
    securityWarning: z.string().optional(),
    frictionMessage: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const digits = data.pixKey.replace(/\D/g, "");

    switch (data.pixKeyType) {
      case "CPF/CNPJ":
        if (digits.length !== 11 && digits.length !== 14) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["pixKey"],
            message: "CPF deve ter 11 dígitos ou CNPJ 14 dígitos.",
          });
        }
        break;
      case "Celular":
        if (digits.length < 10 || digits.length > 11) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["pixKey"],
            message: "Informe um número de celular válido com DDD.",
          });
        }
        break;
      case "E-mail":
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.pixKey.trim())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["pixKey"],
            message: "Informe um e-mail válido.",
          });
        }
        break;
      case "Chave Aleatória":
        if (data.pixKey.trim().length < 32) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["pixKey"],
            message: "A chave aleatória geralmente tem 32 caracteres.",
          });
        }
        break;
    }
  });

export type PaymentRulesValues = z.infer<typeof paymentRulesSchema>;

const defaultPaymentValues: PaymentRulesValues = {
  confirmationTitle: "Revise seu agendamento e confirme",
  pixInstructions:
    "Importante: para confirmar o agendamento, é necessário enviar um sinal de 50%. Por favor, enviar o comprovante no WhatsApp.",
  pixKeyType: "Celular",
  pixKey: "",
  securityWarning:
    "Certifique-se de que a chave Pix informada pertence à empresa. A responsabilidade pela veracidade das informações é inteiramente da empresa.",
  frictionMessage:
    "Para confirmar seu agendamento, cobramos sinal. Faça o Pix de antecipação ou chame no WhatsApp para pagar com cartão.",
};

// ---------------------------------------------------------------------------
// Campo composto: Tipo de chave + Chave Pix num único bloco visual
// ---------------------------------------------------------------------------
function PixKeyField({ control, watch }: { control: any; watch: any }) {
  const selectedType = watch("pixKeyType") as PixKeyType;
  const meta = PIX_KEY_META[selectedType] ?? PIX_KEY_META["Celular"];

  return (
    <FormItem className="sm:col-span-2">
      <FormLabel>Chave Pix</FormLabel>
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-0 sm:rounded-md sm:border sm:focus-within:ring-1 sm:focus-within:ring-ring">
        <FormField
          control={control}
          name="pixKeyType"
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="shrink-0 sm:w-40 sm:rounded-none sm:border-0 sm:border-r sm:focus:ring-0">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {PIX_KEY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />

        <FormField
          control={control}
          name="pixKey"
          render={({ field }) => (
            <FormControl>
              <Input
                placeholder={meta.placeholder}
                className="flex-1 sm:rounded-none sm:border-0 sm:focus-visible:ring-0"
                {...field}
              />
            </FormControl>
          )}
        />
      </div>
      <FormDescription>{meta.help}</FormDescription>
      <FormField
        control={control}
        name="pixKey"
        render={() => <FormMessage />}
      />
    </FormItem>
  );
}

interface PaymentRulesFormProps {
  initialData?: any;
}

export function PaymentRulesForm({ initialData }: PaymentRulesFormProps) {
  const [isPending, setIsPending] = useState(false);

  const form = useForm<PaymentRulesValues>({
    resolver: zodResolver(paymentRulesSchema),
    defaultValues: {
      confirmationTitle:
        initialData?.confirmationTitle ??
        defaultPaymentValues.confirmationTitle,
      pixInstructions:
        initialData?.pixInstructions ?? defaultPaymentValues.pixInstructions,
      pixKeyType: initialData?.pixKeyType ?? defaultPaymentValues.pixKeyType,
      pixKey: initialData?.pixKey ?? defaultPaymentValues.pixKey,
      securityWarning:
        initialData?.securityWarning ?? defaultPaymentValues.securityWarning,
      frictionMessage:
        initialData?.frictionMessage ?? defaultPaymentValues.frictionMessage,
    },
    mode: "onChange",
  });

  async function onSubmit(data: PaymentRulesValues) {
    setIsPending(true);
    try {
      // ⚠️ Bypass temporário de tipagem (as any) para podermos renderizar o front-end sem erros.
      const response = await updateSelfServiceSettingsAction(data as any);

      if (!response?.success) {
        toast.error(response?.error || "Erro ao salvar regras e pagamentos.");
        return;
      }

      toast.success("Regras e configurações de pagamento salvas com sucesso!");
    } catch (error) {
      toast.error("Ocorreu um erro inesperado ao conectar com o servidor.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Confirmação */}
        <Card className="border-none shadow-none">
          <CardHeader className="px-0">
            <CardTitle>Textos de confirmação</CardTitle>
            <CardDescription>
              Personalize as mensagens que o cliente verá na tela final antes de
              agendar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-0">
            <FormField
              control={form.control}
              name="confirmationTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título da etapa</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Revise seu agendamento..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pixInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Instruções principais (sinal / comprovante)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Instruções sobre o envio do comprovante..."
                      className="min-h-20 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Pix */}
        <Card className="border-none shadow-none">
          <CardHeader className="px-0">
            <CardTitle>Dados para pagamento (Pix)</CardTitle>
            <CardDescription>
              Configure a chave Pix que será exibida para o cliente realizar a
              antecipação.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <PixKeyField control={form.control} watch={form.watch} />
          </CardContent>
        </Card>

        {/* Avisos */}
        <Card className="border-none shadow-none">
          <CardHeader className="px-0">
            <CardTitle>Avisos e mensagens complementares</CardTitle>
            <CardDescription>
              Mensagens de rodapé para passar credibilidade e oferecer opções
              alternativas, como cartão de crédito via WhatsApp.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y px-0">
            <FormField
              control={form.control}
              name="securityWarning"
              render={({ field }) => (
                <FormItem className="py-4 first:pt-0">
                  <FormLabel>Aviso de segurança (dados da empresa)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Aviso sobre conferência de dados..."
                      className="min-h-16 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="frictionMessage"
              render={({ field }) => (
                <FormItem className="py-4 last:pb-0">
                  <FormLabel>Mensagem de alternativa de pagamento</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Opção para pagar via cartão no WhatsApp..."
                      className="min-h-16 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Ideal para reduzir a desistência caso o cliente não queira
                    pagar via Pix.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar regras
          </Button>
        </div>
      </form>
    </Form>
  );
}

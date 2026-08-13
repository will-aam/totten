// app/(private)/admin/self-service/_components/rules-form.tsx
"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LoaderLines, Plus, Trash, CalendarAlt } from "@boxicons/react";
import { updateSelfServiceSettingsAction } from "@/app/actions/settings";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const DAYS_OF_WEEK = [
  { id: 0, label: "Domingo", short: "Dom" },
  { id: 1, label: "Segunda-feira", short: "Seg" },
  { id: 2, label: "Terça-feira", short: "Ter" },
  { id: 3, label: "Quarta-feira", short: "Qua" },
  { id: 4, label: "Quinta-feira", short: "Qui" },
  { id: 5, label: "Sexta-feira", short: "Sex" },
  { id: 6, label: "Sábado", short: "Sáb" },
];

const timeSchema = z.object({
  isOpen: z.boolean(),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
  breakStart: z.string().optional(),
  breakEnd: z.string().optional(),
  breakReason: z.string().optional(),
  breakVisibleToClient: z.boolean().default(false),
});

const rulesFormSchema = z.object({
  futureBookingLimitDays: z.coerce.number().min(1, "Mínimo 1 dia"),
  welcomeMessage: z.string().optional(),
  schedule: z.array(timeSchema.extend({ dayOfWeek: z.number() })),
  exceptions: z.array(timeSchema.extend({ date: z.string() })),
});

export type RulesFormValues = z.infer<typeof rulesFormSchema>;

const defaultValues: Partial<RulesFormValues> = {
  schedule: DAYS_OF_WEEK.map((day) => ({
    dayOfWeek: day.id,
    isOpen: day.id >= 1 && day.id <= 6,
    openTime: day.id >= 1 && day.id <= 6 ? "09:00" : "",
    closeTime: day.id >= 1 && day.id <= 6 ? "18:00" : "",
    breakStart: day.id >= 1 && day.id <= 6 ? "12:00" : "",
    breakEnd: day.id >= 1 && day.id <= 6 ? "13:00" : "",
    breakReason: "",
    breakVisibleToClient: false,
  })),
  exceptions: [],
  futureBookingLimitDays: 30,
  welcomeMessage: "Bem-vindo, aqui você pode agendar seu horário de forma rápida e fácil.",
};

// ---------------------------------------------------------------------------
// Seletor de horário
// ---------------------------------------------------------------------------
const TIME_OPTIONS = (() => {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      options.push(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      );
    }
  }
  return options;
})();

function TimeSelect({
  value,
  onChange,
  disabled,
}: {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <Select
      value={value || undefined}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className="h-9 w-28 border-border bg-transparent shadow-sm focus:ring-1 focus:ring-ring">
        <SelectValue placeholder="--:--" />
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {TIME_OPTIONS.map((t) => (
          <SelectItem key={t} value={t}>
            {t}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ---------------------------------------------------------------------------
// Date picker
// ---------------------------------------------------------------------------
function DatePicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (value: string) => void;
}) {
  const selectedDate = value
    ? parse(value, "yyyy-MM-dd", new Date())
    : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 w-45 justify-start gap-2 font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarAlt className="h-4 w-4" />
          {selectedDate
            ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR })
            : "Selecionar data"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onChange(format(date, "yyyy-MM-dd"))}
          locale={ptBR}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// Bloco de horário reutilizável (Desktop & Exceções)
// ---------------------------------------------------------------------------
function TimeRangeFields({
  control,
  basePath,
}: {
  control: any;
  basePath: string;
}) {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
        <div className="flex items-center gap-2">
          <span className="w-16 text-sm font-medium text-muted-foreground">Expediente</span>
          <FormField
            control={control}
            name={`${basePath}.openTime`}
            render={({ field }) => (
              <TimeSelect value={field.value} onChange={field.onChange} />
            )}
          />
          <span className="text-muted-foreground">–</span>
          <FormField
            control={control}
            name={`${basePath}.closeTime`}
            render={({ field }) => (
              <TimeSelect value={field.value} onChange={field.onChange} />
            )}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="w-12 text-sm font-medium text-muted-foreground">Pausa</span>
          <FormField
            control={control}
            name={`${basePath}.breakStart`}
            render={({ field }) => (
              <TimeSelect value={field.value} onChange={field.onChange} />
            )}
          />
          <span className="text-muted-foreground">–</span>
          <FormField
            control={control}
            name={`${basePath}.breakEnd`}
            render={({ field }) => (
              <TimeSelect value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
      </div>

      {/* Motivo do Intervalo */}
      <div className="flex flex-wrap items-center gap-4 pl-0 sm:pl-[4.5rem]">
        <FormField
          control={control}
          name={`${basePath}.breakReason`}
          render={({ field }) => (
            <FormItem className="flex-1 min-w-[150px] max-w-xs">
              <FormControl>
                <Input
                  placeholder="Motivo da pausa (ex: Almoço)"
                  className="h-9 text-sm"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`${basePath}.breakVisibleToClient`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="text-sm font-normal text-muted-foreground cursor-pointer m-0">
                Cliente vê o motivo?
              </FormLabel>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente MobileWeeklySchedule (Editor em Lote)
// ---------------------------------------------------------------------------
function MobileWeeklySchedule({ form }: { form: any }) {
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Padrão: Seg a Sex

  // Para mostrar nos campos de edição em lote, usamos os valores do primeiro dia selecionado
  const referenceDayIndex = selectedDays.length > 0 ? selectedDays[0] : 1;
  const referenceValues = form.watch(`schedule.${referenceDayIndex}`);

  const [hasBreak, setHasBreak] = useState(!!referenceValues?.breakStart);

  // Sincroniza sempre que os valores de referência mudarem, mas só para os selecionados
  const handleBatchChange = (field: string, value: any) => {
    selectedDays.forEach((dayId) => {
      form.setValue(`schedule.${dayId}.${field}`, value, { shouldDirty: true });
    });
  };

  const toggleDay = (dayId: number) => {
    const isCurrentlySelected = selectedDays.includes(dayId);

    // Efeitos colaterais (atualizar formulário) fora da função de atualização de estado
    if (!isCurrentlySelected) {
      form.setValue(`schedule.${dayId}.isOpen`, true);
      if (referenceValues) {
        form.setValue(`schedule.${dayId}.openTime`, referenceValues.openTime);
        form.setValue(`schedule.${dayId}.closeTime`, referenceValues.closeTime);
        form.setValue(`schedule.${dayId}.breakStart`, referenceValues.breakStart);
        form.setValue(`schedule.${dayId}.breakEnd`, referenceValues.breakEnd);
        form.setValue(`schedule.${dayId}.breakReason`, referenceValues.breakReason);
        form.setValue(`schedule.${dayId}.breakVisibleToClient`, referenceValues.breakVisibleToClient);
      }
    } else {
      // Quando desseleciona um dia, define is_open = false
      form.setValue(`schedule.${dayId}.isOpen`, false);
    }

    setSelectedDays((prev) => {
      return prev.includes(dayId)
        ? prev.filter((id) => id !== dayId)
        : [...prev, dayId].sort();
    });
  };

  const applyPreset = (preset: "seg-sex" | "seg-sab" | "todos" | "limpar") => {
    let newDays: number[] = [];
    if (preset === "seg-sex") newDays = [1, 2, 3, 4, 5];
    if (preset === "seg-sab") newDays = [1, 2, 3, 4, 5, 6];
    if (preset === "todos") newDays = [0, 1, 2, 3, 4, 5, 6];
    if (preset === "limpar") newDays = [];

    // Limpa todos primeiro (fechado)
    [0, 1, 2, 3, 4, 5, 6].forEach((dayId) => {
      form.setValue(`schedule.${dayId}.isOpen`, false);
    });

    // Ativa os novos e copia
    newDays.forEach((dayId) => {
      form.setValue(`schedule.${dayId}.isOpen`, true);
      if (referenceValues) {
        form.setValue(`schedule.${dayId}.openTime`, referenceValues.openTime);
        form.setValue(`schedule.${dayId}.closeTime`, referenceValues.closeTime);
        form.setValue(`schedule.${dayId}.breakStart`, referenceValues.breakStart);
        form.setValue(`schedule.${dayId}.breakEnd`, referenceValues.breakEnd);
        form.setValue(`schedule.${dayId}.breakReason`, referenceValues.breakReason);
        form.setValue(`schedule.${dayId}.breakVisibleToClient`, referenceValues.breakVisibleToClient);
      }
    });

    setSelectedDays(newDays);
  };

  // Calcula o resumo
  const summaryDays = selectedDays.length === 7
    ? "Todos os dias"
    : selectedDays.length === 0
      ? "Nenhum dia selecionado"
      : selectedDays.map(id => DAYS_OF_WEEK.find(d => d.id === id)?.short).join(", ");

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Dias de Funcionamento</h3>

        {/* Botoes de dia */}
        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = selectedDays.includes(day.id);
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => toggleDay(day.id)}
                className={cn(
                  "flex h-12 flex-1 items-center justify-center rounded-xl border text-sm font-medium transition-all min-w-[3.5rem] px-2",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                )}
              >
                <span className="md:hidden">{day.short}</span>
                <span className="hidden md:inline">{day.label}</span>
              </button>
            );
          })}
        </div>

        {/* Atalhos Rápidos */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" className="rounded-full text-xs" onClick={() => applyPreset("seg-sex")}>
            Seg a Sex
          </Button>
          <Button type="button" variant="outline" size="sm" className="rounded-full text-xs" onClick={() => applyPreset("seg-sab")}>
            Seg a Sáb
          </Button>
          <Button type="button" variant="outline" size="sm" className="rounded-full text-xs" onClick={() => applyPreset("todos")}>
            Todos
          </Button>
          <Button type="button" variant="ghost" size="sm" className="rounded-full text-xs text-muted-foreground" onClick={() => applyPreset("limpar")}>
            Limpar
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5 space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            Expediente
          </h3>
          <div className="flex gap-4">
            <div className="space-y-2 flex-1">
              <span className="text-xs text-muted-foreground">Abertura</span>
              <TimeSelect
                value={referenceValues?.openTime}
                onChange={(v) => handleBatchChange("openTime", v)}
                disabled={selectedDays.length === 0}
              />
            </div>
            <div className="space-y-2 flex-1">
              <span className="text-xs text-muted-foreground">Fechamento</span>
              <TimeSelect
                value={referenceValues?.closeTime}
                onChange={(v) => handleBatchChange("closeTime", v)}
                disabled={selectedDays.length === 0}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-2 border-t">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Intervalo / Pausa</h3>
            <Switch
              checked={hasBreak}
              onCheckedChange={(checked) => {
                setHasBreak(checked);
                if (!checked) {
                  handleBatchChange("breakStart", "");
                  handleBatchChange("breakEnd", "");
                } else {
                  handleBatchChange("breakStart", "12:00");
                  handleBatchChange("breakEnd", "13:00");
                }
              }}
              disabled={selectedDays.length === 0}
            />
          </div>

          {hasBreak && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex gap-4">
                <div className="space-y-2 flex-1">
                  <span className="text-xs text-muted-foreground">Início</span>
                  <TimeSelect
                    value={referenceValues?.breakStart}
                    onChange={(v) => handleBatchChange("breakStart", v)}
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <span className="text-xs text-muted-foreground">Fim</span>
                  <TimeSelect
                    value={referenceValues?.breakEnd}
                    onChange={(v) => handleBatchChange("breakEnd", v)}
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Motivo do intervalo (Ex: Almoço, Café)</span>
                  <Input
                    value={referenceValues?.breakReason || ""}
                    onChange={(e) => handleBatchChange("breakReason", e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Switch
                    checked={referenceValues?.breakVisibleToClient || false}
                    onCheckedChange={(c) => handleBatchChange("breakVisibleToClient", c)}
                  />
                  <span className="text-sm text-muted-foreground">Cliente vê o motivo?</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-primary/80">
        <p className="font-semibold mb-1">Resumo do funcionamento:</p>
        <p className="opacity-90">
          Das {referenceValues?.openTime || "--:--"} às {referenceValues?.closeTime || "--:--"}
          {hasBreak && referenceValues?.breakStart ? `, intervalo de ${referenceValues.breakStart} às ${referenceValues.breakEnd}` : ""},
          funcionando de {summaryDays}.
        </p>
      </div>

    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
interface RulesAndHoursFormProps {
  initialData?: Partial<RulesFormValues>;
}

export function RulesAndHoursForm({ initialData }: RulesAndHoursFormProps) {
  const [isPending, setIsPending] = useState(false);

  // MERGE INTELIGENTE
  const resolvedData = useMemo(() => {
    if (!initialData) return defaultValues;

    return {
      schedule:
        initialData.schedule && initialData.schedule.length > 0
          ? initialData.schedule
          : defaultValues.schedule,
      exceptions: initialData.exceptions || [],
      futureBookingLimitDays: initialData.futureBookingLimitDays ?? defaultValues.futureBookingLimitDays,
      welcomeMessage: initialData.welcomeMessage ?? defaultValues.welcomeMessage,
    };
  }, [initialData]);

  const form = useForm<RulesFormValues>({
    resolver: zodResolver(rulesFormSchema),
    defaultValues: resolvedData,
    mode: "onChange",
  });

  const { fields: scheduleFields } = useFieldArray({
    name: "schedule",
    control: form.control,
  });

  const {
    fields: exceptionFields,
    append: appendException,
    remove: removeException,
  } = useFieldArray({
    name: "exceptions",
    control: form.control,
  });

  const applyToAllDays = () => {
    const monday = form.getValues("schedule.1");

    [0, 2, 3, 4, 5, 6].forEach((dayIndex) => {
      form.setValue(`schedule.${dayIndex}.isOpen`, monday.isOpen);
      form.setValue(`schedule.${dayIndex}.openTime`, monday.openTime);
      form.setValue(`schedule.${dayIndex}.closeTime`, monday.closeTime);
      form.setValue(`schedule.${dayIndex}.breakStart`, monday.breakStart);
      form.setValue(`schedule.${dayIndex}.breakEnd`, monday.breakEnd);
      form.setValue(`schedule.${dayIndex}.breakReason`, monday.breakReason);
      form.setValue(`schedule.${dayIndex}.breakVisibleToClient`, monday.breakVisibleToClient);
    });

    toast.success(
      "Os horários de Segunda-feira foram aplicados para toda a semana.",
    );
  };

  async function onSubmit(data: RulesFormValues) {
    setIsPending(true);
    try {
      const response = await updateSelfServiceSettingsAction(data);

      if (!response.success) {
        toast.error(response.error || "Erro ao salvar os horários");
        return;
      }

      toast.success("Os horários foram salvos com sucesso.");
    } catch (error) {
      toast.error("Ocorreu um erro inesperado ao conectar com o servidor.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        {/* Padrão semanal */}
        <Card className="border-none shadow-none bg-transparent sm:bg-card">
          <CardHeader className="flex flex-col gap-4 px-0 sm:px-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Padrão semanal de expediente</CardTitle>
              <CardDescription>
                Defina os horários base da sua semana.
              </CardDescription>
            </div>
          </CardHeader>

          {/* Unified UI (Mobile & Desktop) */}
          <CardContent className="px-0 sm:px-6">
            <MobileWeeklySchedule form={form} />
          </CardContent>
        </Card>

        {/* Regras de Agendamento e Recepção */}
        <Card className="border-none shadow-none bg-transparent sm:bg-card">
          <CardHeader className="flex flex-col gap-4 px-0 sm:px-6">
            <div>
              <CardTitle>Regras de Agendamento e Recepção</CardTitle>
              <CardDescription>
                Configure os limites de agendamento e a comunicação inicial.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-0 sm:px-6 space-y-6">
            <FormField
              control={form.control}
              name="futureBookingLimitDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Dias no futuro disponíveis para agendamento</FormLabel>
                  <CardDescription className="mb-2">
                    Limite máximo de dias para frente que um cliente pode reservar.
                  </CardDescription>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      className="rounded-xl bg-muted/40 border-none h-11 font-bold max-w-xs"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="welcomeMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Mensagem de Boas-vindas</FormLabel>
                  <CardDescription className="mb-2">
                    Mensagem exibida ao cliente na tela de agendamento.
                  </CardDescription>
                  <FormControl>
                    <Textarea
                      className="rounded-xl bg-muted/40 border-none resize-none font-medium min-h-[100px]"
                      placeholder="Ex: Bem-vindo, aqui você pode agendar seu horário..."
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Exceções */}
        <Card className="border-none shadow-none">
          <CardHeader className="flex flex-row items-start justify-between px-0 sm:px-6">
            <div>
              <CardTitle>Exceções e datas específicas</CardTitle>
              <CardDescription>
                Configure feriados, folgas ou dias diferentes do padrão.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendException({ date: "", isOpen: false, breakVisibleToClient: false })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          </CardHeader>
          <CardContent className="divide-y px-0 sm:px-6">
            {exceptionFields.length === 0 && (
              <p className="py-4 text-sm text-muted-foreground first:pt-0">
                Nenhuma exceção configurada.
              </p>
            )}
            {exceptionFields.map((field, index) => {
              const isOpen = form.watch(`exceptions.${index}.isOpen`);
              return (
                <div
                  key={field.id}
                  className="flex flex-col gap-4 py-6 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <FormField
                        control={form.control}
                        name={`exceptions.${index}.date`}
                        render={({ field }) => (
                          <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`exceptions.${index}.isOpen`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-y-0 space-x-3">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="cursor-pointer">
                              Aberto neste dia?
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeException(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>

                  {isOpen && (
                    <TimeRangeFields
                      control={form.control}
                      basePath={`exceptions.${index}`}
                    />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex justify-end pb-12 sm:pb-0">
          <Button type="submit" size="lg" disabled={isPending} className="w-full sm:w-auto h-12 rounded-xl">
            {isPending && <LoaderLines className="mr-2 h-4 w-4 animate-spin" />}
            Salvar horários
          </Button>
        </div>
      </form>
    </Form>
  );
}

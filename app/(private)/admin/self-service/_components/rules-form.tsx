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
import { CalendarIcon, Copy, Plus, Trash2, Loader2 } from "lucide-react";
import { updateSelfServiceSettingsAction } from "@/app/actions/settings";
import { toast } from "sonner";

const DAYS_OF_WEEK = [
  { id: 0, label: "Domingo" },
  { id: 1, label: "Segunda-feira" },
  { id: 2, label: "Terça-feira" },
  { id: 3, label: "Quarta-feira" },
  { id: 4, label: "Quinta-feira" },
  { id: 5, label: "Sexta-feira" },
  { id: 6, label: "Sábado" },
];

const timeSchema = z.object({
  isOpen: z.boolean(),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
  breakStart: z.string().optional(),
  breakEnd: z.string().optional(),
});

const rulesFormSchema = z.object({
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
  })),
  exceptions: [],
};

// ---------------------------------------------------------------------------
// Seletor de horário (substitui o <input type="time"> nativo do navegador)
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
      <SelectTrigger className="h-8 w-27.5 border-none bg-transparent px-2 shadow-none focus:ring-1 focus:ring-ring">
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
// Date picker (substitui o <input type="date"> nativo do navegador)
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
          <CalendarIcon className="h-4 w-4" />
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
// Bloco de horário reutilizável (Expediente + Pausa)
// ---------------------------------------------------------------------------
function TimeRangeFields({
  control,
  basePath,
}: {
  control: any;
  basePath: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
      <div className="flex items-center gap-1.5">
        <span className="w-16 text-xs text-muted-foreground">Expediente</span>
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

      <div className="flex items-center gap-1.5">
        <span className="w-12 text-xs text-muted-foreground">Pausa</span>
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

  // 🛡️ MERGE INTELIGENTE: Limpo, mantendo apenas regras de horários
  const resolvedData = useMemo(() => {
    if (!initialData) return defaultValues;

    return {
      schedule:
        initialData.schedule && initialData.schedule.length > 0
          ? initialData.schedule
          : defaultValues.schedule,
      exceptions: initialData.exceptions || [],
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
        <Card className="border-none shadow-none">
          <CardHeader className="flex flex-col gap-4 px-0 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Padrão semanal de expediente</CardTitle>
              <CardDescription>
                Defina os horários base da sua semana.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={applyToAllDays}
            >
              <Copy className="mr-2 h-4 w-4" />
              Replicar Segunda para a semana
            </Button>
          </CardHeader>
          <CardContent className="divide-y px-0">
            {scheduleFields.map((field, index) => {
              const isOpen = form.watch(`schedule.${index}.isOpen`);
              const dayLabel = DAYS_OF_WEEK.find(
                (d) => d.id === field.dayOfWeek,
              )?.label;

              return (
                <div
                  key={field.id}
                  className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <FormField
                    control={form.control}
                    name={`schedule.${index}.isOpen`}
                    render={({ field }) => (
                      <FormItem className="flex shrink-0 flex-row items-center space-y-0 space-x-3 sm:w-44">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer text-base font-medium">
                          {dayLabel}
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  {isOpen ? (
                    <TimeRangeFields
                      control={form.control}
                      basePath={`schedule.${index}`}
                    />
                  ) : (
                    <span className="text-sm italic text-muted-foreground">
                      Fechado
                    </span>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Exceções */}
        <Card className="border-none shadow-none">
          <CardHeader className="flex flex-row items-start justify-between px-0">
            <div>
              <CardTitle>Exceções e datas específicas</CardTitle>
              <CardDescription>
                Configure feriados, folgas ou dias com horários diferentes do
                padrão.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendException({ date: "", isOpen: false })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar data
            </Button>
          </CardHeader>
          <CardContent className="divide-y px-0">
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
                  className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0"
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
                      <Trash2 className="h-4 w-4" />
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

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar horários
          </Button>
        </div>
      </form>
    </Form>
  );
}

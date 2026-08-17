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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { LoaderLines, Plus, Trash, CalendarAlt, Clock, Star, Edit, InfoCircle } from "@boxicons/react";
import { updateSelfServiceSettingsAction, createScheduleRuleAction, updateScheduleRuleAction, deleteScheduleRuleAction } from "@/app/actions/settings";
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

const settingsSchema = z.object({
  futureBookingLimitDays: z.coerce.number().min(1, "Mínimo 1 dia"),
  welcomeMessage: z.string().optional(),
});

const scheduleRuleSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  isDefault: z.boolean().default(false),
  schedule: z.array(timeSchema.extend({ dayOfWeek: z.number() })),
  exceptions: z.array(timeSchema.extend({ date: z.string() })),
});

export type ScheduleRuleValues = z.infer<typeof scheduleRuleSchema>;
export type SettingsFormValues = z.infer<typeof settingsSchema>;

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

function MobileWeeklySchedule({ form }: { form: any }) {
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);

  const referenceDayIndex = selectedDays.length > 0 ? selectedDays[0] : 1;
  const referenceValues = form.watch(`schedule.${referenceDayIndex}`);

  const [hasBreak, setHasBreak] = useState(!!referenceValues?.breakStart);

  const handleBatchChange = (field: string, value: any) => {
    selectedDays.forEach((dayId) => {
      form.setValue(`schedule.${dayId}.${field}`, value, { shouldDirty: true });
    });
  };

  const toggleDay = (dayId: number) => {
    const isCurrentlySelected = selectedDays.includes(dayId);

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

    [0, 1, 2, 3, 4, 5, 6].forEach((dayId) => {
      form.setValue(`schedule.${dayId}.isOpen`, false);
    });

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

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Dias de Funcionamento</h3>

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
                <span>{day.short}</span>
              </button>
            );
          })}
        </div>

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
            <h3 className="text-sm font-semibold">Intervalo</h3>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ScheduleRuleEditor Component (Modal de Edição de Grade)
// ---------------------------------------------------------------------------
function ScheduleRuleEditor({
  rule,
  open,
  onOpenChange,
}: {
  rule: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, setIsPending] = useState(false);

  const defaultSchedule = DAYS_OF_WEEK.map((day) => ({
    dayOfWeek: day.id,
    isOpen: day.id >= 1 && day.id <= 5,
    openTime: day.id >= 1 && day.id <= 5 ? "09:00" : "",
    closeTime: day.id >= 1 && day.id <= 5 ? "18:00" : "",
    breakStart: day.id >= 1 && day.id <= 5 ? "12:00" : "",
    breakEnd: day.id >= 1 && day.id <= 5 ? "13:00" : "",
    breakReason: "",
    breakVisibleToClient: false,
  }));

  const form = useForm<ScheduleRuleValues>({
    resolver: zodResolver(scheduleRuleSchema),
    defaultValues: {
      name: rule?.name || "Nova Grade",
      isDefault: rule?.isDefault || false,
      schedule: rule?.schedule && rule.schedule.length > 0 ? rule.schedule : defaultSchedule,
      exceptions: rule?.exceptions || [],
    },
    mode: "onChange",
  });

  const {
    fields: exceptionFields,
    append: appendException,
    remove: removeException,
  } = useFieldArray({
    name: "exceptions",
    control: form.control,
  });

  async function onSubmit(data: ScheduleRuleValues) {
    setIsPending(true);
    try {
      let response;
      if (rule?.id) {
        response = await updateScheduleRuleAction(rule.id, data);
      } else {
        response = await createScheduleRuleAction(data.name, data.isDefault);
        if (response.success && response.data) {
          // Update the newly created rule with its schedule/exceptions
          response = await updateScheduleRuleAction(response.data.id, data);
        }
      }

      if (!response.success) {
        toast.error(response.error || "Erro ao salvar a grade.");
        return;
      }

      toast.success("Grade de horários salva com sucesso!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Ocorreu um erro inesperado.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-[100dvh] sm:h-[90vh] flex flex-col p-0 gap-0 rounded-none sm:rounded-2xl overflow-hidden bg-background border-0 sm:border">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>{rule?.id ? "Editar Grade de Horários" : "Nova Grade de Horários"}</DialogTitle>
          <DialogDescription>
            Defina o padrão semanal e exceções para esta grade, que poderá ser atribuída a um ou mais profissionais.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto flex flex-col">
            <div className="p-6 space-y-8 flex-1">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Grade</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Grade Manhã" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 shadow-sm h-[76px] mt-2 sm:mt-0">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Tornar Padrão</FormLabel>

                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  Padrão Semanal
                </h3>
                <MobileWeeklySchedule form={form} />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <CalendarAlt className="w-5 h-5 text-muted-foreground" />
                    Exceções (Feriados, Folgas)
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendException({ date: "", isOpen: false, breakVisibleToClient: false })}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar
                  </Button>
                </div>

                <div className="space-y-4">
                  {exceptionFields.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhuma exceção configurada.</p>
                  )}
                  {exceptionFields.map((field, index) => {
                    const isOpen = form.watch(`exceptions.${index}.isOpen`);
                    return (
                      <div key={field.id} className="p-4 rounded-xl border bg-card">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex flex-wrap items-center gap-4">
                            <FormField
                              control={form.control}
                              name={`exceptions.${index}.date`}
                              render={({ field }) => (
                                <DatePicker value={field.value} onChange={field.onChange} />
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`exceptions.${index}.isOpen`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-y-0 space-x-3">
                                  <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                  </FormControl>
                                  <FormLabel className="cursor-pointer">Aberto neste dia?</FormLabel>
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
                          <div className="pt-4 mt-4 border-t">
                            <TimeRangeFields control={form.control} basePath={`exceptions.${index}`} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-card flex justify-end gap-3 sticky bottom-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <LoaderLines className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Grade
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main RulesAndHoursForm (Regras Globais e Lista de Grades)
// ---------------------------------------------------------------------------
export function RulesAndHoursForm({ initialData }: { initialData?: any }) {
  const [isPending, setIsPending] = useState(false);
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      futureBookingLimitDays: initialData?.futureBookingLimitDays ?? 30,
      welcomeMessage: initialData?.welcomeMessage ?? "Bem-vindo, aqui você pode agendar seu horário de forma rápida e fácil.",
    },
  });

  async function onSubmitSettings(data: SettingsFormValues) {
    setIsPending(true);
    try {
      const response = await updateSelfServiceSettingsAction({
        futureBookingLimitDays: data.futureBookingLimitDays,
        welcomeMessage: data.welcomeMessage,
      } as any);

      if (!response.success) {
        toast.error(response.error || "Erro ao salvar as configurações");
        return;
      }
      toast.success("Configurações globais salvas com sucesso.");
    } catch (error) {
      toast.error("Ocorreu um erro inesperado ao salvar.");
    } finally {
      setIsPending(false);
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (confirm("Tem certeza que deseja excluir esta grade de horários?")) {
      const response = await deleteScheduleRuleAction(ruleId);
      if (!response.success) {
        toast.error(response.error || "Erro ao excluir a regra.");
      } else {
        toast.success("Grade excluída com sucesso!");
      }
    }
  };

  const scheduleRules = initialData?.scheduleRules || [];

  return (
    <div className="space-y-8">

      {/* Lista de Templates de Horários */}
      <Card className="border-none shadow-none bg-transparent sm:bg-card">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-0 sm:px-6">
          <div>
            <CardTitle>Grades de Horários (Templates)</CardTitle>
            <CardDescription>
              Crie grades de horários e associe aos seus profissionais.
            </CardDescription>
          </div>
          <Button onClick={() => {
            setSelectedRule(null);
            setIsEditorOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Grade
          </Button>
        </CardHeader>
        <CardContent className="px-0 sm:px-6 space-y-4">
          {scheduleRules.map((rule: any) => (
            <div
              key={rule.id}
              className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => {
                setSelectedRule(rule);
                setIsEditorOpen(true);
              }}
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold flex items-center gap-2">
                    {rule.name}
                    {rule.isDefault && (
                      <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-500 px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3" /> Padrão
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {rule.schedule.filter((s: any) => s.isOpen).length} dias abertos na semana
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRule(rule);
                  setIsEditorOpen(true);
                }}>
                  <Edit className="w-4 h-4 text-muted-foreground" />
                </Button>
                {!rule.isDefault && (
                  <Button variant="ghost" size="icon" onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRule(rule.id);
                  }}>
                    <Trash className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Regras Globais de Agendamento */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitSettings)}>
          <Card className="border-none shadow-none bg-transparent sm:bg-card">
            <CardHeader className="px-0 sm:px-6">
              <CardTitle>Regras de Agendamento e Recepção</CardTitle>
              <CardDescription>
                Configure limites globais aplicáveis a todos os horários e serviços.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 sm:px-6 space-y-6">
              <FormField
                control={form.control}
                name="futureBookingLimitDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Dias disponíveis para agendamento (Limite)</FormLabel>
                    <CardDescription className="mb-2">
                      Limite máximo de dias no futuro que um cliente pode reservar.
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
                      Mensagem exibida ao cliente na tela de agendamento (BookingFlow).
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

              <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" disabled={isPending} className="w-full sm:w-auto h-12 rounded-xl">
                  {isPending && <LoaderLines className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Regras Globais
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>

      {/* Editor Modal */}
      {isEditorOpen && (
        <ScheduleRuleEditor
          rule={selectedRule}
          open={isEditorOpen}
          onOpenChange={(open) => setIsEditorOpen(open)}
        />
      )}
    </div>
  );
}

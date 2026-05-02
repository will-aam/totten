// components/finance/transaction-modal.tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  TransactionType,
  TransactionStatus,
  OrganizationPaymentMethod,
} from "@/types/finance";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  LoaderDots,
  Repeat,
} from "@boxicons/react";
import { cn } from "@/lib/utils";
import {
  createTransaction,
  updateTransaction,
} from "@/app/actions/transactions";
import { getPaymentMethods } from "@/app/actions/payment-methods";
import { useToast } from "@/hooks/use-toast";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "INCOME" | "EXPENSE";
  initialData?: {
    id: string;
    description: string;
    amount: number;
    date: string;
    status: TransactionStatus;
    paymentMethodId?: string;
    recurrence_id?: string | null;
  } | null;
}

export function TransactionModal({
  isOpen,
  onClose,
  type,
  initialData,
}: TransactionModalProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [date, setDate] = useState<string>("");
  const [status, setStatus] = useState<TransactionStatus>("PAGO");
  const [paymentMethodId, setPaymentMethodId] = useState<string>("none");

  // Estados para Criação de Recorrência
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState("MONTHLY");
  const [duration, setDuration] = useState<number | "">("");

  // Estado para Edição de Recorrência (Lote)
  const [updateFuture, setUpdateFuture] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState<
    OrganizationPaymentMethod[]
  >([]);

  const isIncome = type === "INCOME";
  const isEditing = !!initialData;

  useEffect(() => {
    if (isOpen) {
      const loadMethods = async () => {
        const data = await getPaymentMethods();
        setPaymentMethods(data as OrganizationPaymentMethod[]);
      };
      loadMethods();

      if (initialData) {
        setDescription(initialData.description);
        setAmount(initialData.amount);
        setDate(initialData.date.split("T")[0]);
        setStatus(initialData.status);
        setPaymentMethodId(initialData.paymentMethodId || "none");
        setIsRecurring(false);
        setUpdateFuture(false); // Reseta ao abrir
      } else {
        setDescription("");
        setAmount("");
        setDate(new Date().toISOString().split("T")[0]);
        setStatus("PAGO");
        setPaymentMethodId("none");
        setIsRecurring(false);
        setFrequency("MONTHLY");
        setDuration("");
        setUpdateFuture(false);
      }
    }
  }, [isOpen, initialData]);

  const handleSave = () => {
    if (!description || !amount || !date) return;

    if (isRecurring && (!duration || Number(duration) <= 1)) {
      toast({
        title: "Erro",
        description: "Se for repetir, informe ao menos 2 vezes.",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      const payload: any = {
        type: isIncome
          ? ("RECEITA" as TransactionType)
          : ("DESPESA" as TransactionType),
        description,
        amount: Number(amount),
        date,
        status,
        paymentMethodId:
          paymentMethodId === "none" ? undefined : paymentMethodId,
      };

      if (isRecurring) {
        payload.isRecurring = true;
        payload.frequency = frequency;
        payload.duration = Number(duration);
      }

      if (isEditing) {
        payload.updateFuture = updateFuture;
      }

      const result = isEditing
        ? await updateTransaction(initialData!.id, payload)
        : await createTransaction(payload);

      if (result.success) {
        toast({
          title: "Sucesso",
          description: isEditing
            ? updateFuture
              ? "Lote atualizado!"
              : "Atualizada!"
            : isRecurring
              ? "Lançamentos programados!"
              : "Registrada!",
        });
        onClose();
      } else {
        toast({
          title: "Erro",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  const isSaveDisabled = !description || !amount || !date || isPending;
  const hideNumberArrows =
    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => !open && !isPending && onClose()}
    >
      {/* 🔥 Aplicado border radius estilo Gaveta Moderna no Desktop */}
      <SheetContent className="flex flex-col w-full sm:max-w-md p-0 overflow-hidden sm:rounded-l-4xl border-l-0">
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <SheetHeader className="text-left mt-2">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex items-center justify-center h-14 w-14 rounded-2xl shrink-0 border",
                  isIncome
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-600 border-rose-500/20",
                )}
              >
                {isIncome ? (
                  <ArrowUpCircle className="h-7 w-7" strokeWidth={2} />
                ) : (
                  <ArrowDownCircle className="h-7 w-7" strokeWidth={2} />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <SheetTitle className="text-2xl font-black text-foreground tracking-tight">
                  {isEditing
                    ? isIncome
                      ? "Editar Receita"
                      : "Editar Despesa"
                    : isIncome
                      ? "Nova Receita"
                      : "Nova Despesa"}
                </SheetTitle>
                <SheetDescription className="font-medium text-muted-foreground">
                  {isEditing
                    ? "Atualize os dados."
                    : isIncome
                      ? "Registe uma entrada."
                      : "Registe uma saída ou custo."}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex flex-col gap-5 py-2">
            {/* Valor */}
            <div className="space-y-2">
              <Label
                className={cn(
                  "text-[11px] font-black uppercase tracking-widest ml-1",
                  isIncome ? "text-emerald-600" : "text-rose-600",
                )}
              >
                Valor da {isIncome ? "Receita" : "Despesa"} *
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                  R$
                </span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) =>
                    setAmount(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  disabled={isPending}
                  className={cn(
                    "h-14 rounded-2xl pl-12 text-xl font-black bg-card border-border/50 focus-visible:ring-primary/20",
                    hideNumberArrows,
                  )}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Descrição *
              </Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isPending}
                placeholder={
                  isIncome ? "Ex: Venda de Produto" : "Ex: Conta de Luz"
                }
                className="h-12 rounded-2xl font-bold bg-card border-border/50 focus-visible:ring-primary/20"
              />
            </div>

            {/* Data e Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Data *
                </Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={isPending}
                  className="h-12 rounded-2xl font-bold bg-card border-border/50 focus-visible:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Status
                </Label>
                <Select
                  value={status}
                  onValueChange={(val) => setStatus(val as TransactionStatus)}
                  disabled={isPending}
                >
                  <SelectTrigger className="h-12 rounded-2xl font-bold bg-card border-border/50 focus-visible:ring-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem
                      value="PAGO"
                      className="font-bold text-emerald-600 focus:text-emerald-700"
                    >
                      Pago
                    </SelectItem>
                    <SelectItem
                      value="PENDENTE"
                      className="font-bold text-amber-600 focus:text-amber-700"
                    >
                      Pendente
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Meio de Pagamento */}
            <div className="space-y-2">
              <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Meio de Pagamento
              </Label>
              <Select
                value={paymentMethodId}
                onValueChange={setPaymentMethodId}
                disabled={isPending}
              >
                <SelectTrigger className="h-12 rounded-2xl font-bold bg-card border-border/50 focus-visible:ring-primary/20">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem
                    value="none"
                    className="font-medium text-muted-foreground"
                  >
                    Não especificado
                  </SelectItem>
                  {paymentMethods
                    .filter((pm) => pm.isActive)
                    .map((pm) => (
                      <SelectItem
                        key={pm.id}
                        value={pm.id}
                        className="font-bold"
                      >
                        {pm.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* BLOCO DE RECORRÊNCIA (CRIAÇÃO) */}
            {!isEditing && (
              <div className="pt-4 border-t border-border/40 mt-2">
                <div className="flex items-center justify-between bg-card p-5 rounded-3xl border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl">
                      <Repeat className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <Label className="text-sm font-black text-foreground cursor-pointer uppercase tracking-wider">
                        Repetir movimentação
                      </Label>
                    </div>
                  </div>
                  <Switch
                    checked={isRecurring}
                    onCheckedChange={setIsRecurring}
                    disabled={isPending}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>

                {isRecurring && (
                  <div className="grid grid-cols-2 gap-4 mt-3 p-4 bg-card rounded-3xl border border-border/50 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                        Intervalo
                      </Label>
                      <Select
                        value={frequency}
                        onValueChange={setFrequency}
                        disabled={isPending}
                      >
                        <SelectTrigger className="h-12 rounded-2xl font-bold bg-muted/30 border-border/50 focus-visible:ring-primary/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="MONTHLY" className="font-bold">
                            Mensal
                          </SelectItem>
                          <SelectItem value="WEEKLY" className="font-bold">
                            Semanal
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                        Quantidade
                      </Label>
                      <Input
                        type="number"
                        min="2"
                        max="60"
                        value={duration}
                        onChange={(e) =>
                          setDuration(
                            e.target.value === "" ? "" : Number(e.target.value),
                          )
                        }
                        disabled={isPending}
                        placeholder="Ex: 12"
                        className={cn(
                          "h-12 rounded-2xl font-bold bg-muted/30 border-border/50 focus-visible:ring-primary/20",
                          hideNumberArrows,
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* BLOCO DE EDIÇÃO EM LOTE */}
            {isEditing && initialData?.recurrence_id && (
              <div className="pt-4 border-t border-border/40 mt-2">
                <label className="flex items-start gap-4 p-5 border border-border/50 rounded-3xl bg-card cursor-pointer hover:border-primary/30 transition-colors">
                  <Checkbox
                    checked={updateFuture}
                    onCheckedChange={(checked) => setUpdateFuture(!!checked)}
                    disabled={isPending}
                    className="mt-0.5 rounded-md h-5 w-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-foreground uppercase tracking-widest">
                      Aplicar no futuro
                    </span>
                    <span className="text-xs font-medium text-muted-foreground mt-1 leading-relaxed">
                      As alterações de nome e valor serão aplicadas nesta e nas
                      repetições seguintes.
                    </span>
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé Flat */}
        <div className="p-6 pt-4 border-t border-border/40 bg-background">
          <SheetFooter className="flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-2xl font-bold border-border/50 hover:bg-muted/50"
              onClick={onClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              className={cn(
                "flex-1 h-12 rounded-2xl font-bold shadow-md",
                isIncome
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                  : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20",
              )}
              onClick={handleSave}
              disabled={isSaveDisabled}
            >
              {isPending ? (
                <LoaderDots className="h-5 w-5 animate-spin" />
              ) : isEditing ? (
                "Salvar"
              ) : isRecurring ? (
                "Programar"
              ) : (
                "Registrar"
              )}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}

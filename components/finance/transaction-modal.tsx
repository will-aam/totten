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
import { Checkbox } from "@/components/ui/checkbox"; // 🔥 Importamos o Checkbox
import {
  TransactionType,
  TransactionStatus,
  OrganizationPaymentMethod,
} from "@/types/finance";
import { ArrowDownCircle, ArrowUpCircle, Loader2, Repeat } from "lucide-react";
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

  // 🔥 Estado para Edição de Recorrência (Lote)
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

      // 🔥 Passamos a flag de atualização pro Backend
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
      <SheetContent className="flex flex-col w-full sm:max-w-md p-0 overflow-hidden border-l-0 sm:border-l">
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <SheetHeader className="text-left space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-2 rounded-full",
                  isIncome
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
                )}
              >
                {isIncome ? (
                  <ArrowUpCircle className="h-6 w-6" />
                ) : (
                  <ArrowDownCircle className="h-6 w-6" />
                )}
              </div>
              <div>
                <SheetTitle className="text-2xl">
                  {isEditing
                    ? isIncome
                      ? "Editar Receita"
                      : "Editar Despesa"
                    : isIncome
                      ? "Nova Receita"
                      : "Nova Despesa"}
                </SheetTitle>
                <SheetDescription>
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
            <div className="space-y-2">
              <Label
                className={cn(
                  "text-sm font-semibold",
                  isIncome ? "text-emerald-600" : "text-rose-600",
                )}
              >
                Valor da {isIncome ? "Receita" : "Despesa"} *
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
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
                    "h-14 rounded-xl pl-10 text-xl font-bold bg-muted/30 border-none",
                    hideNumberArrows,
                  )}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isPending}
                placeholder={
                  isIncome ? "Ex: Venda de Produto" : "Ex: Conta de Luz"
                }
                className="h-12 rounded-xl bg-muted/30 border-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={isPending}
                  className="h-12 rounded-xl bg-muted/30 border-none"
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(val) => setStatus(val as TransactionStatus)}
                  disabled={isPending}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="PAGO">Pago</SelectItem>
                    <SelectItem value="PENDENTE">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Meio de Pagamento</Label>
              <Select
                value={paymentMethodId}
                onValueChange={setPaymentMethodId}
                disabled={isPending}
              >
                <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="none">---</SelectItem>
                  {paymentMethods
                    .filter((pm) => pm.isActive)
                    .map((pm) => (
                      <SelectItem key={pm.id} value={pm.id}>
                        {pm.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* BLOCO DE RECORRÊNCIA (CRIAÇÃO) */}
            {!isEditing && (
              <div className="pt-2 border-t border-border/50">
                <div className="flex items-center justify-between bg-muted/20 p-4 rounded-xl border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-background rounded-full border shadow-sm">
                      <Repeat className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <Label className="text-base font-semibold cursor-pointer">
                        Repetir movimentação
                      </Label>
                    </div>
                  </div>
                  <Switch
                    checked={isRecurring}
                    onCheckedChange={setIsRecurring}
                    disabled={isPending}
                  />
                </div>

                {isRecurring && (
                  <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-muted/10 rounded-xl border border-border/30">
                    <div className="space-y-2">
                      <Label className="text-xs">Intervalo</Label>
                      <Select
                        value={frequency}
                        onValueChange={setFrequency}
                        disabled={isPending}
                      >
                        <SelectTrigger className="h-10 rounded-lg bg-background border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="MONTHLY">Mensal</SelectItem>
                          <SelectItem value="WEEKLY">Semanal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Repetir quantas vezes?</Label>
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
                          "h-10 rounded-lg bg-background border-border/50",
                          hideNumberArrows,
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 🔥 BLOCO DE EDIÇÃO EM LOTE (Só mostra se for edição de conta recorrente) */}
            {isEditing && initialData?.recurrence_id && (
              <div className="pt-2 border-t border-border/50">
                <label className="flex items-start gap-3 p-4 border border-border/50 rounded-xl bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors">
                  <Checkbox
                    checked={updateFuture}
                    onCheckedChange={(checked) => setUpdateFuture(!!checked)}
                    disabled={isPending}
                    className="mt-1 shadow-none"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground">
                      Aplicar nas parcelas futuras
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5">
                      As alterações de nome e valor serão aplicadas nas
                      repetições seguintes a esta.
                    </span>
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 pt-4 border-t border-border/50 bg-background">
          <SheetFooter className="flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-xl border-none bg-muted hover:bg-muted/80"
              onClick={onClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              className={cn(
                "flex-1 h-12 rounded-xl font-bold",
                isIncome
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-rose-600 hover:bg-rose-700 text-white",
              )}
              onClick={handleSave}
              disabled={isSaveDisabled}
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isEditing ? (
                "Salvar Alterações"
              ) : isRecurring ? (
                "Programar Lançamentos"
              ) : (
                "Salvar"
              )}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}

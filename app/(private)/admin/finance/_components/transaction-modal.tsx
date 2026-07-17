// app/(private)/admin/finance/_components/transaction-modal.tsx
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
      <SheetContent className="flex flex-col w-full sm:max-w-md p-0 overflow-hidden sm:rounded-l-[2.5rem] border-l border-border/40 bg-background/95 backdrop-blur-2xl shadow-2xl">
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <SheetHeader className="text-left mt-2">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex items-center justify-center h-14 w-14 rounded-2xl shrink-0 border shadow-sm",
                  isIncome
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-500 border-rose-500/20",
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
                <SheetDescription className="font-medium text-muted-foreground text-xs uppercase tracking-widest">
                  {isEditing
                    ? "Atualize os dados financeiros"
                    : isIncome
                      ? "Registre uma entrada de valor"
                      : "Registre uma saída ou custo"}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex flex-col gap-5 py-4">
            {/* Valor */}
            <div className="space-y-2">
              <Label
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest ml-1",
                  isIncome
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400",
                )}
              >
                Valor da {isIncome ? "Receita" : "Despesa"} *
              </Label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold transition-colors group-focus-within:text-foreground">
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
                    "h-14 rounded-2xl pl-12 text-xl font-black bg-muted/20 border-border/40 hover:bg-muted/30 focus-visible:ring-primary/30 transition-all shadow-inner",
                    hideNumberArrows,
                  )}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Descrição *
              </Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isPending}
                placeholder={
                  isIncome ? "Ex: Venda de Produto" : "Ex: Conta de Luz"
                }
                className="h-12 rounded-2xl font-bold bg-muted/20 border-border/40 hover:bg-muted/30 focus-visible:ring-primary/30 transition-all shadow-inner"
              />
            </div>

            {/* Data e Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Data *
                </Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={isPending}
                  className="h-12 rounded-2xl font-bold bg-muted/20 border-border/40 hover:bg-muted/30 focus-visible:ring-primary/30 transition-all shadow-inner"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Status
                </Label>
                <Select
                  value={status}
                  onValueChange={(val) => setStatus(val as TransactionStatus)}
                  disabled={isPending}
                >
                  <SelectTrigger className="h-12 rounded-2xl font-bold bg-muted/20 border-border/40 hover:bg-muted/30 focus-visible:ring-primary/30 transition-all shadow-inner">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border/50 shadow-xl">
                    <SelectItem
                      value="PAGO"
                      className="font-bold text-emerald-600 focus:text-emerald-700 focus:bg-emerald-500/10 rounded-xl my-0.5"
                    >
                      Pago
                    </SelectItem>
                    <SelectItem
                      value="PENDENTE"
                      className="font-bold text-amber-600 focus:text-amber-700 focus:bg-amber-500/10 rounded-xl my-0.5"
                    >
                      Pendente
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Meio de Pagamento */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Meio de Pagamento
              </Label>
              <Select
                value={paymentMethodId}
                onValueChange={setPaymentMethodId}
                disabled={isPending}
              >
                <SelectTrigger className="h-12 rounded-2xl font-bold bg-muted/20 border-border/40 hover:bg-muted/30 focus-visible:ring-primary/30 transition-all shadow-inner">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/50 shadow-xl">
                  <SelectItem
                    value="none"
                    className="font-medium text-muted-foreground rounded-xl"
                  >
                    Não especificado
                  </SelectItem>
                  {paymentMethods
                    .filter((pm) => pm.isActive)
                    .map((pm) => (
                      <SelectItem
                        key={pm.id}
                        value={pm.id}
                        className="font-bold rounded-xl my-0.5"
                      >
                        {pm.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* BLOCO DE RECORRÊNCIA (CRIAÇÃO) */}
            {!isEditing && (
              <div className="pt-4 border-t border-border/30 mt-2">
                <div className="flex items-center justify-between bg-linear-to-r from-muted/30 to-muted/10 p-5 rounded-3xl border border-border/40 shadow-sm transition-all hover:border-primary/20">
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
                    className="data-[state=checked]:bg-primary shadow-sm"
                  />
                </div>

                {isRecurring && (
                  <div className="grid grid-cols-2 gap-4 mt-3 p-5 bg-muted/10 rounded-3xl border border-border/40 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                        Intervalo
                      </Label>
                      <Select
                        value={frequency}
                        onValueChange={setFrequency}
                        disabled={isPending}
                      >
                        <SelectTrigger className="h-12 rounded-2xl font-bold bg-background border-border/40 focus-visible:ring-primary/30 shadow-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-border/50">
                          <SelectItem
                            value="MONTHLY"
                            className="font-bold rounded-xl my-0.5"
                          >
                            Mensal
                          </SelectItem>
                          <SelectItem
                            value="WEEKLY"
                            className="font-bold rounded-xl my-0.5"
                          >
                            Semanal
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
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
                          "h-12 rounded-2xl font-bold bg-background border-border/40 focus-visible:ring-primary/30 shadow-sm",
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
              <div className="pt-4 border-t border-border/30 mt-2">
                <label className="flex items-start gap-4 p-5 border border-border/40 rounded-3xl bg-linear-to-r from-muted/30 to-muted/10 cursor-pointer hover:border-primary/40 transition-all shadow-sm group">
                  <Checkbox
                    checked={updateFuture}
                    onCheckedChange={(checked) => setUpdateFuture(!!checked)}
                    disabled={isPending}
                    className="mt-0.5 rounded-md h-5 w-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary shadow-sm"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-foreground uppercase tracking-widest group-hover:text-primary transition-colors">
                      Aplicar no futuro
                    </span>
                    <span className="text-xs font-medium text-muted-foreground mt-1.5 leading-relaxed">
                      As alterações de nome e valor serão aplicadas nesta e nas
                      repetições seguintes.
                    </span>
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé Glassmorphism */}
        <div className="p-6 md:p-8 pt-4 border-t border-border/30 bg-background/50 backdrop-blur-md">
          <SheetFooter className="flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-2xl font-bold border-border/50 hover:bg-muted/50 bg-background/50"
              onClick={onClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              className={cn(
                "flex-1 h-12 rounded-2xl font-bold transition-all duration-300",
                isIncome
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_4px_20px_rgb(16,185,129,0.3)] hover:shadow-[0_6px_25px_rgb(16,185,129,0.4)]"
                  : "bg-rose-500 hover:bg-rose-600 text-white shadow-[0_4px_20px_rgb(244,63,94,0.3)] hover:shadow-[0_6px_25px_rgb(244,63,94,0.4)]",
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

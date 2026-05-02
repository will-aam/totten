// app/admin/finance/receivables/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminHeader } from "@/components/admin-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LoaderDots,
  Dollar,
  Calendar,
  User,
  ArrowDownRight,
  CheckCircle,
} from "@boxicons/react";
import {
  getPendingReceivables,
  processReceivablePayment,
} from "@/app/actions/transactions";
import { getPaymentMethods } from "@/app/actions/payment-methods"; // 🔥 Importamos a busca de pagamentos
import { OrganizationPaymentMethod } from "@/types/finance"; // 🔥 Importamos a tipagem
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ReceivablesPage() {
  const [receivables, setReceivables] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<
    OrganizationPaymentMethod[]
  >([]); // 🔥 Estado para as formas de pagamento
  const [isLoading, setIsLoading] = useState(true);

  // Controle do Modal de Pagamento
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [paymentMethodId, setPaymentMethodId] = useState<string>(""); // 🔥 Agora guardamos o ID da forma selecionada
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 🔥 Buscamos as pendências e os métodos de pagamento simultaneamente
      const [receivablesData, methodsData] = await Promise.all([
        getPendingReceivables(),
        getPaymentMethods(),
      ]);

      setReceivables(receivablesData);
      setPaymentMethods(methodsData as OrganizationPaymentMethod[]);
    } catch (error) {
      toast.error("Erro ao carregar dados.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleConfirmPayment = async () => {
    if (!selectedItem) return;
    if (!paymentMethodId) {
      toast.error("Por favor, selecione uma forma de pagamento.");
      return;
    }

    // Encontra o método completo selecionado para pegar o Tipo (para a agenda) e o ID (para o financeiro)
    const selectedMethod = paymentMethods.find(
      (pm) => pm.id === paymentMethodId,
    );
    if (!selectedMethod) return;

    setIsProcessing(true);
    try {
      const res = await processReceivablePayment(
        selectedItem.id,
        selectedItem.sourceType,
        selectedMethod.type, // Enum usado no agendamento
        selectedMethod.id, // ID usado na transação manual
      );

      if (res.success) {
        toast.success("Pagamento registrado com sucesso!");
        handleCloseModal();
        loadData(); // Recarrega a lista
      } else {
        toast.error(res.error || "Erro ao registrar pagamento.");
      }
    } catch (error) {
      toast.error("Erro na conexão.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setPaymentMethodId(""); // Limpa a seleção ao fechar
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const dateObj = new Date(dateString);
    const dayMonth = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
    }).format(dateObj);
    const time = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj);
    return `${dayMonth} às ${time}`;
  };

  return (
    <>
      <AdminHeader title="Contas a Receber" />

      <div className="flex flex-col gap-4 p-4 md:p-6 max-w-5xl mx-auto w-full pb-24 md:pb-6">
        {/* Resumo */}
        {!isLoading && receivables.length > 0 && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-4 flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-400">
                Total a Receber
              </p>
              <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-300">
                {formatCurrency(
                  receivables.reduce((acc, item) => acc + item.amount, 0),
                )}
              </h2>
            </div>
            <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Dollar className="h-6 w-6" />
            </div>
          </div>
        )}

        {/* Lista de Pendências */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <LoaderDots className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : receivables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/10 rounded-2xl border border-dashed border-border">
            <CheckCircle className="h-12 w-12 text-emerald-500/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground">
              Tudo em dia!
            </h3>
            <p className="text-muted-foreground font-medium mt-1">
              Não há pagamentos pendentes para receber no momento.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {receivables.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-card border border-border/50 rounded-2xl shadow-sm gap-4"
              >
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100/50 text-amber-600 dark:bg-amber-900/30">
                    <ArrowDownRight className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-base font-semibold text-foreground truncate flex items-center gap-2">
                      {item.description}
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-background"
                      >
                        {item.sourceType === "APPOINTMENT"
                          ? "Agenda"
                          : "Manual"}
                      </Badge>
                    </span>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {item.clientName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(item.date)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-border/50">
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-500">
                    {formatCurrency(item.amount)}
                  </span>
                  <Button
                    onClick={() => setSelectedItem(item)}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    Dar Baixa
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE PAGAMENTO */}
      <Dialog
        open={!!selectedItem}
        onOpenChange={(open) => !open && handleCloseModal()}
      >
        <DialogContent className="rounded-3xl sm:max-w-md border-border/50 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Registrar Recebimento</DialogTitle>
            <DialogDescription>
              Selecione a forma de pagamento utilizada para dar baixa no valor
              de{" "}
              <strong className="text-foreground">
                {selectedItem && formatCurrency(selectedItem.amount)}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Forma de Pagamento
              </label>
              <Select
                value={paymentMethodId}
                onValueChange={setPaymentMethodId}
              >
                <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-border/50">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {/* 🔥 Renderizamos apenas as opções ATIVAS cadastradas na organização */}
                  {paymentMethods
                    .filter((pm) => pm.isActive)
                    .map((method) => (
                      <SelectItem
                        key={method.id}
                        value={method.id}
                        className="rounded-lg py-2.5"
                      >
                        {method.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleCloseModal}
              className="rounded-xl border-border/50"
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={isProcessing}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isProcessing ? (
                <>
                  <LoaderDots className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Processando
                </>
              ) : (
                "Confirmar Recebimento"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

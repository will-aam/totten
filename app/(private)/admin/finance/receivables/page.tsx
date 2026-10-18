// app/(private)/admin/finance/receivables/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
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
  processAllReceivablesPayment,
} from "@/app/actions/transactions";
import { getPaymentMethods } from "@/app/actions/payment-methods";
import { OrganizationPaymentMethod } from "@/types/finance";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ReceivablesPage() {
  const [receivables, setReceivables] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<
    OrganizationPaymentMethod[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // Paginação Client-side para fluidez e escalabilidade
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Controle do Modal de Pagamento - aceita o item ou a chave "ALL" para dar baixa em todos
  const [selectedItem, setSelectedItem] = useState<any | "ALL" | null>(null);
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
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

    const selectedMethod = paymentMethods.find(
      (pm) => pm.id === paymentMethodId,
    );
    if (!selectedMethod) return;

    setIsProcessing(true);
    try {
      if (selectedItem === "ALL") {
        // Fluxo Master: Baixa atômica em todos os pendentes no banco (independente de paginação)
        const res = await processAllReceivablesPayment(
          selectedMethod.type,
          selectedMethod.id,
        );

        if (res.success) {
          toast.success(
            `Todos os recebimentos foram quitados com sucesso! (${res.count ?? receivables.length} itens)`,
          );
          handleCloseModal();
          setCurrentPage(1);
          loadData();
        } else {
          toast.error(res.error || "Erro ao quitar todos os recebimentos.");
        }
      } else {
        // Fluxo original: Baixa em um único item
        const res = await processReceivablePayment(
          selectedItem.id,
          selectedItem.sourceType,
          selectedMethod.type,
          selectedMethod.id,
        );

        if (res.success) {
          toast.success("Pagamento registrado com sucesso!");
          handleCloseModal();
          loadData();
        } else {
          toast.error(res.error || "Erro ao registrar pagamento.");
        }
      }
    } catch (error) {
      toast.error("Erro na conexão ao processar recebimento.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setPaymentMethodId("");
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

  const totalReceivables = receivables.reduce(
    (acc, item) => acc + item.amount,
    0,
  );

  // Cálculos de Paginação
  const totalPages = Math.max(1, Math.ceil(receivables.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedReceivables = receivables.slice(startIndex, endIndex);

  return (
    <>
      <AdminHeader title="Contas a Receber" />

      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 md:pb-6 animate-in fade-in duration-700 min-h-[calc(100vh-100px)]">
        {/* RESUMO PREMIUM GLASSMORPHISM */}
        {!isLoading && receivables.length > 0 && (
          <div className="relative overflow-hidden bg-background/50 backdrop-blur-md border border-emerald-500/20 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-sm">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-emerald-500/10 blur-3xl rounded-full -z-10 pointer-events-none" />

            <div className="flex items-center gap-4 relative z-10">
              <div className="h-14 w-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-500/20">
                <Dollar className="h-7 w-7" />
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/80 dark:text-emerald-400/80">
                  Total Pendente ({receivables.length}{" "}
                  {receivables.length === 1 ? "lançamento" : "lançamentos"})
                </p>
                <h2 className="text-3xl font-black text-foreground tracking-tighter mt-0.5">
                  {formatCurrency(totalReceivables)}
                </h2>
              </div>
            </div>

            {/* BOTÃO MASTER: DAR BAIXA EM TODOS */}
            <Button
              onClick={() => setSelectedItem("ALL")}
              className="w-full sm:w-auto font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 rounded-2xl h-12 px-6 transition-all gap-2 relative z-10 active:scale-95"
            >
              <CheckCircle className="h-5 w-5" />
              Dar Baixa em Todos
            </Button>
          </div>
        )}

        {/* LISTA DE PENDÊNCIAS */}
        <div className="flex flex-col w-full bg-background/40 backdrop-blur-sm rounded-3xl border border-border/40 p-2 sm:p-4 shadow-sm">
          {isLoading ? (
            <div className="flex justify-center items-center py-24">
              <LoaderDots className="h-10 w-10 animate-spin text-primary/40" />
            </div>
          ) : receivables.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-muted/10 rounded-2xl border border-dashed border-border/60 mx-2">
              <div className="p-4 bg-emerald-500/10 rounded-full mb-4">
                <CheckCircle className="h-10 w-10 text-emerald-500" />
              </div>
              <h3 className="text-xl font-black text-foreground">
                Tudo em dia!
              </h3>
              <p className="text-sm font-medium text-muted-foreground mt-1.5">
                Não há pagamentos pendentes para receber no momento.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {paginatedReceivables.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-border/40 last:border-0 hover:bg-muted/40 transition-all duration-300 rounded-2xl group gap-4"
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 font-bold shadow-sm transition-transform duration-300 group-hover:scale-110">
                      <ArrowDownRight className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-foreground truncate flex flex-wrap items-center gap-2 group-hover:text-primary transition-colors">
                        {item.description}
                        <Badge
                          variant="secondary"
                          className="text-[9px] uppercase tracking-widest bg-muted/50 border-none font-bold"
                        >
                          {item.sourceType === "APPOINTMENT"
                            ? "Agenda"
                            : "Manual"}
                        </Badge>
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] font-medium text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          <span className="truncate max-w-30 sm:max-w-xs">
                            {item.clientName}
                          </span>
                        </span>
                        <span className="w-1 h-1 rounded-full bg-border mx-0.5"></span>
                        <span className="flex items-center gap-1 font-semibold">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(item.date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 border-t border-border/30 sm:border-none pt-3 sm:pt-0">
                    <span className="text-lg font-black tracking-tight text-amber-600 dark:text-amber-500">
                      {formatCurrency(item.amount)}
                    </span>
                    <Button
                      onClick={() => setSelectedItem(item)}
                      variant="outline"
                      className="font-bold bg-background border-border/40 hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30 transition-all shadow-sm h-10"
                    >
                      Dar Baixa
                    </Button>
                  </div>
                </div>
              ))}

              {/* PAGINAÇÃO */}
              {totalPages > 1 && (
                <div className="pt-6 pb-2 border-t border-border/30 mt-2">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
                          className={
                            safeCurrentPage === 1
                              ? "pointer-events-none opacity-40"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (p) => {
                          if (
                            p === 1 ||
                            p === totalPages ||
                            (p >= safeCurrentPage - 1 &&
                              p <= safeCurrentPage + 1)
                          ) {
                            return (
                              <PaginationItem key={p}>
                                <PaginationLink
                                  onClick={() => setCurrentPage(p)}
                                  isActive={safeCurrentPage === p}
                                  className="cursor-pointer font-bold"
                                >
                                  {p}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }

                          if (
                            p === safeCurrentPage - 2 ||
                            p === safeCurrentPage + 2
                          ) {
                            return (
                              <PaginationItem key={p}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          return null;
                        },
                      )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                          }
                          className={
                            safeCurrentPage === totalPages
                              ? "pointer-events-none opacity-40"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  <p className="text-center text-[11px] font-semibold text-muted-foreground mt-2">
                    Página {safeCurrentPage} de {totalPages} ({receivables.length}{" "}
                    pendências no total)
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE PAGAMENTO PREMIUM */}
      <Dialog
        open={!!selectedItem}
        onOpenChange={(open) => !open && handleCloseModal()}
      >
        <DialogContent className="rounded-4xl sm:max-w-md border-border/40 shadow-2xl bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground">
              {selectedItem === "ALL"
                ? "Registrar Todos os Recebimentos"
                : "Registrar Recebimento"}
            </DialogTitle>
            <DialogDescription className="font-medium text-muted-foreground text-sm leading-relaxed pt-1">
              Selecione a forma de pagamento utilizada para dar baixa{" "}
              {selectedItem === "ALL" ? (
                <>
                  em todos os{" "}
                  <strong className="text-foreground font-black">
                    {receivables.length} lançamentos pendentes
                  </strong>{" "}
                  (de todas as páginas), totalizando{" "}
                  <strong className="text-foreground font-black">
                    {formatCurrency(totalReceivables)}
                  </strong>
                  .
                </>
              ) : (
                <>
                  no valor de{" "}
                  <strong className="text-foreground font-black">
                    {selectedItem &&
                      selectedItem !== "ALL" &&
                      formatCurrency(selectedItem.amount)}
                  </strong>
                  .
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Forma de Pagamento
              </label>
              <Select
                value={paymentMethodId}
                onValueChange={setPaymentMethodId}
                disabled={isProcessing}
              >
                <SelectTrigger className="h-14 bg-muted/20 border-border/40 hover:bg-muted/30 font-bold focus:ring-primary/30 transition-all shadow-inner">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="border-border/50 shadow-xl rounded-2xl">
                  {paymentMethods
                    .filter((pm) => pm.isActive)
                    .map((method) => (
                      <SelectItem
                        key={method.id}
                        value={method.id}
                        className="rounded-full py-2.5 font-bold"
                      >
                        {method.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              variant="outline"
              onClick={handleCloseModal}
              className="h-12 font-bold border-border/40 bg-muted/30 hover:bg-muted/50 px-6"
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={isProcessing}
              className="h-12 font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-[0_4px_20px_rgb(16,185,129,0.3)] hover:shadow-[0_6px_25px_rgb(16,185,129,0.4)] transition-all px-6"
            >
              {isProcessing ? (
                <>
                  <LoaderDots className="mr-2 h-5 w-5 animate-spin" />{" "}
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

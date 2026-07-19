// app/(private)/admin/finance/payment-methods/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  CreditCard,
  Landmark,
  QrScan,
  ChevronUp,
  Slider,
  Coin,
} from "@boxicons/react";
import { cn } from "@/lib/utils";
import { OrganizationPaymentMethod } from "@/types/finance";
import { PaymentMethodModal } from "../_components/payment-method-modal";
import { getPaymentMethods } from "@/app/actions/payment-methods";
import { Skeleton } from "@/components/ui/skeleton";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function PaymentMethodListItem({
  method,
  onClick,
}: {
  method: OrganizationPaymentMethod;
  onClick: () => void;
}) {
  const getIcon = () => {
    switch (method.type) {
      case "PIX":
        return <QrScan size="sm" />;
      case "CARTAO_CREDITO":
      case "CARTAO_DEBITO":
        return <CreditCard size="sm" />;
      case "DINHEIRO":
        return <Coin size="sm" />;
      default:
        return <Landmark size="sm" />;
    }
  };

  const getTaxString = () => {
    const p = Number(method.feePercentage);
    const f = Number(method.feeFixed);

    if (p === 0 && f === 0) return "Sem taxa";
    const parts = [];
    if (p > 0) parts.push(`${p}%`);
    if (f > 0) parts.push(currencyFormatter.format(f));
    return parts.join(" + ");
  };

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-4 md:p-5 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-all duration-300 rounded-2xl group cursor-pointer"
    >
      <div className="flex items-center gap-4 md:gap-5 flex-1 min-w-0 pr-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-bold shadow-sm border transition-transform duration-300 group-hover:scale-110",
            method.isActive
              ? "bg-primary/10 text-primary border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-[0_4px_15px_rgb(var(--primary)/0.2)]"
              : "bg-muted/50 text-muted-foreground border-border/50",
          )}
        >
          {getIcon()}
        </div>

        <div className="flex flex-col min-w-0 gap-0.5">
          <span
            className={cn(
              "text-base font-black leading-tight truncate transition-colors",
              method.isActive
                ? "text-foreground group-hover:text-primary"
                : "text-muted-foreground",
            )}
          >
            {method.name}
          </span>
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest leading-none flex items-center gap-1.5 truncate mt-0.5">
            {method.daysToReceive === 0
              ? "Recebimento na hora"
              : `Recebimento em ${method.daysToReceive} dia(s)`}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <span
          className={cn(
            "text-base font-black tracking-tight",
            method.isActive ? "text-foreground" : "text-muted-foreground/60",
          )}
        >
          {getTaxString()}
        </span>
        {method.isActive ? (
          <Badge
            variant="secondary"
            className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 border-none text-[10px] px-2 py-0.5 h-5 font-bold uppercase tracking-wider"
          >
            Ativo
          </Badge>
        ) : (
          <Badge
            variant="secondary"
            className="bg-muted/50 text-muted-foreground border-none text-[10px] px-2 py-0.5 h-5 font-bold uppercase tracking-wider"
          >
            Inativo
          </Badge>
        )}
      </div>
    </div>
  );
}

export default function PaymentMethodsPage() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] =
    useState<OrganizationPaymentMethod | null>(null);

  const [methods, setMethods] = useState<OrganizationPaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPaymentMethods();
      setMethods(data as OrganizationPaymentMethod[]);
    } catch (error) {
      console.error("Erro ao carregar pagamentos:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const handleScroll = () => setShowScrollTop(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadData]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const handleNewPaymentMethod = () => {
    setSelectedMethod(null);
    setIsModalOpen(true);
  };

  const handleEditPaymentMethod = (method: OrganizationPaymentMethod) => {
    setSelectedMethod(method);
    setIsModalOpen(true);
  };

  return (
    <>
      <AdminHeader title="Meios de Pagamento" />

      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full pb-24 md:pb-6 relative animate-in fade-in duration-700 min-h-[calc(100vh-100px)]">
        {/* CABEÇALHO PREMIUM GLASSMORPHISM */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-background/50 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-border/40 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 -mt-8 -ml-8 w-40 h-40 bg-primary/10 blur-3xl rounded-full -z-10 pointer-events-none" />

          <div className="flex flex-col gap-1.5 relative z-10">
            <h1 className="text-3xl font-black tracking-tight bg-linear-to-br from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary hidden sm:flex">
                <Landmark size="sm" />
              </div>
              Meios de Pagamento
            </h1>
            <p className="text-muted-foreground text-sm font-medium mt-1 sm:ml-12">
              Configure as formas de pagamento que o seu negócio aceita e suas
              respectivas taxas.
            </p>
          </div>

          <Button
            className="h-12 px-6 rounded-2xl font-black shadow-[0_8px_25px_rgb(var(--primary)/0.3)] hover:shadow-[0_10px_30px_rgb(var(--primary)/0.4)] active:scale-95 transition-all relative z-10 w-full sm:w-auto"
            onClick={handleNewPaymentMethod}
          >
            <PlusCircle size="sm" className="mr-2" />
            Adicionar Pagamento
          </Button>
        </div>

        {/* LISTAGEM PRINCIPAL */}
        <Card className="relative overflow-hidden rounded-4xl border-border/40 shadow-sm bg-background/50 backdrop-blur-md">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -z-10 pointer-events-none" />
          <CardHeader className="px-6 pt-6 pb-4 border-b border-border/30 relative z-10">
            <CardTitle className="flex items-center gap-3 text-xl font-black text-foreground">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <Slider size="sm" />
              </div>
              Configurações Atuais
            </CardTitle>
            <CardDescription className="font-medium text-xs uppercase tracking-widest text-muted-foreground ml-12">
              Clique num item para editar suas taxas e prazos.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-2 sm:p-4 relative z-10">
            <div className="flex flex-col">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 border-b border-border/30"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Skeleton className="h-12 w-12 rounded-2xl bg-muted/50" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32 bg-muted/50" />
                        <Skeleton className="h-3 w-24 bg-muted/50" />
                      </div>
                    </div>
                    <div className="space-y-2 flex flex-col items-end">
                      <Skeleton className="h-5 w-20 bg-muted/50" />
                      <Skeleton className="h-4 w-12 bg-muted/50" />
                    </div>
                  </div>
                ))
              ) : methods.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-muted/10 rounded-2xl border border-dashed border-border/60 mx-2 mt-2">
                  <div className="p-4 bg-muted/30 rounded-full mb-4">
                    <Landmark className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                    Nenhum meio de pagamento configurado.
                  </p>
                </div>
              ) : (
                methods.map((method) => (
                  <PaymentMethodListItem
                    key={method.id}
                    method={method}
                    onClick={() => handleEditPaymentMethod(method)}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-20 right-4 md:bottom-8 md:right-8 h-14 w-14 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_30px_rgb(var(--primary)/0.4)] hover:bg-primary/90 transition-all duration-300 z-50",
          showScrollTop
            ? "translate-y-0 opacity-100 hover:scale-105"
            : "translate-y-16 opacity-0 pointer-events-none",
        )}
        aria-label="Voltar ao topo"
      >
        <ChevronUp size="base" removePadding />
      </button>

      {/* O Modal (payment-method-modal.tsx) será renderizado aqui. O design interno dele deve herdar a base que já arrumamos nos outros modais */}
      {isModalOpen && (
        <PaymentMethodModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            loadData();
          }}
          method={selectedMethod}
        />
      )}
    </>
  );
}

// app/admin/finance/payment-methods/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminHeader } from "@/components/admin-header";
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
import { PaymentMethodModal } from "@/components/finance/payment-method-modal";
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
      className="flex items-center justify-between py-3 md:py-4 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors px-2 -mx-2 rounded-lg group cursor-pointer"
    >
      <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 pr-4">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold shadow-sm border transition-transform group-hover:scale-105",
            method.isActive
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-muted text-muted-foreground border-border",
          )}
        >
          {getIcon()}
        </div>

        <div className="flex flex-col min-w-0">
          <span
            className={cn(
              "text-sm font-semibold leading-tight mb-1 truncate group-hover:underline transition-colors",
              method.isActive
                ? "text-foreground group-hover:text-primary"
                : "text-muted-foreground",
            )}
          >
            {method.name}
          </span>
          <span className="text-xs text-muted-foreground leading-none flex items-center gap-1.5 truncate">
            {method.daysToReceive === 0
              ? "Recebimento na hora"
              : `Recebimento em ${method.daysToReceive} dia(s)`}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span
          className={cn(
            "text-sm font-bold",
            method.isActive ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {getTaxString()}
        </span>
        {method.isActive ? (
          <Badge
            variant="secondary"
            className="bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-none text-[10px] px-1.5 py-0 h-4"
          >
            Ativo
          </Badge>
        ) : (
          <Badge
            variant="secondary"
            className="bg-muted text-muted-foreground border-none text-[10px] px-1.5 py-0 h-4"
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

      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 md:pb-6 relative animate-in fade-in duration-500 min-h-[calc(100vh-100px)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Meios de Pagamento
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Configure as formas de pagamento que o seu negócio aceita.
            </p>
          </div>

          <Button
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground justify-center mt-2 sm:mt-0"
            onClick={handleNewPaymentMethod}
          >
            <PlusCircle size="sm" className="mr-2" />
            Adicionar Pagamento
          </Button>
        </div>

        <Card className="border-0 shadow-none bg-transparent md:border md:shadow-sm md:bg-card mt-2 md:mt-0">
          <CardHeader className="px-0 pt-0 md:pt-6 md:px-6">
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Slider size="sm" className="text-primary" />
              Configurações Atuais
            </CardTitle>
            <CardDescription>
              Clique num item para editar taxas e prazos.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-0 pb-0 md:pb-6 md:px-6">
            <div className="flex flex-col">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-4 border-b border-border/50"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <div className="space-y-2 flex flex-col items-end">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-3 w-10" />
                    </div>
                  </div>
                ))
              ) : methods.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/30 rounded-lg border border-dashed border-border">
                  <Landmark size="lg" className="text-muted-foreground/40" />
                  <p className="mt-4 text-sm font-medium text-muted-foreground">
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
          "fixed bottom-20 right-4 md:bottom-8 md:right-8 h-14 w-14 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-300 z-50",
          showScrollTop
            ? "translate-y-0 opacity-100 hover:scale-110"
            : "translate-y-16 opacity-0 pointer-events-none",
        )}
        aria-label="Voltar ao topo"
      >
        <ChevronUp size="base" removePadding />
      </button>

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

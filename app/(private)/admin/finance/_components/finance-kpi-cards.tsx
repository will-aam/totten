// app/(private)/admin/finance/_components/finance-kpi-cards.tsx
"use client";

import useSWR from "swr";
import { getFinanceDashboardData } from "@/app/actions/finance-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpCircle, Clock, ArrowDownCircle, Wallet } from "@boxicons/react";
import type { BoxIconProps } from "@boxicons/react";
import { cn } from "@/lib/utils";

import { useFinanceVisibility } from "./finance-visibility-context";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function FinanceKpiCard({
  title,
  value,
  description,
  icon: Icon,
  className,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ForwardRefExoticComponent<
    BoxIconProps & React.RefAttributes<SVGSVGElement>
  >;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border border-border/50 shadow-md bg-card flex flex-col justify-between min-w-[85vw] md:min-w-0 snap-center shrink-0 rounded-2xl dark:border-white/10 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] transition-all",
        className,
      )}
    >
      <Icon
        aria-hidden="true"
        pack="filled"
        width={70}
        height={70}
        rotate={-10}
        className="pointer-events-none absolute -right-1 top-1/2 -translate-y-1/2 text-foreground/10"
      />
      <Icon
        aria-hidden="true"
        pack="filled"
        width={34}
        height={34}
        rotate={20}
        className="pointer-events-none absolute right-9 -bottom-3 text-foreground/10"
      />

      <CardHeader className="relative z-10 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-3xl font-bold text-foreground tracking-tight truncate">
          {value}
        </div>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

export function FinanceKpiCards() {
  const { hideValues } = useFinanceVisibility();
  const { data: res, isLoading } = useSWR(
    "finance-dashboard-action-data",
    async () => {
      return await getFinanceDashboardData();
    },
    { revalidateOnFocus: true, dedupingInterval: 10000 },
  );

  if (isLoading) {
    return (
      <div className="flex overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scroll-smooth md:grid md:grid-cols-4 md:overflow-visible md:pb-0 md:px-0 md:mx-0 gap-4 [&::-webkit-scrollbar]:hidden">
        <Skeleton className="h-32 min-w-[85vw] md:min-w-0 snap-center rounded-2xl shrink-0" />
        <Skeleton className="h-32 min-w-[85vw] md:min-w-0 snap-center rounded-2xl shrink-0" />
        <Skeleton className="h-32 min-w-[85vw] md:min-w-0 snap-center rounded-2xl shrink-0" />
        <Skeleton className="h-32 min-w-[85vw] md:min-w-0 snap-center rounded-2xl shrink-0" />
      </div>
    );
  }

  const summary = res?.summary || {
    receivedMonth: 0,
    pendingMonth: 0,
    expensesMonth: 0,
    balanceMonth: 0,
  };

  const formatVal = (num: number) =>
    hideValues ? "••••••" : currencyFormatter.format(num);

  return (
    <div className="flex overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scroll-smooth md:grid md:grid-cols-4 md:overflow-visible md:pb-0 md:px-0 md:mx-0 gap-4 [&::-webkit-scrollbar]:hidden">
      <FinanceKpiCard
        title="Recebido no Mês"
        value={formatVal(summary.receivedMonth)}
        description="Valores liquidados"
        icon={ArrowUpCircle}
      />
      <FinanceKpiCard
        title="Pendente no Mês"
        value={formatVal(summary.pendingMonth)}
        description="Aguardando pagamento"
        icon={Clock}
      />
      <FinanceKpiCard
        title="Despesas do Mês"
        value={formatVal(summary.expensesMonth)}
        description="Custos e saídas"
        icon={ArrowDownCircle}
      />
      <FinanceKpiCard
        title="Saldo do Mês"
        value={formatVal(summary.balanceMonth)}
        description="Resultado líquido"
        icon={Wallet}
      />
    </div>
  );
}

// components/finance/finance-summary-cards.tsx
import { FinanceSummary } from "@/types/finance";
import { ArrowDownCircle, ArrowUpCircle, Clock, Wallet } from "@boxicons/react";

interface FinanceSummaryCardsProps {
  data: FinanceSummary;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function FinanceSummaryCards({ data }: FinanceSummaryCardsProps) {
  const cardClasses =
    "min-w-[85vw] md:min-w-0 snap-center shrink-0 flex flex-col justify-between bg-card border border-border/50 rounded-2xl p-6 hover:border-primary/30 transition-colors";

  return (
    <div className="flex overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scroll-smooth md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible md:pb-0 md:px-0 md:mx-0 gap-4 [&::-webkit-scrollbar]:hidden">
      {/* Card: Total Recebido */}
      <div className={cardClasses}>
        <div className="flex flex-row items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Recebido no Mês
          </h3>
          <ArrowUpCircle size="md" className="text-emerald-500" />
        </div>
        <div className="mt-5 flex flex-col gap-0.5">
          <div className="text-2xl font-black text-foreground tracking-tighter truncate">
            {currencyFormatter.format(data.receivedMonth)}
          </div>
          <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-tight">
            Valores liquidados
          </p>
        </div>
      </div>

      {/* Card: Total Pendente */}
      <div className={cardClasses}>
        <div className="flex flex-row items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Pendente no Mês
          </h3>
          <Clock size="md" className="text-amber-500" />
        </div>
        <div className="mt-5 flex flex-col gap-0.5">
          <div className="text-2xl font-black text-foreground tracking-tighter truncate">
            {currencyFormatter.format(data.pendingMonth)}
          </div>
          <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-tight">
            Aguardando pagamento
          </p>
        </div>
      </div>

      {/* Card: Despesas */}
      <div className={cardClasses}>
        <div className="flex flex-row items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Despesas do Mês
          </h3>
          <ArrowDownCircle size="md" className="text-rose-500" />
        </div>
        <div className="mt-5 flex flex-col gap-0.5">
          <div className="text-2xl font-black text-foreground tracking-tighter truncate">
            {currencyFormatter.format(data.expensesMonth)}
          </div>
          <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-tight">
            Custos e saídas
          </p>
        </div>
      </div>

      {/* Card: Saldo */}
      <div className={cardClasses}>
        <div className="flex flex-row items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Saldo do Mês
          </h3>
          <Wallet size="md" className="text-blue-500" />
        </div>
        <div className="mt-5 flex flex-col gap-0.5">
          <div className="text-2xl font-black text-foreground tracking-tighter truncate">
            {currencyFormatter.format(data.balanceMonth)}
          </div>
          <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-tight">
            Resultado líquido
          </p>
        </div>
      </div>
    </div>
  );
}

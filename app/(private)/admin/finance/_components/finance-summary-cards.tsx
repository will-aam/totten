// app/(private)/admin/finance/_components/finance-summary-cards.tsx
import { FinanceSummary } from "@/types/finance";
import { ArrowDownCircle, ArrowUpCircle, Clock, Wallet } from "@boxicons/react";
import { cn } from "@/lib/utils";

interface FinanceSummaryCardsProps {
  data: FinanceSummary;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function FinanceSummaryCards({ data }: FinanceSummaryCardsProps) {
  // Base do card com Glassmorphism, bordas sutis e preparo para o Hover (group)
  const baseCardClasses =
    "relative overflow-hidden min-w-[85vw] md:min-w-0 snap-center shrink-0 flex flex-col justify-between border border-border/50 bg-background/50 backdrop-blur-sm rounded-3xl p-6 hover:shadow-xl transition-all duration-300 group";

  return (
    <div className="flex overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scroll-smooth md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible md:pb-0 md:px-0 md:mx-0 gap-5 [&::-webkit-scrollbar]:hidden">
      {/* Card: Total Recebido */}
      <div className={cn(baseCardClasses, "hover:border-emerald-500/30")}>
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-500/10 blur-3xl rounded-full group-hover:bg-emerald-500/20 transition-all duration-500" />
        <div className="flex flex-row items-center justify-between relative z-10">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Recebido no Mês
          </h3>
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
            <ArrowUpCircle size="md" />
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-1 relative z-10">
          <div className="text-3xl font-black text-foreground tracking-tighter truncate">
            {currencyFormatter.format(data.receivedMonth)}
          </div>
          <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-tight">
            Valores liquidados
          </p>
        </div>
      </div>

      {/* Card: Total Pendente */}
      <div className={cn(baseCardClasses, "hover:border-amber-500/30")}>
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-amber-500/10 blur-3xl rounded-full group-hover:bg-amber-500/20 transition-all duration-500" />
        <div className="flex flex-row items-center justify-between relative z-10">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Pendente no Mês
          </h3>
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
            <Clock size="md" />
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-1 relative z-10">
          <div className="text-3xl font-black text-foreground tracking-tighter truncate">
            {currencyFormatter.format(data.pendingMonth)}
          </div>
          <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-tight">
            Aguardando pagamento
          </p>
        </div>
      </div>

      {/* Card: Despesas */}
      <div className={cn(baseCardClasses, "hover:border-rose-500/30")}>
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-rose-500/10 blur-3xl rounded-full group-hover:bg-rose-500/20 transition-all duration-500" />
        <div className="flex flex-row items-center justify-between relative z-10">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Despesas do Mês
          </h3>
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 group-hover:scale-110 group-hover:bg-rose-500 group-hover:text-white transition-all duration-300">
            <ArrowDownCircle size="md" />
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-1 relative z-10">
          <div className="text-3xl font-black text-foreground tracking-tighter truncate">
            {currencyFormatter.format(data.expensesMonth)}
          </div>
          <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-tight">
            Custos e saídas
          </p>
        </div>
      </div>

      {/* Card: Saldo */}
      <div className={cn(baseCardClasses, "hover:border-blue-500/30")}>
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500/10 blur-3xl rounded-full group-hover:bg-blue-500/20 transition-all duration-500" />
        <div className="flex flex-row items-center justify-between relative z-10">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Saldo do Mês
          </h3>
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
            <Wallet size="md" />
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-1 relative z-10">
          <div className="text-3xl font-black text-foreground tracking-tighter truncate">
            {currencyFormatter.format(data.balanceMonth)}
          </div>
          <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-tight">
            Resultado líquido
          </p>
        </div>
      </div>
    </div>
  );
}

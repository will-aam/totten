// app/(private)/admin/finance/_components/finance-secondary-indicators.tsx
import { SecondaryIndicators } from "@/types/finance";
import {
  AlertCircle,
  Calendar,
  CalendarDetail,
  CreditCard,
} from "@boxicons/react";

interface FinanceSecondaryIndicatorsProps {
  data: SecondaryIndicators;
}

// OTIMIZAÇÃO: Formatador criado apenas uma vez
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// Função auxiliar para traduzir o PaymentMethod de forma segura
function translatePaymentMethod(method: string | null): string {
  if (!method) return "-";

  const formatted = method.toUpperCase();
  if (formatted.includes("CREDIT")) return "Cartão de Crédito";
  if (formatted.includes("DEBIT")) return "Cartão de Débito";
  if (formatted.includes("PIX")) return "Pix";
  if (formatted.includes("CASH") || formatted.includes("DINHEIRO"))
    return "Dinheiro";

  return "Outros";
}

export function FinanceSecondaryIndicators({
  data,
}: FinanceSecondaryIndicatorsProps) {
  // Design Premium: Glassmorphism suave, bordas translúcidas e hover states polidos
  const cardClasses =
    "relative overflow-hidden min-w-[85vw] md:min-w-0 snap-center shrink-0 border border-border/50 bg-background/50 backdrop-blur-sm rounded-2xl p-5 flex flex-row items-center gap-4 hover:border-primary/30 hover:shadow-md transition-all duration-300 group";

  return (
    <div className="flex overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scroll-smooth md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible md:pb-0 md:px-0 md:mx-0 gap-4 [&::-webkit-scrollbar]:hidden">
      {/* Recebido Hoje */}
      <div className={cardClasses}>
        <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-emerald-500/10 blur-2xl rounded-full group-hover:bg-emerald-500/20 transition-all duration-500" />
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0 group-hover:scale-110 transition-transform duration-300">
          <Calendar className="h-6 w-6 stroke-[1.5]" />
        </div>
        <div className="min-w-0 flex-1 flex flex-col gap-0.5 relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">
            Recebido Hoje
          </p>
          <p className="text-xl font-black text-foreground truncate">
            {currencyFormatter.format(data.receivedToday)}
          </p>
        </div>
      </div>

      {/* Recebido na Semana */}
      <div className={cardClasses}>
        <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-blue-500/10 blur-2xl rounded-full group-hover:bg-blue-500/20 transition-all duration-500" />
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 shrink-0 group-hover:scale-110 transition-transform duration-300">
          <CalendarDetail className="h-6 w-6 stroke-[1.5]" />
        </div>
        <div className="min-w-0 flex-1 flex flex-col gap-0.5 relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">
            Recebido Semana
          </p>
          <p className="text-xl font-black text-foreground truncate">
            {currencyFormatter.format(data.receivedWeek)}
          </p>
        </div>
      </div>

      {/* Quantidade de Pendentes */}
      <div className={cardClasses}>
        <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-amber-500/10 blur-2xl rounded-full group-hover:bg-amber-500/20 transition-all duration-500" />
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 shrink-0 group-hover:scale-110 transition-transform duration-300">
          <AlertCircle className="h-6 w-6 stroke-[1.5]" />
        </div>
        <div className="min-w-0 flex-1 flex flex-col gap-0.5 relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">
            Pendentes Hoje
          </p>
          <p className="text-xl font-black text-foreground truncate flex items-baseline gap-1">
            {data.pendingCount}
            <span className="text-xs font-bold text-muted-foreground mb-0.5">
              {data.pendingCount === 1 ? "agendamento" : "agendamentos"}
            </span>
          </p>
        </div>
      </div>

      {/* Meio mais usado */}
      <div className={cardClasses}>
        <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-purple-500/10 blur-2xl rounded-full group-hover:bg-purple-500/20 transition-all duration-500" />
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 shrink-0 group-hover:scale-110 transition-transform duration-300">
          <CreditCard className="h-6 w-6 stroke-[1.5]" />
        </div>
        <div className="min-w-0 flex-1 flex flex-col gap-0.5 relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">
            Meio Favorito
          </p>
          <p className="text-base font-black text-foreground truncate leading-tight mt-1">
            {translatePaymentMethod(data.topPaymentMethod as string | null)}
          </p>
        </div>
      </div>
    </div>
  );
}

// components/finance/finance-secondary-indicators.tsx
import { SecondaryIndicators } from "@/types/finance";
import {
  AlertCircle,
  CalendarDays,
  CalendarRange,
  CreditCard,
} from "lucide-react";

interface FinanceSecondaryIndicatorsProps {
  data: SecondaryIndicators;
}

// 🔥 OTIMIZAÇÃO: Formatador criado apenas uma vez
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
  // 🔥 Classes 100% Flat, sem fundos coloridos, sem sombras extravagantes
  const cardClasses =
    "min-w-[85vw] md:min-w-0 snap-center shrink-0 border border-dashed bg-card rounded-2xl p-5 flex flex-row items-center gap-4 hover:border-primary/30 transition-colors";

  return (
    <div className="flex overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scroll-smooth md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible md:pb-0 md:px-0 md:mx-0 gap-3 [&::-webkit-scrollbar]:hidden">
      {/* Recebido Hoje */}
      <div className={cardClasses}>
        {/* Ícone limpo, sem fundo */}
        <CalendarDays className="h-7 w-7 text-emerald-500 shrink-0 stroke-[1.5]" />
        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate">
            Recebido Hoje
          </p>
          <p className="text-xl font-black text-foreground truncate">
            {currencyFormatter.format(data.receivedToday)}
          </p>
        </div>
      </div>

      {/* Recebido na Semana */}
      <div className={cardClasses}>
        <CalendarRange className="h-7 w-7 text-blue-500 shrink-0 stroke-[1.5]" />
        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate">
            Recebido Semana
          </p>
          <p className="text-xl font-black text-foreground truncate">
            {currencyFormatter.format(data.receivedWeek)}
          </p>
        </div>
      </div>

      {/* Quantidade de Pendentes */}
      <div className={cardClasses}>
        <AlertCircle className="h-7 w-7 text-amber-500 shrink-0 stroke-[1.5]" />
        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate">
            Pendentes Hoje
          </p>
          <p className="text-xl font-black text-foreground truncate flex items-baseline gap-1">
            {data.pendingCount}
            <span className="text-xs font-bold text-muted-foreground mb-0.5">
              agendamentos
            </span>
          </p>
        </div>
      </div>

      {/* Meio mais usado */}
      <div className={cardClasses}>
        <CreditCard className="h-7 w-7 text-purple-500 shrink-0 stroke-[1.5]" />
        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate">
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

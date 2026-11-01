"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PlanPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const plans = [
    {
      id: "basic",
      name: "Plano Básico",
      priceMonthly: "29,90",
      priceYearly: "299,00",
      tagline: "Para começar com organização",
      description: "A estrutura essencial para uma profissional conduzir a própria rotina.",
      gradient: "linear-gradient(180deg, #eaddff 0%, #d8b4fe 40%, rgba(255,255,255,0) 100%)",
      buttonStyle: "bg-white text-gray-900 shadow-[0_4px_14px_0_rgba(0,0,0,0.05)]",
      popular: false,
      features: [
        "Dashboard, Agenda, confirmações manuais e check-in",
        "Clientes, fichas, serviços, pacotes e estoque sem limite de itens",
        "Aniversariantes, notas, gestão de pacotes e todos os Registros",
        "1 profissional",
        "Até 1 pacote ativo por cliente",
      ],
    },
    {
      id: "pro",
      name: "Plano Médio",
      priceMonthly: "49,90",
      priceYearly: "499,00",
      tagline: "Mais controle e recorrência",
      description: "Para quem quer acompanhar as finanças, incentivar retornos e crescer com uma equipe pequena.",
      gradient: "linear-gradient(180deg, #c4b5fd 0%, #fed7aa 70%, rgba(255,255,255,0) 100%)",
      buttonStyle: "bg-[#27272a] text-white shadow-[0_8px_20px_-6px_rgba(0,0,0,0.4)]",
      popular: true,
      features: [
        "Tudo do Plano Básico",
        "Até 2 profissionais",
        "Até 3 pacotes ativos por cliente",
        "Módulo Financeiro",
        "Programa de Fidelidade",
      ],
    },
    {
      id: "advanced",
      name: "Plano Avançado",
      priceMonthly: "89,90",
      priceYearly: "899,00",
      tagline: "Operação completa",
      description: "Autoatendimento e capacidade ampliada para operações com mais profissionais.",
      gradient: "linear-gradient(180deg, #a7f3d0 0%, #34d399 40%, rgba(255,255,255,0) 100%)",
      buttonStyle: "bg-white text-gray-900 border border-gray-200 shadow-[0_4px_14px_0_rgba(0,0,0,0.05)] hover:bg-gray-50",
      popular: false,
      features: [
        "Tudo do Plano Médio",
        "Autoatendimento completo",
        "De 3 até 30 profissionais",
        "Pacotes ativos sem limite por cliente",
        "Suporte humano prioritário",
      ],
    },
  ];

  return (
    <div className="w-full min-h-full p-4 md:p-10 flex flex-col items-center">
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-3 mb-10 mt-4 max-w-2xl">

        <div className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
          Estrutura de planos em teste
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">
          Conheça os planos{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-500">
            ideais para você
          </span>
        </h1>
        <p className="text-muted-foreground text-sm font-medium">
          Esta estrutura está em avaliação. No teste gratuito de 14 dias, você pode experimentar todos os recursos.
        </p>

        <div className="flex items-center gap-1 mt-4 bg-muted/40 p-1.5 rounded-full border border-border/50">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-bold transition-all duration-300",
              billingCycle === "monthly"
                ? "bg-background shadow-md text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2",
              billingCycle === "yearly"
                ? "bg-background shadow-md text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Anual
            <span className="bg-emerald-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
              1 mês grátis
            </span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl pb-20 px-2 md:px-8">
        {plans.map((plan) => {
          const price = billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly;

          return (
            <div
              key={plan.id}
              className="relative rounded-[2.5rem] bg-white p-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col"
            >
              {/* Inner Gradient Block */}
              <div
                className="relative rounded-[2rem] p-6 pb-10 flex flex-col"
                style={{ background: plan.gradient }}
              >
                {plan.popular && (
                  <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                    Recomendado
                  </div>
                )}

                <p className="text-[17px] font-semibold text-gray-900 mb-6">
                  {plan.name}
                </p>

                <p className="text-[13px] font-medium text-gray-600 mb-1">
                  {plan.tagline}
                </p>

                <div className="flex items-baseline gap-1.5 mb-6">
                  <span className="text-[32px] md:text-[40px] font-medium tracking-tight text-gray-900">
                    R${price}
                  </span>
                  <span className="text-[13px] font-medium text-gray-600">
                    / {billingCycle === "monthly" ? "mês" : "ano"}
                  </span>
                </div>

                <p className="text-[14px] text-gray-700 font-medium leading-relaxed mb-8 max-w-[280px] min-h-[60px]">
                  {plan.description}
                </p>

                <div
                  className={cn(
                    "w-full py-4 rounded-[1.25rem] text-center font-semibold text-[15px]",
                    plan.buttonStyle,
                    "opacity-75",
                  )}
                >
                  Plano em avaliação
                </div>
              </div>

              {/* Features Section */}
              <div className="px-6 py-6 mt-2 flex flex-col flex-grow bg-white rounded-b-[2rem]">
                <p className="text-[14px] font-bold text-gray-900 mb-6">
                  O que está incluído:
                </p>
                <ul className="space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check
                        className="w-[18px] h-[18px] text-gray-800 flex-shrink-0 mt-0.5"
                        strokeWidth={2}
                      />
                      <span className="text-[14px] font-medium text-gray-600 leading-tight">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

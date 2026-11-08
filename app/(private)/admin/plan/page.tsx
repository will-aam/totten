"use client";

import { useRef, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { Check, Minus } from "@boxicons/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { createSubscriptionCheckoutAction } from "./actions";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";

type PlanId = "basic" | "medium" | "advanced";
type ComparisonValue = string | boolean;

const plans: {
  id: PlanId;
  name: string;
  priceMonthly: string;
  priceYearly: string;
  description: string;
  featured?: boolean;
  cornerLabel: string;
  highlights: string[];
}[] = [
    {
      id: "basic",
      name: "Plano Básico",
      priceMonthly: "29,90",
      priceYearly: "299,00",
      description: "A estrutura essencial para organizar sua rotina e atender seus clientes.",
      cornerLabel: "Essencial",
      highlights: ["1 profissional", "Até 1 pacote ativo por cliente"],
    },
    {
      id: "medium",
      name: "Plano Padrão",
      priceMonthly: "49,90",
      priceYearly: "499,00",
      description: "Mais controle financeiro e recursos para incentivar a recorrência.",
      featured: true,
      cornerLabel: "Destaque",
      highlights: ["Até 2 profissionais", "Financeiro e Fidelidade"],
    },
    {
      id: "advanced",
      name: "Plano Avançado",
      priceMonthly: "89,90",
      priceYearly: "899,00",
      description: "Autoatendimento completo e capacidade para uma operação maior.",
      cornerLabel: "Completo",
      highlights: ["Até 30 profissionais", "Autoatendimento completo"],
    },
  ];

const comparisonSections: {
  title: string;
  rows: { label: string; values: Record<PlanId, ComparisonValue> }[];
}[] = [
    {
      title: "Agenda e atendimento",
      rows: [
        { label: "Dashboard e Agenda", values: { basic: true, medium: true, advanced: true } },
        { label: "Confirmações manuais e check-in", values: { basic: true, medium: true, advanced: true } },
        { label: "Aniversariantes e notas", values: { basic: true, medium: true, advanced: true } },
        { label: "Gestão de pacotes e Registros", values: { basic: true, medium: true, advanced: true } },
      ],
    },
    {
      title: "Cadastros e limites",
      rows: [
        {
          label: "Clientes, anamnese, serviços, pacotes e estoque",
          values: { basic: "Sem limite de itens", medium: "Sem limite de itens", advanced: "Sem limite de itens" },
        },
        { label: "Profissionais cadastrados", values: { basic: "1", medium: "Até 2", advanced: "Até 30" } },
        { label: "Pacotes ativos por cliente", values: { basic: "Até 1", medium: "Até 3", advanced: "Sem limite" } },
      ],
    },
    {
      title: "Módulos",
      rows: [
        { label: "Financeiro", values: { basic: false, medium: true, advanced: true } },
        { label: "Programa de Fidelidade", values: { basic: false, medium: true, advanced: true } },
        { label: "Autoatendimento completo", values: { basic: false, medium: false, advanced: true } },
      ],
    },
  ];

function ComparisonCell({ value }: { value: ComparisonValue }) {
  if (typeof value === "string") {
    return <span className="text-sm text-zinc-600 dark:text-zinc-300">{value}</span>;
  }

  return value ? (
    <span className="inline-flex size-6 items-center justify-center rounded-full bg-lime-200 text-zinc-950" aria-label="Incluído">
      <Check className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
    </span>
  ) : (
    <span className="inline-flex size-6 items-center justify-center text-zinc-300 dark:text-zinc-600" aria-label="Não incluído">
      <Minus className="size-4" aria-hidden="true" />
    </span>
  );
}

function MobilePlanCarousel({
  billingCycle,
  onSubscribe,
  loadingPlanId,
}: {
  billingCycle: "monthly" | "yearly";
  onSubscribe: (planId: PlanId) => void;
  loadingPlanId: string | null;
}) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateActiveCard = () => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const center = carousel.getBoundingClientRect().left + carousel.clientWidth / 2;
    const cards = Array.from(carousel.children) as HTMLElement[];
    const nextIndex = cards.reduce(
      (closestIndex, card, index) => {
        const cardCenter = card.getBoundingClientRect().left + card.clientWidth / 2;
        const closestCard = cards[closestIndex];
        const closestCenter = closestCard.getBoundingClientRect().left + closestCard.clientWidth / 2;
        return Math.abs(cardCenter - center) < Math.abs(closestCenter - center)
          ? index
          : closestIndex;
      },
      0,
    );

    setActiveIndex(nextIndex);
  };

  const goToCard = (index: number) => {
    const card = carouselRef.current?.children[index] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  return (
    <section className="md:hidden" aria-label="Planos em cartões deslizáveis">
      <div
        ref={carouselRef}
        onScroll={updateActiveCard}
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Deslize para comparar os planos"
      >
        {plans.map((plan) => {
          const isFeatured = plan.featured;
          const price = billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly;

          return (
            <article
              key={plan.id}
              className={cn(
                "relative flex min-h-[590px] w-[calc(100vw-3.5rem)] max-w-[390px] shrink-0 snap-center flex-col overflow-hidden rounded-[28px] border px-5 pb-5 pt-12",
                isFeatured
                  ? "border-lime-300 bg-zinc-950 text-white shadow-[0_16px_42px_rgba(0,0,0,0.16)] dark:border-lime-300 dark:bg-zinc-800 dark:ring-1 dark:ring-lime-300/30"
                  : "border-zinc-200 bg-white text-zinc-950 dark:border-border dark:bg-card dark:text-foreground",
              )}
            >
              <div className="absolute right-0 top-0 rounded-bl-2xl border-b border-l border-lime-300/60 bg-lime-200 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-950">
                {plan.cornerLabel}
              </div>

              <div className="mt-1">
                <h3 className="text-xl font-semibold tracking-tight">{plan.name}</h3>
                <p className={cn("mt-1.5 max-w-[270px] text-xs leading-5", isFeatured ? "text-zinc-400" : "text-zinc-500 dark:text-muted-foreground")}>
                  {plan.description}
                </p>
              </div>

              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="text-4xl font-semibold tracking-[-0.05em]">R$ {price}</span>
                <span className={cn("text-xs", isFeatured ? "text-zinc-400" : "text-zinc-500 dark:text-muted-foreground")}>
                  / {billingCycle === "monthly" ? "mês" : "ano"}
                </span>
              </div>
              <p className={cn("mt-1 text-[11px]", isFeatured ? "text-zinc-400" : "text-zinc-500 dark:text-muted-foreground")}>
                {billingCycle === "monthly" ? "Cobrança mensal" : "Valor total da cobrança anual"}
              </p>

              <div className="mt-5 flex-1 border-t border-current/10 pt-4">
                {comparisonSections.map((section) => (
                  <div key={section.title} className="mb-4 last:mb-0">
                    <h4 className={cn("mb-2 text-[9px] font-semibold uppercase tracking-[0.14em]", isFeatured ? "text-zinc-400" : "text-zinc-500 dark:text-muted-foreground")}>
                      {section.title}
                    </h4>
                    <ul className="space-y-2.5">
                      {section.rows.map((row) => {
                        const value = row.values[plan.id];
                        const isInEvaluation = value === "Em avaliação";
                        const included = value !== false && !isInEvaluation;

                        return (
                          <li key={row.label} className="flex items-start gap-2 text-xs leading-4">
                            {isInEvaluation ? (
                              <span className="mt-0.5 size-3.5 shrink-0 rounded-full border border-amber-500/50 bg-amber-100" aria-hidden="true" />
                            ) : included ? (
                              <Check className={cn("mt-0.5 size-3.5 shrink-0", isFeatured ? "text-lime-300" : "text-lime-700 dark:text-lime-300")} aria-hidden="true" />
                            ) : (
                              <Minus className="mt-0.5 size-3.5 shrink-0 text-zinc-300 dark:text-zinc-600" aria-hidden="true" />
                            )}
                            <span className={cn(
                              isInEvaluation
                                ? isFeatured ? "text-amber-200" : "text-amber-700 dark:text-amber-300"
                                : included
                                  ? isFeatured ? "text-zinc-200" : "text-zinc-700 dark:text-zinc-300"
                                  : "text-zinc-400 dark:text-zinc-600",
                            )}>
                              {row.label}
                              {typeof value === "string" && (
                                <span className="ml-1 font-medium">· {value}</span>
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>

              <InteractiveHoverButton
                type="button"
                onClick={() => onSubscribe(plan.id)}
                disabled={Boolean(loadingPlanId)}
                className={cn(
                  "mt-6 min-h-12 w-full rounded-xl border px-4 py-3.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 focus-visible:ring-offset-2",
                  isFeatured
                    ? "border-zinc-800 bg-zinc-900 text-white dark:border-zinc-700 dark:bg-zinc-900"
                    : "border-zinc-300 bg-white text-zinc-900 dark:border-border dark:bg-transparent dark:text-foreground",
                  loadingPlanId === plan.id && "opacity-70 cursor-wait"
                )}
                fillClassName="bg-lime-300"
                fillTextClassName="text-zinc-950"
              >
                {loadingPlanId === plan.id ? "Conectando ao Mercado Pago..." : "Assinar plano"}
              </InteractiveHoverButton>
            </article>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-center gap-2" aria-label={`Plano ${activeIndex + 1} de ${plans.length}`}>
        {plans.map((plan, index) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => goToCard(index)}
            aria-label={`Ver ${plan.name}`}
            aria-current={activeIndex === index ? "true" : undefined}
            className={cn(
              "h-1.5 rounded-full transition-all",
              activeIndex === index ? "w-6 bg-lime-500" : "w-1.5 bg-zinc-300 dark:bg-zinc-700",
            )}
          />
        ))}
      </div>
      <p className="mt-3 text-center text-[11px] text-zinc-500 dark:text-muted-foreground">
        Deslize para o lado para ver os outros planos
      </p>
    </section>
  );
}

export default function PlanPage() {
  const { data: session } = useSession();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const isSystemOwner =
    (session?.user as any)?.isSystemOwner === true ||
    session?.user?.id === "cmw6jrhek0003cgxgoznhpzm6" ||
    session?.user?.email?.toLowerCase() === "tottenappbr@gmail.com";

  const handleSubscribe = (planId: PlanId) => {
    if (isSystemOwner) {
      toast.info("A sua conta de administrador já possui acesso completo à plataforma.");
      return;
    }

    setLoadingPlanId(planId);
    toast.loading("Iniciando assinatura segura...", { id: "sub-loading" });

    startTransition(async () => {
      try {
        const res = await createSubscriptionCheckoutAction(planId, billingCycle);
        if (res.success && res.initPoint) {
          toast.success("Redirecionando para o Mercado Pago...", { id: "sub-loading" });
          window.location.href = res.initPoint;
        } else {
          toast.error(res.error || "Erro ao iniciar assinatura.", { id: "sub-loading" });
          setLoadingPlanId(null);
        }
      } catch (err) {
        toast.error("Ocorreu um erro inesperado ao conectar ao Mercado Pago.", { id: "sub-loading" });
        setLoadingPlanId(null);
      }
    });
  };

  return (
    <>
      <AdminHeader title="Meu Plano" />
      <div className="relative mx-auto flex min-h-[calc(100vh-100px)] w-full max-w-400 flex-col gap-6 bg-[#f7f7f5] p-4 pb-24 text-zinc-950 animate-in fade-in duration-500 md:p-6 md:pb-6 dark:bg-background dark:text-foreground">
        <header className="mb-8 pb-2 md:mb-10">
          <h1 className="max-w-2xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl lg:text-[42px]">
            Um plano para cada fase da sua operação.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-muted-foreground sm:text-base">
            Compare os recursos e escolha como quer organizar sua rotina com a Totten.
          </p>
        </header>

        <section
          aria-label="Período de teste"
          className="mb-8 flex flex-col gap-3 border-b border-zinc-200 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-border"
        >
          <div>
            <p className="text-sm font-semibold">Experimente todos os recursos da Totten</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-muted-foreground">
              Acesso completo durante o período de teste.
            </p>
          </div>
          <span className="inline-flex w-fit items-center rounded-full border border-lime-500/40 bg-lime-300 px-4 py-2 text-sm font-bold text-zinc-950 shadow-[0_4px_14px_rgba(132,204,22,0.22)]">
            14 dias grátis
          </span>
        </section>

        <div className="mb-5 hidden flex-col gap-4 sm:flex-row sm:items-end sm:justify-between md:flex">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Planos Totten</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-muted-foreground">
              Valores de referência. Os planos poderão ser assinados após a integração de pagamentos.
            </p>
          </div>

          <div
            className="inline-flex w-fit items-center gap-1 rounded-full border border-zinc-200 bg-white p-1 dark:border-border dark:bg-card"
            aria-label="Periodicidade de cobrança"
          >
            <button
              type="button"
              aria-pressed={billingCycle === "monthly"}
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                billingCycle === "monthly"
                  ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                  : "text-zinc-500 hover:text-zinc-950 dark:text-muted-foreground dark:hover:text-foreground",
              )}
            >
              Mensal
            </button>
            <button
              type="button"
              aria-pressed={billingCycle === "yearly"}
              onClick={() => setBillingCycle("yearly")}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                billingCycle === "yearly"
                  ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                  : "text-zinc-500 hover:text-zinc-950 dark:text-muted-foreground dark:hover:text-foreground",
              )}
            >
              Anual
              {billingCycle === "yearly" && (
                <span className="rounded-full bg-lime-200 px-2 py-0.5 text-[10px] font-semibold text-zinc-950">
                  2 meses grátis
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-3 md:hidden">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Planos Totten</h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-muted-foreground">Escolha a periodicidade</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="grid w-full grid-cols-2 gap-1 rounded-2xl border border-zinc-200 bg-white p-1 dark:border-border dark:bg-card" aria-label="Periodicidade de cobrança">
              <button
                type="button"
                aria-pressed={billingCycle === "monthly"}
                onClick={() => setBillingCycle("monthly")}
                className={cn("min-h-11 rounded-xl px-4 py-2 text-xs font-medium", billingCycle === "monthly" ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "text-zinc-500 dark:text-muted-foreground")}
              >
                Mensal
              </button>
              <button
                type="button"
                aria-pressed={billingCycle === "yearly"}
                onClick={() => setBillingCycle("yearly")}
                className={cn("flex min-h-11 flex-col items-center justify-center rounded-xl px-4 py-1 text-xs font-medium", billingCycle === "yearly" ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "text-zinc-500 dark:text-muted-foreground")}
              >
                Anual
                {billingCycle === "yearly" && (
                  <span className="mt-0.5 rounded-full bg-lime-200 px-2 py-0.5 text-[9px] font-semibold leading-none text-zinc-950">
                    2 meses grátis
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        <section aria-label="Opções de plano" className="hidden grid-cols-1 gap-3 md:grid md:grid-cols-3 md:gap-4">
          {plans.map((plan) => {
            const price = billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly;
            const isFeatured = plan.featured;

            return (
              <article
                key={plan.id}
                className={cn(
                  "relative flex min-h-[310px] flex-col overflow-hidden rounded-2xl border px-5 pb-5 pt-12 sm:px-6 sm:pb-6",
                  isFeatured
                    ? "border-zinc-900 bg-zinc-950 text-white dark:border-lime-300/70 dark:bg-zinc-800 dark:text-white dark:ring-1 dark:ring-lime-300/25"
                    : "border-zinc-200 bg-white text-zinc-950 dark:border-border dark:bg-card dark:text-foreground",
                )}
              >
                <span className="absolute right-0 top-0 rounded-bl-2xl border-b border-l border-lime-300/60 bg-lime-200 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-950">
                  {plan.cornerLabel}
                </span>
                <div className="pr-2">
                  <h3 className="text-base font-semibold">{plan.name}</h3>
                  <p className={cn("mt-1 text-xs", isFeatured ? "text-zinc-400" : "text-zinc-500 dark:text-muted-foreground")}>
                    {plan.description}
                  </p>
                </div>

                <div className="mt-7 flex items-baseline gap-1.5">
                  <span className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">R$ {price}</span>
                  <span className={cn("text-xs", isFeatured ? "text-zinc-400" : "text-zinc-500 dark:text-muted-foreground")}>
                    / {billingCycle === "monthly" ? "mês" : "ano"}
                  </span>
                </div>
                <p className={cn("mt-1 text-xs", isFeatured ? "text-zinc-400" : "text-zinc-500 dark:text-muted-foreground")}>
                  {billingCycle === "monthly" ? "Cobrança mensal" : "Valor total da cobrança anual"}
                </p>

                <ul className="mt-6 space-y-3 border-t border-current/10 pt-5">
                  {plan.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-2.5 text-sm">
                      <Check className={cn("mt-0.5 size-4 shrink-0", isFeatured ? "text-lime-300" : "text-zinc-800 dark:text-foreground")} aria-hidden="true" />
                      <span className={isFeatured ? "text-zinc-200" : "text-zinc-600 dark:text-muted-foreground"}>{highlight}</span>
                    </li>
                  ))}
                </ul>

                <InteractiveHoverButton
                  type="button"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={Boolean(loadingPlanId)}
                  className={cn(
                    "mt-8 min-h-12 w-full rounded-xl border px-4 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 focus-visible:ring-offset-2",
                    isFeatured
                      ? "border-zinc-800 bg-zinc-900 text-white dark:border-zinc-700 dark:bg-zinc-900"
                      : "border-zinc-300 bg-white text-zinc-900 dark:border-border dark:bg-transparent dark:text-foreground",
                    loadingPlanId === plan.id && "opacity-70 cursor-wait"
                  )}
                  fillClassName="bg-lime-300"
                  fillTextClassName="text-zinc-950"
                >
                  {loadingPlanId === plan.id ? "Conectando ao Mercado Pago..." : "Assinar plano"}
                </InteractiveHoverButton>
              </article>
            );
          })}
        </section>

        <MobilePlanCarousel
          billingCycle={billingCycle}
          onSubscribe={handleSubscribe}
          loadingPlanId={loadingPlanId}
        />

        <section className="mt-12 hidden pb-12 md:block" aria-labelledby="comparison-heading">
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-muted-foreground">
              Comparativo
            </p>
            <h2 id="comparison-heading" className="mt-1 text-xl font-semibold tracking-tight">
              Veja o que está incluído
            </h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-border dark:bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-border">
                    <th scope="col" className="w-[42%] px-5 py-4 text-xs font-medium text-zinc-500 dark:text-muted-foreground">
                      Recursos
                    </th>
                    {plans.map((plan) => (
                      <th key={plan.id} scope="col" className="px-4 py-4 text-center text-xs font-semibold text-zinc-900 dark:text-foreground">
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonSections.map((section) => (
                    <FragmentSection key={section.title} title={section.title}>
                      {section.rows.map((row) => (
                        <tr key={row.label} className="border-b border-zinc-100 last:border-0 dark:border-border/60">
                          <th scope="row" className="px-5 py-3.5 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            {row.label}
                          </th>
                          {plans.map((plan) => (
                            <td key={plan.id} className="px-4 py-3.5 text-center">
                              <ComparisonCell value={row.values[plan.id]} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </FragmentSection>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-zinc-200 dark:border-border">
                    <td className="px-5 py-4 text-xs font-medium text-zinc-500 dark:text-muted-foreground">
                      Escolha seu plano
                    </td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="px-2 py-3 text-center">
                        <InteractiveHoverButton
                          type="button"
                          onClick={() => handleSubscribe(plan.id)}
                          disabled={Boolean(loadingPlanId)}
                          className={cn(
                            "w-full rounded-lg border px-2 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 focus-visible:ring-offset-2",
                            plan.featured
                              ? "border-zinc-800 bg-zinc-900 text-white dark:border-zinc-700 dark:bg-zinc-900"
                              : "border-zinc-300 bg-white text-zinc-900 dark:border-border dark:bg-transparent dark:text-foreground",
                            loadingPlanId === plan.id && "opacity-70 cursor-wait"
                          )}
                          fillClassName="bg-lime-300"
                          fillTextClassName="text-zinc-950"
                        >
                          {loadingPlanId === plan.id ? "Aguarde..." : "Assinar plano"}
                        </InteractiveHoverButton>
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 text-zinc-500 dark:text-muted-foreground">
            Esta comparação apresenta a proposta de planos. O controle de acesso por assinatura ainda será definido.
          </p>
        </section>
      </div>
    </>
  );
}

function FragmentSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-border dark:bg-muted/40">
        <th colSpan={4} className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-muted-foreground">
          {title}
        </th>
      </tr>
      {children}
    </>
  );
}

import { Button } from "@/components/ui/button";
import SectionHeader from "./section-header";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function PricingSection() {
  const plans = [
    {
      name: "Starter",
      price: "R$ 89",
      period: "/mês",
      desc: "Para profissionais autônomos começando a organizar a agenda.",
      cta: "Começar teste grátis",
      href: "#demo",
      highlight: false,
      features: [
        "1 profissional",
        "Agenda e agendamentos ilimitados",
        "Cadastro de clientes",
        "Notificações por e-mail",
        "Suporte por e-mail",
      ],
    },
    {
      name: "Business",
      price: "R$ 249",
      period: "/mês",
      desc: "Para clínicas e salões com equipe e operação em ritmo constante.",
      cta: "Assinar Business",
      href: "#demo",
      highlight: true,
      badge: "Mais escolhido",
      features: [
        "Até 10 profissionais",
        "Totem de autoatendimento",
        "Financeiro completo",
        "Estoque e pacotes",
        "Prontuários e anamnese",
        "Suporte prioritário",
      ],
    },
    {
      name: "Scale",
      price: "R$ 549",
      period: "/mês",
      desc: "Para redes e operações de alto volume, com múltiplas unidades.",
      cta: "Falar com vendas",
      href: "#demo",
      highlight: false,
      features: [
        "Profissionais ilimitados",
        "Multiunidades",
        "Relatórios avançados",
        "Integrações e API",
        "Gerente de sucesso dedicado",
      ],
    },
  ];
  return (
    <section
      id="preços"
      className="mx-auto w-full px-4 py-24 sm:px-6 lg:px-48 bg-[#0b0b0d]"
    >
      <a id="precos" />
      <SectionHeader
        eyebrow="Preços"
        title="Planos que crescem com sua operação."
        subtitle="Comece grátis por 14 dias. Sem cartão. Cancele quando quiser."
      />
      <div className="mt-14 grid gap-4 lg:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`relative flex flex-col rounded-2xl border p-6 transition-all bg-zinc-950 ${
              p.highlight
                ? "border-white/30 bg-card-totten shadow-2xl shadow-black/40 lg:-translate-y-2"
                : "border-totten bg-card-totten hover:border-white/20"
            }`}
          >
            {p.highlight && (
              <div className="pointer-events-none absolute -top-px left-1/2 h-px w-1/2 -translate-x-1/2 bg-linear-to-r from-transparent via-white to-transparent" />
            )}
            {p.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-black">
                  {p.badge}
                </span>
              </div>
            )}
            <div className="text-sm font-medium text-zinc-soft">{p.name}</div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="bg-linear-to-b from-white to-zinc-400 bg-clip-text text-5xl font-semibold tracking-tight text-transparent">
                {p.price}
              </span>
              <span className="text-sm text-zinc-soft">{p.period}</span>
            </div>
            <p className="mt-3 text-sm text-zinc-soft">{p.desc}</p>
            <Button
              asChild
              size="lg"
              className={`mt-6 ${
                p.highlight
                  ? "bg-white text-black hover:bg-zinc-200"
                  : "border border-totten bg-[#0c0c0e] text-white hover:bg-white/5"
              }`}
            >
              <a href={p.href}>
                {p.cta} <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
            <div className="my-6 h-px bg-linear-to-r from-transparent var-(--border-c)] to-transparent" />
            <ul className="space-y-3 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-zinc-soft">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-white" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-8 text-center text-xs text-zinc-soft">
        Todos os planos incluem 14 dias de teste grátis, sem necessidade de
        cartão de crédito.
      </p>
    </section>
  );
}

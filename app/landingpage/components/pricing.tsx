import { Button } from "@/components/ui/button";
import SectionHeader from "./section-header";
import { ArrowRight, CheckCircle } from "@boxicons/react";

export default function PricingSection() {
  const plans = [
    {
      name: "Early Access",
      price: "R$ 39,90",
      period: "/mês",
      desc: "Preço especial e fixo enquanto o sistema está sendo desenvolvido. Garanta seu acesso antes do lançamento oficial.",
      cta: "Começar teste de 30 dias",
      href: "#demo",
      highlight: true,
      badge: "Preço de Desenvolvimento",
      features: [
        "Acesso antecipado a todas as ferramentas atuais",
        "Agenda e agendamentos ilimitados",
        "Cadastro de clientes",
        "Totem de autoatendimento",
        "Prontuários e anamnese",
        "Futuras atualizações inclusas (Automação de WhatsApp, etc)",
      ],
    },
  ];
  return (
    <section
      id="preços"
      className="mx-auto w-full px-4 py-24 sm:px-6 lg:px-48 bg-zinc-900/10 flex flex-col items-center"
    >
      <a id="precos" />
      <div className="text-center">
        <SectionHeader
          eyebrow="Preços"
          title="Preço único durante o desenvolvimento."
          subtitle="Aproveite o valor reduzido de R$ 39,90 enquanto adicionamos novas funcionalidades, como a automação via WhatsApp. Teste grátis por 30 dias!"
        />
      </div>
      <div className="mt-14 w-full max-w-md mx-auto">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`relative flex flex-col rounded-2xl border p-6 transition-all bg-zinc-950 ${p.highlight
                ? "border-white/30 bg-card-totten shadow-2xl shadow-black/40 lg:-translate-y-2"
                : "border-totten bg-card-totten hover:border-white/20"
              }`}
          >
            {p.highlight && (
              <div className="pointer-events-none absolute -top-px left-1/2 h-px w-1/2 -translate-x-1/2 bg-linear-to-r from-transparent via-white to-transparent" />
            )}
            {p.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-full text-center">
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
              className={`mt-6 ${p.highlight
                  ? "bg-white text-black hover:bg-zinc-200"
                  : "border border-totten bg-[#0c0c0e] text-white hover:bg-white/5"
                }`}
            >
              <a href={p.href}>
                {p.cta} <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
            <div className="my-6 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
            <ul className="space-y-3 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-zinc-soft">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-white" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-8 text-center text-xs text-zinc-soft">
        Acesso completo liberado por 30 dias sem necessidade de cartão de crédito inicial.
      </p>
    </section>
  );
}

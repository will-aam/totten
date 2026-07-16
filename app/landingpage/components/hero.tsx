import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";
import DashboardMockup from "./dashboard-mockup";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-150 w-225 -translate-x-1/2 rounded-full bg-white/4 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #27272A 1px, transparent 1px), linear-gradient(to bottom, #27272A 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse at center, black 40%, transparent 75%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12 lg:px-8 lg:pb-32">
        <div className="animate-fade-up">
          <a
            href="#recursos"
            className="inline-flex items-center gap-2 rounded-full border border-totten bg-card-totten px-3 py-1 text-xs text-zinc-soft transition-colors hover:text-white"
          >
            <Sparkles className="h-3 w-3 text-white" />
            Novo — Totem de autoatendimento
            <ChevronRight className="h-3 w-3" />
          </a>
          <h1 className="mt-4 text-balance bg-linear-to-b from-white via-white to-zinc-500 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl md:text-6xl lg:text-[64px] lg:leading-[1.05] pb-1">
            Gestão inteligente para clínicas, salões e negócios de agendamentos.
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-zinc-soft sm:text-lg">
            O Totten reúne agendamento, check-in, financeiro, estoque, pacotes,
            prontuários e gestão completa em um único sistema moderno.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="bg-white text-black hover:bg-zinc-200">
              Começar agora <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-totten bg-card-totten text-white hover:bg-white/5"
            >
              Agendar demonstração
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-6 text-xs text-zinc-soft">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-white" /> Sem cartão
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-white" /> 14 dias grátis
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-white" /> Cancelamento livre
            </div>
          </div>
        </div>

        <div className="mt-16 lg:mt-0 md:block hidden">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}

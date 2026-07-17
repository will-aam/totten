import { CheckCircle2 } from "lucide-react";
import DashboardMockup from "./dashboard-mockup";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Glow */}
        <div className="absolute left-1/4 top-0 h-150 w-150 -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />

        {/* Grade de pontinhos */}
        <div
          className="absolute inset-0 opacity-50 w-2/3"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,.12) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage:
              "radial-gradient(ellipse at left, black 45%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at left, black 45%, transparent 80%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12 lg:px-8 lg:pb-32">
        <div className="animate-fade-up">
          <h1 className="mt-4 text-balance bg-linear-to-b from-white via-white to-zinc-500 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl md:text-6xl lg:text-[64px] lg:leading-[1.05] pb-1">
            Gestão inteligente para clínicas, salões e negócios de agendamentos.
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-zinc-soft sm:text-lg">
            O Totten reúne agendamento, check-in, financeiro, estoque, pacotes,
            prontuários e gestão completa em um único sistema moderno.
          </p>
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

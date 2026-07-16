import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-totten bg-card-totten px-6 py-16 text-center sm:px-12 sm:py-24">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute left-1/2 top-0 h-96 w-150 -translate-x-1/2 rounded-full bg-white/6 blur-3xl" />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(to right, #27272A 1px, transparent 1px), linear-gradient(to bottom, #27272A 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage:
                "radial-gradient(ellipse at center, black 30%, transparent 70%)",
            }}
          />
        </div>
        <div className="relative">
          <h2 className="mx-auto pb-1 max-w-3xl text-balance bg-linear-to-b from-white to-zinc-400 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-5xl">
            Pronto para transformar a gestão da sua empresa?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-soft">
            Experimente gratuitamente e descubra como o Totten pode automatizar
            o seu negócio.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="bg-white text-black hover:bg-zinc-200">
              Começar agora <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-totten bg-[#0c0c0e] text-white hover:bg-white/5"
            >
              Solicitar demonstração
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

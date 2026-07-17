import { CheckCircle2 } from "lucide-react";
import PhoneMockup from "./phone-mockup";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

export default function TotemSection() {
  return (
    <section id="totem" className="py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
        <div className="order-2 md:flex justify-center lg:order-1 hidden">
          {/* <PhoneMockup /> */}
          <Image
            src="/totem.png"
            alt="Totem de autoatendimento"
            width={400}
            height={400}
          />
        </div>
        <div className="order-1 lg:order-2">
          <Badge
            variant="outline"
            className="border-totten bg-card-totten text-xs text-zinc-soft"
          >
            Totem de autoatendimento
          </Badge>
          <h2 className="mt-4 bg-linear-to-b from-white to-zinc-400 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl pb-1">
            Seus clientes fazem o check-in em segundos.
          </h2>
          <p className="mt-4 text-zinc-soft">
            Utilizando apenas CPF ou telefone, o Totem integra automaticamente
            com os agendamentos e libera sua equipe para o que importa.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              "Reduz filas na recepção",
              "Agiliza o atendimento",
              "Integra com os agendamentos",
              "Funciona em tablets e celulares",
            ].map((b) => (
              <div
                key={b}
                className="flex items-center gap-2 rounded-xl border border-totten bg-card-totten px-4 py-3 text-sm"
              >
                <CheckCircle2 className="h-4 w-4 text-white" /> {b}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

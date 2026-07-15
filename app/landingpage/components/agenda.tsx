import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";
import { Fragment } from "react/jsx-runtime";
import BrowserFrame from "./browser-frame";

export default function AgendaSection() {
  const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00"];
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex"];
  const events = [
    { d: 0, h: 1, dur: 2, t: "Consulta · Ana", tone: "bg-white/90 text-black" },
    { d: 1, h: 2, dur: 1, t: "Retorno · Bruno", tone: "bg-white/10" },
    { d: 2, h: 0, dur: 2, t: "Estética · Carla", tone: "bg-white/20" },
    {
      d: 3,
      h: 3,
      dur: 2,
      t: "Massagem · Diego",
      tone: "bg-white/70 text-black",
    },
    { d: 4, h: 1, dur: 1, t: "Corte · Elen", tone: "bg-white/10" },
    { d: 4, h: 4, dur: 2, t: "Pacote · Fábio", tone: "bg-white/30" },
  ];
  return (
    <section id="agenda" className="bg-[#0b0b0d] py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
        <div className="order-2 lg:order-1">
          <Badge
            variant="outline"
            className="border-totten bg-card-totten text-xs text-zinc-soft"
          >
            Agenda
          </Badge>
          <h2 className="mt-4 bg-linear-to-b from-white to-zinc-400 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl pb-1">
            A agenda que sua equipe já sabe usar.
          </h2>
          <p className="mt-4 text-zinc-soft">
            Interface familiar semelhante ao Google Agenda. Arraste, filtre por
            profissional e visualize sua operação em qualquer escala.
          </p>
          <ul className="mt-6 space-y-2 text-sm">
            {[
              "Visualização diária, semanal e mensal",
              "Arrastar e reagendar",
              "Filtros por profissional e serviço",
              "Agendamentos recorrentes",
            ].map((i) => (
              <li key={i} className="flex items-center gap-2 text-zinc-soft">
                <CheckCircle2 className="h-4 w-4 text-white" /> {i}
              </li>
            ))}
          </ul>
        </div>
        <div className="md:order-2 md:block hidden">
          <BrowserFrame>
            <div className="bg-app p-3">
              <div className="mb-2 flex items-center justify-between text-xs">
                <div className="flex gap-1">
                  {["Dia", "Semana", "Mês"].map((v, i) => (
                    <button
                      key={v}
                      className={`rounded-md px-2 py-1 text-[11px] ${i === 1 ? "bg-white text-black" : "border border-totten bg-card-totten text-zinc-soft"}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1">
                  {["Ana", "Bruno", "Carla"].map((p, i) => (
                    <div
                      key={p}
                      className="flex items-center gap-1 rounded-md border border-totten bg-card-totten px-2 py-1 text-[10px]"
                    >
                      <Circle
                        className={`h-2 w-2 ${["fill-white text-white", "fill-zinc-400 text-zinc-400", "fill-zinc-600 text-zinc-600"][i]}`}
                      />{" "}
                      {p}
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-[50px_repeat(5,1fr)] overflow-hidden rounded-lg border border-totten">
                <div />
                {days.map((d) => (
                  <div
                    key={d}
                    className="border-l border-totten bg-[#0c0c0e] py-1.5 text-center text-[10px] text-zinc-soft"
                  >
                    {d}
                  </div>
                ))}
                {hours.map((h, hi) => (
                  <Fragment key={h}>
                    <div className="border-t border-totten bg-[#0c0c0e] px-2 py-3 text-[9px] text-zinc-500">
                      {h}
                    </div>
                    {days.map((_, di) => {
                      const ev = events.find((e) => e.d === di && e.h === hi);
                      return (
                        <div
                          key={`${hi}-${di}`}
                          className="relative min-h-9.5 border-l border-t border-totten"
                        >
                          {ev && (
                            <div
                              className={`absolute inset-x-1 top-1 rounded-md px-1.5 py-1 text-[9px] font-medium ${ev.tone}`}
                              style={{ height: `${ev.dur * 38 - 6}px` }}
                            >
                              {ev.t}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </Fragment>
                ))}
              </div>
            </div>
          </BrowserFrame>
        </div>
      </div>
    </section>
  );
}

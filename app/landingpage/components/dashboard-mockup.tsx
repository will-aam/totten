import {
  BarChart3,
  Bird,
  Calendar,
  CheckCircle2,
  Package,
  Users,
  Boxes,
  ClipboardList,
  CreditCard,
  Search,
} from "lucide-react";

export default function DashboardMockup() {
  return (
    <div className="relative">
      {/* floating chips */}
      <FloatingChip
        className="-left-2 top-8 sm:-left-6"
        delay="0s"
        icon={<CheckCircle2 className="h-4 w-4" />}
        title="Check-in realizado"
        subtitle="Maria Silva · agora"
      />
      <FloatingChip
        className="-right-2 top-24 sm:-right-6"
        delay="1s"
        icon={<Calendar className="h-4 w-4" />}
        title="Novo agendamento"
        subtitle="15:30 · Corte"
      />
      <FloatingChip
        className="-left-2 bottom-24 sm:-left-8"
        delay="2s"
        icon={<Users className="h-4 w-4" />}
        title="Cliente confirmado"
        subtitle="João P. confirmou"
      />
      <FloatingChip
        className="-right-2 bottom-6 sm:-right-8"
        delay="1.5s"
        icon={<CreditCard className="h-4 w-4" />}
        title="Pagamento recebido"
        subtitle="R$ 240,00 · Pix"
      />

      <BrowserFrame>
        <div className="grid grid-cols-[180px_1fr] bg-app min-h-95">
          {/* sidebar */}
          <aside className="border-r border-totten bg-[#0c0c0e] p-3 text-xs">
            <div className="mb-4 flex items-center gap-2 px-2 py-1">
              <Bird className="h-4 w-4" />{" "}
              <span className="font-semibold">Totten</span>
            </div>
            <div className="mb-1 px-2 text-[10px] uppercase tracking-wider text-zinc-500">
              Menu
            </div>
            {[
              { i: BarChart3, l: "Dashboard", active: true },
              { i: Calendar, l: "Agenda" },
              { i: Users, l: "Clientes" },
              { i: Package, l: "Pacotes" },
              { i: CreditCard, l: "Financeiro" },
              { i: Boxes, l: "Estoque" },
              { i: ClipboardList, l: "Anamnese" },
            ].map(({ i: Icon, l, active }) => (
              <div
                key={l}
                className={`mt-0.5 flex items-center gap-2 rounded-md px-2 py-1.5 ${
                  active ? "bg-white/10 text-white" : "text-zinc-soft"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {l}
              </div>
            ))}
          </aside>
          {/* main */}
          <div className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-medium">Dashboard</div>
              <div className="flex gap-2">
                <div className="rounded-md border border-totten bg-card-totten px-2 py-1 text-[10px] text-zinc-soft">
                  Hoje
                </div>
                <div className="rounded-md bg-white px-2 py-1 text-[10px] font-medium text-black">
                  Modo Check-in
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { l: "Agendamentos", v: "24", d: "+12%" },
                { l: "Check-ins", v: "18", d: "75%" },
                { l: "Ativos", v: "312", d: "+8" },
                { l: "Receita", v: "R$ 4.2k", d: "+18%" },
              ].map((s) => (
                <div
                  key={s.l}
                  className="rounded-lg border border-totten bg-card-totten p-2.5"
                >
                  <div className="text-[10px] uppercase tracking-wide text-zinc-500">
                    {s.l}
                  </div>
                  <div className="mt-1 text-lg font-semibold">{s.v}</div>
                  <div className="text-[10px] text-emerald-400">{s.d}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-totten bg-card-totten p-3">
                <div className="mb-2 flex items-center justify-between text-[11px]">
                  <span className="font-medium">Agenda hoje</span>
                  <span className="text-zinc-500">13 JUL</span>
                </div>
                {[
                  { t: "09:00", n: "Ana Souza", s: "Consulta" },
                  { t: "10:30", n: "Bruno L.", s: "Retorno" },
                  { t: "14:00", n: "Carla M.", s: "Estética" },
                ].map((r) => (
                  <div
                    key={r.t}
                    className="mb-1 flex items-center justify-between rounded-md border border-totten/60 bg-[#0c0c0e] px-2 py-1.5 text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono">
                        {r.t}
                      </span>
                      <span>{r.n}</span>
                    </div>
                    <span className="text-zinc-500">{r.s}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-totten bg-card-totten p-3">
                <div className="mb-2 text-[11px] font-medium">
                  Receita da semana
                </div>
                <MiniChart />
              </div>
            </div>
          </div>
        </div>
      </BrowserFrame>
    </div>
  );
}

function MiniChart() {
  const bars = [40, 65, 45, 80, 55, 90, 70];
  return (
    <div className="flex h-24 items-end gap-1.5">
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t bg-linear-to-t from-white/30 to-white"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

function FloatingChip({
  icon,
  title,
  subtitle,
  className,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  className?: string;
  delay?: string;
}) {
  return (
    <div
      className={`absolute z-10 hidden animate-float-slow items-center gap-2.5 rounded-xl border border-totten bg-card-totten/90 px-3 py-2 text-xs shadow-2xl backdrop-blur-md sm:flex ${className}`}
      style={{ animationDelay: delay }}
    >
      <div className="grid h-7 w-7 place-items-center rounded-lg bg-white/10 text-white">
        {icon}
      </div>
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-[10px] text-zinc-soft">{subtitle}</div>
      </div>
    </div>
  );
}

function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-totten bg-card-totten shadow-2xl shadow-black/40">
      <div className="flex items-center gap-2 border-b border-totten bg-[#0c0c0e] px-3 py-2">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#27272A]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#27272A]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#27272A]" />
        </div>
        <div className="mx-auto flex items-center gap-1.5 rounded-md border border-totten bg-card-totten px-3 py-0.5 text-[10px] text-zinc-soft">
          <Search className="h-2.5 w-2.5" /> totten.com.br/admin/dashboard
        </div>
      </div>
      {children}
    </div>
  );
}

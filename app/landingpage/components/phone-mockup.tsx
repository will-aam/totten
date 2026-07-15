export default function PhoneMockup() {
  return (
    <div className="relative">
      <div className="absolute -inset-1 -z-10 rounded-[3rem] bg-white/4 blur-sm" />
      <div className="w-70 rounded-[2.5rem] border border-totten bg-[#0c0c0e] p-2 shadow-2xl shadow-black/60">
        <div className="overflow-hidden rounded-[2.1rem] border border-totten bg-app">
          <div className="px-6 pt-8 text-center">
            <div className="text-[10px] tracking-[0.4em] text-zinc-soft">
              CLÍNICA
            </div>
            <div className="mt-1 font-serif text-3xl font-bold tracking-tight">
              HARMONIA
            </div>
          </div>
          <div className="mx-6 mt-6 grid grid-cols-2 rounded-full border border-totten bg-card-totten p-1 text-xs">
            <button className="rounded-full bg-[#0c0c0e] py-1.5 font-medium">
              CPF
            </button>
            <button className="rounded-full py-1.5 text-zinc-soft">
              Telefone
            </button>
          </div>
          <div className="mx-6 mt-5 text-center text-[11px] text-zinc-soft">
            Digite seu CPF para iniciar.
          </div>
          <div className="mx-6 mt-3 rounded-2xl border border-totten py-3 text-center font-mono text-lg text-zinc-500">
            000.000.000-00
          </div>
          <div className="mx-6 mt-4 grid grid-cols-3 gap-2">
            {[
              "1",
              "2",
              "3",
              "4",
              "5",
              "6",
              "7",
              "8",
              "9",
              "Limpar",
              "0",
              "⌫",
            ].map((k) => (
              <div
                key={k}
                className="grid h-10 place-items-center rounded-lg border border-totten bg-card-totten text-sm"
              >
                {k}
              </div>
            ))}
          </div>
          <div className="m-6 rounded-xl bg-zinc-400 py-3 text-center text-sm font-semibold text-black">
            Confirmar
          </div>
        </div>
      </div>
    </div>
  );
}

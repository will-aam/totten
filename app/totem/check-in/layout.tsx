"use client";

export default function CheckInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh w-full flex-col bg-background overflow-x-hidden">
      {/* Cabeçalho Fixo - Sem borda */}
      <header className="flex w-full shrink-0 flex-col items-center justify-center bg-card/30 p-6 md:p-8">
        <div className="flex flex-col items-center text-center animate-in fade-in duration-700 font-philosopher">
          <span className="text-xl md:text-2xl font-normal uppercase tracking-[0.2em] text-muted-foreground/80 mb-1">
            Bem-vindo(a)
          </span>
          <h1 className="text-5xl font-bold text-foreground md:text-6xl lg:text-7xl">
            Totten
          </h1>
        </div>
      </header>
      <main className="flex w-full flex-1 items-center justify-center p-4">
        {children}
      </main>
      <footer className="flex w-full shrink-0 items-center justify-center bg-muted/20 p-6 md:p-8">
        <button
          type="button"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:text-lg"
          onClick={() => {
            console.log("Solicitar ajuda");
          }}
        >
          Precisando de ajuda? Toque aqui.
        </button>
      </footer>
    </div>
  );
}

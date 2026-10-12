// app/(private)/admin/finance/_components/finance-header.tsx
"use client";

export function FinanceHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-20">
      <div className="flex flex-col">
        <h1 className="text-3xl font-black tracking-tight bg-linear-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
          Financeiro
        </h1>
        <p className="text-muted-foreground text-sm mt-1.5 font-medium">
          Acompanhe e faça a gestão das movimentações do seu negócio.
        </p>
      </div>
    </div>
  );
}

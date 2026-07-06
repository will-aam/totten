"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function CheckInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const [clinicName, setClinicName] = useState("Totten");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings/public");
        if (res.ok) {
          const data = await res.json();
          setClinicName(data.tradeName || data.companyName || "Totten");
        }
      } catch (error) {
        console.error("Erro ao buscar configurações:", error);
      } finally {
        setLoading(false);
      }
    };

    if (status !== "loading") {
      fetchSettings();
    }
  }, [status]);

  let smallPrefix = "Bem-vindo";
  let mainTitle = clinicName;

  if (clinicName.includes(" ")) {
    const firstSpaceIndex = clinicName.indexOf(" ");
    smallPrefix = clinicName.substring(0, firstSpaceIndex);
    mainTitle = clinicName.substring(firstSpaceIndex + 1);
  } else {
    smallPrefix = "Bem-vindo(a)";
    mainTitle = clinicName;
  }

  return (
    <div className="flex min-h-dvh w-full flex-col bg-background overflow-x-hidden">
      {" "}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Philosopher:ital,wght@0,400;0,700;1,400;1,700&display=swap');
        .font-philosopher { font-family: 'Philosopher', sans-serif; }
      `,
        }}
      />
      {/* Cabeçalho Fixo - Sem borda */}
      <header className="flex w-full shrink-0 flex-col items-center justify-center bg-card/30 p-6 md:p-8">
        {loading || status === "loading" ? (
          <div className="h-16 w-64 rounded-xl bg-muted animate-pulse" />
        ) : (
          /* Fonte Philosopher aplicada a todo o bloco */
          <div className="flex flex-col items-center text-center animate-in fade-in duration-700 font-philosopher">
            <span className="text-xl md:text-2xl font-normal uppercase tracking-[0.2em] text-muted-foreground/80 mb-1">
              {smallPrefix}
            </span>
            <h1 className="text-5xl font-bold text-foreground md:text-6xl lg:text-7xl">
              {mainTitle}
            </h1>
          </div>
        )}
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

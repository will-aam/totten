"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, Dashboard } from "@boxicons/react";

export default function TotemIdleContent() {
  const { status } = useSession();
  const router = useRouter();

  const handleCheckInClick = (e: React.MouseEvent) => {
    if (status !== "authenticated") {
      e.preventDefault();
      router.push("/totem/error?type=ORG_NOT_FOUND");
    }
  };

  const handleAdminAccess = () => {
    if (status === "authenticated") {
      router.push("/admin/dashboard");
    } else {
      router.push("/login");
    }
  };

  return (
    // Adicionamos a classe font-philosopher na raiz para herança global na página
    <div className="relative flex h-dvh w-full flex-col items-center justify-between p-6 pb-12 overflow-hidden bg-background font-philosopher">
      {/* Injeção da fonte exclusiva para esta página */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Philosopher:ital,wght@0,400;0,700;1,400;1,700&display=swap');
        .font-philosopher { font-family: 'Philosopher', sans-serif; }
      `,
        }}
      />

      <div className="h-10 w-full" />

      <div className="flex flex-col items-center gap-8 w-full max-w-sm animate-in fade-in zoom-in duration-700">
        <div className="flex flex-col items-center gap-4">
          {/* Logo com troca dinâmica de tema e sem cortes */}
          <div className="flex items-center justify-center shrink-0">
            {/* Logo exibida no TEMA CLARO */}
            <Image
              src="/totten.png"
              alt="Totten Logo"
              width={128}
              height={128}
              className="object-contain h-24 w-24 md:h-32 md:w-32 animate-pulse-slow dark:hidden block"
              priority
            />
            {/* Logo exibida no TEMA ESCURO */}
            <Image
              src="/totten-brac.png"
              alt="Totten Logo"
              width={128}
              height={128}
              className="object-contain h-24 w-24 md:h-32 md:w-32 animate-pulse-slow hidden dark:block"
              priority
            />
          </div>

          <div className="space-y-1 text-center min-h-15 flex items-center justify-center w-full">
            {status === "loading" ? (
              <div className="h-12 w-48 md:h-15 md:w-64 rounded-xl bg-muted animate-pulse mx-auto" />
            ) : (
              // O título já puxa a fonte do pai, mas a mantemos limpa
              <h1 className="text-5xl font-bold tracking-tight text-foreground md:text-6xl animate-in fade-in duration-700">
                Totten
              </h1>
            )}
          </div>
        </div>

        <div className="w-full px-4 pt-4">
          <Link
            href="/totem/check-in"
            onClick={handleCheckInClick}
            className="flex h-20 w-full items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground hover:scale-[1.02] active:scale-95 transition-transform md:h-24 md:text-2xl shadow-lg"
          >
            Fazer Check-in
          </Link>
          <p className="mt-4 text-xs md:text-sm text-muted-foreground animate-pulse text-center">
            {status === "authenticated"
              ? "Toque para registrar sua presença"
              : "Totem não autenticado na organização"}
          </p>
        </div>
      </div>

      <div className="w-full flex justify-center items-center">
        <button
          onClick={handleAdminAccess}
          className="group flex items-center gap-2 p-4 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        >
          {status === "authenticated" ? (
            <>
              <Dashboard className="h-4 w-4 transition-transform group-hover:scale-110" />
              <span className="text-[10px] uppercase tracking-widest font-medium opacity-110">
                Ir para Dashboard
              </span>
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 transition-transform group-hover:scale-110" />
              <span className="text-[10px] uppercase tracking-widest font-medium opacity-110">
                Acesso Restrito
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

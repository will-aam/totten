// app/totem/idle/totem-idle-content.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image"; // 🔥 Importação para usar as imagens da pasta public
import { Lock, LayoutDashboard } from "lucide-react"; // Removido o Bird

export default function TotemIdleContent() {
  const { data: session, status } = useSession();
  const router = useRouter();

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
      router.push("/admin/login");
    }
  };

  return (
    <div className="relative flex h-dvh w-full flex-col items-center justify-between p-6 pb-12 overflow-hidden bg-background">
      <div className="h-10 w-full" />

      <div className="flex flex-col items-center gap-8 w-full max-w-sm animate-in fade-in zoom-in duration-700">
        <div className="flex flex-col items-center gap-4">
          {/* 🔥 Logo com corte circular perfeito, sem fundo/borda */}
          <Image
            src="/totten.png"
            alt="Totten Logo"
            width={128} // Mantendo o tamanho definido anteriormente
            height={128}
            className="rounded-full overflow-hidden aspect-square h-24 w-24 md:h-32 md:w-32 object-cover animate-pulse-slow" // 🔥 Classes cruciais: rounded-full, overflow-hidden, aspect-square, object-cover
          />

          <div className="space-y-1 text-center min-h-15 flex items-center justify-center w-full">
            {loading || status === "loading" ? (
              <div className="h-12 w-48 md:h-15 md:w-64 rounded-xl bg-muted animate-pulse mx-auto" />
            ) : (
              <h1 className="font-serif text-5xl font-bold tracking-tight text-foreground md:text-6xl animate-in fade-in duration-700">
                {clinicName}
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
              <LayoutDashboard className="h-4 w-4 transition-transform group-hover:scale-110" />
              <span className="text-[10px] uppercase tracking-widest font-medium opacity-0 group-hover:opacity-100 transition-opacity">
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

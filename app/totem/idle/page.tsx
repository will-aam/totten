"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Heart, Lock, LayoutDashboard, Loader2 } from "lucide-react";

export default function TotemIdlePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const slug = searchParams.get("slug") || "";

  const [clinicName, setClinicName] = useState("Totten");
  const [loading, setLoading] = useState(true);

  // 🔥 Busca o nome da clínica ao carregar a página (via slug)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(
          slug ? `/api/settings/public?slug=${slug}` : "/api/settings/public",
        );
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

    fetchSettings();
  }, [slug]);

  // 🔥 Função para lidar com o botão de check-in
  const handleCheckInClick = (e: React.MouseEvent) => {
    // Totem é público → não exige login
    if (!slug) {
      e.preventDefault();
      router.push("/totem/error?type=ORG_NOT_FOUND");
    }
  };

  // 🔥 Função para lidar com o botão de acesso restrito/dashboard
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
          <div className="flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-full bg-primary">
            <Heart className="h-10 w-10 md:h-12 md:w-12 text-primary-foreground" />
          </div>
          <div className="space-y-1 text-center">
            {loading || status === "loading" ? (
              <div className="flex items-center justify-center gap-2 py-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <h1 className="font-serif text-5xl font-bold tracking-tight text-foreground md:text-6xl">
                  {clinicName}
                </h1>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  Sua jornada de bem-estar começa aqui.
                </p>
              </>
            )}
          </div>
        </div>

        <div className="w-full px-4 pt-4">
          <Link
            href={slug ? `/totem/check-in?slug=${slug}` : "/totem/check-in"}
            onClick={handleCheckInClick}
            className="flex h-20 w-full items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground hover:scale-[1.02] active:scale-95 transition-transform md:h-24 md:text-2xl shadow-lg"
          >
            Fazer Check-in
          </Link>
          <p className="mt-4 text-xs md:text-sm text-muted-foreground animate-pulse text-center">
            {slug
              ? "Toque para registrar sua presença"
              : "Organização não identificada"}
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
              <span className="text-[10px] uppercase tracking-widest font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Acesso Restrito
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

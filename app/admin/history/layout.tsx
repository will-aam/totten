"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LoaderDots } from "@boxicons/react";

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();

  // 🔥 LÓGICA DE PROTEÇÃO DE ROTA (RBAC)
  useEffect(() => {
    if (status === "loading") return;

    const isOwner = session?.user?.role === "OWNER";
    const hasHistoryPermission =
      session?.user?.permissions?.includes("HISTORY");

    // 🛡️ Se NÃO for Owner E NÃO tiver a permissão específica de Histórico, bloqueia.
    if (!isOwner && !hasHistoryPermission) {
      router.replace("/admin/dashboard");
    }
  }, [session, status, router]);

  // Exibe um estado de carregamento enquanto valida a sessão para evitar "flashes" de conteúdo
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoaderDots className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  // Verificação de segurança final antes da renderização
  const isOwner = session?.user?.role === "OWNER";
  const hasHistoryPermission = session?.user?.permissions?.includes("HISTORY");

  if (!isOwner && !hasHistoryPermission) {
    return null; // O useEffect cuidará do redirecionamento
  }

  return <div className="w-full">{children}</div>;
}

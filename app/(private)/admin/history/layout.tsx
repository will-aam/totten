"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();

  //  LÓGICA DE PROTEÇÃO DE ROTA (RBAC)
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

  // Verificação de segurança final antes da renderização
  const isOwner = session?.user?.role === "OWNER";
  const hasHistoryPermission = session?.user?.permissions?.includes("HISTORY");

  if (status !== "loading" && !isOwner && !hasHistoryPermission) {
    return null; // O useEffect cuidará do redirecionamento
  }

  return <div className="w-full">{children}</div>;
}

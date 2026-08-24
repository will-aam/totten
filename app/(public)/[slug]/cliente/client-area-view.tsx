"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowLeft, History } from "@boxicons/react";
import { LogOut } from "lucide-react";
import { getClientHistoryByPhone } from "@/app/actions/public-client";

import { logoutClientSession } from "@/app/actions/client-auth";

export function ClientAreaView({ 
  org, 
  theme,
  initialHistory,
  initialClientName,
  error
}: { 
  org: any; 
  theme: any;
  initialHistory: any[];
  initialClientName: string;
  error?: string;
}) {
  const router = useRouter();
  
  const handleLogout = async () => {
    await logoutClientSession(org.slug);
    if (typeof window !== "undefined") {
      localStorage.removeItem(`totten_client_logged_in_${org.slug}`);
      localStorage.removeItem(`totten_client_phone_${org.slug}`);
    }
    router.push(`/${org.slug}/agendar`);
    router.refresh();
  };

  return (
    <div
      className="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-900"
    >
      {/* Navbar */}
      <div
        className="shrink-0 z-50 px-4 py-3 flex items-center justify-between border-b backdrop-blur-md bg-white/80 border-black/10"
      >
        <button
          onClick={() => router.push(`/${org.slug}/agendar`)}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-black/5 hover:bg-black/10"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="font-bold text-sm">Área do Cliente</h1>
        <button
          onClick={handleLogout}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-black/5 hover:bg-black/10"
          title="Sair"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 pb-24 space-y-8">
        <div className="text-center space-y-2 mt-4 mb-8">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-black/5">
            <span className="text-2xl">👋</span>
          </div>
          <h2 className="text-xl font-bold">Olá, {initialClientName || "Cliente"}</h2>
          <p className="text-sm opacity-70">
            Área do cliente. Em breve novas coisas!
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 text-red-600 text-sm font-medium text-center">
            {error}
          </div>
        )}

        {!error && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <History className="h-5 w-5 opacity-70" />
              <h3 className="font-bold">Seu Histórico (Últimos 10)</h3>
            </div>

            {initialHistory.length === 0 ? (
              <div
                className="p-6 rounded-2xl border flex flex-col items-center justify-center text-center space-y-2 bg-white border-black/5"
              >
                <p className="text-sm opacity-60">Nenhum histórico encontrado.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {initialHistory.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-4 rounded-2xl border text-left bg-white border-black/5"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-bold">{item.serviceName}</span>
                      <span className="text-xs opacity-70">{item.packageName}</span>
                      <span className="text-xs font-medium mt-1">
                        {new Intl.DateTimeFormat("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(item.dateTime))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// app/admin/clients/[id]/page.tsx
"use client";

import { use, useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { AdminHeader } from "@/components/admin-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { User, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

// Importando os nossos blocos arquiteturais
import { ClientHeader } from "@/components/client/client-header";
import { ClientContact } from "@/components/client/client-contact";
import { ClientPackage } from "@/components/client/client-package";
import { ClientAnamnesis } from "@/components/client/client-anamnesis";
import { ClientHistory } from "@/components/client/client-history";

// 🔥 Mantemos APENAS a tipagem do Cliente. As outras vão para seus respectivos componentes.
export type ClientType = {
  id: string;
  name: string;
  cpf: string;
  phone_whatsapp: string;
  email?: string | null;
  birth_date?: string | null;
  zip_code?: string | null;
  city?: string | null;
  street?: string | null;
  number?: string | null;
  created_at?: string;
  active: boolean; // 🔥 Status que adicionamos na API
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // 🔥 Estado para controlar a visibilidade do botão ArrowUp
  const [showScrollTop, setShowScrollTop] = useState(false);

  // A página agora só se importa em buscar os dados do cliente
  const { data, isLoading } = useSWR<{ client: ClientType }>(
    `/api/clients/${id}`,
    fetcher,
  );

  // 🔥 Efeito para ouvir o scroll da página
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- ESTADOS DE CARREGAMENTO & ERRO ---
  if (isLoading) {
    return (
      <>
        <AdminHeader title="Perfil do Cliente" />
        <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-64 md:col-span-2 rounded-xl" />
            <Skeleton className="h-64 md:col-span-1 rounded-xl" />
          </div>
        </div>
      </>
    );
  }

  if (!data?.client) {
    return (
      <>
        <AdminHeader title="Cliente" />
        <div className="flex flex-col items-center justify-center gap-4 p-12 text-center h-[80vh]">
          <User className="h-16 w-16 text-muted-foreground/30" />
          <p className="text-lg font-medium text-muted-foreground">
            Cliente não encontrado.
          </p>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/admin/clients">Voltar para a lista</Link>
          </Button>
        </div>
      </>
    );
  }

  const { client } = data;

  // --- RENDERIZAÇÃO LIMPA E MODULAR ---
  return (
    <>
      <AdminHeader title="Perfil do Cliente" />

      {/* Adicionamos 'relative' aqui para caso o botão precise de contexto */}
      <div className="flex flex-col gap-4 md:gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 md:pb-6 relative">
        {/* Bloco 1: Cabeçalho */}
        <ClientHeader client={client} />

        {/* Bloco 2: Grid Principal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <ClientContact client={client} />

          <ClientPackage
            clientId={id}
            clientName={client.name}
            clientActive={client.active}
          />
        </div>

        {/* Bloco 3: Anamneses */}
        <ClientAnamnesis clientId={id} />

        {/* Bloco 4: Histórico */}
        <ClientHistory clientId={id} />
      </div>

      {/* 🔥 Botão ArrowUp flutuante */}
      <button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-24 md:bottom-8 right-4 md:right-8 p-3.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 z-50",
          showScrollTop
            ? "translate-y-0 opacity-100"
            : "translate-y-10 opacity-0 pointer-events-none",
        )}
        aria-label="Voltar ao topo"
      >
        <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </>
  );
}

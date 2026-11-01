"use client";

import React from "react";
import Link from "next/link";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
import { ChevronRight } from "lucide-react";

interface HelpTopicItem {
  title: string;
  href?: string;
  enabled?: boolean;
  isExternal?: boolean;
}

interface HelpTopicSection {
  title: string;
  items: HelpTopicItem[];
}

const SUPPORT_WHATSAPP =
  "https://wa.me/5579998752198?text=" +
  encodeURIComponent("Olá! Preciso de ajuda com o sistema Totten.");

const SECTIONS: HelpTopicSection[] = [
  {
    title: "Menu Principal",
    items: [
      { title: "Dashboard" },
      { title: "Agenda" },
      { title: "Confirmações Manuais" },
      { title: "Aniversariantes" },
      { title: "Notas" },
      { title: "Gestão de Pacotes" },
    ],
  },
  {
    title: "Cadastros",
    items: [
      { title: "Clientes" },
      { title: "Fichas de Anamnese" },
      { title: "Profissionais" },
      { title: "Serviços e Pacotes" },
      { title: "Estoque" },
    ],
  },
  {
    title: "Registros",
    items: [
      { title: "Comprovantes" },
      { title: "Histórico de Check-in" },
      { title: "Histórico de Ações" },
    ],
  },
  {
    title: "Módulos",
    items: [
      { title: "Financeiro" },
      { title: "Autoatendimento" },
      {
        title: "Programa de Fidelidade",
        href: "/admin/help/loyalty",
        enabled: true,
      },
    ],
  },
  {
    title: "Suporte",
    items: [
      {
        title: "Suporte via WhatsApp",
        href: SUPPORT_WHATSAPP,
        enabled: true,
        isExternal: true,
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <>
      <AdminHeader title="Ajuda" />

      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 md:pb-6 relative animate-in fade-in duration-500 min-h-[calc(100vh-100px)]">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            Central de Ajuda
          </h2>
          <p className="text-sm text-muted-foreground">
            Selecione uma funcionalidade para visualizar as instruções e a aula explicativa.
          </p>
        </div>

        <div className="space-y-6">
          {SECTIONS.map((section) => (
            <div key={section.title} className="space-y-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 px-1">
                {section.title}
              </h3>

              <div className="bg-card rounded-2xl border divide-y divide-border/40 shadow-2xs overflow-hidden">
                {section.items.map((item) => {
                  if (item.enabled && item.href) {
                    if (item.isExternal) {
                      return (
                        <a
                          key={item.title}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center justify-between p-4 hover:bg-muted/40 transition-colors"
                        >
                          <span className="text-sm font-medium text-foreground group-hover:text-primary underline-offset-4 group-hover:underline transition-all">
                            {item.title}
                          </span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </a>
                      );
                    }

                    return (
                      <Link
                        key={item.title}
                        href={item.href}
                        className="group flex items-center justify-between p-4 hover:bg-muted/40 transition-colors"
                      >
                        <span className="text-sm font-medium text-foreground group-hover:text-primary underline-offset-4 group-hover:underline transition-all">
                          {item.title}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    );
                  }

                  return (
                    <div
                      key={item.title}
                      className="flex items-center justify-between p-4 opacity-60 cursor-default"
                    >
                      <span className="text-sm font-medium text-foreground">
                        {item.title}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

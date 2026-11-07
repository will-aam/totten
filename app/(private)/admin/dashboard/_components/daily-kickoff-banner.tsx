"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { getDailyKickoffAction } from "@/app/actions/notifications";
import { Coffee, X, ArrowRight, Calendar, BirthdayCake, Clock } from "@boxicons/react";

const PREFS_KEY = "totten_notification_preferences";

export function DailyKickoffBanner() {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [enabled, setEnabled] = useState(true);

  // Formata a chave diária (ex: totten_kickoff_dismissed_2026-11-02)
  const todayStr = new Date().toISOString().split("T")[0];
  const dismissKey = `totten_kickoff_dismissed_${todayStr}`;

  useEffect(() => {
    setMounted(true);
    try {
      // Checa se está desativado nas preferências
      const savedPrefs = localStorage.getItem(PREFS_KEY);
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs);
        if (parsed.dailyKickoff === false) {
          setEnabled(false);
        }
      }

      // Checa se já foi dispensado hoje
      const isDismissedToday = localStorage.getItem(dismissKey) === "true";
      if (isDismissedToday) {
        setDismissed(true);
      }
    } catch {
      // Fallback
    }
  }, [dismissKey]);

  const { data: response } = useSWR(
    mounted && enabled && !dismissed ? "admin/dashboard/kickoff" : null,
    getDailyKickoffAction,
    {
      dedupingInterval: 60000,
      revalidateOnFocus: false,
    },
  );

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(dismissKey, "true");
    } catch {
      // Ignora erro de localStorage
    }
  };

  if (!mounted || !enabled || dismissed || !response?.success) {
    return null;
  }

  const { professionalName, appointmentsToday, pendingRequests, birthdaysToday } =
    response.data;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <>
      {/* ── Visual Mobile (< sm): Barra ultra-compacta, limpa e minimalista ── */}
      <div className="sm:hidden flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl border border-border/60 bg-card/70 backdrop-blur-xs shadow-xs animate-in fade-in duration-200">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Coffee className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-xs font-bold text-foreground truncate">
              {greeting}, {professionalName}!
            </h2>
            <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
              <strong className="text-foreground font-semibold">
                {appointmentsToday} {appointmentsToday === 1 ? "atendimento" : "atendimentos"}
              </strong>{" "}
              hoje
              {pendingRequests > 0 && (
                <span className="text-blue-500 dark:text-blue-400 font-medium">
                  {" "}• {pendingRequests} {pendingRequests === 1 ? "solicitação" : "solicitações"}
                </span>
              )}
              {birthdaysToday > 0 && (
                <span className="text-amber-500 dark:text-amber-400 font-medium">
                  {" "}• {birthdaysToday} {birthdaysToday === 1 ? "aniversário" : "aniversários"}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href="/admin/agenda"
            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-[11px] font-semibold transition-all active:scale-95"
          >
            Agenda
            <ArrowRight className="h-2.5 w-2.5" />
          </Link>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Fechar resumo"
            aria-label="Fechar resumo"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Visual Desktop (>= sm): Banner completo e informativo ── */}
      <div className="hidden sm:flex rounded-2xl border border-primary/20 bg-linear-to-r from-primary/10 via-primary/5 to-transparent p-4 sm:p-5 flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs relative animate-in fade-in duration-300">
        {/* Informações e Saudação */}
        <div className="flex items-start gap-3.5 pr-6 sm:pr-0">
          <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <Coffee className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              {greeting}, {professionalName}!
            </h2>

            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed">
              Hoje você tem{" "}
              <strong className="text-foreground font-semibold">
                {appointmentsToday} {appointmentsToday === 1 ? "atendimento" : "atendimentos"}
              </strong>
              {pendingRequests > 0 && (
                <>
                  ,{" "}
                  <strong className="text-blue-600 dark:text-blue-400 font-semibold">
                    {pendingRequests} {pendingRequests === 1 ? "solicitação online" : "solicitações online"}
                  </strong>
                </>
              )}
              {birthdaysToday > 0 && (
                <>
                  {" "}e{" "}
                  <strong className="text-amber-600 dark:text-amber-400 font-semibold">
                    {birthdaysToday} {birthdaysToday === 1 ? "aniversariante" : "aniversariantes"}
                  </strong>
                </>
              )}
              . Tenha um excelente dia de trabalho!
            </p>
          </div>
        </div>

        {/* Ações e Botão Fechar */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          <Link
            href="/admin/agenda"
            className="inline-flex items-center gap-1.5 h-8 sm:h-9 px-3 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
          >
            <Calendar className="h-3.5 w-3.5" />
            Ver Agenda
            <ArrowRight className="h-3 w-3 ml-0.5" />
          </Link>

          {birthdaysToday > 0 && (
            <Link
              href="/admin/birthdays"
              className="inline-flex items-center gap-1.5 h-8 sm:h-9 px-3 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-semibold transition-colors"
            >
              <BirthdayCake className="h-3.5 w-3.5" />
              Parabenizar
            </Link>
          )}

          {pendingRequests > 0 && (
            <Link
              href="/admin/auto/requests"
              className="inline-flex items-center gap-1.5 h-8 sm:h-9 px-3 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 text-xs font-semibold transition-colors"
            >
              <Clock className="h-3.5 w-3.5" />
              Aprovar
            </Link>
          )}

          {/* Botão Dispensar com 1 clique */}
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Fechar resumo de hoje"
            aria-label="Fechar resumo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}


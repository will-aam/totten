"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getAutoBookingStatusAction } from "@/app/actions/notifications";
import {
  Calendar,
  CalendarX,
  Package,
  Last,
  FileDetail,
  Coffee,
  CheckCircle,
} from "@boxicons/react";

export interface NotificationPreferences {
  // Feed do Sino
  notifyCheckin: boolean;
  notifyBookingRequests: boolean;
  notifyCancellations: boolean;
  notifyLastSession: boolean;
  notifyLowStock: boolean;

  // Resumo Matinal
  dailyKickoff: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  notifyCheckin: true,
  notifyBookingRequests: true,
  notifyCancellations: true,
  notifyLastSession: true,
  notifyLowStock: true,
  dailyKickoff: true,
};

const STORAGE_KEY = "totten_notification_preferences";

export function NotificationsSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
  const [isLoaded, setIsLoaded] = useState(false);

  // SWR: Cache global em memória com dedupingInterval de 60s
  const { data: autoBookingRes } = useSWR(
    "admin/auto-booking-status",
    getAutoBookingStatusAction,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      dedupingInterval: 60000,
    },
  );

  const isAutoBookingActive = autoBookingRes?.success ? autoBookingRes.isActive : null;

  // Carrega as preferências do navegador
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setPreferences({
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          ...JSON.parse(saved),
        });
      }
    } catch {
      // Fallback para valores padrão
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Atualiza e persiste a preferência selecionada
  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      toast.success("Preferência de alerta atualizada!");
    } catch {
      toast.error("Erro ao salvar preferência no navegador");
    }

  };

  return (
    <Card className="border-none shadow-none bg-transparent rounded-none md:rounded-3xl md:border md:border-border/60 md:bg-card md:shadow-xs overflow-hidden">
      {/* Header limpo e chapado no mobile */}
      <CardHeader className="px-0 pt-0 pb-4 md:p-6 md:pb-2">
        <CardTitle className="text-xl font-bold tracking-tight text-foreground">
          Alertas do Sistema
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground mt-1">
          Defina quais avisos e oportunidades você deseja visualizar no seu dia a dia.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-0 pb-0 md:p-6 md:pt-4 grid gap-8">
        {/* GRUPO 1: FEED DO SINO (NO CABEÇALHO) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-foreground uppercase tracking-wider">
              Avisos no Sino do Painel (Feed Silencioso)
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Essas atividades geram alertas no ícone do sino para você consultar no seu ritmo entre atendimentos.
          </p>

          <div className="grid gap-3 pt-1">
            {/* Check-ins */}
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/50 p-4 bg-background/50 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center shrink-0 text-primary">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-foreground cursor-pointer">
                    Check-in de Clientes
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Avisar quando um cliente confirmar presença pelo Totem de autoatendimento.
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.notifyCheckin}
                onCheckedChange={(val) => handleToggle("notifyCheckin", val)}
                disabled={!isLoaded}
              />
            </div>

            {/* Agendamentos Online */}
            <div
              className={cn(
                "flex items-center justify-between gap-4 rounded-2xl border border-border/50 p-4 transition-colors",
                isAutoBookingActive === false
                  ? "bg-muted/20 opacity-75"
                  : "bg-background/50 hover:bg-muted/20",
              )}
            >
              <div className="flex items-center gap-3.5">
                <div className="h-9 w-9 bg-blue-500/10 rounded-full flex items-center justify-center shrink-0 text-blue-500">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Label
                      className={cn(
                        "text-sm font-semibold text-foreground",
                        isAutoBookingActive === false
                          ? "cursor-default"
                          : "cursor-pointer",
                      )}
                    >
                      Solicitações de Agendamento Online
                    </Label>
                    {isAutoBookingActive === false && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-semibold bg-muted/80 text-muted-foreground border border-border/60"
                      >
                        Desativado no Autoatendimento
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isAutoBookingActive === false ? (
                      <>
                        O autoagendamento está desativado. Para receber solicitações,{" "}
                        <Link
                          href="/admin/custom-page"
                          className="text-primary underline font-medium hover:text-primary/80"
                        >
                          ative a sua Página Personalizada
                        </Link>
                        .
                      </>
                    ) : (
                      "Avisar quando novos clientes solicitarem horários pelo seu link público."
                    )}
                  </p>
                </div>
              </div>
              <Switch
                checked={
                  isAutoBookingActive === false
                    ? false
                    : preferences.notifyBookingRequests
                }
                onCheckedChange={(val) =>
                  handleToggle("notifyBookingRequests", val)
                }
                disabled={!isLoaded || isAutoBookingActive === false}
              />
            </div>

            {/* Cancelamentos pelo Cliente */}
            <div
              className={cn(
                "flex items-center justify-between gap-4 rounded-2xl border border-border/50 p-4 transition-colors",
                isAutoBookingActive === false
                  ? "bg-muted/20 opacity-75"
                  : "bg-background/50 hover:bg-muted/20",
              )}
            >
              <div className="flex items-center gap-3.5">
                <div className="h-9 w-9 bg-rose-500/10 rounded-full flex items-center justify-center shrink-0 text-rose-500">
                  <CalendarX className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Label
                      className={cn(
                        "text-sm font-semibold text-foreground",
                        isAutoBookingActive === false
                          ? "cursor-default"
                          : "cursor-pointer",
                      )}
                    >
                      Cancelamento de Horário pelo Cliente
                    </Label>
                    {isAutoBookingActive === false && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-semibold bg-muted/80 text-muted-foreground border border-border/60"
                      >
                        Desativado no Autoatendimento
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isAutoBookingActive === false ? (
                      <>
                        Com o autoatendimento desativado, clientes não conseguem desmarcar horários online.{" "}
                        <Link
                          href="/admin/custom-page"
                          className="text-primary underline font-medium hover:text-primary/80"
                        >
                          Ver autoatendimento
                        </Link>
                        .
                      </>
                    ) : (
                      "Sinalizar quando um cliente desmarcar pela Área do Cliente, liberando o horário para novos encaixes."
                    )}
                  </p>
                </div>
              </div>
              <Switch
                checked={
                  isAutoBookingActive === false
                    ? false
                    : preferences.notifyCancellations
                }
                onCheckedChange={(val) =>
                  handleToggle("notifyCancellations", val)
                }
                disabled={!isLoaded || isAutoBookingActive === false}
              />
            </div>

            {/* Última Sessão de Pacote */}
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/50 p-4 bg-background/50 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="h-9 w-9 bg-amber-500/10 rounded-full flex items-center justify-center shrink-0 text-amber-500">
                  <Last className="h-4 w-4" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-foreground cursor-pointer">
                    Última Sessão de Pacote
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Avisar no sino quando um cliente estiver realizando o encerramento do pacote no dia.
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.notifyLastSession}
                onCheckedChange={(val) => handleToggle("notifyLastSession", val)}
                disabled={!isLoaded}
              />
            </div>

            {/* Estoque */}
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/50 p-4 bg-background/50 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="h-9 w-9 bg-amber-500/10 rounded-full flex items-center justify-center shrink-0 text-amber-500">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-foreground cursor-pointer">
                    Estoque Mínimo Atingido
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Avisar no sino quando insumos ou produtos de revenda estiverem acabando.
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.notifyLowStock}
                onCheckedChange={(val) => handleToggle("notifyLowStock", val)}
                disabled={!isLoaded}
              />
            </div>
          </div>
        </div>

        {/* GRUPO 2: RESUMO MATINAL NO DASHBOARD */}
        <div className="space-y-3 pt-2 border-t border-border/40">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-foreground uppercase tracking-wider">
              Resumo Matinal (Dashboard)
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Apresentação rápida do panorama do seu dia assim que você acessa o sistema.
          </p>

          <div className="grid gap-3 pt-1">
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/50 p-4 bg-background/50 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="h-9 w-9 bg-emerald-500/10 rounded-full flex items-center justify-center shrink-0 text-emerald-500">
                  <Coffee className="h-4 w-4" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-foreground cursor-pointer">
                    Cartão &quot;Daily Kickoff&quot; no Dashboard
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Exibir cartão com o resumo de atendimentos e aniversariantes do dia (dispensável com 1 clique).
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.dailyKickoff}
                onCheckedChange={(val) => handleToggle("dailyKickoff", val)}
                disabled={!isLoaded}
              />
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}

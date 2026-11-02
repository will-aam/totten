// app/(private)/admin/dashboard/_components/push-notification-modal.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  BellRing,
  Phone,
  Shield,
  CalendarCheck,
  UserCheck,
  AlertTriangle,
  ArrowOutUpLeftStrokeSquare,
  LoaderLines,
} from "@boxicons/react";
import { savePushSubscriptionAction } from "@/app/actions/push";

export function PushNotificationModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(true);

  // Verifica o estado atual de permissão ao montar no Dashboard
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setIsSupported(false);
      return;
    }

    const currentPermission = Notification.permission;
    setPermissionState(currentPermission);

    // Se ainda não tiver permissão concedida ("default" ou "denied"), abre o modal
    if (currentPermission !== "granted") {
      // Pequeno timeout suave para não colidir com o carregamento inicial da página
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  // Solicita permissão e registra subscrição
  const handleEnablePush = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Este navegador não suporta notificações Push.");
      return;
    }

    setIsRequesting(true);

    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);

      if (permission === "granted") {
        // 1. Tenta obter o Service Worker registrado
        let subscription: any = null;

        if ("serviceWorker" in navigator) {
          try {
            const registration = await navigator.serviceWorker.ready;

            // Envia notificação imediata de boas-vindas / teste
            registration.showNotification("Notificações Totten Ativadas! 🎉", {
              body: "Seu aparelho agora receberá alertas de agendamentos e check-ins em tempo real.",
              icon: "/android-chrome-192x192.png",
              badge: "/favicon-32x32.png",
              vibrate: [200, 100, 200],
              data: { url: "/admin/dashboard" },
            } as any);

            // Tenta inscrever no pushManager se disponível
            if ("pushManager" in registration) {
              const existingSub = await registration.pushManager.getSubscription();
              if (existingSub) {
                subscription = existingSub.toJSON();
              }
            }
          } catch (swErr) {
            console.warn("[Push] Service Worker push subscription aviso:", swErr);
          }
        }

        // 2. Salva subscrição no backend se disponível
        if (subscription && subscription.endpoint) {
          await savePushSubscriptionAction({
            endpoint: subscription.endpoint,
            keys: subscription.keys,
            userAgent: navigator.userAgent,
          }).catch(() => { });
        }

        // 3. Salva preferência no localStorage
        try {
          const savedPrefs = localStorage.getItem("totten_notification_preferences");
          const prefs = savedPrefs ? JSON.parse(savedPrefs) : {};
          localStorage.setItem(
            "totten_notification_preferences",
            JSON.stringify({ ...prefs, mobilePush: true }),
          );
        } catch {
          // Ignora
        }

        toast.success("Notificações Push ativadas com sucesso! 🎉", {
          description: "Seu celular receberá avisos em tempo real como um app nativo.",
        });

        // Fecha o modal definitivamente já que a permissão agora é "granted"
        setIsOpen(false);
      } else if (permission === "denied") {
        toast.error("Permissão de notificações bloqueada no navegador.", {
          description: "Veja as instruções abaixo para desbloquear nas configurações.",
        });
      }
    } catch (err: any) {
      console.error("[Push] Erro ao solicitar permissão:", err);
      toast.error("Erro ao ativar notificações: " + (err?.message || "Tente novamente."));
    } finally {
      setIsRequesting(false);
    }
  };

  // Re-verifica se o usuário já desbloqueou no navegador
  const handleCheckAgain = () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const current = Notification.permission;
      setPermissionState(current);
      if (current === "granted") {
        toast.success("Permissão detectada! Notificações ativadas.");
        setIsOpen(false);
      } else if (current === "denied") {
        toast.info("Ainda consta como 'Bloqueado'. Siga os passos acima no navegador.");
      } else {
        handleEnablePush();
      }
    }
  };

  if (!isSupported) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border border-border/80 rounded-3xl shadow-2xl bg-card">
        {/* Top Header Decorativo */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-primary/5 to-background p-6 pt-7 border-b border-border/40 text-center flex flex-col items-center">


          {/* Ícone Hero */}
          <div className="relative mb-3">
            <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <BellRing className="h-8 w-8 animate-bounce duration-1000" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs border-2 border-background">
              <Phone className="h-3 w-3" />
            </div>
          </div>

          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            {permissionState === "denied"
              ? "Notificações Bloqueadas no Aparelho"
              : "Ative as Notificações no seu Celular"}
          </DialogTitle>

          <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-sm">
            {permissionState === "denied"
              ? "Seu navegador está bloqueando alertas do Totten. Siga o passo a passo abaixo para permitir."
              : "O Totten funciona como um aplicativo de celular. Receba avisos mesmo com a tela bloqueada."}
          </DialogDescription>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 space-y-4">
          {permissionState === "denied" ? (
            // Instruções de Desbloqueio caso o usuário tenha clicado em bloquear no passado
            <div className="space-y-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                Como permitir no seu navegador:
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-amber-950/80 dark:text-amber-200/80 leading-relaxed">
                <li>
                  Toque no ícone de <strong>configurações ou cadeado 🔒</strong> ao lado do endereço do site.
                </li>
                <li>
                  Acesse <strong>&quot;Permissões&quot;</strong> ou <strong>&quot;Configurações do site&quot;</strong>.
                </li>
                <li>
                  Localize <strong>Notificações</strong> e altere para <strong>&quot;Permitir&quot;</strong>.
                </li>
              </ol>
            </div>
          ) : (
            // Lista de Benefícios
            <div className="space-y-2.5">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/40 border border-border/40">
                <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <CalendarCheck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">
                    Novos Agendamentos Online
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Saiba instantaneamente quando um cliente reservar horário pelo seu link.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/40 border border-border/40">
                <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">
                    Check-in Presencial no Totem
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Receba um alerta na hora em que seu cliente confirmar presença na clínica.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/40 border border-border/40">
                <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">
                    Alerta Discreto e Silencioso
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Notificações limpas, sem sons estridentes nem interrupções enquanto atende.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex flex-col gap-2 pt-2">
            {permissionState === "denied" ? (
              <Button
                type="button"
                className="w-full h-11 rounded-2xl font-bold gap-2 text-sm shadow-md"
                onClick={handleCheckAgain}
              >
                <ArrowOutUpLeftStrokeSquare flip="horizontal" className="h-4 w-4" />
                Já Desbloqueei, Verificar Novamente
              </Button>
            ) : (
              <Button
                type="button"
                className="w-full h-11 rounded-2xl font-bold gap-2 text-sm shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleEnablePush}
                disabled={isRequesting}
              >
                {isRequesting ? (
                  <>
                    <LoaderLines className="h-4 w-4 animate-spin" />
                    Solicitando Permissão...
                  </>
                ) : (
                  <>
                    <BellRing className="h-4 w-4" />
                    Ativar Notificações no Celular
                  </>
                )}
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              className="w-full h-9 rounded-xl text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setIsOpen(false)}
            >
              Lembrar Mais Tarde
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

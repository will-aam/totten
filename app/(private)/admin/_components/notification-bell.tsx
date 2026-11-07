"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Checks,
  CheckCircle,
  Calendar,
  CalendarX,
  Package,
  Slider,
  Inbox,
  ArrowRight,
  Sparkles,
} from "@boxicons/react";
import {
  getNotificationsAction,
  type NotificationItem,
} from "@/app/actions/notifications";
import { DEFAULT_NOTIFICATION_PREFERENCES, type NotificationPreferences } from "../settings/_components/notifications-settings";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const PREFS_STORAGE_KEY = "totten_notification_preferences";
const READ_IDS_STORAGE_KEY = "totten_read_notifications";
const LAST_READ_STORAGE_KEY = "totten_notifications_last_read";

export function NotificationBell() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "unread">("all");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [lastReadTimestamp, setLastReadTimestamp] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
  const [isClient, setIsClient] = useState(false);

  // Carrega estado de lidas e preferências do localStorage
  useEffect(() => {
    setIsClient(true);
    try {
      const savedReadIds = localStorage.getItem(READ_IDS_STORAGE_KEY);
      if (savedReadIds) {
        setReadIds(new Set(JSON.parse(savedReadIds)));
      }
      const savedLastRead = localStorage.getItem(LAST_READ_STORAGE_KEY);
      if (savedLastRead) {
        setLastReadTimestamp(savedLastRead);
      }
      const savedPrefs = localStorage.getItem(PREFS_STORAGE_KEY);
      if (savedPrefs) {
        setPreferences({
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          ...JSON.parse(savedPrefs),
        });
      }
    } catch {
      // Ignora erro de parsing
    }
  }, []);

  // Polling leve a cada 30 segundos
  const { data: response, isLoading } = useSWR(
    "admin/notifications",
    getNotificationsAction,
    {
      refreshInterval: 30000,
      dedupingInterval: 15000,
      revalidateOnFocus: true,
    },
  );

  const rawNotifications = response?.data || [];

  // Filtra de acordo com as preferências do autônomo
  const filteredNotifications = useMemo(() => {
    return rawNotifications.filter((item) => {
      if (item.type === "CHECK_IN" && !preferences.notifyCheckin) return false;
      if (
        item.type === "BOOKING_REQUEST" &&
        !preferences.notifyBookingRequests
      )
        return false;
      if (item.type === "CANCELLATION" && !preferences.notifyCancellations)
        return false;
      if (item.type === "LOW_STOCK" && !preferences.notifyLowStock)
        return false;
      if (item.type === "LAST_SESSION" && !preferences.notifyLastSession)
        return false;
      return true;
    });
  }, [rawNotifications, preferences]);

  // Função auxiliar para checar se está lida
  const isNotificationRead = (item: NotificationItem) => {
    if (readIds.has(item.id)) return true;
    if (lastReadTimestamp) {
      return new Date(item.timestamp) <= new Date(lastReadTimestamp);
    }
    return false;
  };

  // Contagem de não lidas
  const unreadCount = useMemo(() => {
    if (!isClient) return 0;
    return filteredNotifications.filter((item) => !isNotificationRead(item))
      .length;
  }, [filteredNotifications, readIds, lastReadTimestamp, isClient]);

  // Lista para exibição (Todas ou apenas Não Lidas)
  const displayedNotifications = useMemo(() => {
    if (activeFilter === "unread") {
      return filteredNotifications.filter((item) => !isNotificationRead(item));
    }
    return filteredNotifications;
  }, [filteredNotifications, activeFilter, readIds, lastReadTimestamp]);

  // Marcar uma notificação específica como lida
  const handleMarkAsRead = (id: string) => {
    const updated = new Set(readIds);
    updated.add(id);
    setReadIds(updated);
    try {
      localStorage.setItem(READ_IDS_STORAGE_KEY, JSON.stringify(Array.from(updated)));
    } catch {
      // Ignora
    }
  };

  // Marcar todas como lidas
  const handleMarkAllAsRead = () => {
    const nowIso = new Date().toISOString();
    setLastReadTimestamp(nowIso);
    try {
      localStorage.setItem(LAST_READ_STORAGE_KEY, nowIso);
    } catch {
      // Ignora
    }
  };

  // Ícone e cores para cada tipo de notificação
  const getNotificationIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "CHECK_IN":
        return (
          <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle className="h-4 w-4" />
          </div>
        );
      case "BOOKING_REQUEST":
        return (
          <div className="h-8 w-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Calendar className="h-4 w-4" />
          </div>
        );
      case "CANCELLATION":
        return (
          <div className="h-8 w-8 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <CalendarX className="h-4 w-4" />
          </div>
        );
      case "LOW_STOCK":
        return (
          <div className="h-8 w-8 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Package className="h-4 w-4" />
          </div>
        );
      case "LAST_SESSION":
        return (
          <div className="h-8 w-8 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
        );
    }
  };

  const renderTrigger = (
    <button
      type="button"
      className="relative flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label="Abrir notificações"
    >
      <Bell className="h-4 w-4 sm:h-4.5 sm:w-4.5" />

      {/* Badge vermelho discreto de não lidas */}
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs animate-in zoom-in duration-200">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );

  const renderContent = (isSheet: boolean) => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Cabeçalho */}
      <div className={cn("p-4 pb-3 border-b border-border/40 bg-muted/20", isSheet && "pr-12")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-base text-foreground">Notificações</h2>
            {unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              >
                {unreadCount} nova{unreadCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline transition-all"
            >
              <Checks className="h-3.5 w-3.5" />
              Marcar lidas
            </button>
          )}
        </div>

        {/* Filtros: Todas vs Não Lidas */}
        <div className="flex gap-1.5 mt-3">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold transition-colors",
              activeFilter === "all"
                ? "bg-foreground text-background"
                : "bg-muted/50 text-muted-foreground hover:text-foreground",
            )}
          >
            Todas ({filteredNotifications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("unread")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold transition-colors",
              activeFilter === "unread"
                ? "bg-foreground text-background"
                : "bg-muted/50 text-muted-foreground hover:text-foreground",
            )}
          >
            Não lidas ({unreadCount})
          </button>
        </div>
      </div>

      {/* Lista de Notificações */}
      <div
        className={cn(
          "overflow-y-auto divide-y divide-border/30 custom-scrollbar",
          isSheet ? "flex-1 min-h-[220px] max-h-[60dvh]" : "max-h-[380px]"
        )}
      >
        {displayedNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center mb-2.5">
              <Inbox className="h-5 w-5 text-muted-foreground/70" />
            </div>
            <p className="text-sm font-semibold text-foreground">Tudo limpo por aqui</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activeFilter === "unread"
                ? "Você leu todas as notificações recentes."
                : "Nenhuma atividade registrada nas últimas 48 horas."}
            </p>
          </div>
        ) : (
          displayedNotifications.map((item) => {
            const isRead = isNotificationRead(item);
            const relativeTime = formatDistanceToNow(new Date(item.timestamp), {
              addSuffix: true,
              locale: ptBR,
            });

            return (
              <div
                key={item.id}
                onClick={() => {
                  handleMarkAsRead(item.id);
                  if (item.actionUrl) {
                    setOpen(false);
                    router.push(item.actionUrl);
                  }
                }}
                className={cn(
                  "flex items-start gap-3 p-3.5 transition-colors cursor-pointer",
                  !isRead
                    ? "bg-primary/5 hover:bg-primary/10"
                    : "hover:bg-muted/30",
                )}
              >
                {getNotificationIcon(item.type)}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {!isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                      <p className="text-xs font-bold text-foreground truncate">
                        {item.title}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                      {relativeTime}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>

                  {item.actionUrl && (
                    <div className="mt-2 flex items-center justify-between">
                      <Link
                        href={item.actionUrl}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(item.id);
                          setOpen(false);
                          router.push(item.actionUrl!);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                      >
                        {item.actionLabel || "Visualizar"}
                        <ArrowRight className="h-3 w-3" />
                      </Link>

                      {!isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Rodapé: Link para Configurações */}
      <div
        className={cn(
          "p-2.5 border-t border-border/40 bg-muted/10 text-center",
          isSheet ? "pb-6" : ""
        )}
      >
        <Link
          href="/admin/settings"
          onClick={() => setOpen(false)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Slider className="h-3.5 w-3.5" />
          Configurar preferências de alertas
        </Link>
      </div>
    </div>
  );

  if (isClient && isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          {renderTrigger}
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="rounded-t-[28px] max-h-[85dvh] p-0 flex flex-col gap-0 border-t border-border/50 bg-card overflow-hidden shadow-2xl focus:outline-none"
        >
          {/* Indicador visual de arraste (drag handle) */}
          <div className="pt-2.5 pb-1 flex justify-center shrink-0">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          <SheetHeader className="sr-only">
            <SheetTitle>Notificações</SheetTitle>
            <SheetDescription>Central de notificações e alertas do sistema</SheetDescription>
          </SheetHeader>

          {renderContent(true)}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {renderTrigger}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-96 p-0 rounded-2xl shadow-xl border border-border/60 bg-card overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200"
      >
        {renderContent(false)}
      </PopoverContent>
    </Popover>
  );
}


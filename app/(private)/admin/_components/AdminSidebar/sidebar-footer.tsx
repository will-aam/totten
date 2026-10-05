"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ChessQueen,
  HeadphoneMic,
  Cog,
  Power,
  LoaderDots,
  Moon,
  Sun,
} from "@boxicons/react";
import { SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface SidebarUserFooterProps {
  isOwner: boolean;
  whatsappUrl: string;
  loggingOut: boolean;
  onLogout: () => void;
  onNavigate: () => void;
  userImage?: string | null;
  userName?: string | null;
}

type FooterAction = {
  name: string;
  icon: React.ReactNode;
  onClick: () => void;
  show: boolean;
  danger?: boolean;
};

export function SidebarUserFooter({
  isOwner,
  whatsappUrl,
  loggingOut,
  onLogout,
  onNavigate,
  userImage,
  userName,
}: SidebarUserFooterProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Esc fecha o menu
  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const go = (href: string) => {
    onNavigate();
    router.push(href);
  };

  const isDark = theme === "dark";

  // Ordem: conta → ajuda → aparência → sair (o último fica colado no avatar)
  const actions: FooterAction[] = [
    {
      name: "Meu Plano",
      icon: <ChessQueen size="sm" />,
      onClick: () => go("/admin/plan"),
      show: isOwner,
    },
    {
      name: "Configurações",
      icon: <Cog size="sm" />,
      onClick: () => go("/admin/settings"),
      show: isOwner,
    },
    {
      name: "Suporte",
      icon: <HeadphoneMic size="sm" />,
      onClick: () => window.open(whatsappUrl, "_blank"),
      show: isOwner,
    },
    {
      name: isDark ? "Modo Claro" : "Modo Escuro",
      icon: mounted ? (
        isDark ? <Sun size="sm" /> : <Moon size="sm" />
      ) : (
        <span className="w-5 h-5" />
      ),
      onClick: () => setTheme(isDark ? "light" : "dark"),
      show: true,
    },
    {
      name: "Sair",
      icon: loggingOut ? (
        <LoaderDots size="sm" className="animate-spin" />
      ) : (
        <Power size="sm" />
      ),
      onClick: onLogout,
      show: true,
      danger: true,
    },
  ];

  const visibleActions = actions.filter((a) => a.show);

  const avatar = (
    <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ring-2 ring-primary/20">
      {userImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={userImage}
          alt={userName || "Usuário"}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-primary text-sm font-bold text-primary-foreground">
          {userName ? userName.charAt(0).toUpperCase() : "U"}
        </span>
      )}
    </span>
  );

  return (
    <SidebarFooter
      className={cn(
        "relative border-none p-3 pb-4",
        // recolhida: tudo centralizado no eixo da coluna de 3rem
        "group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
      )}
    >
      {/* Fundo invisível: clique fora fecha o menu */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden
        />
      )}

      {/* Menu do usuário */}
      {isOpen && (
        <div
          role="menu"
          className={cn(
            "absolute bottom-full z-50 mb-1 flex flex-col",
            isCollapsed
              ? "left-1/2 -translate-x-1/2 items-center gap-2"
              : "inset-x-3 gap-0.5 rounded-2xl border border-border/60 bg-background/95 p-1.5 shadow-lg backdrop-blur-md",
          )}
        >
          {visibleActions.map((action, i) => {
            const isLast = i === visibleActions.length - 1;
            return (
              <React.Fragment key={action.name}>
                {/* Sair fica separado do resto, sem desenhar linha */}
                {isLast && !isCollapsed && visibleActions.length > 1 && (
                  <div className="h-1" aria-hidden />
                )}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                  title={isCollapsed ? action.name : undefined}
                  aria-label={action.name}
                  className={cn(
                    "flex items-center transition-colors animate-in fade-in slide-in-from-bottom-3 active:scale-[0.98]",
                    isCollapsed
                      ? "size-10 justify-center rounded-full border border-border/50 bg-background/95 shadow-md backdrop-blur-md hover:bg-muted"
                      : "w-full gap-3 rounded-xl px-2 py-1.5 hover:bg-muted",
                  )}
                  style={{
                    animationDelay: `${(visibleActions.length - i) * 40}ms`,
                    animationFillMode: "backwards",
                  }}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full",
                      action.danger
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    {action.icon}
                  </span>
                  {!isCollapsed && (
                    <span
                      className={cn(
                        "whitespace-nowrap text-sm font-semibold",
                        action.danger
                          ? "text-destructive"
                          : "text-foreground",
                      )}
                    >
                      {action.name}
                    </span>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Gatilho: cartão do usuário (expandida) ou só o avatar (recolhida) */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Menu do usuário"
        className={cn(
          "relative z-50 flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-muted/60",
          isOpen && "bg-muted/60",
          "group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-full group-data-[collapsible=icon]:p-0",
        )}
      >
        {avatar}

        <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
          <span className="block truncate text-sm font-semibold text-sidebar-foreground">
            {userName || "Usuário"}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {isOwner ? "Administração" : "Equipe"}
          </span>
        </span>

        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className={cn(
            "shrink-0 text-muted-foreground transition-transform duration-200 group-data-[collapsible=icon]:hidden",
            isOpen ? "rotate-0" : "rotate-180",
          )}
        >
          <path d="m6 15 6-6 6 6" />
        </svg>
      </button>
    </SidebarFooter>
  );
}
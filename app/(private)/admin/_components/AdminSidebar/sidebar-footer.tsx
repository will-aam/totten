"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import {
  HeadphoneMic,
  Cog,
  Power,
  LoaderDots,
  Moon,
  Sun,
} from "@boxicons/react";
import { SidebarFooter, SidebarMenuButton } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface SidebarUserFooterProps {
  isOwner: boolean;
  whatsappUrl: string;
  loggingOut: boolean;
  onLogout: () => void;
  onNavigate: () => void;
}

export function SidebarUserFooter({
  isOwner,
  whatsappUrl,
  loggingOut,
  onLogout,
  onNavigate,
}: SidebarUserFooterProps) {
  const { theme, setTheme } = useTheme();

  return (
    <SidebarFooter className="p-4 mt-auto">
      <div className="flex items-center w-full bg-accent/40 border border-border/40 rounded-2xl p-1.5 shadow-sm">
        <SidebarMenuButton
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          tooltip="Alternar Tema"
          className="flex-1 h-10 justify-center rounded-xl bg-transparent hover:bg-background hover:text-primary transition-all hover:shadow-sm"
        >
          {theme === "dark" ? <Sun size="sm" /> : <Moon size="sm" />}
        </SidebarMenuButton>

        <SidebarMenuButton
          asChild
          tooltip="Suporte"
          className={cn(
            "flex-1 h-10 justify-center rounded-xl bg-transparent hover:bg-background hover:text-primary transition-all hover:shadow-sm",
            !isOwner && "hidden", // Esconde suporte para colaborador
          )}
        >
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <HeadphoneMic size="sm" />
          </a>
        </SidebarMenuButton>

        {isOwner && (
          <SidebarMenuButton
            asChild
            tooltip="Configurações"
            className="flex-1 h-10 justify-center rounded-xl bg-transparent hover:bg-background hover:text-primary transition-all hover:shadow-sm"
          >
            <Link href="/admin/settings" onClick={onNavigate}>
              <Cog size="sm" />
            </Link>
          </SidebarMenuButton>
        )}

        <SidebarMenuButton
          onClick={onLogout}
          disabled={loggingOut}
          tooltip="Sair"
          className="flex-1 h-10 justify-center rounded-xl bg-transparent hover:bg-destructive/10 text-destructive hover:text-destructive transition-all"
        >
          {loggingOut ? (
            <LoaderDots size="sm" className="animate-spin" />
          ) : (
            <Power size="sm" />
          )}
        </SidebarMenuButton>
      </div>
    </SidebarFooter>
  );
}

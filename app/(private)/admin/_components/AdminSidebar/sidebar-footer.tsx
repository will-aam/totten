import Link from "next/link";
import {
  User,
  Bell,
  HeadphoneMic,
  Cog,
  Power,
  LoaderDots,
} from "@boxicons/react";
import { SidebarFooter, SidebarMenuButton } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface SidebarUserFooterProps {
  isOwner: boolean;
  userEmail?: string | null;
  whatsappUrl: string;
  loggingOut: boolean;
  onLogout: () => void;
  onNavigate: () => void;
}

export function SidebarUserFooter({
  isOwner,
  userEmail,
  whatsappUrl,
  loggingOut,
  onLogout,
  onNavigate,
}: SidebarUserFooterProps) {
  return (
    <SidebarFooter className="p-4 border-t flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User size="sm" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-none mb-1">
              {isOwner ? "Administrador" : "Colaborador(a)"}
            </span>
            <span className="text-[10px] text-muted-foreground leading-none truncate max-w-35">
              {userEmail || "usuario@totten.com"}
            </span>
          </div>
        </div>
        <button className="relative p-2 text-muted-foreground hover:bg-muted rounded-full transition-all">
          <Bell size="sm" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
        </button>
      </div>

      <div className="h-px bg-border/50 w-full" />

      <div className="flex w-full items-center gap-1">
        <SidebarMenuButton
          asChild
          tooltip="Suporte"
          className={cn(
            "flex-1 justify-center bg-transparent hover:bg-transparent text-muted-foreground hover:text-primary",
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
            className="flex-1 justify-center bg-transparent hover:bg-transparent text-muted-foreground hover:text-foreground"
          >
            <Link href="/admin/settings" onClick={onNavigate}>
              <Cog size="sm" />
            </Link>
          </SidebarMenuButton>
        )}

        <SidebarMenuButton
          onClick={onLogout}
          disabled={loggingOut}
          className="flex-2 justify-center text-destructive hover:text-destructive hover:bg-destructive/10"
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

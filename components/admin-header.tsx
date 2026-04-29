// components/admin-header.tsx
"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { ChevronsRight, ChevronsLeft, CheckShield } from "@boxicons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

export function AdminHeader({ title }: { title: string }) {
  const { toggleSidebar, open } = useSidebar();
  const { data: session } = useSession();

  const slug = session?.user?.organizationSlug;

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between bg-background/60 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="relative flex items-center justify-center p-1.5 -ml-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-all active:scale-95 overflow-hidden"
        >
          {/* Sidebar aberto → seta esquerda (fechar). Fechado → seta direita (abrir) */}
          <span className="relative flex items-center justify-center w-6 h-6">
            <ChevronsRight
              size="base"
              removePadding
              className={cn(
                "absolute transition-all duration-300 ease-in-out",
                open
                  ? "opacity-0 -translate-x-3 scale-75"
                  : "opacity-100 translate-x-0 scale-100",
              )}
            />
            <ChevronsLeft
              size="base"
              removePadding
              className={cn(
                "absolute transition-all duration-300 ease-in-out",
                open
                  ? "opacity-100 translate-x-0 scale-100"
                  : "opacity-0 translate-x-3 scale-75",
              )}
            />
          </span>
          <span className="sr-only">Menu</span>
        </button>

        <h1 className="text-sm font-medium text-muted-foreground">{title}</h1>
      </div>

      <div className="flex items-center">
        <Button
          asChild
          variant="secondary"
          size="sm"
          className="group h-8 sm:h-9 gap-2 rounded-full font-medium text-xs sm:text-sm shadow-sm border border-border/50 bg-primary/5 hover:bg-primary/10 text-primary transition-all"
        >
          <Link href={slug ? `/totem/idle?slug=${slug}` : "/totem/idle"}>
            <span className="relative flex items-center justify-center w-4 h-4">
              <CheckShield
                size="base"
                removePadding
                pack="basic"
                className={cn(
                  "absolute transition-all duration-300",
                  "opacity-100 scale-100 group-hover:opacity-0 group-hover:scale-75",
                )}
              />
              <CheckShield
                size="base"
                removePadding
                pack="filled"
                className={cn(
                  "absolute transition-all duration-300",
                  "opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100",
                )}
              />
            </span>
            <span className="hidden sm:inline">Modo Check-in</span>
            <span className="sm:hidden">Totem</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}

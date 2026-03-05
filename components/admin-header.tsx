"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { AlignLeft, MonitorSmartphone } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

export function AdminHeader({ title }: { title: string }) {
  const { toggleSidebar } = useSidebar();
  const { data: session } = useSession();

  const slug = session?.user?.organizationSlug;

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between bg-background/60 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-1.5 -ml-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-all active:scale-95"
        >
          <AlignLeft className="h-5 w-5" strokeWidth={2} />
          <span className="sr-only">Menu</span>
        </button>
        <h1 className="text-sm font-medium text-muted-foreground">
          {title}
        </h1>{" "}
      </div>

      <div className="flex items-center">
        <Button
          asChild
          variant="secondary"
          size="sm"
          className="h-8 sm:h-9 gap-2 rounded-full font-medium text-xs sm:text-sm shadow-sm border border-border/50 bg-primary/5 hover:bg-primary/10 text-primary transition-all"
        >
          <Link href={slug ? `/totem/idle?slug=${slug}` : "/totem/idle"}>
            <MonitorSmartphone className="h-4 w-4" />
            <span className="hidden sm:inline">Modo Check-in</span>
            <span className="sm:hidden">Totem</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}

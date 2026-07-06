"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSidebar } from "@/components/ui/sidebar";
import { MenuLeft, CheckShield, ChevronDown, Slider } from "@boxicons/react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AgendaHeaderProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  title: string;
  subtitle: ReactNode;
  onOpenSettings: () => void;
}

export function AgendaHeader({
  selectedDate,
  onSelectDate,
  title,
  subtitle,
  onOpenSettings,
}: AgendaHeaderProps) {
  const { toggleSidebar } = useSidebar();
  const { data: session } = useSession();
  const slug = session?.user?.organizationSlug;

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between bg-background/60 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-1 sm:gap-2 min-w-0">
        <button
          onClick={toggleSidebar}
          className="relative flex items-center justify-center p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-all active:scale-95 shrink-0"
        >
          <MenuLeft size="base" removePadding />
          <span className="sr-only">Menu</span>
        </button>

        <Popover>
          <PopoverTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1.5 rounded-2xl transition-colors group min-w-0">
              <div className="text-left min-w-0">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-foreground leading-tight flex items-center gap-1.5 truncate">
                  <span className="truncate">{title}</span>
                  <ChevronDown
                    size="sm"
                    className="text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity shrink-0"
                  />
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium truncate">
                  {subtitle}
                </p>
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 rounded-2xl shadow-xl"
            align="start"
          >
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onSelectDate(date)}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSettings}
          className="rounded-full h-9 w-9 text-muted-foreground hover:bg-muted"
        >
          <Slider size="sm" />
        </Button>

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

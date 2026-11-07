import Link from "next/link";
import { ChevronLeft } from "@boxicons/react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  href: string;
  label?: string;
  className?: string;
}

export function BackButton({ href, label = "Voltar", className }: BackButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2.5 text-muted-foreground hover:text-foreground transition-all duration-200 group z-20 select-none",
        className
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/80 shadow-xs backdrop-blur-md transition-all duration-200 group-hover:bg-muted group-hover:scale-105 group-hover:border-border">
        <ChevronLeft removePadding className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-0.5" />
      </div>
      <span className="hidden sm:inline text-sm font-medium">{label}</span>
    </Link>
  );
}


// components/client/client-header.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, User } from "@boxicons/react";

export type ClientHeaderType = {
  id: string;
  name: string;
  cpf: string;
};

export function ClientHeader({ client }: { client: ClientHeaderType }) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 pb-4 md:pb-6 mb-2">
      <div className="flex items-center gap-3">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="rounded-full h-10 w-10 md:h-11 md:w-11 shrink-0 text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          <Link href="/admin/clients">
            <ChevronLeft
              removePadding
              className="h-5 w-5 md:h-6 md:w-6"
              strokeWidth={1.5}
            />
          </Link>
        </Button>
        <div className="flex flex-col">
          <span className="text-sm md:text-base font-bold text-foreground leading-tight flex items-center gap-1.5">
            <User className="h-4 w-4 text-primary" /> Ficha do Cliente
          </span>
        </div>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  DashboardAlt,
  CalendarDetail,
  ClipboardCheck,
  Gift,
  Note,
  Layers,
  Search,
  Lock,
} from "@boxicons/react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  navItems,
  cadastrosSubItems,
  registrosSubItems,
  autoatendimentoSubItems,
  financeSubItems,
} from "./AdminSidebar/nav-config";

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  const isOwner = session?.user?.role === "OWNER";
  const permissions: string[] = session?.user?.permissions ?? [];
  const canViewFinance = isOwner || permissions.includes("FINANCE");

  const canAccess = (item: { ownerOnly?: boolean; permission?: string }) => {
    if (isOwner) return true;
    if (item.ownerOnly) return false;
    if (item.permission && !permissions.includes(item.permission)) return false;
    return true;
  };

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 hover:bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground transition-colors"
      >
        <Search size="xs" className="opacity-70" />
        <span>Buscar página ou ação...</span>
        <kbd className="pointer-events-none ml-2 flex h-4 items-center gap-1 rounded bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground border border-border/50 shadow-2xs">
          <span className="text-[10px]">⌘</span>K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Busca Rápida de Páginas"
        description="Navegue rapidamente entre telas ou ações do sistema"
      >
        <CommandInput placeholder="O que você está procurando?" />
        <CommandList className="max-h-80 custom-scrollbar">
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

          <CommandGroup heading="Menu Principal">
            <CommandItem
              onSelect={() => runCommand(() => router.push("/admin/dashboard"))}
              className="gap-2.5 cursor-pointer py-2"
            >
              <DashboardAlt size="sm" className="text-muted-foreground" />
              <span>Dashboard</span>
            </CommandItem>
            {navItems.filter(canAccess).map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => {
                  if (item.active) {
                    runCommand(() => router.push(item.href));
                  }
                }}
                disabled={!item.active}
                className="gap-2.5 cursor-pointer py-2"
              >
                <item.icon size="sm" className="text-muted-foreground" />
                <span>{item.title}</span>
                {!item.active && (
                  <Lock size="xs" className="ml-auto opacity-40" />
                )}
              </CommandItem>
            ))}
          </CommandGroup>

          {isOwner && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Cadastros">
                {cadastrosSubItems.filter(canAccess).map((sub) => (
                  <CommandItem
                    key={sub.href}
                    onSelect={() => {
                      if (sub.active) {
                        runCommand(() => router.push(sub.href));
                      }
                    }}
                    disabled={!sub.active}
                    className="gap-2.5 cursor-pointer py-2"
                  >
                    <span className="size-2 rounded-full bg-primary/40 shrink-0" />
                    <span>{sub.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          <CommandSeparator />
          <CommandGroup heading="Registros">
            {registrosSubItems.filter(canAccess).map((sub) => (
              <CommandItem
                key={sub.href}
                onSelect={() => {
                  if (sub.active) {
                    runCommand(() => router.push(sub.href));
                  }
                }}
                disabled={!sub.active}
                className="gap-2.5 cursor-pointer py-2"
              >
                <span className="size-2 rounded-full bg-primary/40 shrink-0" />
                <span>{sub.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          {canViewFinance && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Financeiro">
                {financeSubItems.filter(canAccess).map((sub) => (
                  <CommandItem
                    key={sub.href}
                    onSelect={() => {
                      if (sub.active) {
                        runCommand(() => router.push(sub.href));
                      }
                    }}
                    disabled={!sub.active}
                    className="gap-2.5 cursor-pointer py-2"
                  >
                    <span className="size-2 rounded-full bg-emerald-500/50 shrink-0" />
                    <span>{sub.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {isOwner && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Autoatendimento">
                {autoatendimentoSubItems.filter(canAccess).map((sub) => (
                  <CommandItem
                    key={sub.href}
                    onSelect={() => {
                      if (sub.active) {
                        runCommand(() => router.push(sub.href));
                      }
                    }}
                    disabled={!sub.active}
                    className="gap-2.5 cursor-pointer py-2"
                  >
                    <span className="size-2 rounded-full bg-sky-500/50 shrink-0" />
                    <span>{sub.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}


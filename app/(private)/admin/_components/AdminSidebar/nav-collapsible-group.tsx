"use client";

import Link from "next/link";
import { ChevronRight, Lock } from "@boxicons/react";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { NavIcon, type BoxIcon } from "./nav-icon";
import type { SubNavItem } from "./nav-config";

interface NavCollapsibleGroupProps {
  label: string;
  icon: BoxIcon;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isActive: boolean;
  items: SubNavItem[];
  pathname: string;
  onNavigate: () => void;
}

export function NavCollapsibleGroup({
  label,
  icon,
  isOpen,
  onOpenChange,
  isActive,
  items,
  pathname,
  onNavigate,
}: NavCollapsibleGroupProps) {
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;

  // Quando a sidebar está RECOLHIDA (apenas ícones em desktop),
  // o item se comporta como um Menu Flutuante / Popover Dropdown lateral
  if (isCollapsed) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              isActive={isActive}
              className="hover:bg-muted/50 w-full"
              tooltip={label}
            >
              <div className="flex items-center justify-center w-full">
                <NavIcon icon={icon} isActive={isActive} />
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="right"
            align="start"
            sideOffset={12}
            className="w-52 rounded-xl p-1.5 shadow-xl border border-border/60 bg-popover/95 backdrop-blur-md animate-in fade-in-50 zoom-in-95"
          >
            <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {label}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1" />
            {items.map((subItem) => {
              const isSubActive =
                pathname.startsWith(subItem.href) && subItem.active;

              return (
                <DropdownMenuItem key={subItem.title} asChild={subItem.active}>
                  {subItem.active ? (
                    <Link
                      href={subItem.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors",
                        isSubActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-foreground hover:bg-muted",
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          isSubActive ? "bg-primary" : "bg-muted-foreground/40",
                        )}
                      />
                      <span>{subItem.title}</span>
                    </Link>
                  ) : (
                    <div className="flex items-center justify-between px-2.5 py-2 text-xs text-muted-foreground/60 opacity-60 cursor-not-allowed">
                      <div className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-muted-foreground/30" />
                        <span>{subItem.title}</span>
                      </div>
                      <Lock size="xs" className="opacity-50" />
                    </div>
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }

  // Quando a sidebar está EXPANDIDA, funciona como sanfona normal
  return (
    <Collapsible
      asChild
      className="group/collapsible w-full"
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={isActive} className="hover:bg-muted/50">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <NavIcon icon={icon} isActive={isActive} />
                <span>{label}</span>
              </div>
              <ChevronRight
                size="xs"
                className="text-muted-foreground/50 transition-transform group-data-[state=open]/collapsible:rotate-90"
              />
            </div>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="border-l border-border ml-4 mt-1">
            {items.map((subItem) => (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton
                  asChild={subItem.active}
                  isActive={pathname.startsWith(subItem.href) && subItem.active}
                  className={cn(
                    "py-2",
                    !subItem.active && "opacity-50 cursor-not-allowed",
                  )}
                >
                  {subItem.active ? (
                    <Link href={subItem.href} onClick={onNavigate}>
                      <span className="text-xs">{subItem.title}</span>
                    </Link>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs">{subItem.title}</span>
                      <Lock size="xs" className="opacity-50" />
                    </div>
                  )}
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

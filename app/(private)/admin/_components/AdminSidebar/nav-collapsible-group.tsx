import Link from "next/link";
import { ChevronRight, Lock } from "@boxicons/react";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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

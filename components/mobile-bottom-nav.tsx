"use client";

import { cn } from "@/lib/utils";
import type { BoxIconProps } from "@boxicons/react";

type BoxIcon = React.ForwardRefExoticComponent<
  BoxIconProps & React.RefAttributes<SVGSVGElement>
>;

export interface MobileNavItem {
  id: string;
  label: string;
  icon:
    | BoxIcon
    | React.ForwardRefExoticComponent<any>
    | React.ComponentType<any>;
}

interface MobileBottomNavProps {
  items: MobileNavItem[];
  activeId: string;
  onChange: (id: string) => void;
}

export function MobileBottomNav({
  items,
  activeId,
  onChange,
}: MobileBottomNavProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_10px_rgba(0,0,0,0.2)]">
      <div className="flex justify-around items-center h-16 px-2">
        {items.map((item) => {
          const isActive = activeId === item.id;
          const Icon = item.icon as BoxIcon;

          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200",
                isActive
                  ? "text-primary scale-105"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div className="p-1.5">
                {/* Dois ícones sobrepostos — basic some, filled aparece */}
                <span className="relative flex items-center justify-center w-5 h-5">
                  <Icon
                    pack="basic"
                    size="sm"
                    className={cn(
                      "absolute transition-all duration-300",
                      isActive ? "opacity-0 scale-75" : "opacity-100 scale-100",
                    )}
                  />
                  <Icon
                    pack="filled"
                    size="sm"
                    className={cn(
                      "transition-all duration-300",
                      isActive ? "opacity-100 scale-100" : "opacity-0 scale-75",
                    )}
                  />
                </span>
              </div>
              <span
                className={cn(
                  "text-[10px] tracking-wide transition-all duration-200",
                  isActive ? "font-bold" : "font-medium",
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

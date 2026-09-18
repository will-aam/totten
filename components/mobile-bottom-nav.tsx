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
  const activeIndex = items.findIndex((item) => item.id === activeId);

  return (
    <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
      <div className="flex h-[72px] bg-card dark:bg-[#1a1b1e] border border-border/50 rounded-[24px] shadow-2xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
        
        {/* Indicador Deslizante (sem o brilho de fundo) */}
        {activeIndex !== -1 && (
          <div
            className="absolute top-0 h-[3px] transition-transform duration-300 ease-out pointer-events-none z-20"
            style={{
              width: `${100 / items.length}%`,
              transform: `translateX(${activeIndex * 100}%)`,
              left: 0,
            }}
          >
            <div className="mx-auto w-1/2 h-full bg-primary rounded-b-md shadow-[0_2px_12px_hsl(var(--primary))]" />
          </div>
        )}

        {items.map((item) => {
          const isActive = activeId === item.id;
          const Icon = item.icon as BoxIcon;

          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={cn(
                "relative flex-1 flex flex-col items-center justify-center h-full space-y-1 transition-all duration-300 active:scale-95 z-10",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div className="relative z-10 p-1">
                <span className="relative flex items-center justify-center w-6 h-6">
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
                  "relative z-10 text-[10px] tracking-wide transition-all duration-300",
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

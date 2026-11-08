"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "@boxicons/react";
import { motion, type MotionProps } from "motion/react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

interface SidebarPlanCardProps {
  onNavigate?: () => void;
  isSystemOwner?: boolean;
}

const animationProps: MotionProps = {
  initial: { "--x": "100%", scale: 0.98 } as any,
  animate: { "--x": "-100%", scale: 1 } as any,
  whileTap: { scale: 0.97 },
  transition: {
    repeat: Infinity,
    repeatType: "loop",
    repeatDelay: 1.5,
    type: "spring",
    stiffness: 20,
    damping: 15,
    mass: 2,
    scale: {
      type: "spring",
      stiffness: 200,
      damping: 5,
      mass: 0.5,
    },
  },
};

export function SidebarPlanCard({
  onNavigate,
  isSystemOwner = false,
}: SidebarPlanCardProps) {
  const pathname = usePathname();
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;
  const isPlanPage = pathname.startsWith("/admin/plan");

  // Se a sidebar estiver recolhida (3rem de largura), não renderizamos o botão aqui
  // para manter a sidebar 100% limpa, sem elementos soltos ou desalinhados.
  if (isCollapsed) {
    return null;
  }

  return (
    <div className="px-3 py-1.5 w-full">
      <Link href="/admin/plan" onClick={onNavigate} className="block w-full">
        <motion.div
          className={cn(
            "group relative flex w-full items-center justify-between overflow-hidden rounded-xl p-2.5 backdrop-blur-xl transition-all duration-300 ease-in-out hover:shadow-xs",
            isSystemOwner
              ? "bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20"
              : "bg-muted/40 hover:bg-muted/70",
            "dark:bg-[radial-gradient(circle_at_50%_0%,var(--primary)/12%_0%,transparent_70%)]",
            isPlanPage && "bg-primary/10 shadow-xs",
          )}
          {...animationProps}
        >
          {/* Conteúdo com efeito Shiny suave */}
          <span
            className="relative flex items-center justify-between w-full"
            style={{
              maskImage:
                "linear-gradient(-75deg,var(--primary) calc(var(--x) + 20%),transparent calc(var(--x) + 30%),var(--primary) calc(var(--x) + 100%))",
              WebkitMaskImage:
                "linear-gradient(-75deg,var(--primary) calc(var(--x) + 20%),transparent calc(var(--x) + 30%),var(--primary) calc(var(--x) + 100%))",
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex flex-col min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground tracking-tight">
                    {isSystemOwner ? "Admin" : "Meu Plano"}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.2 text-[9px] font-semibold",
                      isSystemOwner
                        ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                        : "bg-primary/15 text-primary"
                    )}
                  >
                    {isSystemOwner ? "FULL" : "PRO"}
                  </span>
                </div>
                <span className="truncate text-[10px] text-muted-foreground">
                  {isSystemOwner
                    ? "Acesso Vitalício"
                    : "Ver detalhes e limites"}
                </span>
              </div>
            </div>

            <ChevronRight
              size="xs"
              className="text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground shrink-0"
            />
          </span>
        </motion.div>
      </Link>
    </div>
  );
}

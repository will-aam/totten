"use client";

import { useState } from "react";
import { Plus, UserPlus, Share, ArrowOutDownSquareHalf } from "@boxicons/react";
import { cn } from "@/lib/utils";

interface ClientsSpeedDialProps {
  onImport: () => void;
  onCopyLink: () => void;
  onNewClient: () => void;
  showScrollTop: boolean;
}

export function ClientsSpeedDial({
  onImport,
  onCopyLink,
  onNewClient,
  showScrollTop,
}: ClientsSpeedDialProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(!isOpen);

  const actions = [
    { name: "Novo Cliente", icon: <UserPlus className="w-5 h-5" />, onClick: onNewClient },
    { name: "Importar", icon: <ArrowOutDownSquareHalf className="w-5 h-5" />, onClick: onImport },
    { name: "Área do Cliente", icon: <Share className="w-5 h-5" />, onClick: onCopyLink },
  ];

  return (
    <div
      className={cn(
        "fixed bottom-20 right-4 z-50 flex flex-col items-end transition-all duration-300 sm:hidden",
        showScrollTop ? "translate-y-16 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
      )}
    >
      {isOpen && (
        <div className="flex flex-col items-end gap-3 mb-4">
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={() => {
                action.onClick();
                setIsOpen(false);
              }}
              className="flex items-center gap-3 bg-background/60 backdrop-blur-md rounded-full py-1.5 pl-1.5 pr-5 border border-border/50 hover:bg-background/80 transition-colors animate-in fade-in slide-in-from-bottom-5 active:scale-[0.98]"
              style={{ animationDelay: `${(actions.length - i) * 50}ms`, animationFillMode: 'backwards' }}
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                {action.icon}
              </div>
              <span className="text-sm font-bold text-foreground whitespace-nowrap shadow-sm">
                {action.name}
              </span>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={toggle}
        className={cn(
          "w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-primary-foreground transition-all duration-300",
          isOpen ? "bg-red-500 rotate-45" : "bg-primary hover:scale-110"
        )}
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Overlay invisível para fechar ao clicar fora */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

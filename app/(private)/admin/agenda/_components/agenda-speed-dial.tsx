"use client";

import { useState } from "react";
import { Plus, UserPlus, UserCheck, Package, Block, Store } from "@boxicons/react";
import { cn } from "@/lib/utils";

interface AgendaSpeedDialProps {
  onNewAppointment: () => void;
  onNewBlock: () => void;
  onManualCheckIn: () => void;
  onNewSale: () => void;
  onNewPackage: () => void;
  showScrollTop: boolean;
}

export function AgendaSpeedDial({
  onNewAppointment,
  onNewBlock,
  onManualCheckIn,
  onNewSale,
  onNewPackage,
  showScrollTop,
}: AgendaSpeedDialProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(!isOpen);

  const actions = [
    { name: "Novo Agendamento", icon: <UserPlus className="w-5 h-5" />, onClick: onNewAppointment },
    { name: "Check-in Manual", icon: <UserCheck className="w-5 h-5" />, onClick: onManualCheckIn },
    { name: "Bloquear Horário", icon: <Block className="w-5 h-5" />, onClick: onNewBlock },
    { name: "Vender Serviço", icon: <Store className="w-5 h-5" />, onClick: onNewSale },
    { name: "Vender Pacote", icon: <Package className="w-5 h-5" />, onClick: onNewPackage },
  ];

  return (
    <div
      className={cn(
        "fixed bottom-20 right-4 md:bottom-8 md:right-8 z-50 flex flex-col items-end transition-all duration-300",
        showScrollTop ? "translate-y-16 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
      )}
    >
      {isOpen && (
        <div className="flex flex-col items-end gap-3 mb-4">
          {actions.map((action, i) => (
            <div key={i} className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5" style={{ animationDelay: `${(actions.length - i) * 50}ms`, animationFillMode: 'backwards' }}>
              <span className="bg-background border shadow-md text-sm font-bold px-3 py-1.5 rounded-xl whitespace-nowrap text-foreground">
                {action.name}
              </span>
              <button
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                className="w-12 h-12 rounded-full bg-background border shadow-lg flex items-center justify-center text-primary hover:bg-muted/50 transition-colors"
              >
                {action.icon}
              </button>
            </div>
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

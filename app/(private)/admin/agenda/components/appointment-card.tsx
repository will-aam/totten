// components/agenda/appointment-card.tsx
"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  Clock,
  Package as PackageIcon,
  Lock,
  AlertTriangle,
  Check,
  User,
  DotsVerticalRounded,
  InfoCircle,
  Cog,
} from "@boxicons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

//  A interface que vai ser usada por TUDO na agenda
export interface Appointment {
  id: string;
  time: string;
  duration: number;
  clientName: string;
  service: string;
  sessionInfo: string;
  isRecurring: boolean;
  phone: string;
  color: string;
  hasCharge?: boolean;
  status?: string;
  payment_method?: string | null;
  paymentMethod?: string | null;
  date_time?: string;
  package_id?: string | null;
  session_number?: number | null;
  package?: {
    total_sessions: number;
    used_sessions: number;
    active?: boolean;
  } | null;
  professionalName?: string | null;
  snapshot_service_name?: string | null;
  snapshot_service_duration?: number | null;
  snapshot_service_price?: number | null;
}

export const cleanPhone = (phone: string) => {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
};

export function AppointmentCardContent({
  appt,
  height,
  isOverlay = false,
  isCancelled = false,
  isLocked = false,
}: {
  appt: Appointment;
  height: number;
  isOverlay?: boolean;
  isCancelled?: boolean;
  isLocked?: boolean;
}) {
  const isPackageArchived = appt.package && appt.package.active === false;
  const isCompact = height <= 40;

  //  Lendo o snapshot aqui dentro da nossa pecinha universal!
  const serviceName = appt.snapshot_service_name ?? appt.service;

  if (isCancelled) {
    return (
      <div
        className={cn(
          "h-full w-full rounded-xl border border-dashed flex items-center justify-between px-2 py-1 shadow-sm transition-transform overflow-hidden",
          appt.color,
          "opacity-50 grayscale-[0.8]",
          isOverlay && "shadow-2xl scale-105 rotate-1 cursor-grabbing",
        )}
      >
        <div className="flex items-center gap-1.5 truncate pr-2 w-full">
          <Lock className="h-3 w-3 shrink-0 opacity-60" />
          <span className="font-bold text-xs truncate line-through opacity-80">
            {appt.clientName.split(" ")[0]}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0 text-[10px] font-bold opacity-70">
          <Clock className="h-3 w-3 hidden sm:block" />
          <span>{appt.time}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "h-full w-full rounded-xl border flex shadow-sm group overflow-hidden transition-transform relative",
        isCompact ? "flex-row items-center px-2 py-1 gap-2" : "flex-col p-3",
        appt.color,
        appt.hasCharge && !isPackageArchived && "border-2 border-destructive",
        isPackageArchived && "border-2 border-destructive/80 opacity-80",
        isOverlay &&
          "shadow-2xl scale-105 rotate-1 border-primary/50 cursor-grabbing",
      )}
    >
      <div
        className={cn(
          "flex w-full",
          isCompact
            ? "items-center justify-between"
            : "flex-col justify-between items-start h-full",
        )}
      >
        <div
          className={cn(
            "flex truncate pr-6",
            isCompact ? "flex-row items-center gap-2" : "flex-col",
          )}
        >
          <div className="flex items-center gap-1.5">
            {isLocked && !isOverlay && (
              <Lock className="h-3 w-3 text-muted-foreground/50 shrink-0" />
            )}
            <span
              className={cn(
                "font-bold truncate",
                isCompact ? "text-xs" : "text-sm md:text-base",
                isPackageArchived && "line-through",
              )}
            >
              {appt.clientName}
            </span>
          </div>

          <div
            className={cn(
              "flex items-center gap-1",
              !isCompact && "mt-0.5 flex-col items-start",
            )}
          >
            {!isCompact && (
              <span className="text-[11px] font-semibold opacity-80 truncate uppercase tracking-wider leading-none flex items-center gap-1">
                <Cog className="h-3 w-3 shrink-0" /> {serviceName}
              </span>
            )}
          </div>
        </div>

        <div
          className={cn(
            "flex items-center text-[10px] font-bold opacity-80",
            isCompact
              ? "gap-2 shrink-0"
              : "mt-auto justify-between w-full pt-1.5 border-t border-black/5",
          )}
        >
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 shrink-0">
              <Clock className="h-3 w-3" /> {appt.time}
            </span>

            {appt.professionalName && (
              <div className="flex items-center gap-1 bg-background/50 px-1.5 py-0.5 rounded text-[9px] font-bold text-foreground/90 backdrop-blur-sm border border-black/5 shadow-sm shrink-0">
                <User className="h-2.5 w-2.5" />
                <span className="truncate max-w-15">
                  {appt.professionalName.split(" ")[0]}
                </span>
              </div>
            )}
          </div>

          {(!isCompact || isPackageArchived) && (
            <span
              className={cn(
                "px-1.5 rounded flex items-center gap-1",
                isPackageArchived
                  ? "bg-destructive/10 text-destructive font-black"
                  : "bg-white/30",
              )}
            >
              {!isPackageArchived && appt.package_id && !isCompact && (
                <PackageIcon className="h-3 w-3" />
              )}
              {isPackageArchived && <AlertTriangle className="h-3 w-3" />}
              {isPackageArchived ? "Inativo" : appt.sessionInfo}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function DraggableAppointmentCard({
  appt,
  top,
  height,
  width = "calc(100% - 24px)",
  left = "8px",
  onClick,
  onWhatsApp,
  onQuickConfirm,
}: {
  appt: Appointment;
  top: number;
  height: number;
  width?: string;
  left?: string;
  onClick: () => void;
  onWhatsApp: (e: React.MouseEvent) => void;
  onQuickConfirm?: (appt: Appointment) => void;
}) {
  const isCancelled = appt.status?.toUpperCase() === "CANCELADO";
  const isRealizado = appt.status?.toUpperCase() === "REALIZADO";
  const paymentMethod = appt.payment_method || appt.paymentMethod;
  const isPaid = !!paymentMethod && paymentMethod !== "nenhum";

  const isLocked = isCancelled || isRealizado || isPaid;

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: appt.id,
    data: appt,
    disabled: isLocked,
  });

  const style: React.CSSProperties = {
    position: "absolute",
    top: `${top}px`,
    height: `${height}px`,
    left,
    width,
    zIndex: isDragging ? 0 : 10,
    opacity: isDragging ? 0 : 1,
    touchAction: "none",
    pointerEvents: "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(!isLocked ? listeners : {})}
      {...(!isLocked ? attributes : {})}
      className={cn(
        !isLocked ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        "group",
      )}
      onClick={(e) => {
        if (e.defaultPrevented) return;
        onClick();
      }}
    >
      {!isCancelled && (
        <div className="absolute top-1 right-1 z-50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 bg-transparent hover:bg-black/5 text-black/50 hover:text-black shadow-none border-none p-0 m-0"
                onClick={(e) => e.stopPropagation()}
              >
                <DotsVerticalRounded className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 z-100 rounded-xl">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                className="font-medium"
              >
                <InfoCircle className="mr-2 h-4 w-4" /> Detalhes da Sessão
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {!isLocked && appt.status?.toUpperCase() !== "CONFIRMADO" && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onQuickConfirm) onQuickConfirm(appt);
                  }}
                  className="text-blue-600 focus:text-blue-700 font-medium"
                >
                  <Check className="mr-2 h-4 w-4" /> Marcar Confirmado
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onWhatsApp(e);
                }}
                className="text-emerald-600 focus:text-emerald-700 font-medium"
              >
                <MessageCircle className="mr-2 h-4 w-4" /> Enviar WhatsApp
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <AppointmentCardContent
        appt={appt}
        height={height}
        isCancelled={isCancelled}
        isLocked={isLocked}
      />
    </div>
  );
}

"use client";

import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string | React.ReactNode;
  children: React.ReactNode;
  className?: string; // Optional custom classes for the content
}

export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  children,
  className,
}: ResponsiveModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className={cn(
            "rounded-t-[32px] p-4 max-h-[90dvh] overflow-y-auto border-t-0 shadow-2xl",
            className
          )}
        >
          {title && (
            <SheetHeader className="space-y-1 mt-2">
              <SheetTitle className="text-center text-xl font-black">
                {title}
              </SheetTitle>
            </SheetHeader>
          )}
          <div className="py-2">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "p-6 max-h-[90dvh] overflow-y-auto shadow-2xl sm:max-w-md",
          className
        )}
      >
        {title && (
          <DialogHeader className="space-y-1 mt-2">
            <DialogTitle className="text-center text-xl font-black">
              {title}
            </DialogTitle>
          </DialogHeader>
        )}
        <div className="py-2">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

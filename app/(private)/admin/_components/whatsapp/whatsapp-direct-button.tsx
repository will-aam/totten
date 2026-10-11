// app/(private)/admin/_components/whatsapp/whatsapp-direct-button.tsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Whatsapp } from "@boxicons/react";
import { toast } from "sonner";
import {
  interpolateTemplate,
  openWhatsAppChat,
} from "@/lib/whatsapp-utils";

export interface WhatsAppDirectButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "onClick"> {
  phone: string | null | undefined;
  template: string;
  variables?: Record<string, string | number | undefined | null>;
  onSent?: () => void;
  iconOnly?: boolean;
}

export function WhatsAppDirectButton({
  phone,
  template,
  variables = {},
  onSent,
  iconOnly = false,
  children,
  className,
  variant = "ghost",
  size,
  ...props
}: WhatsAppDirectButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!phone) {
      toast.error("Este cliente não possui WhatsApp cadastrado.");
      return;
    }

    const finalMessage = interpolateTemplate(template, variables);
    const result = openWhatsAppChat(phone, finalMessage);

    if (!result.success) {
      toast.error(result.error || "Número de WhatsApp inválido.");
      return;
    }

    onSent?.();
  };

  return (
    <Button
      variant={variant}
      size={size || (iconOnly ? "icon" : "default")}
      onClick={handleClick}
      className={className}
      {...props}
    >
      {children ? (
        children
      ) : iconOnly ? (
        <Whatsapp className="h-4 w-4" />
      ) : (
        <>
          <Whatsapp className="h-4 w-4 mr-2" />
          Enviar WhatsApp
        </>
      )}
    </Button>
  );
}

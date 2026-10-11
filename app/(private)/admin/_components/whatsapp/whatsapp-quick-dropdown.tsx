// app/(private)/admin/_components/whatsapp/whatsapp-quick-dropdown.tsx
"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Whatsapp } from "@boxicons/react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import {
  DEFAULT_MESSAGE_TEMPLATES,
  interpolateTemplate,
  openWhatsAppChat,
} from "@/lib/whatsapp-utils";

interface WhatsAppQuickDropdownProps {
  clientName: string;
  clientPhone: string | null | undefined;
  usedSessions?: number;
  totalSessions?: number;
  time?: string;
  serviceName?: string;
  triggerClassName?: string;
  triggerVariant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  align?: "start" | "end" | "center";
}

interface SettingsMessagesResponse {
  msgUpdate?: string;
  msgWelcome?: string;
  msgRenewal?: string;
  msgReminder?: string;
  msgManualConfirmation?: string;
  msgBirthday?: string;
}

export function WhatsAppQuickDropdown({
  clientName,
  clientPhone,
  usedSessions = 0,
  totalSessions = 10,
  time = "09:00",
  serviceName = "Atendimento",
  triggerClassName,
  triggerVariant = "outline",
  align = "start",
}: WhatsAppQuickDropdownProps) {
  const { data: settings } = useSWR<SettingsMessagesResponse>(
    "settings/messages",
    apiClient,
    { revalidateOnFocus: false },
  );

  const templates = useMemo(() => {
    return {
      update: settings?.msgUpdate?.trim() || DEFAULT_MESSAGE_TEMPLATES.CHECK_IN,
      welcome:
        settings?.msgWelcome?.trim() || DEFAULT_MESSAGE_TEMPLATES.WELCOME,
      renewal:
        settings?.msgRenewal?.trim() || DEFAULT_MESSAGE_TEMPLATES.RENEWAL,
      reminder:
        settings?.msgReminder?.trim() || DEFAULT_MESSAGE_TEMPLATES.REMINDER,
    };
  }, [settings]);

  const firstName = useMemo(() => {
    if (!clientName) return "";
    return clientName.trim().split(" ")[0];
  }, [clientName]);

  const handleSend = (templateText: string) => {
    if (!clientPhone) {
      toast.error("Este cliente não possui WhatsApp cadastrado.");
      return;
    }

    const message = interpolateTemplate(templateText, {
      nome: firstName,
      usadas: usedSessions,
      total: totalSessions,
      horario: time,
      servico: serviceName,
    });

    const result = openWhatsAppChat(clientPhone, message);
    if (!result.success) {
      toast.error(result.error || "Número de WhatsApp inválido.");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={triggerVariant}
          className={
            triggerClassName ||
            "w-full sm:w-auto h-10 border-[#25D366]/30 bg-[#25D366]/5 text-[#25D366] hover:bg-[#25D366]/10 transition-colors font-semibold"
          }
        >
          <Whatsapp className="mr-2 h-4 w-4" /> Enviar Mensagem
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-64 rounded-xl">
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
          Modelos Rápidos
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleSend(templates.update)}
          className="cursor-pointer py-2.5"
        >
          <span className="font-medium text-sm">Atualização (Check-in)</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSend(templates.welcome)}
          className="cursor-pointer py-2.5"
        >
          <span className="font-medium text-sm">Boas-vindas</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSend(templates.renewal)}
          className="cursor-pointer py-2.5"
        >
          <span className="font-medium text-sm">Renovação de Pacote</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSend(templates.reminder)}
          className="cursor-pointer py-2.5"
        >
          <span className="font-medium text-sm">Lembrete de Agenda</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

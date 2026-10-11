// app/(private)/admin/clients/_components/whatsapp-button.tsx
"use client";

import { WhatsAppQuickDropdown } from "@/app/(private)/admin/_components/whatsapp/whatsapp-quick-dropdown";

export interface WhatsAppButtonProps {
  clientName: string;
  clientPhone: string;
  usedSessions?: number;
  totalSessions?: number;
}

export function WhatsAppButton({
  clientName,
  clientPhone,
  usedSessions,
  totalSessions,
}: WhatsAppButtonProps) {
  return (
    <WhatsAppQuickDropdown
      clientName={clientName}
      clientPhone={clientPhone}
      usedSessions={usedSessions}
      totalSessions={totalSessions}
      triggerClassName="gap-2 border-emerald-500/20 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 bg-emerald-50/50"
      align="end"
    />
  );
}

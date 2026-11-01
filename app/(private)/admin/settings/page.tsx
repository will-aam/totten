"use client";

import { useState } from "react";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

// Seções
import { GeneralSettings } from "./_components/general-settings";
import { MessageSettings } from "./_components/message-settings";
import { SecuritySettings } from "./_components/security-settings";
import { NotificationsSettings } from "./_components/notifications-settings";
import {
  Building,
  Whatsapp,
  CheckShield,
  Bell,
} from "@boxicons/react";

// Lista de menus do MobileBottomNav
const mobileNavItems = [
  { id: "general", label: "Geral", icon: Building },
  { id: "messages", label: "Mensagens", icon: Whatsapp },
  { id: "notifications", label: "Notificações", icon: Bell },
  { id: "security", label: "Acesso", icon: CheckShield },
];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <>
      <AdminHeader title="Configurações do Sistema" />

      {/* Diretriz de Layout Fluido: max-w-400 com padding e espaçamentos padrão */}
      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-32 md:pb-12 relative animate-in fade-in duration-500 min-h-[calc(100vh-100px)]">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full flex-1 flex flex-col"
        >
          {/* TabsList com design padrão arredondado (rounded-full) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <TabsList className="hidden md:grid w-full max-w-2xl grid-cols-4 h-auto gap-1 bg-muted/60 p-1.5 rounded-full border border-border/40 shadow-xs">
              <TabsTrigger
                value="general"
                className="flex items-center justify-center gap-2 py-2.5 rounded-full font-medium text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <Building size="sm" /> Geral
              </TabsTrigger>
              <TabsTrigger
                value="messages"
                className="flex items-center justify-center gap-2 py-2.5 rounded-full font-medium text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <Whatsapp size="sm" /> Mensagens
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="flex items-center justify-center gap-2 py-2.5 rounded-full font-medium text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <Bell size="sm" /> Notificações
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="flex items-center justify-center gap-2 py-2.5 rounded-full font-medium text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <CheckShield size="sm" /> Acesso
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Conteúdo das abas sem animações de transform que afetem elementos filhos fixos */}
          <div className="flex-1">
            <TabsContent
              value="general"
              className="mt-0 focus-visible:outline-none"
            >
              <GeneralSettings />
            </TabsContent>
            <TabsContent
              value="messages"
              className="mt-0 focus-visible:outline-none"
            >
              <MessageSettings />
            </TabsContent>
            <TabsContent
              value="notifications"
              className="mt-0 focus-visible:outline-none"
            >
              <NotificationsSettings />
            </TabsContent>
            <TabsContent
              value="security"
              className="mt-0 focus-visible:outline-none"
            >
              <SecuritySettings />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Menu Mobile Fixo */}
      <MobileBottomNav
        items={mobileNavItems}
        activeId={activeTab}
        onChange={setActiveTab}
      />
    </>
  );
}

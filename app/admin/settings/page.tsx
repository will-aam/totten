"use client";

import { useState } from "react";
import { AdminHeader } from "@/components/admin-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

// Seções
import { GeneralSettings } from "./sections/general-settings";
import { AppearanceSettings } from "./sections/appearance-settings";
import { MessageSettings } from "./sections/message-settings";
import { SecuritySettings } from "./sections/security-settings";
import { NotificationsSettings } from "./sections/notifications-settings";

import {
  Building,
  Palette,
  Whatsapp,
  CheckShield,
  Bell,
} from "@boxicons/react";
import { Button } from "@/components/ui/button";

// Definimos a lista de menus aqui, de forma limpa, para injetar no componente mobile
const mobileNavItems = [
  { id: "general", label: "Geral", icon: Building },
  { id: "appearance", label: "Visual", icon: Palette },
  { id: "messages", label: "Msg", icon: Whatsapp },
  { id: "notifications", label: "Alertas", icon: Bell },
  { id: "security", label: "Acesso", icon: CheckShield },
];

export default function AdminSettingsPage() {
  // Estado que controla qual aba/tela está ativa agora
  const [activeTab, setActiveTab] = useState("general");

  return (
    <>
      <AdminHeader title="Configurações do Sistema" />

      {/* LARGURA FLUIDA: Trocamos max-w-5xl por max-w-400 para acompanhar monitores grandes */}
      {/* Adicionado min-h para empurrar o botão de salvar sempre pro fundo */}
      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-32 md:pb-12 relative animate-in fade-in duration-500 min-h-[calc(100vh-100px)]">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full flex-1 flex flex-col"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            {/* 🔥 DESIGN IGUAL AO ARQUIVO SERVICES: Grid menor, p-1 bg-muted, rounded-xl e triggers com py-2 */}
            <TabsList className="hidden md:grid w-full lg:w-200 grid-cols-5 h-auto gap-1 bg-muted p-1 rounded-xl">
              <TabsTrigger
                value="general"
                className="flex items-center gap-2 py-2 rounded-lg"
              >
                <Building size="sm" /> Geral
              </TabsTrigger>
              <TabsTrigger
                value="appearance"
                className="flex items-center gap-2 py-2 rounded-lg"
              >
                <Palette size="sm" /> Aparência
              </TabsTrigger>
              <TabsTrigger
                value="messages"
                className="flex items-center gap-2 py-2 rounded-lg"
              >
                <Whatsapp size="sm" /> Mensagens
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="flex items-center gap-2 py-2 rounded-lg"
              >
                <Bell size="sm" /> Notificações
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="flex items-center gap-2 py-2 rounded-lg"
              >
                <CheckShield size="sm" /> Acesso
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1">
            <TabsContent
              value="general"
              className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              <GeneralSettings />
            </TabsContent>
            <TabsContent
              value="appearance"
              className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              <AppearanceSettings />
            </TabsContent>
            <TabsContent
              value="messages"
              className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              <MessageSettings />
            </TabsContent>
            <TabsContent
              value="notifications"
              className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              <NotificationsSettings />
            </TabsContent>
            <TabsContent
              value="security"
              className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              <SecuritySettings />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Menu Mobile */}
      <MobileBottomNav
        items={mobileNavItems}
        activeId={activeTab}
        onChange={setActiveTab}
      />
    </>
  );
}

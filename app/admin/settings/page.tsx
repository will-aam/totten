// app/admin/settings/page.tsx
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
  MessageSquare,
  ShieldCheck,
  Save,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Definimos a lista de menus aqui, de forma limpa, para injetar no componente mobile
const mobileNavItems = [
  { id: "general", label: "Geral", icon: Building },
  { id: "appearance", label: "Visual", icon: Palette },
  { id: "messages", label: "Msg", icon: MessageSquare },
  { id: "notifications", label: "Alertas", icon: Bell },
  { id: "security", label: "Acesso", icon: ShieldCheck },
];

export default function AdminSettingsPage() {
  // Estado que controla qual aba/tela está ativa agora
  const [activeTab, setActiveTab] = useState("general");

  return (
    <>
      <AdminHeader title="Configurações do Sistema" />

      {/* 🔥 1. LARGURA FLUIDA: Trocamos max-w-5xl por max-w-400 para acompanhar monitores grandes */}
      {/* Adicionado min-h para empurrar o botão de salvar sempre pro fundo */}
      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-32 md:pb-12 relative animate-in fade-in duration-500 min-h-[calc(100vh-100px)]">
        {/* Usamos value e onValueChange para controlar as Tabs programaticamente */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full flex-1 flex flex-col"
        >
          {/* 🔥 2. MENU DESKTOP PREMIUM: Arredondado, h-14, fundo suave */}
          <TabsList className="hidden md:grid w-full grid-cols-5 bg-muted/40 h-14 rounded-2xl p-1 border border-border/50 shadow-sm">
            <TabsTrigger
              value="general"
              className="flex gap-2 rounded-xl font-bold h-full data-[state=active]:shadow-sm transition-all"
            >
              <Building className="h-4 w-4" /> Geral
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="flex gap-2 rounded-xl font-bold h-full data-[state=active]:shadow-sm transition-all"
            >
              <Palette className="h-4 w-4" /> Aparência
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              className="flex gap-2 rounded-xl font-bold h-full data-[state=active]:shadow-sm transition-all"
            >
              <MessageSquare className="h-4 w-4" /> Mensagens
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex gap-2 rounded-xl font-bold h-full data-[state=active]:shadow-sm transition-all"
            >
              <Bell className="h-4 w-4" /> Notificações
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex gap-2 rounded-xl font-bold h-full data-[state=active]:shadow-sm transition-all"
            >
              <ShieldCheck className="h-4 w-4" /> Acesso
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 flex-1">
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

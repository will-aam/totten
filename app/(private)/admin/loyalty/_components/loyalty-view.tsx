"use client";

import { useState } from "react";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UserCircle, Cog } from "@boxicons/react";

import { LoyaltyVoucher } from "./loyalty-voucher";
import { LoyaltyOverviewTab } from "./loyalty-overview-tab";
import { LoyaltySettingsTab } from "./loyalty-settings-tab";
import { MOCK_CLIENTS, MOCK_REWARDS } from "./mock-data";

export function LoyaltyView() {
  const [activeTab, setActiveTab] = useState("overview");
  const [programScope, setProgramScope] = useState<"global" | "specific">("global");
  const [isProgramActive, setIsProgramActive] = useState(false);
  
  // States that would typically come from a DB or API
  const [clients, setClients] = useState(MOCK_CLIENTS);
  const [rewards, setRewards] = useState(MOCK_REWARDS);
  const [selectedClientForVoucher, setSelectedClientForVoucher] = useState<(typeof MOCK_CLIENTS)[0] | null>(null);

  return (
    <>
      <AdminHeader title="Programa de Fidelidade" />

      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 md:pb-6 relative animate-in fade-in duration-500 min-h-[calc(100vh-100px)]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-6 rounded-full bg-muted/50 p-1">
            <TabsTrigger value="overview" className="rounded-full flex items-center gap-2">
              <UserCircle size="sm" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-full flex items-center gap-2">
              <Cog size="sm" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: VISÃO GERAL */}
          <TabsContent value="overview" className="space-y-6">
            <LoyaltyOverviewTab 
              isProgramActive={isProgramActive}
              setIsProgramActive={setIsProgramActive}
              programScope={programScope}
              clients={clients}
              onOpenVoucher={setSelectedClientForVoucher}
            />
          </TabsContent>

          {/* TAB 2: CONFIGURAÇÕES */}
          <TabsContent value="settings" className="flex flex-col gap-8 md:gap-6">
            <LoyaltySettingsTab 
              rewards={rewards}
              setRewards={setRewards}
              programScope={programScope}
              setProgramScope={setProgramScope}
            />
          </TabsContent>
        </Tabs>

        {/* Modal do Voucher */}
        {selectedClientForVoucher && (
          <LoyaltyVoucher
            open={!!selectedClientForVoucher}
            onOpenChange={(open) => !open && setSelectedClientForVoucher(null)}
            clientName={selectedClientForVoucher.name}
            points={selectedClientForVoucher.points}
            rewards={rewards}
          />
        )}
      </div>
    </>
  );
}

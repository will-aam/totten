"use client";

import { useState } from "react";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UserCircle, Cog } from "@boxicons/react";

import { LoyaltyVoucher } from "./loyalty-voucher";
import { LoyaltyOverviewTab } from "./loyalty-overview-tab";
import { LoyaltySettingsTab } from "./loyalty-settings-tab";
import { updateLoyaltySettings } from "@/app/actions/loyalty";
import { toast } from "sonner";

interface ClientData {
  id: string;
  name: string;
  points: number;
  tier: string;
  lastCheckIn: string;
  enrolledAt: Date | null;
}

export function LoyaltyView({ organizationId, initialSettings, clients }: { organizationId: string, initialSettings: any, clients: ClientData[] }) {
  const [activeTab, setActiveTab] = useState("overview");
  
  const [settings, setSettings] = useState(initialSettings);
  const initialRewards = (initialSettings.rewards || []).map((r: any) => ({
    id: r.id,
    title: r.title,
    pointsCost: r.points_cost,
    conditions: r.conditions,
    validityDays: r.validity_days
  }));
  const [rewards, setRewards] = useState(initialRewards);
  const [isProgramActive, setIsProgramActive] = useState(initialSettings.is_active || false);
  const [programScope, setProgramScope] = useState<"global" | "specific">(initialSettings.scope || "specific");
  
  const [selectedClientForVoucher, setSelectedClientForVoucher] = useState<ClientData | null>(null);

  const handleActivateProgram = async (active: boolean) => {
    try {
      const res = await updateLoyaltySettings(organizationId, { is_active: active });
      if (res.success) {
        setIsProgramActive(active);
        toast.success(active ? "Programa ativado!" : "Programa desativado.");
      } else {
        toast.error("Erro ao alterar o status do programa.");
      }
    } catch (e) {
      toast.error("Erro na comunicação com o servidor.");
    }
  };

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
              setIsProgramActive={handleActivateProgram}
              programScope={programScope}
              clients={clients}
              rewards={rewards}
              onOpenVoucher={setSelectedClientForVoucher}
            />
          </TabsContent>

          {/* TAB 2: CONFIGURAÇÕES */}
          <TabsContent value="settings" className="flex flex-col gap-8 md:gap-6">
            <LoyaltySettingsTab 
              organizationId={organizationId}
              settings={settings}
              rewards={rewards}
              setRewards={setRewards}
              programScope={programScope}
              setProgramScope={setProgramScope}
              isProgramActive={isProgramActive}
              setIsProgramActive={handleActivateProgram}
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

// app/(private)/admin/self-service/page.tsx
import { getSelfServiceSettingsAction } from "@/app/actions/settings";
import { RulesAndHoursForm } from "./_components/rules-form";
import { PaymentRulesForm } from "./_components/payment-rules-form";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export default async function SelfServicePage() {
  // Busca os dados diretamente no servidor antes de renderizar a página
  const response = await getSelfServiceSettingsAction();

  // Extrai os dados se a requisição for bem-sucedida
  const initialData =
    response.success && response.data ? response.data : undefined;

  return (
    <>
      <AdminHeader title="Autoatendimento" />

      <div className="flex flex-col gap-6 p-6 md:p-8">
        <Tabs defaultValue="hours" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="hours">Horários</TabsTrigger>
            <TabsTrigger value="rules">Regras e Pagamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="hours">
            {/* Renderiza o componente de formulário passando os dados reais do banco */}
            <RulesAndHoursForm initialData={initialData} />
          </TabsContent>

          <TabsContent value="rules">
            {/* Renderiza o formulário de regras customizáveis e chaves Pix */}
            <PaymentRulesForm initialData={initialData} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

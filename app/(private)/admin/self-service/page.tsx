// app/(private)/admin/self-service/page.tsx
import { getSelfServiceSettingsAction } from "@/app/actions/settings";
import { RulesAndHoursForm } from "./_components/rules-form";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";

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
        <RulesAndHoursForm initialData={initialData} />
      </div>
    </>
  );
}

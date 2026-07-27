import { getSelfServiceSettingsAction } from "@/app/actions/settings";
import { RulesAndHoursForm } from "./_components/rules-form";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";

export const metadata = {
  title: "Autoatendimento | Totten",
  description: "Configurações de regras e horários do autoatendimento",
};

export default async function SelfServicePage() {
  // Busca os dados diretamente no servidor antes de renderizar a página
  const response = await getSelfServiceSettingsAction();

  // Extrai os dados se a requisição for bem-sucedida
  const initialData =
    response.success && response.data ? response.data : undefined;

  return (
    <>
      <AdminHeader title="Regras e Horários" />

      <div className="flex flex-col gap-6 p-6 md:p-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight">Autoatendimento</h2>
          <p className="text-muted-foreground">
            Configure os dias de expediente, horários e termos de uso que serão
            exibidos para os seus clientes.
          </p>
        </div>

        {/* Renderiza o componente de formulário passando os dados reais do banco */}
        <RulesAndHoursForm initialData={initialData} />
      </div>
    </>
  );
}

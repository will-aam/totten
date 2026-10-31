import { Metadata } from "next";
import { LoyaltyView } from "./_components/loyalty-view";
import { redirect } from "next/navigation";
import { getLoyaltySettings, getPaginatedLoyaltyClients } from "@/app/actions/loyalty";
import { requireAuth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Programa de Fidelidade | Totten",
  description: "Gerencie o programa de pontos e recompensas",
};

export default async function LoyaltyPage() {
  const session = await requireAuth();
  if (!session || !session.organizationId) redirect("/login");

  const organizationId = session.organizationId;
  const { settings } = await getLoyaltySettings(organizationId);

  const scope = (settings?.scope as "global" | "specific") || "specific";

  // Busca paginada leve apenas da primeira página (8 itens), eliminando o N+1 e o timeout
  const initialData = await getPaginatedLoyaltyClients({
    page: 1,
    limit: 8,
    scope,
  });

  return (
    <LoyaltyView 
      organizationId={organizationId} 
      initialSettings={settings} 
      initialClients={initialData.clients} 
      initialTotal={initialData.total}
      initialTotalPages={initialData.totalPages}
    />
  );
}

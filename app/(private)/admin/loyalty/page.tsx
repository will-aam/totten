import { Metadata } from "next";
import { LoyaltyView } from "./_components/loyalty-view";
import { redirect } from "next/navigation";
import { getLoyaltySettings, calculateClientPoints } from "@/app/actions/loyalty";
import { prisma } from "@/lib/prisma";
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

  // Fetch all clients in this organization
  const clients = await prisma.client.findMany({
    where: { organization_id: organizationId },
    select: {
      id: true,
      name: true,
      loyalty_points: true,
      loyalty_enrolled_at: true,
      check_ins: {
        orderBy: { date_time: 'desc' },
        take: 1
      }
    },
    orderBy: { name: 'asc' }
  });

  const formattedClients = await Promise.all(clients.map(async (c) => {
    // Calcula pontos de forma dinâmica baseada na tabela de checkins/agendamentos!
    const dynamicPoints = await calculateClientPoints(c.id, c.loyalty_enrolled_at, settings);
    
    // Sincroniza o cache do banco se necessário
    if (dynamicPoints !== c.loyalty_points) {
      await prisma.client.update({
        where: { id: c.id },
        data: { loyalty_points: dynamicPoints }
      });
    }

    return {
      id: c.id,
      name: c.name,
      points: dynamicPoints,
      tier: dynamicPoints >= 500 ? "Ouro" : dynamicPoints >= 200 ? "Prata" : "Bronze",
      lastCheckIn: c.check_ins[0] ? new Date(c.check_ins[0].date_time).toLocaleDateString('pt-BR') : 'Nunca',
      enrolledAt: c.loyalty_enrolled_at,
    };
  }));

  return (
    <LoyaltyView 
      organizationId={organizationId} 
      initialSettings={settings} 
      clients={formattedClients} 
    />
  );
}

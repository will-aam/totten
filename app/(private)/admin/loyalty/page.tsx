import { Metadata } from "next";
import { LoyaltyView } from "./_components/loyalty-view";

export const metadata: Metadata = {
  title: "Programa de Fidelidade | Totten",
  description: "Gerencie o programa de pontos e recompensas",
};

export default function LoyaltyPage() {
  return <LoyaltyView />;
}

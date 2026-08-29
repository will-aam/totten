import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClientAreaView } from "./client-area-view";

export default async function ClientAreaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!slug) return notFound();

  const org = await prisma.organization.findUnique({
    where: { slug },
    include: { settings: true, link_bio: true },
  });

  if (!org) {
    return notFound();
  }

  const { getClientSession } = await import("@/app/actions/client-auth");
  const { redirect } = await import("next/navigation");
  
  const clientId = await getClientSession(slug);
  if (!clientId) {
    redirect(`/${slug}/login`);
  }

  const tc = (org.link_bio?.theme_config as any) || {};
  const theme = {
    primaryColor: tc.buttonBg || "#0f172a",
    textColor: tc.textColor || "#0f172a",
    css: tc.css || "",
  };

  const { getClientHistoryById } = await import("@/app/actions/public-client");
  const historyRes = await getClientHistoryById(slug, clientId || "");

  return (
    <ClientAreaView 
      org={org} 
      theme={theme} 
      initialHistory={historyRes.success && historyRes.data ? historyRes.data : []}
      initialClientName={historyRes.success && historyRes.clientName ? historyRes.clientName : ""}
      error={historyRes.success ? "" : (historyRes.error || "Erro desconhecido")}
    />
  );
}

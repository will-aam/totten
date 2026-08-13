import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClientLoginView } from "./client-login-view";

export default async function ClientLoginPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!slug) return notFound();

  // Busca a organização
  const org = await prisma.organization.findUnique({
    where: { slug },
    include: { settings: true, link_bio: true },
  });

  if (!org) {
    return notFound();
  }

  // Prepara cores do tema para manter consistência
  const tc = (org.link_bio?.theme_config as any) || {};
  const theme = {
    primaryColor: tc.buttonBg || "#0f172a",
    textColor: tc.textColor || "#0f172a",
    css: tc.css || "",
  };

  return <ClientLoginView org={org} theme={theme} />;
}

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

  const tc = (org.link_bio?.theme_config as any) || {};
  const theme = {
    primaryColor: tc.buttonBg || "#0f172a",
    textColor: tc.textColor || "#0f172a",
    css: tc.css || "",
  };

  return <ClientAreaView org={org} theme={theme} />;
}

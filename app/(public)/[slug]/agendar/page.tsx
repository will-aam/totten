import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClientAgendarView } from "./client-agendar-view";
import { getClientSession } from "@/app/actions/client-auth";

export const dynamic = "force-dynamic";

export default async function AgendarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!slug) return notFound();

  const clientId = await getClientSession(slug);

  const org = await prisma.organization.findUnique({
    where: { slug },
    include: {
      settings: true,
      link_bio: true,
      services: {
        where: { active: true },
        orderBy: { name: "asc" },
      },
      categories: {
        orderBy: { name: "asc" },
      },
      admins: {
        where: { active: true },
        orderBy: { display_name: "asc" },
        include: {
          services: { select: { id: true } },
          package_templates: { select: { id: true } },
          _count: { select: { professional_likes: true } },
          professional_likes: clientId ? { where: { client_id: clientId } } : false
        }
      },
      package_templates: {
        where: { active: true, available_online: true },
        orderBy: { name: "asc" },
        include: {
          service: true,
        }
      }
    },
  });

  if (!org) {
    return notFound();
  }

  // Serialize via JSON to convert all Decimal/Date objects to plain values
  const plainOrg = JSON.parse(JSON.stringify(org, (_, v) =>
    v !== null && typeof v === "object" && v.constructor?.name === "Decimal"
      ? Number(v)
      : v
  ));

  const formattedOrg = {
    ...plainOrg,
    professionals: plainOrg.admins.map((admin: any) => ({
      ...admin,
      name: admin.display_name || "Profissional",
      image_url: admin.profile_image_url,
      likesCount: admin._count?.professional_likes || 0,
      userHasLiked: admin.professional_likes?.length > 0
    })),
    services: plainOrg.services,
    packageTemplates: plainOrg.package_templates,
  };

  return <ClientAgendarView org={formattedOrg} />;
}

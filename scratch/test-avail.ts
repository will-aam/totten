import { PrismaClient } from "@prisma/client";
import { getAvailableTimesAndProfessionals } from "../app/actions/availability";

const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany({
    include: { services: true }
  });

  for (const org of orgs) {
    if (org.services.length === 0) continue;
    console.log("Checking org", org.slug);
    const res = await getAvailableTimesAndProfessionals(org.slug, org.services[0].id, "2026-08-30");
    console.log(JSON.stringify(res, null, 2));
    const res2 = await getAvailableTimesAndProfessionals(org.slug, org.services[0].id, "2026-08-29");
    console.log("Saturday:", JSON.stringify(res2, null, 2));
  }
}
main();

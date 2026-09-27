import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany({
    include: {
      loyalty_settings: true
    }
  });
  console.log(JSON.stringify(orgs.map(o => ({ id: o.id, name: o.name, loyalty: o.loyalty_settings })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const orgs = await prisma.organization.findMany();
  console.log(orgs.map(o => o.slug));
}
main();

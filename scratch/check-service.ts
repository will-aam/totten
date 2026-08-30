import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const org = await prisma.organization.findUnique({
    where: { slug: "serenita" },
    include: { services: true }
  });
  console.log(org?.services[0]);
}
main();

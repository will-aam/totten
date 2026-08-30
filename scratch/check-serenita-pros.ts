import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const org = await prisma.organization.findUnique({
    where: { slug: "serenita" },
    include: {
      admins: {
        include: {
          schedule_rule: {
            include: { working_hours: true }
          }
        }
      }
    }
  });
  console.log(JSON.stringify(org?.admins, null, 2));
}
main();

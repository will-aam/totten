import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const rules = await prisma.scheduleRule.findMany({
    include: {
      working_hours: true
    }
  });
  console.log(JSON.stringify(rules, null, 2));
}
main();

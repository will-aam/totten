import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.workingHour.updateMany({
    where: {
      day_of_week: { in: [0, 6] },
      is_open: true,
      schedule_rule: { name: "Grade Padrão" }
    },
    data: {
      is_open: false
    }
  });
  console.log("Updated working hours:", result.count);
}
main();

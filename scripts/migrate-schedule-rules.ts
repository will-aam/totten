import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando migração de ScheduleRules...");

  const orgs = await prisma.organization.findMany();

  for (const org of orgs) {
    console.log(`Processando org: ${org.id}`);

    let defaultRule = await prisma.scheduleRule.findFirst({
      where: { organization_id: org.id, is_default: true },
    });

    if (!defaultRule) {
      defaultRule = await prisma.scheduleRule.create({
        data: {
          name: "Grade Padrão",
          is_default: true,
          organization_id: org.id,
        },
      });
      console.log(`Criada regra padrão para org ${org.id}`);
    }

    await prisma.workingHour.updateMany({
      where: {
        organization_id: org.id,
        schedule_rule_id: null as any,
      },
      data: {
        schedule_rule_id: defaultRule.id,
      },
    });

    await prisma.scheduleException.updateMany({
      where: {
        organization_id: org.id,
        schedule_rule_id: null as any,
      },
      data: {
        schedule_rule_id: defaultRule.id,
      },
    });
  }

  console.log("Migração concluída.");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

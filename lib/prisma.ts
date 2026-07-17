// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// O construtor vazio buscará automaticamente a DATABASE_URL no seu .env
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * NOVA CAMADA DE SEGURANÇA: Prisma Client com escopo de Tenant
 * Ao invés de usar o `prisma` global diretamente nas Server Actions,
 * usaremos esta função passando o ID da organização logada.
 */
export const getTenantPrisma = (organizationId: string) => {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // 1. Ignoramos modelos globais que NÃO possuem a coluna organization_id
          const globalModels = ["Organization", "User"];
          if (globalModels.includes(model)) {
            return query(args);
          }

          // 2. Definimos as operações que aceitam a cláusula where e precisam de isolamento
          const operationsToScope = [
            "findMany",
            "findFirst",
            "count",
            "updateMany",
            "deleteMany",
          ];

          if (operationsToScope.includes(operation)) {
            // Utilizamos 'any' para evitar que o TS barre a injeção dinâmica
            const scopedArgs = (args || {}) as any;
            scopedArgs.where = {
              ...scopedArgs.where,
              organization_id: organizationId,
            };
            return query(scopedArgs);
          }

          return query(args);
        },
      },
    },
  });
};

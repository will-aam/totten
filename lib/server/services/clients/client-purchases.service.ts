// lib/server/services/clients/client-purchases.service.ts
import { getTenantPrisma } from "@/lib/prisma";

export interface ClientPurchasesSummary {
  totalSpent: number;
  totalPurchases: number;
  averageTicket: number;
  pendingAmount: number;
  lastPurchaseDate: string | null;
}

export interface ClientPurchaseItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "PACKAGE" | "APPOINTMENT" | "OTHER";
  status: "PAGO" | "PENDENTE" | "CANCELADO" | "ATRASADO";
  paymentMethodName: string | null;
  installment: string | null;
  dueDate: string | null;
  packageId?: string | null;
  appointmentId?: string | null;
}

export interface ClientPurchasesResponse {
  summary: ClientPurchasesSummary;
  purchases: ClientPurchaseItem[];
}

export class ClientPurchasesService {
  /**
   * Obtém histórico completo e consolidação de compras de um cliente pelo ID.
   */
  static async getClientPurchases(
    organizationId: string,
    clientId: string
  ): Promise<ClientPurchasesResponse> {
    const prisma = getTenantPrisma(organizationId);

    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        organization_id: organizationId,
      },
      select: { id: true },
    });

    if (!client) {
      throw new Error("CLIENT_NOT_FOUND");
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        client_id: clientId,
        organization_id: organizationId,
        type: "RECEITA",
      },
      include: {
        payment_method: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    let totalSpent = 0;
    let pendingAmount = 0;
    let paidCount = 0;
    let lastPurchaseDate: string | null = null;

    const purchases: ClientPurchaseItem[] = transactions.map((tx) => {
      const numAmount = Number(tx.amount);
      const isPaid = tx.status === "PAGO";
      const isPending = tx.status === "PENDENTE" || tx.status === "ATRASADO";

      if (isPaid) {
        totalSpent += numAmount;
        paidCount++;
        if (!lastPurchaseDate || new Date(tx.date) > new Date(lastPurchaseDate)) {
          lastPurchaseDate = tx.date.toISOString();
        }
      } else if (isPending) {
        pendingAmount += numAmount;
      }

      let itemType: "PACKAGE" | "APPOINTMENT" | "OTHER" = "OTHER";
      if (tx.package_id) {
        itemType = "PACKAGE";
      } else if (tx.appointment_id) {
        itemType = "APPOINTMENT";
      }

      return {
        id: tx.id,
        date: tx.date.toISOString(),
        description: tx.description,
        amount: numAmount,
        type: itemType,
        status: tx.status as "PAGO" | "PENDENTE" | "CANCELADO" | "ATRASADO",
        paymentMethodName: tx.payment_method?.name || null,
        installment: tx.installment || null,
        dueDate: tx.due_date ? tx.due_date.toISOString() : null,
        packageId: tx.package_id,
        appointmentId: tx.appointment_id,
      };
    });

    const averageTicket = paidCount > 0 ? totalSpent / paidCount : 0;

    return {
      summary: {
        totalSpent,
        totalPurchases: paidCount,
        averageTicket,
        pendingAmount,
        lastPurchaseDate,
      },
      purchases,
    };
  }
}


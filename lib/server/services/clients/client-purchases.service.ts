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
        package: {
          select: {
            name: true,
          },
        },
        appointment: {
          select: {
            service: {
              select: {
                name: true,
              },
            },
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
      let numAmount = Number(tx.amount);
      const isPaid = tx.status === "PAGO";
      const isPending = tx.status === "PENDENTE" || tx.status === "ATRASADO";

      let rawDesc = tx.description || "";

      // 1. Recompor o valor bruto pago pelo cliente caso taxa de operadora tenha sido abatida
      const taxMatch = rawDesc.match(/\(Taxa abatida:\s*R\$\s*([\d,.]+)\)/i);
      if (taxMatch) {
        const feeStr = taxMatch[1].replace(/\./g, "").replace(",", ".");
        const feeVal = parseFloat(feeStr);
        if (!isNaN(feeVal) && feeVal > 0) {
          numAmount = Number((numAmount + feeVal).toFixed(2));
        }
        rawDesc = rawDesc.replace(taxMatch[0], "").trim();
      }

      // 2. Extrair título limpo
      let cleanTitle = "";
      if (tx.package?.name) {
        cleanTitle = tx.package.name;
      } else if (tx.appointment?.service?.name) {
        cleanTitle = tx.appointment.service.name;
      } else {
        rawDesc = rawDesc.replace(/\(Taxa[^)]*\)/gi, "");
        rawDesc = rawDesc.replace(/\(Totem(?:\s*-\s*Agend:[^)]+)?\)/gi, "");
        rawDesc = rawDesc.replace(/\(Baixa Manual\)/gi, "");
        rawDesc = rawDesc.replace(/\(Sessão\)/gi, "");
        rawDesc = rawDesc.replace(/\(Check-in Rápido\)/gi, "");
        rawDesc = rawDesc.replace(/\(\s*[A-ZÀ-Ú\s]{3,}\s*\)/g, " ");
        rawDesc = rawDesc.replace(/^Venda de Pacote:\s*/i, "");
        rawDesc = rawDesc.replace(/^Pacote:\s*/i, "");
        rawDesc = rawDesc.replace(/^Parcela Pacote:\s*/i, "");
        rawDesc = rawDesc.replace(/^Serviço Realizado\s*\/\s*Pago Antecipado:\s*/i, "");
        rawDesc = rawDesc.replace(/^Serviço Realizado:\s*/i, "");
        rawDesc = rawDesc.replace(/^Serviço:\s*/i, "");
        rawDesc = rawDesc.replace(/^Receita:\s*/i, "");
        rawDesc = rawDesc.replace(/\s{2,}/g, " ").trim();
        rawDesc = rawDesc.replace(/^-\s*|\s*-\s*$/g, "").trim();
        cleanTitle = rawDesc || (tx.package_id ? "Pacote" : tx.appointment_id ? "Atendimento" : "Pagamento");
      }

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
        description: cleanTitle,
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


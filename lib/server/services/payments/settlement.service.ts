// lib/server/services/payments/settlement.service.ts
import { prisma } from "@/lib/prisma";
import { PaymentMethod } from "@prisma/client";

export interface SettlementAndFeeResult {
  settlementDate: Date;
  daysToReceive: number;
  feeAmount: number;
  netAmount: number;
  method: {
    id: string;
    name: string;
    type: PaymentMethod;
    feePercentage: number;
    feeFixed: number;
    daysToReceive: number;
  } | null;
  paymentMethodRecord: {
    id: string;
    name: string;
    type: PaymentMethod;
    feePercentage: number;
    feeFixed: number;
    daysToReceive: number;
  } | null;
}

export interface CalculatePaymentSettlementParams {
  organizationId: string;
  amount?: number;
  grossAmount?: number;
  paymentMethodId?: string | null;
  paymentMethodEnum?: PaymentMethod | string | null;
  baseDate?: Date;
  tx?: any;
  prismaClient?: any;
}

/**
 * Calcula a data de compensação real no fluxo de caixa (baseada em daysToReceive)
 * e o valor exato da taxa de intermediação/maquininha (feePercentage + feeFixed).
 */
export async function calculatePaymentSettlementAndFee(
  params: CalculatePaymentSettlementParams,
): Promise<SettlementAndFeeResult> {
  const db = params.tx || params.prismaClient || prisma;
  const baseDate = params.baseDate || new Date();
  const rawAmount = params.grossAmount ?? params.amount ?? 0;
  const amount = Number(rawAmount);

  let paymentMethodRecord = null;

  if (params.paymentMethodId) {
    paymentMethodRecord = await db.organizationPaymentMethod.findFirst({
      where: {
        id: params.paymentMethodId,
        organization_id: params.organizationId,
      },
    });
  }

  // Fallback caso paymentMethodId não tenha sido fornecido ou não seja mais válido
  if (!paymentMethodRecord && params.paymentMethodEnum) {
    paymentMethodRecord = await db.organizationPaymentMethod.findFirst({
      where: {
        organization_id: params.organizationId,
        type: params.paymentMethodEnum as PaymentMethod,
        isActive: true,
      },
      orderBy: { created_at: "asc" },
    });
  }

  const daysToReceive = Number(paymentMethodRecord?.daysToReceive || 0);
  const settlementDate = new Date(baseDate);
  if (daysToReceive > 0) {
    settlementDate.setDate(settlementDate.getDate() + daysToReceive);
  }

  const feePercentage = Number(paymentMethodRecord?.feePercentage || 0);
  const feeFixed = Number(paymentMethodRecord?.feeFixed || 0);
  let feeAmount = 0;

  if (feePercentage > 0 || feeFixed > 0) {
    feeAmount = amount * (feePercentage / 100) + feeFixed;
    feeAmount = Math.min(amount, Math.max(0, Number(feeAmount.toFixed(2))));
  }

  const netAmount = Math.max(0, Number((amount - feeAmount).toFixed(2)));

  const methodSummary = paymentMethodRecord
    ? {
        id: paymentMethodRecord.id,
        name: paymentMethodRecord.name,
        type: paymentMethodRecord.type,
        feePercentage,
        feeFixed,
        daysToReceive,
      }
    : null;

  return {
    settlementDate,
    daysToReceive,
    feeAmount,
    netAmount,
    method: methodSummary,
    paymentMethodRecord: methodSummary,
  };
}

export interface CreateSettledRevenueParams {
  tx?: any;
  prismaClient?: any;
  organizationId: string;
  grossAmount: number;
  description: string;
  client_id?: string | null;
  clientId?: string | null;
  appointment_id?: string | null;
  appointmentId?: string | null;
  package_id?: string | null;
  packageId?: string | null;
  stock_item_id?: string | null;
  stockItemId?: string | null;
  admin_id?: string | null;
  adminId?: string | null;
  paymentMethodId?: string | null;
  paymentMethodEnum?: PaymentMethod | string | null;
  baseDate?: Date;
  status?: "PAGO" | "PENDENTE";
  feeDescription?: string;
}

/**
 * Registra a RECEITA com valor bruto e, caso haja taxa cadastrada,
 * gera a DESPESA correspondente da taxa no fluxo de caixa com a mesma data de compensação.
 */
export async function createSettledRevenueWithFee(params: CreateSettledRevenueParams) {
  const db = params.tx || params.prismaClient || prisma;
  const grossAmount = Number(params.grossAmount);

  const {
    settlementDate,
    feeAmount,
    method,
  } = await calculatePaymentSettlementAndFee({
    organizationId: params.organizationId,
    amount: grossAmount,
    paymentMethodId: params.paymentMethodId,
    paymentMethodEnum: params.paymentMethodEnum,
    baseDate: params.baseDate,
    tx: db,
  });

  const createdTxIds: string[] = [];

  const clientId = params.client_id ?? params.clientId ?? null;
  const appointmentId = params.appointment_id ?? params.appointmentId ?? null;
  const packageId = params.package_id ?? params.packageId ?? null;
  const stockItemId = params.stock_item_id ?? params.stockItemId ?? null;
  const adminId = params.admin_id ?? params.adminId ?? null;

  // 1. Cria a RECEITA no valor BRUTO (Padronização do Faturamento Bruto)
  const revenueTx = await db.transaction.create({
    data: {
      type: "RECEITA",
      description: params.description,
      amount: grossAmount,
      date: settlementDate, // Reflete os dias para recebimento (D+X)
      status: params.status || "PAGO",
      organization_id: params.organizationId,
      client_id: clientId,
      appointment_id: appointmentId,
      package_id: packageId,
      stock_item_id: stockItemId,
      admin_id: adminId,
      payment_method_id: method?.id || params.paymentMethodId || null,
    },
  });
  createdTxIds.push(revenueTx.id);

  let feeTx: any = null;

  // 2. Se houver taxa de cartão / maquininha, cria a DESPESA correspondente (Padronização do Faturamento Líquido)
  if (feeAmount > 0 && method) {
    const feeDesc = params.feeDescription || `Taxa ${method.name}: ${params.description}`;
    feeTx = await db.transaction.create({
      data: {
        type: "DESPESA",
        description: feeDesc,
        amount: feeAmount,
        date: settlementDate, // Mesma data de liquidação
        status: "PAGO",
        organization_id: params.organizationId,
        client_id: clientId,
        appointment_id: appointmentId,
        package_id: packageId,
        payment_method_id: method.id,
        admin_id: adminId,
        parent_transaction_id: revenueTx.id,
      },
    });
    createdTxIds.push(feeTx.id);
  }

  return {
    revenueTx,
    feeTx,
    createdTxIds,
    settlementDate,
    feeAmount,
  };
}

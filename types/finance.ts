// types/finance.ts
import { PaymentMethod } from "@prisma/client";

// Exportamos para o resto do sistema usar a definição oficial do Banco de Dados
export { PaymentMethod };

export type TransactionType = "RECEITA" | "DESPESA";
export type TransactionStatus = "PAGO" | "PENDENTE" | "ATRASADO" | "CANCELADO";
export type FinanceViewMode = "COMPETENCIA" | "CAIXA";

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  grossAmount?: number;
  feeAmount?: number;
  netAmount?: number;
  date: string;
  settlementDate?: string | null;
  dueDate?: string | null;
  paymentMethod?: PaymentMethod;
  paymentMethodName?: string;
  status: TransactionStatus;
  clientId?: string;
  clientName?: string;
}

export interface FinanceSummary {
  receivedMonth: number;
  pendingMonth: number;
  expensesMonth: number;
  balanceMonth: number;
  profitMargin?: number;
  grossRevenueMonth?: number;
  feesMonth?: number;
  viewMode?: FinanceViewMode;
}

export interface SecondaryIndicators {
  receivedToday: number;
  receivedWeek: number;
  pendingCount: number;
  topPaymentMethod: PaymentMethod | null;
}

export interface OrganizationPaymentMethod {
  id: string;
  type: PaymentMethod;
  name: string;
  isActive: boolean;
  feePercentage: number;
  feeFixed: number;
  daysToReceive: number;
}

export interface PaymentMethodAggregation {
  name: string;
  method: PaymentMethod | "OUTRO";
  value: number;
  count: number;
  percentage: number;
}

export interface CategoryAggregation {
  id: string;
  name: string;
  amount: number;
  count: number;
}

export interface FinanceDailyFlowPoint {
  date: string;
  income: number;
  expenses: number;
  balance: number;
}

export interface FinanceDashboardData {
  summary: FinanceSummary;
  secondary: SecondaryIndicators;
  byPaymentMethod: PaymentMethodAggregation[];
  byCategory: CategoryAggregation[];
  chartData: FinanceDailyFlowPoint[];
  recentTransactions: Array<{
    id: string;
    type: TransactionType;
    description: string;
    amount: number;
    grossAmount?: number;
    feeAmount?: number;
    netAmount?: number;
    date: string;
    settlementDate?: string | null;
    status: TransactionStatus;
    clientName?: string;
    paymentMethod?: string;
    professionalName?: string;
  }>;
}

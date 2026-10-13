// lib/server/integrations/zibee.service.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

// Configurações do Zibee (Supabase)
const ZIBEE_SUPABASE_URL =
  process.env.ZIBEE_SUPABASE_URL || "https://zkrosvlxrbbmzeglgnmq.supabase.co";
const ZIBEE_SERVICE_ROLE_KEY =
  process.env.ZIBEE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprcm9zdmx4cmJibXplZ2xnbm1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDM0OTcyNiwiZXhwIjoyMDc5OTI1NzI2fQ.78PazXnDgb1X9gnKVmryDZjZUVSeJj8PHe3fG5SRuYs";
const ZIBEE_CLIENT_USER_ID =
  process.env.ZIBEE_CLIENT_USER_ID || "0IktFfSPwvRIAXYhGe2RXLkRW9qTpyIN";
export const ZIBEE_ENABLED_ORG_ID =
  process.env.ZIBEE_ENABLED_ORG_ID || "cmmgntg4s0000l504vyelqq2u";

let supabaseInstance: SupabaseClient | null = null;

function getZibeeClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(ZIBEE_SUPABASE_URL, ZIBEE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseInstance;
}

export interface ZibeeTransactionInput {
  id: string;
  organizationId: string;
  description: string;
  amount: number | string;
  type: "RECEITA" | "DESPESA";
  date: string | Date;
  status: "PAGO" | "PENDENTE" | "ATRASADO";
  paymentMethod?: string | null;
  clientName?: string | null;
  category?: string | null;
  packageId?: string | null;
  stockItemId?: string | null;
}

/**
 * Normaliza a forma de pagamento do Totten para o padrão do Zibee
 */
function normalizePaymentMethod(method?: string | null): string {
  if (!method) return "Pix";
  const m = method.toUpperCase();
  if (m.includes("PIX")) return "Pix";
  if (
    m.includes("CREDITO") ||
    m.includes("CRÉDITO") ||
    m.includes("CARTAO") ||
    m.includes("CARTÃO") ||
    m.includes("DEBITO") ||
    m.includes("DÉBITO")
  ) {
    return "Cartão";
  }
  if (m.includes("DINHEIRO") || m.includes("ESPECIE") || m.includes("ESPÉCIE")) {
    return "Dinheiro";
  }
  if (m.includes("BOLETO")) return "Boleto";
  if (m.includes("TRANSFER") || m.includes("TED") || m.includes("DOC")) {
    return "Transferência";
  }
  return "Pix";
}

/**
 * Normaliza a categoria para o Zibee
 */
function deriveCategory(tx: ZibeeTransactionInput): string {
  if (tx.category) return tx.category;
  if (
    tx.stockItemId ||
    tx.description.toLowerCase().includes("insumo") ||
    tx.description.toLowerCase().includes("material")
  ) {
    return "Insumos";
  }
  if (tx.packageId || tx.description.toLowerCase().includes("pacote")) {
    return "Pacotes";
  }
  return "Atendimentos";
}

/**
 * Converte a transação do Totten para o payload do Zibee (tabela lancamentos)
 */
function formatZibeePayload(tx: ZibeeTransactionInput) {
  const dateObj = typeof tx.date === "string" ? new Date(tx.date) : tx.date;
  const dataFormatada = !isNaN(dateObj.getTime())
    ? dateObj.toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const observacoesParts = ["[Totten]"];
  if (tx.clientName) {
    observacoesParts.push(`Cliente: ${tx.clientName}`);
  }
  if (tx.packageId) {
    observacoesParts.push(`Pacote Vinculado`);
  }

  return {
    totten_transaction_id: tx.id,
    user_id: ZIBEE_CLIENT_USER_ID,
    descricao: tx.description,
    valor: Math.abs(Number(tx.amount) || 0),
    tipo: tx.type === "RECEITA" ? "Receita" : "Despesa",
    data_vencimento: dataFormatada,
    pago: tx.status === "PAGO",
    forma_pagamento: normalizePaymentMethod(tx.paymentMethod),
    categoria: deriveCategory(tx),
    observacoes: observacoesParts.join(" | "),
    grupo_id: null,
  };
}

/**
 * Sincroniza uma transação individual para o Zibee (Upsert Idempotente)
 */
export async function syncTransactionToZibee(tx: ZibeeTransactionInput) {
  // 1. Tenant Gating rigoroso: só executa para a organização autorizada
  if (tx.organizationId !== ZIBEE_ENABLED_ORG_ID) {
    return { skipped: true };
  }

  try {
    const supabase = getZibeeClient();
    const payload = formatZibeePayload(tx);

    const { data, error } = await supabase
      .from("lancamentos")
      .upsert(payload, { onConflict: "totten_transaction_id" })
      .select("id, totten_transaction_id")
      .single();

    if (error) {
      console.error("[Zibee Sync] Erro no upsert individual:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error("[Zibee Sync] Exceção ao sincronizar:", err);
    return { success: false, error: err?.message };
  }
}

/**
 * Remove uma transação do Zibee caso tenha sido excluída no Totten
 */
export async function deleteTransactionFromZibee(
  tottenTxId: string,
  organizationId: string,
) {
  if (organizationId !== ZIBEE_ENABLED_ORG_ID) {
    return { skipped: true };
  }

  try {
    const supabase = getZibeeClient();
    const { error } = await supabase
      .from("lancamentos")
      .delete()
      .eq("totten_transaction_id", tottenTxId)
      .eq("user_id", ZIBEE_CLIENT_USER_ID);

    if (error) {
      console.error("[Zibee Sync] Erro ao deletar no Zibee:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[Zibee Sync] Exceção ao deletar no Zibee:", err);
    return { success: false, error: err?.message };
  }
}

/**
 * Sincroniza um lote de transações para o Zibee em blocos de até 100 registros
 */
export async function syncTransactionsBatchToZibee(
  transactions: ZibeeTransactionInput[],
) {
  // Filtrar apenas transações da organização autorizada
  const validTransactions = transactions.filter(
    (t) => t.organizationId === ZIBEE_ENABLED_ORG_ID,
  );

  if (validTransactions.length === 0) {
    return { success: true, count: 0 };
  }

  const supabase = getZibeeClient();
  const payloads = validTransactions.map(formatZibeePayload);

  const BATCH_SIZE = 100;
  let totalProcessed = 0;

  for (let i = 0; i < payloads.length; i += BATCH_SIZE) {
    const chunk = payloads.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from("lancamentos")
      .upsert(chunk, { onConflict: "totten_transaction_id" });

    if (error) {
      console.error("[Zibee Sync] Erro ao sincronizar lote:", error);
      throw new Error(`Falha no lote Zibee: ${error.message}`);
    }

    totalProcessed += chunk.length;
  }

  return { success: true, count: totalProcessed };
}

/**
 * Sincroniza todas as transações existentes da organização no Totten para o Zibee (Carga Completa / Reconciliação)
 */
export async function syncAllHistoricTransactionsToZibee(organizationId: string) {
  if (organizationId !== ZIBEE_ENABLED_ORG_ID) {
    throw new Error("Integração com Zibee não disponível para esta organização.");
  }

  // 1. Buscar todas as transações gravadas no banco do Totten
  const txs = await prisma.transaction.findMany({
    where: { organization_id: organizationId },
    include: {
      client: { select: { name: true } },
      payment_method: { select: { type: true, name: true } },
    },
    orderBy: { date: "asc" },
  });

  const inputs: ZibeeTransactionInput[] = txs.map((t) => ({
    id: t.id,
    organizationId: t.organization_id,
    description: t.description,
    amount: Number(t.amount),
    type: t.type,
    date: t.date,
    status: t.status,
    paymentMethod: t.payment_method?.type || t.payment_method?.name || null,
    clientName: t.client?.name || null,
    packageId: t.package_id,
    stockItemId: t.stock_item_id,
  }));

  const result = await syncTransactionsBatchToZibee(inputs);
  return {
    success: true,
    totalTransactions: txs.length,
    synced: result.count,
  };
}

/**
 * Disparo automático não-bloqueante por ID da transação
 */
export async function triggerZibeeSyncById(transactionId: string) {
  try {
    const tx = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        client: { select: { name: true } },
        payment_method: { select: { type: true, name: true } },
      },
    });

    if (!tx || tx.organization_id !== ZIBEE_ENABLED_ORG_ID) return;

    await syncTransactionToZibee({
      id: tx.id,
      organizationId: tx.organization_id,
      description: tx.description,
      amount: Number(tx.amount),
      type: tx.type,
      date: tx.date,
      status: tx.status,
      paymentMethod: tx.payment_method?.type || tx.payment_method?.name || null,
      clientName: tx.client?.name || null,
      packageId: tx.package_id,
      stockItemId: tx.stock_item_id,
    });
  } catch (err) {
    console.error("[Zibee Sync Trigger Error]", err);
  }
}


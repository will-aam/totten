// app/actions/zibee.ts
"use server";

import { requireAuth } from "@/lib/auth";
import {
  syncAllHistoricTransactionsToZibee,
  ZIBEE_ENABLED_ORG_ID,
} from "@/lib/server/integrations/zibee.service";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

const ZIBEE_SUPABASE_URL =
  process.env.ZIBEE_SUPABASE_URL || "https://zkrosvlxrbbmzeglgnmq.supabase.co";
const ZIBEE_SERVICE_ROLE_KEY =
  process.env.ZIBEE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprcm9zdmx4cmJibXplZ2xnbm1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDM0OTcyNiwiZXhwIjoyMDc5OTI1NzI2fQ.78PazXnDgb1X9gnKVmryDZjZUVSeJj8PHe3fG5SRuYs";
const ZIBEE_CLIENT_USER_ID =
  process.env.ZIBEE_CLIENT_USER_ID || "0IktFfSPwvRIAXYhGe2RXLkRW9qTpyIN";

export async function getZibeeIntegrationStatusAction() {
  try {
    const admin = await requireAuth();

    if (admin.organizationId !== ZIBEE_ENABLED_ORG_ID) {
      return { isEnabled: false };
    }

    const orgTotalCount = await prisma.transaction.count({
      where: { organization_id: admin.organizationId },
    });

    // Consultar quantos lançamentos sincronizados existem no Supabase do Zibee
    const supabase = createClient(ZIBEE_SUPABASE_URL, ZIBEE_SERVICE_ROLE_KEY);
    const { count, error } = await supabase
      .from("lancamentos")
      .select("id", { count: "exact", head: true })
      .eq("user_id", ZIBEE_CLIENT_USER_ID)
      .not("totten_transaction_id", "is", null);

    return {
      isEnabled: true,
      syncedCount: error ? 0 : count || 0,
      orgTotalCount,
    };
  } catch (error) {
    console.error("Erro ao verificar status do Zibee:", error);
    return { isEnabled: false };
  }
}

export async function syncZibeeHistoryAction() {
  try {
    const admin = await requireAuth();

    if (admin.organizationId !== ZIBEE_ENABLED_ORG_ID) {
      return {
        success: false,
        error: "Esta funcionalidade é exclusiva para a clínica autorizada.",
      };
    }

    const result = await syncAllHistoricTransactionsToZibee(admin.organizationId);

    return {
      success: true,
      message: `${result.synced} de ${result.totalTransactions} transações sincronizadas com o Zibee com sucesso!`,
      totalTransactions: result.totalTransactions,
      synced: result.synced,
    };
  } catch (error: any) {
    console.error("Erro na sincronização histórica do Zibee:", error);
    return {
      success: false,
      error: error?.message || "Falha ao sincronizar histórico com o Zibee.",
    };
  }
}

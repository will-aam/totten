import { mutate } from "swr";

/**
 * Utilitário centralizado para invalidação reativa de cache do módulo Financeiro.
 * Chamado sempre que houver mutação (criar, editar, excluir, quitar recebimento).
 */
export function invalidateFinanceCaches() {
  mutate("finance-dashboard-action-data");
  mutate("finance-reports-data");
  mutate("finance-reports-action-data");
  mutate("finance-pending-receivables");
  mutate("finance-payment-methods");
  mutate("finance-settings");
  mutate(
    (key) =>
      (typeof key === "string" && key.startsWith("finance-")) ||
      (Array.isArray(key) &&
        typeof key[0] === "string" &&
        key[0].startsWith("finance-")),
  );
}

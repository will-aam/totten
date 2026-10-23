// app/(private)/admin/finance/_lib/transaction-formatters.ts

/**
 * Utilitário profissional para formatação e limpeza semântica de descrições de transações.
 * Suporta transações limpas geradas pelo novo padrão e trata de forma graciosa
 * transações legadas (com pipes '|', tags técnicas como '(Totem)' e 'Agend: ...')
 * sem recorrer a regex destrutivas que mutilam nomes reais de serviços ou produtos.
 */

export interface ParsedTransactionDescription {
  title: string;
  details?: string;
  cleanSubject: string;
}

/**
 * Extrai título limpo e detalhes estruturados de uma descrição de transação.
 */
export function parseTransactionDescription(
  desc: string | null | undefined,
  type: string = "RECEITA",
  clientName?: string | null,
): ParsedTransactionDescription {
  if (!desc || !desc.trim()) {
    const fallback = type === "RECEITA" ? "Receita" : "Despesa";
    return { title: fallback, cleanSubject: fallback };
  }

  let text = desc.trim();
  let extractedDetails: string | undefined;

  // 1. Tratar transações legadas concatenadas com pipe '|'
  // Exemplo legado: "Custo Insumos (Totem) | Agend: cld... | Detalhes: 2x Agulha... (R$ 10,00)"
  if (text.includes("|")) {
    const segments = text.split("|").map((s) => s.trim()).filter(Boolean);
    const validParts: string[] = [];

    for (const seg of segments) {
      if (/^agend(amento)?:\s*[a-z0-9_-]+/i.test(seg) || /^id:\s*[a-z0-9_-]+/i.test(seg)) {
        // Ignora metadados de ID técnico concatenados no texto
        continue;
      }
      if (/^detalhes:\s*/i.test(seg)) {
        extractedDetails = seg.replace(/^detalhes:\s*/i, "").trim();
        continue;
      }
      validParts.push(seg);
    }

    text = validParts.join(" - ") || segments[0] || text;
  }

  // 2. Extrair detalhes embutidos entre parênteses se contiverem contagem de itens (ex: "(2x Luva, 1x Seringa)")
  if (!extractedDetails) {
    const itemsMatch = text.match(/\(\s*(\d+x\s+[^)]+)\s*\)/i);
    if (itemsMatch) {
      extractedDetails = itemsMatch[1].trim();
      text = text.replace(itemsMatch[0], "").trim();
    }
  }

  // 3. Remover tags técnicas legadas (ex: "(Totem)", "(Baixa Manual)", "(Sessão)", "(Check-in Rápido)", "(Totem - Agend: ...)")
  text = text.replace(/\(Totem(?:\s*-\s*Agend:[^)]+)?\)/gi, "");
  text = text.replace(/\(Baixa Manual\)/gi, "");
  text = text.replace(/\(Sessão\)/gi, "");
  text = text.replace(/\(Check-in Rápido\)/gi, "");

  // 4. Normalizar prefixos verbosos para rótulos elegantes
  text = text.replace(/^Serviço Realizado\s*\/\s*Pago Antecipado:\s*/i, "Serviço: ");
  text = text.replace(/^Serviço Realizado:\s*/i, "Serviço: ");
  text = text.replace(/^Custo Fixo de Material:\s*/i, "Custo de Material: ");
  text = text.replace(/^Custo Insumo:\s*/i, "Custo de Insumo: ");
  text = text.replace(/^Custo Insumos(?:\s*:\s*)?/i, "Custo de Insumos: ");
  text = text.replace(/^Parcela Pacote:\s*/i, "Pacote: ");

  // 5. Remover nome do cliente se estiver redundante entre parênteses no final da descrição
  if (clientName && clientName.trim()) {
    const escaped = clientName.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const namePattern = new RegExp(`\\s*\\(\\s*${escaped}\\s*\\)\\s*$`, "i");
    text = text.replace(namePattern, "").trim();
  }

  // 6. Limpar pontuação residual, traços duplicados e espaços extras
  text = text.replace(/\s{2,}/g, " ");
  text = text.replace(/\s*:\s*$/, "");
  text = text.replace(/^-\s*|\s*-\s*$/g, "");
  text = text.trim();

  // 7. Se após a limpeza restar uma string vazia, usar fallback semântico
  const fallback = type === "RECEITA" ? "Receita" : "Despesa";
  const finalTitle = text || fallback;

  // Assunto limpo (sem o prefixo de categoria, para quando se deseja exibir só o nome do item/serviço)
  const cleanSubject = finalTitle.replace(/^(Serviço|Custo de Material|Custo de Insumos?|Compra de Insumo|Pacote|Taxa [^:]+):\s*/i, "").trim() || finalTitle;

  return {
    title: finalTitle,
    details: extractedDetails,
    cleanSubject,
  };
}

/**
 * Retorna diretamente o título formatado e limpo para listagens financeiras.
 */
export function getCleanDescription(
  desc: string | null | undefined,
  type: string = "RECEITA",
  clientName?: string | null,
): string {
  const { title } = parseTransactionDescription(desc, type, clientName);
  return title;
}

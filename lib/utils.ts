import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sanitizeUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  
  const lowerUrl = trimmed.toLowerCase();
  
  if (
    lowerUrl.startsWith("javascript:") || 
    lowerUrl.startsWith("data:") || 
    lowerUrl.startsWith("vbscript:")
  ) {
    return "#";
  }
  
  if (
    lowerUrl.startsWith("http://") || 
    lowerUrl.startsWith("https://") || 
    lowerUrl.startsWith("mailto:") || 
    lowerUrl.startsWith("tel:") || 
    lowerUrl.startsWith("/")
  ) {
    return trimmed;
  }
  
  return `https://${trimmed}`;
}

export function formatName(name: string | null | undefined): string {
  if (!name) return "";

  // Preposições que devem continuar minúsculas
  const prepositions = ["de", "do", "da", "dos", "das", "e", "del", "von"];

  return name
    .toLowerCase()
    .split(/\s+/) // Separa por espaços e remove espaços duplos
    .map((word, index) => {
      // Se for a primeira palavra, ou se não for uma preposição, capitaliza
      if (index === 0 || !prepositions.includes(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word; // Preposições continuam minúsculas
    })
    .join(" ")
    .trim();
}

/**
 * Converte texto para Title Case inteligente:
 * - Primeira letra de cada palavra maiúscula, restante minúscula.
 * - Mantém preposições em minúsculo (de, da, do, e, etc.).
 * - Mantém siglas empresariais em maiúsculo (LTDA, S.A., ME, EPP, EIRELI, etc.).
 * - Mantém siglas de estados (UF) em maiúsculo (SP, RJ, SE, etc.).
 */
export function toTitleCase(text: string): string {
  if (!text) return "";

  const lowerCaseWords = new Set([
    "de", "da", "do", "das", "dos",
    "e", "em", "na", "no", "nas", "nos",
    "a", "o", "as", "os", "ao", "aos",
    "por", "para", "com", "sob", "sobre",
  ]);

  const upperCaseWords = new Set([
    "ltda", "ltda.", "sa", "s.a.", "s/a", "me", "epp", "eireli", "cnpj", "cpf", "cep", "ss", "s/s",
  ]);

  const ufs = new Set([
    "ac", "al", "ap", "am", "ba", "ce", "df", "es", "go", "ma",
    "mt", "ms", "mg", "pa", "pb", "pr", "pe", "pi", "rj", "rn",
    "rs", "ro", "rr", "sc", "sp", "se", "to",
  ]);

  return text
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      const cleanWord = word.replace(/[^a-zA-Z]/g, "").toLowerCase();

      // Siglas empresariais
      if (upperCaseWords.has(cleanWord)) {
        return word.toUpperCase();
      }

      // UF isolada
      if (ufs.has(cleanWord) && cleanWord.length === 2 && word.length <= 4) {
        return word.toUpperCase();
      }

      // Preposições (exceto se for a primeira palavra)
      if (index > 0 && lowerCaseWords.has(cleanWord)) {
        return word.toLowerCase();
      }

      // Cidade/UF separada por barra (Ex: Aracaju/SE)
      if (word.includes("/")) {
        return word
          .split("/")
          .map((part) => {
            const cleanPart = part.replace(/[^a-zA-Z]/g, "").toLowerCase();
            if (ufs.has(cleanPart)) return part.toUpperCase();
            return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
          })
          .join("/");
      }

      // Palavras com hífen (Ex: Bem-Estar)
      if (word.includes("-")) {
        return word
          .split("-")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join("-");
      }

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

export function formatPhone(value: string): string {
  let v = value.replace(/\D/g, "");
  if (v.length <= 10) {
    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    v = v.replace(/(\d{4})(\d)/g, "$1-$2");
  } else {
    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    v = v.replace(/(\d{5})(\d)/g, "$1-$2");
  }
  return v.slice(0, 15);
}

export function formatCep(value: string): string {
  let v = value.replace(/\D/g, "").slice(0, 8);
  if (v.length > 5) v = v.replace(/^(\d{5})(\d)/, "$1-$2");
  return v;
}

export function formatDocument(value: string, type: "CPF" | "CNPJ"): string {
  if (type === "CPF") {
    let v = value.replace(/\D/g, "").slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    return v;
  } else {
    // CNPJ pode ser numérico tradicional ou alfanumérico (letras A-Z e números)
    let v = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 14);
    v = v.replace(/^([A-Z0-9]{2})([A-Z0-9])/, "$1.$2");
    v = v.replace(/^([A-Z0-9]{2})\.([A-Z0-9]{3})([A-Z0-9])/, "$1.$2.$3");
    v = v.replace(/^([A-Z0-9]{2})\.([A-Z0-9]{3})\.([A-Z0-9]{3})([A-Z0-9])/, "$1.$2.$3/$4");
    v = v.replace(/\/([A-Z0-9]{4})([A-Z0-9])/, "/$1-$2");
    return v;
  }
}

export * from "./phone-utils";
